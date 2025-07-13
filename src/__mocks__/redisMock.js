// Enhanced Redis Mock for Testing
class MockRedis {
  constructor() {
    this.data = new Map();
    this.expirations = new Map();
  }

  async get(key) {
    // Check if key has expired
    if (this.expirations.has(key)) {
      const expiry = this.expirations.get(key);
      if (Date.now() > expiry) {
        this.data.delete(key);
        this.expirations.delete(key);
        return null;
      }
    }
    return this.data.get(key) || null;
  }

  async set(key, value, ...args) {
    this.data.set(key, value);
    
    // Handle EX (expiration in seconds)
    if (args.length >= 2 && args[0] === 'EX') {
      const seconds = parseInt(args[1]);
      this.expirations.set(key, Date.now() + (seconds * 1000));
    }
    
    return 'OK';
  }

  async incr(key) {
    const current = parseInt(this.data.get(key) || '0');
    const newValue = current + 1;
    this.data.set(key, newValue.toString());
    return newValue;
  }

  async expire(key, seconds) {
    if (this.data.has(key)) {
      this.expirations.set(key, Date.now() + (seconds * 1000));
      return 1;
    }
    return 0;
  }

  async del(key) {
    const existed = this.data.has(key);
    this.data.delete(key);
    this.expirations.delete(key);
    return existed ? 1 : 0;
  }

  async flushall() {
    this.data.clear();
    this.expirations.clear();
    return 'OK';
  }

  // Connection methods that don't throw errors
  async connect() {
    return Promise.resolve();
  }

  async disconnect() {
    return Promise.resolve();
  }

  async quit() {
    return Promise.resolve();
  }

  // Status methods
  get status() {
    return 'ready';
  }

  // Event emitter methods (no-op for tests)
  on() {}
  off() {}
  emit() {}
}

// Export both named and default
const mockRedis = new MockRedis();

// Default export for ioredis
module.exports = MockRedis;
module.exports.default = MockRedis;

// Named exports
module.exports.createClient = () => new MockRedis();
module.exports.Redis = MockRedis;

// For CommonJS compatibility
module.exports.__esModule = true;