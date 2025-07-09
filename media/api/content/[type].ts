import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from 'redis';

// Create Redis client with proper error handling
async function getRedisClient() {
  try {
    const redisUrl = process.env.REDIS_URL;
    
    if (!redisUrl) {
      console.error('REDIS_URL not found in environment variables');
      return null;
    }

    const client = createClient({ 
      url: redisUrl,
      socket: {
        connectTimeout: 5000,
        reconnectStrategy: (retries) => {
          if (retries > 3) return false;
          return Math.min(retries * 100, 3000);
        }
      }
    });

    client.on('error', (err) => {
      console.error('Redis Client Error:', err);
    });

    await client.connect();
    return client;
  } catch (error) {
    console.error('Failed to connect to Redis:', error);
    return null;
  }
}

// Helper to get content key
const getContentKey = (type: string) => `content:${type}`;

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { type } = req.query;
  
  if (!type || typeof type !== 'string') {
    return res.status(400).json({ error: 'Invalid content type' });
  }

  // Validate content type
  const validTypes = ['work', 'timeline', 'experiment', 'leadership', 'contact'];
  if (!validTypes.includes(type)) {
    return res.status(400).json({ error: 'Invalid content type' });
  }

  let client = null;

  try {
    // Connect to Redis
    client = await getRedisClient();
    
    if (!client) {
      // If Redis is not available, return empty array (frontend will use localStorage)
      console.log('Redis not available, returning empty array');
      return res.status(200).json([]);
    }

    const contentKey = getContentKey(type);

    switch (req.method) {
      case 'GET':
        // Get all items of a specific type
        const data = await client.get(contentKey);
        const items = data ? JSON.parse(data) : [];
        return res.status(200).json(items);

      case 'POST':
        // Create new item
        if (!req.body) {
          return res.status(400).json({ error: 'Missing request body' });
        }

        const currentData = await client.get(contentKey);
        const currentItems = currentData ? JSON.parse(currentData) : [];
        
        const newItem = {
          ...req.body,
          id: Date.now().toString(),
          type,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        
        const updatedItems = [...currentItems, newItem];
        await client.set(contentKey, JSON.stringify(updatedItems));
        
        return res.status(201).json(newItem);

      case 'PUT':
        // Update existing item
        if (!req.body || !req.body.id) {
          return res.status(400).json({ error: 'Missing item ID' });
        }

        const putData = await client.get(contentKey);
        const itemsToUpdate = putData ? JSON.parse(putData) : [];
        const itemIndex = itemsToUpdate.findIndex((item: any) => item.id === req.body.id);
        
        if (itemIndex === -1) {
          return res.status(404).json({ error: 'Item not found' });
        }

        itemsToUpdate[itemIndex] = {
          ...itemsToUpdate[itemIndex],
          ...req.body,
          updatedAt: new Date().toISOString()
        };
        
        await client.set(contentKey, JSON.stringify(itemsToUpdate));
        return res.status(200).json(itemsToUpdate[itemIndex]);

      case 'DELETE':
        // Delete item
        const { id } = req.query;
        if (!id || typeof id !== 'string') {
          return res.status(400).json({ error: 'Missing item ID' });
        }

        const deleteData = await client.get(contentKey);
        const itemsToDelete = deleteData ? JSON.parse(deleteData) : [];
        const filteredItems = itemsToDelete.filter((item: any) => item.id !== id);
        
        if (filteredItems.length === itemsToDelete.length) {
          return res.status(404).json({ error: 'Item not found' });
        }

        await client.set(contentKey, JSON.stringify(filteredItems));
        return res.status(204).send('');

      default:
        res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error: any) {
    console.error('API Error:', error);
    return res.status(500).json({ 
      error: 'Internal server error', 
      message: error.message 
    });
  } finally {
    // Always disconnect
    if (client) {
      await client.disconnect();
    }
  }
}