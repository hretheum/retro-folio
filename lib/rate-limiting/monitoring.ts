import { RateLimiter } from './rate-limiter';
import { EventEmitter } from 'events';

export interface RateLimitEvent {
  limiterName: string;
  key: string;
  action: 'limit_exceeded' | 'limit_reset' | 'limit_created';
  timestamp: Date;
  details: any;
}

export class RateLimitMonitor extends EventEmitter {
  private rateLimiter: RateLimiter;
  private metrics: Map<string, {
    totalRequests: number;
    blockedRequests: number;
    uniqueKeys: Set<string>;
  }> = new Map();
  
  constructor(rateLimiter: RateLimiter) {
    super();
    this.rateLimiter = rateLimiter;
  }
  
  async trackRequest(limiterName: string, key: string, allowed: boolean): Promise<void> {
    if (!this.metrics.has(limiterName)) {
      this.metrics.set(limiterName, {
        totalRequests: 0,
        blockedRequests: 0,
        uniqueKeys: new Set()
      });
    }
    
    const metric = this.metrics.get(limiterName)!;
    metric.totalRequests++;
    metric.uniqueKeys.add(key);
    
    if (!allowed) {
      metric.blockedRequests++;
      
      this.emit('limit_exceeded', {
        limiterName,
        key,
        action: 'limit_exceeded',
        timestamp: new Date(),
        details: {
          totalRequests: metric.totalRequests,
          blockedRequests: metric.blockedRequests
        }
      });
    }
  }
  
  async resetLimiter(limiterName: string, key: string): Promise<void> {
    await this.rateLimiter.resetLimit(limiterName, key);
    
    this.emit('limit_reset', {
      limiterName,
      key,
      action: 'limit_reset',
      timestamp: new Date(),
      details: {}
    });
  }
  
  getMetrics(limiterName?: string): any {
    if (limiterName) {
      const metric = this.metrics.get(limiterName);
      if (!metric) return null;
      
      return {
        limiterName,
        totalRequests: metric.totalRequests,
        blockedRequests: metric.blockedRequests,
        uniqueKeys: metric.uniqueKeys.size,
        blockRate: metric.totalRequests > 0 ? 
          (metric.blockedRequests / metric.totalRequests * 100).toFixed(2) + '%' : '0%'
      };
    }
    
    const allMetrics: any = {};
    for (const [name, metric] of this.metrics) {
      allMetrics[name] = {
        totalRequests: metric.totalRequests,
        blockedRequests: metric.blockedRequests,
        uniqueKeys: metric.uniqueKeys.size,
        blockRate: metric.totalRequests > 0 ? 
          (metric.blockedRequests / metric.totalRequests * 100).toFixed(2) + '%' : '0%'
      };
    }
    
    return allMetrics;
  }
  
  async generateReport(): Promise<any> {
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        totalLimiters: this.metrics.size,
        totalRequests: 0,
        totalBlocked: 0,
        overallBlockRate: '0%'
      },
      limiters: this.getMetrics()
    };
    
    // Calculate summary
    for (const metric of this.metrics.values()) {
      report.summary.totalRequests += metric.totalRequests;
      report.summary.totalBlocked += metric.blockedRequests;
    }
    
    if (report.summary.totalRequests > 0) {
      report.summary.overallBlockRate = 
        (report.summary.totalBlocked / report.summary.totalRequests * 100).toFixed(2) + '%';
    }
    
    return report;
  }
}