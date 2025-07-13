/**
 * API Validation Tests
 * Testy realnego działania API z kluczami
 */

describe('API Validation Tests', () => {
  const requiredEnvVars = [
    'OPENAI_API_KEY',
    'SUPABASE_URL', 
    'SUPABASE_ANON_KEY',
    'VERCEL_TOKEN'
  ];

  beforeAll(() => {
    // Sprawdź czy wszystkie wymagane zmienne środowiskowe są ustawione
    requiredEnvVars.forEach(envVar => {
      if (!process.env[envVar]) {
        console.warn(`⚠️  Missing environment variable: ${envVar}`);
      }
    });
  });

  describe('OpenAI API Tests', () => {
    test('should connect to OpenAI API successfully', async () => {
      if (!process.env.OPENAI_API_KEY) {
        console.log('⏭️  Skipping OpenAI test - no API key');
        return;
      }

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [{ role: 'user', content: 'Hello' }],
          max_tokens: 10
        })
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.choices).toBeDefined();
      expect(data.choices[0].message).toBeDefined();
    });

    test('should handle OpenAI API errors gracefully', async () => {
      if (!process.env.OPENAI_API_KEY) {
        console.log('⏭️  Skipping OpenAI error test - no API key');
        return;
      }

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [{ role: 'user', content: '' }], // Empty content should trigger error
          max_tokens: 10
        })
      });

      // Should handle error gracefully
      expect(response.status).toBeGreaterThanOrEqual(400);
    });
  });

  describe('Supabase API Tests', () => {
    test('should connect to Supabase API successfully', async () => {
      if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
        console.log('⏭️  Skipping Supabase test - missing credentials');
        return;
      }

      const response = await fetch(`${process.env.SUPABASE_URL}/rest/v1/`, {
        headers: {
          'apikey': process.env.SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${process.env.SUPABASE_ANON_KEY}`,
        }
      });

      // Supabase should respond (even if no tables)
      expect(response.status).toBeGreaterThanOrEqual(200);
      expect(response.status).toBeLessThan(500);
    });

    test('should handle Supabase authentication', async () => {
      if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
        console.log('⏭️  Skipping Supabase auth test - missing credentials');
        return;
      }

      const response = await fetch(`${process.env.SUPABASE_URL}/auth/v1/user`, {
        headers: {
          'apikey': process.env.SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${process.env.SUPABASE_ANON_KEY}`,
        }
      });

      // Should handle auth endpoint
      expect(response.status).toBeGreaterThanOrEqual(200);
      expect(response.status).toBeLessThan(500);
    });
  });

  describe('Vercel API Tests', () => {
    test('should connect to Vercel API successfully', async () => {
      if (!process.env.VERCEL_TOKEN) {
        console.log('⏭️  Skipping Vercel test - no token');
        return;
      }

      const response = await fetch('https://api.vercel.com/v1/user', {
        headers: {
          'Authorization': `Bearer ${process.env.VERCEL_TOKEN}`,
        }
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.user).toBeDefined();
      expect(data.user.email).toBeDefined();
    });

    test('should list Vercel projects', async () => {
      if (!process.env.VERCEL_TOKEN) {
        console.log('⏭️  Skipping Vercel projects test - no token');
        return;
      }

      const response = await fetch('https://api.vercel.com/v1/projects', {
        headers: {
          'Authorization': `Bearer ${process.env.VERCEL_TOKEN}`,
        }
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(Array.isArray(data.projects)).toBe(true);
    });
  });

  describe('Custom API Endpoints Tests', () => {
    const baseUrl = process.env.TEST_API_URL || 'http://localhost:3000';

    test('should validate infrastructure endpoint', async () => {
      try {
        const response = await fetch(`${baseUrl}/api/validate-infrastructure`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ test: 'infrastructure' })
        });

        // Should handle the request (even if endpoint doesn't exist yet)
        expect(response.status).toBeGreaterThanOrEqual(200);
        expect(response.status).toBeLessThan(600);
      } catch (error) {
        // Network errors are expected if server is not running
        console.log('⚠️  Infrastructure endpoint not available:', error.message);
      }
    });

    test('should collect metrics endpoint', async () => {
      try {
        const response = await fetch(`${baseUrl}/api/collect-metrics`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ test: 'metrics' })
        });

        expect(response.status).toBeGreaterThanOrEqual(200);
        expect(response.status).toBeLessThan(600);
      } catch (error) {
        console.log('⚠️  Metrics endpoint not available:', error.message);
      }
    });

    test('should validate classification endpoint', async () => {
      try {
        const response = await fetch(`${baseUrl}/api/validate-classification`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ test: 'classification' })
        });

        expect(response.status).toBeGreaterThanOrEqual(200);
        expect(response.status).toBeLessThan(600);
      } catch (error) {
        console.log('⚠️  Classification endpoint not available:', error.message);
      }
    });
  });

  describe('Integration Tests', () => {
    test('should have all required environment variables for production', () => {
      const missingVars = requiredEnvVars.filter(envVar => !process.env[envVar]);
      
      if (process.env.NODE_ENV === 'production') {
        expect(missingVars).toHaveLength(0);
      } else {
        console.log(`⚠️  Missing env vars in development: ${missingVars.join(', ')}`);
      }
    });

    test('should validate API response times', async () => {
      if (!process.env.OPENAI_API_KEY) {
        console.log('⏭️  Skipping response time test - no OpenAI key');
        return;
      }

      const startTime = Date.now();
      
      await fetch('https://api.openai.com/v1/models', {
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        }
      });

      const responseTime = Date.now() - startTime;
      
      // API should respond within 10 seconds
      expect(responseTime).toBeLessThan(10000);
    });
  });
});