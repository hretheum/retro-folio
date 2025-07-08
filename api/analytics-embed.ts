import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Fetch analytics data
    const baseUrl = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 
                   process.env.NODE_ENV === 'development' ? 'http://localhost:3000' : 
                   'https://retro-folio.vercel.app';

    const response = await fetch(`${baseUrl}/api/ai/analytics`);
    let analyticsData: any = null;
    
    if (response.ok) {
      analyticsData = await response.json();
    }

    // Generate HTML with embedded analytics
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Analytics Dashboard</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
        body { background-color: #0f0f0f; color: white; font-family: system-ui, -apple-system, sans-serif; }
        .gradient-bg { background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%); }
        .animate-pulse { animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite; }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: .5; } }
    </style>
</head>
<body class="p-6">
    <div class="max-w-7xl mx-auto">
        <div class="text-center mb-8">
            <h1 class="text-3xl font-bold text-white mb-2">📊 AI Chat Analytics</h1>
            <p class="text-gray-400">Real-time performance metrics and insights</p>
        </div>

        ${analyticsData ? `
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div class="bg-gray-800 rounded-xl p-6 border border-gray-700">
                <div class="flex items-center justify-between mb-4">
                    <span class="text-2xl">💬</span>
                </div>
                <div class="text-2xl font-bold text-white mb-1">${analyticsData.overview.totalConversations}</div>
                <div class="text-sm text-gray-400">Total Conversations</div>
            </div>
            
            <div class="bg-gray-800 rounded-xl p-6 border border-gray-700">
                <div class="flex items-center justify-between mb-4">
                    <span class="text-2xl">⚡</span>
                </div>
                <div class="text-2xl font-bold text-white mb-1">${analyticsData.overview.averageResponseTime}ms</div>
                <div class="text-sm text-gray-400">Avg Response Time</div>
            </div>
            
            <div class="bg-gray-800 rounded-xl p-6 border border-gray-700">
                <div class="flex items-center justify-between mb-4">
                    <span class="text-2xl">🎯</span>
                </div>
                <div class="text-2xl font-bold text-white mb-1">${analyticsData.overview.cacheHitRate}%</div>
                <div class="text-sm text-gray-400">Cache Hit Rate</div>
            </div>
            
            <div class="bg-gray-800 rounded-xl p-6 border border-gray-700">
                <div class="flex items-center justify-between mb-4">
                    <span class="text-2xl">👥</span>
                    <div class="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                </div>
                <div class="text-2xl font-bold text-white mb-1">${analyticsData.realtime.activeUsers}</div>
                <div class="text-sm text-gray-400">Active Users</div>
            </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <div class="bg-gray-800 rounded-xl p-6 border border-gray-700">
                <h3 class="text-lg font-semibold text-white mb-4">🔍 Popular Queries</h3>
                <div class="space-y-3">
                    ${analyticsData.overview.popularQueries.slice(0, 5).map(query => `
                        <div class="flex justify-between items-center">
                            <span class="text-gray-300 text-sm truncate flex-1 mr-4">${query.query}</span>
                            <span class="text-white text-sm bg-gray-700 px-2 py-1 rounded">${query.count}</span>
                        </div>
                    `).join('')}
                </div>
            </div>

            <div class="bg-gray-800 rounded-xl p-6 border border-gray-700">
                <h3 class="text-lg font-semibold text-white mb-4">📈 Performance</h3>
                <div class="space-y-4">
                    <div class="flex justify-between items-center">
                        <span class="text-gray-300">P95 Response Time</span>
                        <span class="text-white font-mono">${analyticsData.performance.responseTimeP95}ms</span>
                    </div>
                    <div class="flex justify-between items-center">
                        <span class="text-gray-300">Error Rate</span>
                        <span class="text-${analyticsData.performance.errorRate < 1 ? 'green' : 'red'}-400 font-mono">${analyticsData.performance.errorRate.toFixed(2)}%</span>
                    </div>
                    <div class="flex justify-between items-center">
                        <span class="text-gray-300">Search Performance</span>
                        <span class="text-white font-mono">${analyticsData.performance.searchPerformance.averageSearchTime}ms</span>
                    </div>
                </div>
            </div>
        </div>

        <div class="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <h3 class="text-lg font-semibold text-white mb-4">📊 Daily Usage (Last 7 Days)</h3>
            <div class="flex items-end justify-between h-32 gap-2">
                ${analyticsData.overview.dailyUsage.map(day => {
                  const maxConversations = Math.max(...analyticsData.overview.dailyUsage.map(d => d.conversations));
                  const height = maxConversations > 0 ? (day.conversations / maxConversations) * 80 : 0;
                  
                  return `
                    <div class="flex-1 flex flex-col items-center gap-2">
                        <div class="text-xs text-gray-400 text-center">${day.conversations}</div>
                        <div class="w-full gradient-bg rounded-t transition-all duration-500" style="height: ${height}px; min-height: ${height > 0 ? '8px' : '2px'}"></div>
                        <div class="text-xs text-gray-500 text-center">${new Date(day.date).toLocaleDateString('en', { weekday: 'short' })}</div>
                    </div>
                  `;
                }).join('')}
            </div>
        </div>
        ` : `
        <div class="bg-gray-800 rounded-xl p-12 border border-gray-700 text-center">
            <div class="text-6xl mb-4">📊</div>
            <h3 class="text-xl font-semibold text-white mb-2">Loading Analytics...</h3>
            <p class="text-gray-400">Fetching latest performance data</p>
        </div>
        `}

        <div class="mt-8 text-center">
            <p class="text-gray-500 text-sm">
                Last updated: ${new Date().toLocaleString()} | 
                <button onclick="window.location.reload()" class="text-blue-400 hover:text-blue-300">Refresh</button>
            </p>
        </div>
    </div>

    <script>
        // Auto-refresh every 30 seconds
        setTimeout(() => {
            window.location.reload();
        }, 30000);
    </script>
</body>
</html>`;

    res.setHeader('Content-Type', 'text/html');
    return res.status(200).send(html);

  } catch (error) {
    console.error('Analytics embed error:', error);
    
    const errorHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Analytics Error</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <style>body { background-color: #0f0f0f; color: white; }</style>
</head>
<body class="p-6">
    <div class="max-w-4xl mx-auto text-center">
        <div class="text-6xl mb-4">⚠️</div>
        <h1 class="text-2xl font-bold text-white mb-4">Analytics Unavailable</h1>
        <p class="text-gray-400 mb-6">Unable to load analytics data. Please try again later.</p>
        <button onclick="window.location.reload()" class="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors">
            Retry
        </button>
    </div>
</body>
</html>`;

    res.setHeader('Content-Type', 'text/html');
    return res.status(500).send(errorHtml);
  }
}