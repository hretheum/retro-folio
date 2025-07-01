import { VercelRequest, VercelResponse } from '@vercel/node';

// Storage abstraction - works with Vercel KV (Redis) or fallback
class Storage {
  private kv: any = null;

  constructor() {
    // Try to initialize Vercel KV
    try {
      // @vercel/kv will auto-detect credentials from env vars
      const { kv } = require('@vercel/kv');
      this.kv = kv;
    } catch (error) {
      console.log('Vercel KV not available, using in-memory storage');
    }
  }

  async get(key: string): Promise<any> {
    if (this.kv) {
      return await this.kv.get(key);
    }
    // Fallback to in-memory for local dev
    return global[key] || null;
  }

  async set(key: string, value: any): Promise<void> {
    if (this.kv) {
      await this.kv.set(key, value);
    } else {
      // Fallback to in-memory for local dev
      global[key] = value;
    }
  }
}

const storage = new Storage();

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
  const validTypes = ['work', 'timeline', 'experiment'];
  if (!validTypes.includes(type)) {
    return res.status(400).json({ error: 'Invalid content type' });
  }

  try {
    switch (req.method) {
      case 'GET':
        // Get all items of a specific type
        const items = await storage.get(getContentKey(type)) || [];
        return res.status(200).json(items);

      case 'POST':
        // Create new item
        if (!req.body) {
          return res.status(400).json({ error: 'Missing request body' });
        }

        const currentItems = await storage.get(getContentKey(type)) || [];
        const newItem = {
          ...req.body,
          id: Date.now().toString(),
          type,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        
        const updatedItems = [...currentItems, newItem];
        await storage.set(getContentKey(type), updatedItems);
        
        return res.status(201).json(newItem);

      case 'PUT':
        // Update existing item
        if (!req.body || !req.body.id) {
          return res.status(400).json({ error: 'Missing item ID' });
        }

        const itemsToUpdate = await storage.get(getContentKey(type)) || [];
        const itemIndex = itemsToUpdate.findIndex((item: any) => item.id === req.body.id);
        
        if (itemIndex === -1) {
          return res.status(404).json({ error: 'Item not found' });
        }

        itemsToUpdate[itemIndex] = {
          ...itemsToUpdate[itemIndex],
          ...req.body,
          updatedAt: new Date().toISOString()
        };
        
        await storage.set(getContentKey(type), itemsToUpdate);
        return res.status(200).json(itemsToUpdate[itemIndex]);

      case 'DELETE':
        // Delete item
        const { id } = req.query;
        if (!id || typeof id !== 'string') {
          return res.status(400).json({ error: 'Missing item ID' });
        }

        const itemsToDelete = await storage.get(getContentKey(type)) || [];
        const filteredItems = itemsToDelete.filter((item: any) => item.id !== id);
        
        if (filteredItems.length === itemsToDelete.length) {
          return res.status(404).json({ error: 'Item not found' });
        }

        await storage.set(getContentKey(type), filteredItems);
        return res.status(204).send('');

      default:
        res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}