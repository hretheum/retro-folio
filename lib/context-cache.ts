import { analyzeQueryIntent } from './chat-intelligence';
import { ContextChunk } from './context-pruning';

export interface CacheEntry {
  key: string;
  value: ContextChunk[];
  timestamp: number;
  ttl: number;
  accessCount: number;
  lastAccessed: number;
  metadata: {
    queryIntent: string;
    originalTokens: number;
    compressed: boolean;
    hitCount: number;
  };
}

export interface CacheConfig {
  maxMemoryMB: number;
  defaultTTL: number;
  cleanupInterval: number;
  maxEntries: number;
  compressionThreshold: number;
  hitRateTarget: number;
}

export interface CacheStats {
  totalEntries: number;
  memoryUsageMB: number;
  hitRate: number;
  avgResponseTime: number;
  totalHits: number;
  totalMisses: number;
  evictionCount: number;
  cleanupCount: number;
}

export class SmartContextCache {
  private cache: Map<string, CacheEntry>;
  private config: CacheConfig;
  private stats: CacheStats;
  private cleanupTimer: NodeJS.Timeout | null;
  private memoryUsage: number;
  
  constructor(config: Partial<CacheConfig> = {}) {
    this.config = {
      maxMemoryMB: 100,
      defaultTTL: 30 * 60 * 1000, // 30 minutes
      cleanupInterval: 5 * 60 * 1000, // 5 minutes
      maxEntries: 1000,
      compressionThreshold: 0.8,
      hitRateTarget: 0.6,
      ...config
    };
    
    this.cache = new Map();
    this.memoryUsage = 0;
    this.stats = {
      totalEntries: 0,
      memoryUsageMB: 0,
      hitRate: 0,
      avgResponseTime: 0,
      totalHits: 0,
      totalMisses: 0,
      evictionCount: 0,
      cleanupCount: 0
    };
    
    this.cleanupTimer = null;
    this.startCleanupTimer();
  }
  
  private generateCacheKey(
    userQuery: string,
    contextSize: number,
    queryIntent?: string
  ): string {
    const intent = queryIntent || analyzeQueryIntent(userQuery);
    const queryHash = this.hashString(userQuery.toLowerCase().trim());
    
    return `${intent}:${contextSize}:${queryHash}`;
  }
  
  private hashString(str: string): string {
    let hash = 0;
    if (str.length === 0) return hash.toString();
    
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    
    return Math.abs(hash).toString(36);
  }
  
  private calculateMemoryUsage(chunks: ContextChunk[]): number {
    // Estimate memory usage in bytes
    let totalSize = 0;
    
    for (const chunk of chunks) {
      totalSize += chunk.content.length * 2; // Unicode characters
      totalSize += JSON.stringify(chunk.metadata).length * 2;
      totalSize += 200; // Overhead for object structure
    }
    
    return totalSize;
  }
  
  private calculateTTL(queryIntent: string, chunks: ContextChunk[]): number {
    const baseConfig = {
      FACTUAL: this.config.defaultTTL * 2, // Longer TTL for factual data
      CASUAL: this.config.defaultTTL * 0.5, // Shorter TTL for casual queries
      EXPLORATION: this.config.defaultTTL * 1.5, // Extended TTL for exploration
      COMPARISON: this.config.defaultTTL * 1.2, // Slightly longer for comparisons
      SYNTHESIS: this.config.defaultTTL * 1.8 // Longest TTL for synthesis
    };
    
    let ttl = baseConfig[queryIntent] || this.config.defaultTTL;
    
    // Adjust based on content quality
    const avgScore = chunks.reduce((sum, chunk) => sum + chunk.score, 0) / chunks.length;
    if (avgScore > 0.8) {
      ttl *= 1.5; // Extend TTL for high-quality content
    } else if (avgScore < 0.5) {
      ttl *= 0.7; // Reduce TTL for low-quality content
    }
    
    // Adjust based on content size
    const totalTokens = chunks.reduce((sum, chunk) => sum + chunk.tokens, 0);
    if (totalTokens > 2000) {
      ttl *= 1.3; // Extend TTL for large contexts
    }
    
    return Math.floor(ttl);
  }
  
  private shouldEvict(): boolean {
    const memoryUsageMB = this.memoryUsage / (1024 * 1024);
    return (
      memoryUsageMB > this.config.maxMemoryMB ||
      this.cache.size > this.config.maxEntries
    );
  }
  
  private evictLeastUsed(): void {
    if (this.cache.size === 0) return;
    
    let leastUsedKey = '';
    let leastUsedScore = Infinity;
    
    for (const [key, entry] of this.cache) {
      // Calculate eviction score (lower is more likely to be evicted)
      const timeSinceAccess = Date.now() - entry.lastAccessed;
      const accessFrequency = entry.accessCount / ((Date.now() - entry.timestamp) / 1000);
      
      const evictionScore = accessFrequency * 1000 - timeSinceAccess;
      
      if (evictionScore < leastUsedScore) {
        leastUsedScore = evictionScore;
        leastUsedKey = key;
      }
    }
    
    if (leastUsedKey) {
      const evicted = this.cache.get(leastUsedKey);
      if (evicted) {
        this.memoryUsage -= this.calculateMemoryUsage(evicted.value);
        this.cache.delete(leastUsedKey);
        this.stats.evictionCount++;
      }
    }
  }
  
  private cleanupExpired(): void {
    const now = Date.now();
    let cleanedCount = 0;
    
    for (const [key, entry] of this.cache) {
      if (now - entry.timestamp > entry.ttl) {
        this.memoryUsage -= this.calculateMemoryUsage(entry.value);
        this.cache.delete(key);
        cleanedCount++;
      }
    }
    
    this.stats.cleanupCount += cleanedCount;
    this.updateStats();
  }
  
  private startCleanupTimer(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
    }
    
    this.cleanupTimer = setInterval(() => {
      this.cleanupExpired();
    }, this.config.cleanupInterval);
  }
  
  private updateStats(): void {
    this.stats.totalEntries = this.cache.size;
    this.stats.memoryUsageMB = this.memoryUsage / (1024 * 1024);
    
    const totalRequests = this.stats.totalHits + this.stats.totalMisses;
    this.stats.hitRate = totalRequests > 0 ? this.stats.totalHits / totalRequests : 0;
  }
  
  public get(
    userQuery: string,
    contextSize: number,
    queryIntent?: string
  ): ContextChunk[] | null {
    const key = this.generateCacheKey(userQuery, contextSize, queryIntent);
    const entry = this.cache.get(key);
    
    if (!entry) {
      this.stats.totalMisses++;
      this.updateStats();
      return null;
    }
    
    // Check if entry is expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.memoryUsage -= this.calculateMemoryUsage(entry.value);
      this.cache.delete(key);
      this.stats.totalMisses++;
      this.updateStats();
      return null;
    }
    
    // Update access statistics
    entry.accessCount++;
    entry.lastAccessed = Date.now();
    entry.metadata.hitCount++;
    
    this.stats.totalHits++;
    this.updateStats();
    
    return entry.value;
  }
  
  public set(
    userQuery: string,
    contextSize: number,
    chunks: ContextChunk[],
    queryIntent?: string
  ): void {
    const intent = queryIntent || analyzeQueryIntent(userQuery);
    const key = this.generateCacheKey(userQuery, contextSize, intent);
    
    // Check if we need to evict before adding
    const entrySize = this.calculateMemoryUsage(chunks);
    const newMemoryUsage = this.memoryUsage + entrySize;
    
    // Evict entries if necessary
    while (this.shouldEvict() && this.cache.size > 0) {
      this.evictLeastUsed();
    }
    
    // Don't cache if entry is too large
    if (entrySize > this.config.maxMemoryMB * 1024 * 1024 * 0.5) {
      return;
    }
    
    const ttl = this.calculateTTL(intent, chunks);
    const now = Date.now();
    
    const cacheEntry: CacheEntry = {
      key,
      value: chunks,
      timestamp: now,
      ttl,
      accessCount: 1,
      lastAccessed: now,
      metadata: {
        queryIntent: intent,
        originalTokens: chunks.reduce((sum, chunk) => sum + chunk.tokens, 0),
        compressed: chunks.some(chunk => chunk.score !== undefined),
        hitCount: 0
      }
    };
    
    // Remove existing entry if it exists
    const existingEntry = this.cache.get(key);
    if (existingEntry) {
      this.memoryUsage -= this.calculateMemoryUsage(existingEntry.value);
    }
    
    this.cache.set(key, cacheEntry);
    this.memoryUsage += entrySize;
    
    this.updateStats();
  }
  
  public invalidate(pattern?: string): void {
    if (!pattern) {
      // Clear all cache
      this.cache.clear();
      this.memoryUsage = 0;
      this.updateStats();
      return;
    }
    
    // Invalidate entries matching pattern
    const regex = new RegExp(pattern, 'i');
    const keysToDelete = [];
    
    for (const [key, entry] of this.cache) {
      if (regex.test(key) || regex.test(entry.value.map(c => c.content).join(' '))) {
        keysToDelete.push(key);
      }
    }
    
    for (const key of keysToDelete) {
      const entry = this.cache.get(key);
      if (entry) {
        this.memoryUsage -= this.calculateMemoryUsage(entry.value);
        this.cache.delete(key);
      }
    }
    
    this.updateStats();
  }
  
  public getStats(): CacheStats {
    this.updateStats();
    return { ...this.stats };
  }
  
  public optimize(): void {
    const stats = this.getStats();
    
    // If hit rate is below target, increase TTLs
    if (stats.hitRate < this.config.hitRateTarget) {
      this.config.defaultTTL *= 1.2;
    }
    
    // If memory usage is high, decrease TTLs
    if (stats.memoryUsageMB > this.config.maxMemoryMB * 0.8) {
      this.config.defaultTTL *= 0.9;
    }
    
    // Clean up expired entries
    this.cleanupExpired();
    
    // Evict least used entries if still over capacity
    while (this.shouldEvict() && this.cache.size > 0) {
      this.evictLeastUsed();
    }
  }
  
  public warmup(
    commonQueries: Array<{
      query: string;
      contextSize: number;
      chunks: ContextChunk[];
    }>
  ): void {
    for (const { query, contextSize, chunks } of commonQueries) {
      if (!this.get(query, contextSize)) {
        this.set(query, contextSize, chunks);
      }
    }
  }
  
  public export(): Array<{
    key: string;
    query: string;
    contextSize: number;
    chunks: ContextChunk[];
    metadata: CacheEntry['metadata'];
  }> {
    const exports = [];
    
    for (const [key, entry] of this.cache) {
      const [intent, contextSize, queryHash] = key.split(':');
      exports.push({
        key,
        query: queryHash, // Note: this is hashed, not original query
        contextSize: parseInt(contextSize),
        chunks: entry.value,
        metadata: entry.metadata
      });
    }
    
    return exports;
  }
  
  public import(
    data: Array<{
      key: string;
      query: string;
      contextSize: number;
      chunks: ContextChunk[];
      metadata: CacheEntry['metadata'];
    }>
  ): void {
    for (const item of data) {
      const now = Date.now();
      const ttl = this.calculateTTL(item.metadata.queryIntent, item.chunks);
      
      const cacheEntry: CacheEntry = {
        key: item.key,
        value: item.chunks,
        timestamp: now,
        ttl,
        accessCount: 1,
        lastAccessed: now,
        metadata: item.metadata
      };
      
      if (!this.shouldEvict()) {
        this.cache.set(item.key, cacheEntry);
        this.memoryUsage += this.calculateMemoryUsage(item.chunks);
      }
    }
    
    this.updateStats();
  }
  
  public destroy(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
    
    this.cache.clear();
    this.memoryUsage = 0;
    this.updateStats();
  }
  
  // Performance testing methods
  public async benchmark(
    testQueries: Array<{
      query: string;
      contextSize: number;
      chunks: ContextChunk[];
    }>,
    iterations: number = 100
  ): Promise<{
    avgCacheHitTime: number;
    avgCacheMissTime: number;
    hitRate: number;
    memoryEfficiency: number;
  }> {
    const results = {
      hitTimes: [],
      missTimes: [],
      hits: 0,
      misses: 0
    };
    
    // Warm up cache with half the queries
    const warmupQueries = testQueries.slice(0, Math.floor(testQueries.length / 2));
    for (const { query, contextSize, chunks } of warmupQueries) {
      this.set(query, contextSize, chunks);
    }
    
    // Run benchmark
    for (let i = 0; i < iterations; i++) {
      const testQuery = testQueries[i % testQueries.length];
      
      const startTime = performance.now();
      const result = this.get(testQuery.query, testQuery.contextSize);
      const endTime = performance.now();
      
      if (result) {
        results.hitTimes.push(endTime - startTime);
        results.hits++;
      } else {
        results.missTimes.push(endTime - startTime);
        results.misses++;
        
        // Simulate cache miss by setting the value
        this.set(testQuery.query, testQuery.contextSize, testQuery.chunks);
      }
    }
    
    const avgCacheHitTime = results.hitTimes.length > 0 
      ? results.hitTimes.reduce((a, b) => a + b, 0) / results.hitTimes.length 
      : 0;
      
    const avgCacheMissTime = results.missTimes.length > 0 
      ? results.missTimes.reduce((a, b) => a + b, 0) / results.missTimes.length 
      : 0;
    
    const hitRate = results.hits / (results.hits + results.misses);
    const memoryEfficiency = this.stats.totalEntries / (this.stats.memoryUsageMB || 1);
    
    return {
      avgCacheHitTime,
      avgCacheMissTime,
      hitRate,
      memoryEfficiency
    };
  }
  
  public validatePerformance(): {
    hitRateTarget: boolean;
    memoryUsageTarget: boolean;
    responseTimeTarget: boolean;
    cleanupWorking: boolean;
  } {
    const stats = this.getStats();
    
    return {
      hitRateTarget: stats.hitRate >= this.config.hitRateTarget,
      memoryUsageTarget: stats.memoryUsageMB <= this.config.maxMemoryMB,
      responseTimeTarget: stats.avgResponseTime <= 50, // 50ms target
      cleanupWorking: stats.cleanupCount > 0 || this.cache.size === 0
    };
  }
}

// Export singleton instance
export const smartContextCache = new SmartContextCache();