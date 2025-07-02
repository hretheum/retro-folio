import { createClient } from 'redis';

export default async function handler(req, res) {
  const health = {
    status: 'checking',
    timestamp: new Date().toISOString(),
    checks: {
      redis: { status: 'unknown' },
      openai: { status: 'unknown' },
      pinecone: { status: 'unknown' },
      environment: {
        NODE_ENV: process.env.NODE_ENV,
        hasOpenAIKey: !!process.env.OPENAI_API_KEY,
        hasPineconeKey: !!process.env.PINECONE_API_KEY,
        hasRedisUrl: !!process.env.REDIS_URL,
      }
    },
    lastError: null
  };

  // Test Redis
  if (process.env.REDIS_URL) {
    try {
      const redis = createClient({ url: process.env.REDIS_URL });
      await redis.connect();
      await redis.ping();
      await redis.disconnect();
      health.checks.redis.status = 'ok';
    } catch (error) {
      health.checks.redis = {
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // Test OpenAI
  if (process.env.OPENAI_API_KEY) {
    try {
      const response = await fetch('https://api.openai.com/v1/models', {
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        }
      });
      health.checks.openai = {
        status: response.ok ? 'ok' : 'error'
      };
      if (!response.ok) {
        health.checks.openai.error = `HTTP ${response.status}`;
      }
    } catch (error) {
      health.checks.openai = {
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // Test Pinecone
  if (process.env.PINECONE_API_KEY) {
    try {
      const response = await fetch('https://api.pinecone.io/indexes', {
        headers: {
          'Api-Key': process.env.PINECONE_API_KEY,
        }
      });
      health.checks.pinecone = {
        status: response.ok ? 'ok' : 'error'
      };
      if (!response.ok) {
        health.checks.pinecone.error = `HTTP ${response.status}`;
      }
    } catch (error) {
      health.checks.pinecone = {
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // Pobierz ostatni błąd z localStorage (jeśli dostępny przez query param)
  if (req.query?.includeLastError) {
    // To musi być pobrane przez klienta
    health.lastError = 'Check browser localStorage for "last_error" key';
  }

  // Określ ogólny status
  const allChecks = Object.values(health.checks).filter(check => typeof check === 'object' && 'status' in check);
  const hasErrors = allChecks.some(check => check.status === 'error');
  health.status = hasErrors ? 'unhealthy' : 'healthy';

  res.status(200).json(health);
}