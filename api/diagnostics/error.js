export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const errorData = req.body;
  
  // Log błędu na serwerze
  console.error('🚨 Client error received:', {
    timestamp: errorData.timestamp,
    url: errorData.url,
    error: errorData.error.message,
    stack: errorData.error.stack,
    componentStack: errorData.errorInfo?.componentStack
  });

  // W przyszłości można tu dodać integrację z Sentry lub innym narzędziem
  
  res.status(200).json({ received: true });
}