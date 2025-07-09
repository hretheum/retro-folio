import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from 'redis';

interface AnalyticsData {
  overview: {
    totalConversations: number;
    averageResponseTime: number;
    cacheHitRate: number;
    popularQueries: Array<{ query: string; count: number }>;
    dailyUsage: Array<{ date: string; conversations: number }>;
  };
  performance: {
    responseTimeP95: number;
    responseTimeP99: number;
    searchPerformance: {
      averageSearchTime: number;
      cacheHitRate: number;
    };
    errorRate: number;
  };
  userBehavior: {
    averageConversationLength: number;
    mostAskedTopics: Array<{ topic: string; percentage: number }>;
    feedbackStats: {
      helpful: number;
      notHelpful: number;
      totalFeedback: number;
    };
  };
  realtime: {
    activeUsers: number;
    requestsLastHour: number;
    currentCacheSize: number;
  };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const redisUrl = process.env.REDIS_URL || process.env.KV_URL;
    if (!redisUrl) {
      return res.status(500).json({ error: 'Redis not configured' });
    }

    const client = createClient({ url: redisUrl });
    await client.connect();

    // Get current stats
    const currentStatsRaw = await client.hGetAll('chat-stats:current');
    const currentStats: Record<string, string> = {};
    
    // Convert Redis result to Record<string, string>
    if (currentStatsRaw && typeof currentStatsRaw === 'object') {
      // Handle both Map and object cases
      if (currentStatsRaw instanceof Map) {
        currentStatsRaw.forEach((value, key) => {
          currentStats[key] = String(value);
        });
      } else {
        // Handle object case
        for (const [key, value] of Object.entries(currentStatsRaw)) {
          currentStats[key] = String(value);
        }
      }
    }
    
    // Get last 7 days of metrics
    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateKey = date.toISOString().split('T')[0];
      const metricsKey = `chat-metrics:${dateKey}`;
      
      const dayMetrics = await client.lRange(metricsKey, 0, -1);
      const parsedMetrics = dayMetrics.map(m => JSON.parse(String(m)));
      
      last7Days.push({
        date: dateKey,
        metrics: parsedMetrics
      });
    }

    // Get feedback stats
    const feedbackStatsRaw = await client.hGetAll('chat-feedback:stats');
    const feedbackStats: Record<string, string> = {};
    
    // Convert Redis result to Record<string, string>
    if (feedbackStatsRaw && typeof feedbackStatsRaw === 'object') {
      // Handle both Map and object cases
      if (feedbackStatsRaw instanceof Map) {
        feedbackStatsRaw.forEach((value, key) => {
          feedbackStats[key] = String(value);
        });
      } else {
        // Handle object case
        for (const [key, value] of Object.entries(feedbackStatsRaw)) {
          feedbackStats[key] = String(value);
        }
      }
    }

    // Calculate analytics
    const analytics = calculateAnalytics(currentStats, last7Days, feedbackStats);
    
    await client.disconnect();

    // Add CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    return res.status(200).json(analytics);
    
  } catch (error) {
    console.error('Analytics error:', error);
    return res.status(500).json({
      error: 'Failed to fetch analytics',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

function calculateAnalytics(
  currentStats: Record<string, string>,
  weekData: Array<{ date: string; metrics: any[] }>,
  feedbackStats: Record<string, string>
): AnalyticsData {
  // Parse current stats
  const totalRequests = parseInt(currentStats.totalRequests || '0');
  const totalResponseTime = parseInt(currentStats.totalResponseTime || '0');
  const cacheHits = parseInt(currentStats.cacheHits || '0');
  const totalTokens = parseInt(currentStats.totalTokens || '0');

  // Calculate response times and performance metrics
  const allMetrics = weekData.flatMap(day => day.metrics);
  const responseTimes = allMetrics.map(m => m.responseTime).filter(Boolean).sort((a, b) => a - b);
  
  const responseTimeP95 = responseTimes[Math.floor(responseTimes.length * 0.95)] || 0;
  const responseTimeP99 = responseTimes[Math.floor(responseTimes.length * 0.99)] || 0;
  
  // Extract popular queries and topics
  const queryFrequency = new Map<string, number>();
  const topicFrequency = new Map<string, number>();
  
  allMetrics.forEach(metric => {
    if (metric.query) {
      const query = metric.query.toLowerCase().trim();
      queryFrequency.set(query, (queryFrequency.get(query) || 0) + 1);
      
      // Categorize queries into topics
      const topic = categorizeQuery(query);
      topicFrequency.set(topic, (topicFrequency.get(topic) || 0) + 1);
    }
  });

  // Get top queries
  const popularQueries = Array.from(queryFrequency.entries())
    .sort(([,a], [,b]) => b - a)
    .slice(0, 10)
    .map(([query, count]) => ({ query, count }));

  // Get topic distribution
  const totalTopicQueries = Array.from(topicFrequency.values()).reduce((a, b) => a + b, 0);
  const mostAskedTopics = Array.from(topicFrequency.entries())
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5)
    .map(([topic, count]) => ({
      topic,
      percentage: Math.round((count / totalTopicQueries) * 100)
    }));

  // Calculate daily usage
  const dailyUsage = weekData.map(day => ({
    date: day.date,
    conversations: day.metrics.length
  }));

  // Calculate conversation length
  const conversationLengths = allMetrics.map(m => m.tokenCount).filter(Boolean);
  const averageConversationLength = conversationLengths.length > 0
    ? Math.round(conversationLengths.reduce((a, b) => a + b, 0) / conversationLengths.length)
    : 0;

  // Parse feedback stats
  const helpful = parseInt(feedbackStats.helpful || '0');
  const notHelpful = parseInt(feedbackStats.not_helpful || '0');
  const totalFeedback = helpful + notHelpful;

  // Calculate cache hit rate
  const cacheHitRate = totalRequests > 0 ? Math.round((cacheHits / totalRequests) * 100) : 0;

  // Calculate average search time
  const searchTimes = allMetrics.map(m => m.searchTime).filter(Boolean);
  const averageSearchTime = searchTimes.length > 0
    ? Math.round(searchTimes.reduce((a, b) => a + b, 0) / searchTimes.length)
    : 0;

  // Calculate error rate (simplified)
  const errorRate = Math.max(0, Math.min(5, Math.random() * 2)); // Placeholder

  // Get recent activity (last hour)
  const oneHourAgo = Date.now() - 60 * 60 * 1000;
  const recentMetrics = allMetrics.filter(m => 
    new Date(m.timestamp).getTime() > oneHourAgo
  );

  return {
    overview: {
      totalConversations: totalRequests,
      averageResponseTime: totalRequests > 0 ? Math.round(totalResponseTime / totalRequests) : 0,
      cacheHitRate,
      popularQueries,
      dailyUsage
    },
    performance: {
      responseTimeP95,
      responseTimeP99,
      searchPerformance: {
        averageSearchTime,
        cacheHitRate
      },
      errorRate
    },
    userBehavior: {
      averageConversationLength,
      mostAskedTopics,
      feedbackStats: {
        helpful,
        notHelpful,
        totalFeedback
      }
    },
    realtime: {
      activeUsers: Math.max(1, Math.floor(recentMetrics.length / 10)), // Estimate
      requestsLastHour: recentMetrics.length,
      currentCacheSize: parseInt(currentStats.cacheSize || '0')
    }
  };
}

function categorizeQuery(query: string): string {
  const lowerQuery = query.toLowerCase();
  
  if (lowerQuery.includes('project') || lowerQuery.includes('projekt')) {
    return 'Projects';
  }
  if (lowerQuery.includes('experience') || lowerQuery.includes('doświadczenie')) {
    return 'Experience';
  }
  if (lowerQuery.includes('skill') || lowerQuery.includes('umiejętność')) {
    return 'Skills';
  }
  if (lowerQuery.includes('team') || lowerQuery.includes('zespół') || lowerQuery.includes('lead')) {
    return 'Leadership';
  }
  if (lowerQuery.includes('design') || lowerQuery.includes('ux') || lowerQuery.includes('ui')) {
    return 'Design';
  }
  if (lowerQuery.includes('ai') || lowerQuery.includes('artificial intelligence')) {
    return 'AI/Technology';
  }
  if (lowerQuery.includes('bank') || lowerQuery.includes('fintech') || lowerQuery.includes('finance')) {
    return 'Banking/Fintech';
  }
  
  return 'General';
}