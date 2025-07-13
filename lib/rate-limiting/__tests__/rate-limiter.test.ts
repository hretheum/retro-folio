// Mock ioredis before importing
jest.mock('ioredis', () => {
  class MockRedis {
    constructor() {}
    async get() { return null; }
    async set() { return 'OK'; }
    async incr() { return 1; }
    async expire() { return 1; }
    async del() { return 1; }
    async flushall() { return 'OK'; }
    async connect() { return Promise.resolve(); }
    async disconnect() { return Promise.resolve(); }
    async quit() { return Promise.resolve(); }
    get status() { return 'ready'; }
    on() {}
    off() {}
    emit() {}
  }
  return MockRedis;
});

// Mock rate-limiter-flexible
jest.mock('rate-limiter-flexible', () => {
  class MockRateLimiterRedis {
    constructor(options: any) {
      this.options = options;
      this.counters = new Map();
    }
    
    options: any;
    counters: Map<string, number>;

    async consume(key: string, points = 1) {
      const current = this.counters.get(key) || 0;
      const newCount = current + points;
      
      if (newCount > this.options.points) {
        const error = new Error('Rate limit exceeded') as any;
        error.remainingPoints = 0;
        error.msBeforeNext = this.options.duration * 1000;
        error.totalHits = newCount;
        throw error;
      }
      
      this.counters.set(key, newCount);
      
      return {
        remainingPoints: this.options.points - newCount,
        msBeforeNext: this.options.duration * 1000,
        totalHits: newCount
      };
    }

    async reset(key: string) {
      this.counters.delete(key);
      return true;
    }

    async get(key: string) {
      const current = this.counters.get(key) || 0;
      return {
        remainingPoints: this.options.points - current,
        msBeforeNext: this.options.duration * 1000,
        totalHits: current
      };
    }

    async delete(key: string) {
      this.counters.delete(key);
      return true;
    }
  }
  
  return {
    RateLimiterRedis: MockRateLimiterRedis
  };
});

import { RateLimiter, createRateLimitMiddleware, RATE_LIMITS } from '../rate-limiter';
import { Request, Response, NextFunction } from 'express';

describe('Rate Limiter', () => {
  let rateLimiter: RateLimiter;
  
  beforeEach(() => {
    rateLimiter = new RateLimiter();
  });
  
  test('should create rate limiter', () => {
    expect(rateLimiter).toBeDefined();
  });
  
  test('should create limiter with config', () => {
    const limiter = rateLimiter.createLimiter('test', {
      windowMs: 60000,
      maxRequests: 10
    });
    expect(limiter).toBeDefined();
  });
  
  test('should check limits correctly', async () => {
    const limiter = rateLimiter.createLimiter('test', {
      windowMs: 60000,
      maxRequests: 5
    });
    
    const key = 'test-user';
    
    // First 5 requests should be allowed
    for (let i = 0; i < 5; i++) {
      const result = await rateLimiter.checkLimit('test', key);
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(4 - i);
    }
    
    // 6th request should be blocked
    const result = await rateLimiter.checkLimit('test', key);
    expect(result.allowed).toBe(false);
    expect(result.remaining).toBe(0);
  });
  
  test('should reset limits', async () => {
    const limiter = rateLimiter.createLimiter('test', {
      windowMs: 60000,
      maxRequests: 1
    });
    
    const key = 'test-user';
    
    // Use up the limit
    await rateLimiter.checkLimit('test', key);
    
    // Reset the limit
    await rateLimiter.resetLimit('test', key);
    
    // Should be able to make another request
    const result = await rateLimiter.checkLimit('test', key);
    expect(result.allowed).toBe(true);
  });
  
  test('should create middleware', () => {
    const middleware = createRateLimitMiddleware('test', RATE_LIMITS.CHAT_API);
    expect(typeof middleware).toBe('function');
  });
  
  test('should handle rate limit exceeded', async () => {
    const middleware = createRateLimitMiddleware('test', {
      windowMs: 60000,
      maxRequests: 1,
      keyGenerator: () => 'test-key'
    });
    
    const req = { ip: '127.0.0.1' } as Request;
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      set: jest.fn()
    } as any;
    const next = jest.fn() as NextFunction;
    
    // First request should pass
    await middleware(req, res, next);
    expect(next).toHaveBeenCalled();
    
    // Second request should be blocked
    await middleware(req, res, next);
    expect(res.status).toHaveBeenCalledWith(429);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: 'Rate limit exceeded'
      })
    );
  });
});