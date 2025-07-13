import { RateLimiterRedis } from 'rate-limiter-flexible';
import Redis, { RedisOptions } from 'ioredis';
import { Request, Response, NextFunction } from 'express';

export interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  keyGenerator?: (req: Request) => string;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
  handler?: (req: Request, res: Response) => void;
}

export class RateLimiter {
  private redis: Redis;
  private limiters: Map<string, RateLimiterRedis> = new Map();
  
  constructor() {
    const redisOptions: RedisOptions = {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD,
      maxRetriesPerRequest: 3,
    };
    this.redis = new Redis(redisOptions);
  }
  
  createLimiter(name: string, config: RateLimitConfig): RateLimiterRedis {
    const limiter = new RateLimiterRedis({
      storeClient: this.redis,
      keyPrefix: `rate_limit:${name}`,
      points: config.maxRequests,
      duration: config.windowMs / 1000,
      blockDuration: 60, // Block for 1 minute when limit exceeded
    });
    
    this.limiters.set(name, limiter);
    return limiter;
  }
  
  async checkLimit(
    name: string, 
    key: string, 
    points: number = 1
  ): Promise<{ allowed: boolean; remaining: number; resetTime: number }> {
    const limiter = this.limiters.get(name);
    if (!limiter) {
      throw new Error(`Rate limiter '${name}' not found`);
    }
    
    try {
      const result = await limiter.consume(key, points);
      return {
        allowed: true,
        remaining: result.remainingPoints,
        resetTime: result.msBeforeNext
      };
    } catch (error: any) {
      if (error.remainingPoints === 0) {
        return {
          allowed: false,
          remaining: 0,
          resetTime: error.msBeforeNext
        };
      }
      throw error;
    }
  }
  
  async resetLimit(name: string, key: string): Promise<void> {
    const limiter = this.limiters.get(name);
    if (limiter) {
      await limiter.delete(key);
    }
  }
  
  async getLimitInfo(name: string, key: string): Promise<{
    remaining: number;
    resetTime: number;
    totalPoints: number;
  }> {
    const limiter = this.limiters.get(name);
    if (!limiter) {
      throw new Error(`Rate limiter '${name}' not found`);
    }
    
    const info = await limiter.get(key);
    return {
      remaining: info ? info.remainingPoints : 0,
      resetTime: info ? info.msBeforeNext : 0,
      totalPoints: info ? (info as any).totalPoints || 0 : 0
    };
  }
}

// Express middleware factory
export function createRateLimitMiddleware(
  name: string,
  config: RateLimitConfig
) {
  const rateLimiter = new RateLimiter();
  const limiter = rateLimiter.createLimiter(name, config);
  
  return async (req: Request, res: Response, next: NextFunction) => {
    const key = config.keyGenerator ? 
      config.keyGenerator(req) : 
      req.ip || req.connection.remoteAddress || 'unknown';
    
    try {
      const result = await rateLimiter.checkLimit(name, key);
      
      // Add rate limit headers
      res.set({
        'X-RateLimit-Limit': config.maxRequests.toString(),
        'X-RateLimit-Remaining': result.remaining.toString(),
        'X-RateLimit-Reset': new Date(Date.now() + result.resetTime).toISOString()
      });
      
      if (result.allowed) {
        next();
      } else {
        const error = {
          error: 'Rate limit exceeded',
          message: `Too many requests. Try again in ${Math.ceil(result.resetTime / 1000)} seconds.`,
          retryAfter: Math.ceil(result.resetTime / 1000)
        };
        
        if (config.handler) {
          config.handler(req, res);
        } else {
          res.status(429).json(error);
        }
      }
    } catch (error) {
      console.error('Rate limiting error:', error);
      // On error, allow the request to proceed
      next();
    }
  };
}

// Specific rate limiters for different endpoints
export const RATE_LIMITS = {
  CHAT_API: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 30, // 30 requests per minute
    keyGenerator: (req: Request) => `chat:${req.ip || 'unknown'}`
  },
  INTENT_CLASSIFICATION: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 100, // 100 requests per minute
    keyGenerator: (req: Request) => `intent:${req.ip || 'unknown'}`
  },
  CONTEXT_MANAGEMENT: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 50, // 50 requests per minute
    keyGenerator: (req: Request) => `context:${req.ip || 'unknown'}`
  },
  ADMIN_API: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 10, // 10 requests per minute
    keyGenerator: (req: Request) => `admin:${req.ip || 'unknown'}`
  }
};