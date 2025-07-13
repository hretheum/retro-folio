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