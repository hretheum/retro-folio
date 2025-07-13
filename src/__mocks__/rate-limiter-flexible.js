// Mock for rate-limiter-flexible
class MockRateLimiterRedis {
  constructor(options) {
    this.options = options;
    this.counters = new Map();
  }

  async consume(key, points = 1) {
    const current = this.counters.get(key) || 0;
    const newCount = current + points;
    
    if (newCount > this.options.points) {
      // Rate limit exceeded
      const error = new Error('Rate limit exceeded');
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

  async reset(key) {
    this.counters.delete(key);
    return true;
  }

  async get(key) {
    const current = this.counters.get(key) || 0;
    return {
      remainingPoints: this.options.points - current,
      msBeforeNext: this.options.duration * 1000,
      totalHits: current
    };
  }
}

module.exports = {
  RateLimiterRedis: MockRateLimiterRedis,
  RateLimiterMemory: MockRateLimiterRedis
};