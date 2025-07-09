import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getMetrics, checkCostAlert } from '../../lib/analytics';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  try {
    // Get metrics
    const metrics = await getMetrics();
    
    // Check for cost alert
    const costAlert = await checkCostAlert();
    
    // Format response
    const response = {
      ...metrics,
      costAlert,
      timestamp: new Date().toISOString(),
      status: 'healthy',
    };
    
    // Set cache headers for 1 minute
    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate');
    
    return res.status(200).json(response);
  } catch (error) {
    console.error('Metrics endpoint error:', error);
    return res.status(500).json({
      error: 'Failed to retrieve metrics',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}