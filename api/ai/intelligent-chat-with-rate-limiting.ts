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