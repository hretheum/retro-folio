# Autonomiczny Plan Wykonawczy - Faza 2: Hierarchical Classification & Context Management

## 🎯 Cel Dokumentu

Ten dokument jest **samowystarczalnym przewodnikiem** dla autonomicznego agenta kodowania (lub developera) do przeprowadzenia Fazy 2 migracji - implementacji hierarchicznej klasyfikacji intencji i zaawansowanego zarządzania kontekstem.

## � Krytyczne Poprawki z Analizy

### ZADANIE 2.0.1: Implement rate limiting for API protection

```bash
# Install rate limiting dependencies
npm install express-rate-limit redis rate-limiter-flexible

# Create rate limiting service
cat > lib/rate-limiting/rate-limiter.ts << 'EOF'
import { RateLimiterRedis } from 'rate-limiter-flexible';
import Redis from 'ioredis';
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
    this.redis = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD,
      retryDelayOnFailover: 100,
      maxRetriesPerRequest: 3,
    });
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
      totalPoints: info ? info.totalPoints : 0
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
EOF

# Create rate limiting tests
cat > tests/rate-limiting/rate-limiter.test.ts << 'EOF'
import { RateLimiter, createRateLimitMiddleware, RATE_LIMITS } from '../../lib/rate-limiting/rate-limiter';
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
EOF

# Update API endpoints to use rate limiting
cat > api/ai/intelligent-chat-with-rate-limiting.ts << 'EOF'
import { createRateLimitMiddleware, RATE_LIMITS } from '../../lib/rate-limiting/rate-limiter';
import express from 'express';

const app = express();

// Apply rate limiting to chat endpoint
app.use('/api/ai/intelligent-chat', 
  createRateLimitMiddleware('chat-api', RATE_LIMITS.CHAT_API)
);

// Apply rate limiting to intent classification
app.use('/api/ai/intent-classification',
  createRateLimitMiddleware('intent-api', RATE_LIMITS.INTENT_CLASSIFICATION)
);

// Apply rate limiting to context management
app.use('/api/ai/context',
  createRateLimitMiddleware('context-api', RATE_LIMITS.CONTEXT_MANAGEMENT)
);

// Apply rate limiting to admin endpoints
app.use('/api/admin',
  createRateLimitMiddleware('admin-api', RATE_LIMITS.ADMIN_API)
);

export default app;
EOF

# Create rate limiting monitoring
cat > lib/rate-limiting/monitoring.ts << 'EOF'
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
EOF

# Run rate limiting tests
npm test tests/rate-limiting/rate-limiter.test.ts
```

**CHECKPOINT 2.0.1**:
- [ ] Rate limiting framework implemented
- [ ] Redis-based rate limiting configured
- [ ] Express middleware created
- [ ] Tests passing
- [ ] API endpoints protected

## �📁 Struktura Projektu po Fazie 1

```
/Users/hretheum/dev/bezrobocie/retro/
├── src/
│   └── components/
│       └── ErykChatEnhanced.tsx      # Frontend chat component
├── api/
│   └── ai/
│       ├── intelligent-chat.ts       # Original endpoint
│       └── intelligent-chat-rollout.ts # With rollout control
├── lib/
│   ├── chat-intelligence.ts          # Original regex-based
│   ├── embeddings/
│   │   ├── embedding-service.ts      # ✅ Phase 1
│   │   └── similarity-calculator.ts  # ✅ Phase 1
│   ├── intent/
│   │   ├── embedding-classifier.ts   # ✅ Phase 1
│   │   └── parallel-classifier.ts    # ✅ Phase 1
│   ├── cache/
│   │   └── multi-level-cache.ts      # ✅ Phase 1
│   └── rollout/
│       └── gradual-rollout.ts        # ✅ Phase 1
└── validation-reports/               # ✅ Phase 1 reports
```