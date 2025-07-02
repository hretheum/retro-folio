import { createClient } from 'redis';

export interface ChatMetrics {
  totalQueries: number;
  avgResponseTime: number;
  dailyCost: number;
  satisfactionRate: number;
  topQueries: Array<{ query: string; count: number }>;
  errorRate: number;
  activeUsers: number;
  p95ResponseTime: number;
}

export interface ChatInteraction {
  sessionId: string;
  query: string;
  responseTime: number;
  tokenUsage: {
    prompt: number;
    completion: number;
    total: number;
  };
  contextFound: boolean;
  error?: string;
  feedback?: 'helpful' | 'not_helpful';
  timestamp: string;
}

// Cost calculation based on OpenAI pricing
const COST_PER_1K_PROMPT_TOKENS = 0.01; // GPT-4 Turbo
const COST_PER_1K_COMPLETION_TOKENS = 0.03;

// Store interaction
export async function logChatInteraction(interaction: ChatInteraction): Promise<void> {
  const redisUrl = process.env.REDIS_URL || process.env.KV_URL;
  if (!redisUrl) return;
  
  try {
    const client = createClient({ url: redisUrl });
    await client.connect();
    
    // Store in daily bucket
    const date = new Date().toISOString().split('T')[0];
    const key = `ai:analytics:${date}`;
    
    await client.lPush(key, JSON.stringify(interaction));
    await client.expire(key, 30 * 24 * 60 * 60); // 30 days
    
    // Update real-time metrics
    await updateRealtimeMetrics(client, interaction);
    
    await client.disconnect();
  } catch (error) {
    console.error('Failed to log interaction:', error);
  }
}

// Update real-time metrics
async function updateRealtimeMetrics(
  client: any,
  interaction: ChatInteraction
): Promise<void> {
  const metricsKey = 'ai:metrics:realtime';
  
  // Increment total queries
  await client.hIncrBy(metricsKey, 'totalQueries', 1);
  
  // Update response time stats
  await client.lPush('ai:metrics:responseTimes', interaction.responseTime);
  await client.lTrim('ai:metrics:responseTimes', 0, 999); // Keep last 1000
  
  // Update token usage
  if (interaction.tokenUsage) {
    await client.hIncrByFloat(
      metricsKey,
      'totalTokens',
      interaction.tokenUsage.total
    );
  }
  
  // Track errors
  if (interaction.error) {
    await client.hIncrBy(metricsKey, 'errors', 1);
  }
  
  // Track unique sessions
  await client.sAdd('ai:metrics:sessions', interaction.sessionId);
  await client.expire('ai:metrics:sessions', 24 * 60 * 60); // Daily unique users
  
  // Track queries
  await client.zIncrBy('ai:metrics:topQueries', 1, interaction.query.toLowerCase());
}

// Submit feedback
export async function submitFeedback(
  sessionId: string,
  messageId: string,
  feedback: 'helpful' | 'not_helpful'
): Promise<void> {
  const redisUrl = process.env.REDIS_URL || process.env.KV_URL;
  if (!redisUrl) return;
  
  try {
    const client = createClient({ url: redisUrl });
    await client.connect();
    
    // Store feedback
    const feedbackKey = `ai:feedback:${sessionId}:${messageId}`;
    await client.set(feedbackKey, feedback);
    await client.expire(feedbackKey, 30 * 24 * 60 * 60);
    
    // Update satisfaction metrics
    const metricsKey = 'ai:metrics:realtime';
    await client.hIncrBy(metricsKey, `feedback_${feedback}`, 1);
    
    await client.disconnect();
  } catch (error) {
    console.error('Failed to submit feedback:', error);
  }
}

// Get metrics
export async function getMetrics(): Promise<ChatMetrics> {
  const redisUrl = process.env.REDIS_URL || process.env.KV_URL;
  
  if (!redisUrl) {
    return getDefaultMetrics();
  }
  
  try {
    const client = createClient({ url: redisUrl });
    await client.connect();
    
    // Get basic metrics
    const metricsKey = 'ai:metrics:realtime';
    const metrics = await client.hGetAll(metricsKey);
    
    // Calculate response times
    const responseTimes = await client.lRange('ai:metrics:responseTimes', 0, -1);
    const times = responseTimes.map(Number).filter(t => t > 0);
    
    const avgResponseTime = times.length > 0
      ? times.reduce((a, b) => a + b, 0) / times.length
      : 0;
    
    const p95ResponseTime = times.length > 0
      ? times.sort((a, b) => a - b)[Math.floor(times.length * 0.95)]
      : 0;
    
    // Get unique users
    const activeUsers = await client.sCard('ai:metrics:sessions');
    
    // Get top queries
    const topQueriesRaw = await client.zRangeWithScores('ai:metrics:topQueries', 0, 9, {
      REV: true,
    });
    
    const topQueries = topQueriesRaw.map(item => ({
      query: item.value,
      count: item.score,
    }));
    
    // Calculate satisfaction rate
    const helpful = parseInt(metrics.feedback_helpful || '0');
    const notHelpful = parseInt(metrics.feedback_not_helpful || '0');
    const totalFeedback = helpful + notHelpful;
    const satisfactionRate = totalFeedback > 0 ? helpful / totalFeedback : 0;
    
    // Calculate daily cost
    const totalTokens = parseFloat(metrics.totalTokens || '0');
    const promptTokens = totalTokens * 0.7; // Rough estimate
    const completionTokens = totalTokens * 0.3;
    
    const dailyCost = 
      (promptTokens / 1000) * COST_PER_1K_PROMPT_TOKENS +
      (completionTokens / 1000) * COST_PER_1K_COMPLETION_TOKENS;
    
    // Calculate error rate
    const totalQueries = parseInt(metrics.totalQueries || '0');
    const errors = parseInt(metrics.errors || '0');
    const errorRate = totalQueries > 0 ? errors / totalQueries : 0;
    
    await client.disconnect();
    
    return {
      totalQueries,
      avgResponseTime,
      dailyCost,
      satisfactionRate,
      topQueries,
      errorRate,
      activeUsers,
      p95ResponseTime,
    };
  } catch (error) {
    console.error('Failed to get metrics:', error);
    return getDefaultMetrics();
  }
}

// Default metrics when Redis is unavailable
function getDefaultMetrics(): ChatMetrics {
  return {
    totalQueries: 0,
    avgResponseTime: 0,
    dailyCost: 0,
    satisfactionRate: 0,
    topQueries: [],
    errorRate: 0,
    activeUsers: 0,
    p95ResponseTime: 0,
  };
}

// Cost alert check
export async function checkCostAlert(): Promise<boolean> {
  const metrics = await getMetrics();
  return metrics.dailyCost > 5; // Alert if daily cost exceeds $5
}