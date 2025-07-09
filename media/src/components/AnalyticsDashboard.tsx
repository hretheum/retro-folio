import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  BarChart3, 
  TrendingUp, 
  Clock, 
  MessageSquare, 
  Users, 
  Zap,
  ThumbsUp,
  ThumbsDown,
  Activity,
  Eye,
  RefreshCw
} from 'lucide-react';

interface AnalyticsData {
  overview: {
    totalConversations: number;
    averageResponseTime: number;
    cacheHitRate: number;
    popularQueries: Array<{ query: string; count: number }>;
    dailyUsage: Array<{ date: string; conversations: number }>;
  };
  performance: {
    responseTimeP95: number;
    responseTimeP99: number;
    searchPerformance: {
      averageSearchTime: number;
      cacheHitRate: number;
    };
    errorRate: number;
  };
  userBehavior: {
    averageConversationLength: number;
    mostAskedTopics: Array<{ topic: string; percentage: number }>;
    feedbackStats: {
      helpful: number;
      notHelpful: number;
      totalFeedback: number;
    };
  };
  realtime: {
    activeUsers: number;
    requestsLastHour: number;
    currentCacheSize: number;
  };
}

interface AnalyticsDashboardProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AnalyticsDashboard({ isOpen, onClose }: AnalyticsDashboardProps) {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchAnalytics = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/ai/analytics');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const analyticsData = await response.json();
      setData(analyticsData);
      setLastUpdated(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch analytics');
      console.error('Analytics fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchAnalytics();
      
      // Auto-refresh every 30 seconds
      const interval = setInterval(fetchAnalytics, 30000);
      return () => clearInterval(interval);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-gray-900 border border-gray-700 rounded-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <div className="flex items-center gap-3">
            <BarChart3 className="w-6 h-6 text-blue-400" />
            <h2 className="text-2xl font-bold text-white">AI Chat Analytics</h2>
          </div>
          <div className="flex items-center gap-4">
            {lastUpdated && (
              <span className="text-sm text-gray-400">
                Last updated: {lastUpdated.toLocaleTimeString()}
              </span>
            )}
            <button
              onClick={fetchAnalytics}
              disabled={loading}
              className="p-2 rounded-lg hover:bg-gray-800 transition-colors"
            >
              <RefreshCw className={`w-5 h-5 text-gray-400 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-gray-800 transition-colors text-gray-400"
            >
              ✕
            </button>
          </div>
        </div>

        <div className="p-6">
          {loading && !data && (
            <div className="flex items-center justify-center py-12">
              <div className="flex items-center gap-3 text-gray-400">
                <RefreshCw className="w-5 h-5 animate-spin" />
                Loading analytics...
              </div>
            </div>
          )}

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 mb-6">
              <div className="text-red-400 font-medium">Error loading analytics</div>
              <div className="text-red-300 text-sm mt-1">{error}</div>
            </div>
          )}

          {data && (
            <div className="space-y-8">
              {/* Overview Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <MetricCard
                  icon={MessageSquare}
                  title="Total Conversations"
                  value={data.overview.totalConversations.toLocaleString()}
                  change="+12%"
                  positive
                />
                <MetricCard
                  icon={Clock}
                  title="Avg Response Time"
                  value={`${data.overview.averageResponseTime}ms`}
                  change="-5%"
                  positive
                />
                <MetricCard
                  icon={Zap}
                  title="Cache Hit Rate"
                  value={`${data.overview.cacheHitRate}%`}
                  change="+8%"
                  positive
                />
                <MetricCard
                  icon={Users}
                  title="Active Users"
                  value={data.realtime.activeUsers.toString()}
                  change="Real-time"
                  isRealtime
                />
              </div>

              {/* Performance Metrics */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-green-400" />
                    Performance Metrics
                  </h3>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-300">P95 Response Time</span>
                      <span className="text-white font-mono">{data.performance.responseTimeP95}ms</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-300">P99 Response Time</span>
                      <span className="text-white font-mono">{data.performance.responseTimeP99}ms</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-300">Search Performance</span>
                      <span className="text-white font-mono">{data.performance.searchPerformance.averageSearchTime}ms</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-300">Error Rate</span>
                      <span className={`font-mono ${data.performance.errorRate < 1 ? 'text-green-400' : 'text-red-400'}`}>
                        {data.performance.errorRate.toFixed(2)}%
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <Activity className="w-5 h-5 text-blue-400" />
                    User Behavior
                  </h3>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-300">Avg Conversation Length</span>
                      <span className="text-white font-mono">{data.userBehavior.averageConversationLength} tokens</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-300">Total Feedback</span>
                      <span className="text-white font-mono">{data.userBehavior.feedbackStats.totalFeedback}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <ThumbsUp className="w-4 h-4 text-green-400" />
                        <span className="text-gray-300">Helpful</span>
                      </div>
                      <span className="text-green-400 font-mono">{data.userBehavior.feedbackStats.helpful}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <ThumbsDown className="w-4 h-4 text-red-400" />
                        <span className="text-gray-300">Not Helpful</span>
                      </div>
                      <span className="text-red-400 font-mono">{data.userBehavior.feedbackStats.notHelpful}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Popular Queries and Topics */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <Eye className="w-5 h-5 text-purple-400" />
                    Popular Queries
                  </h3>
                  <div className="space-y-3">
                    {data.overview.popularQueries.slice(0, 5).map((query, index) => (
                      <div key={index} className="flex justify-between items-center">
                        <span className="text-gray-300 text-sm truncate flex-1 mr-4">
                          {query.query}
                        </span>
                        <span className="text-white font-mono text-sm bg-gray-700 px-2 py-1 rounded">
                          {query.count}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-orange-400" />
                    Most Asked Topics
                  </h3>
                  <div className="space-y-3">
                    {data.userBehavior.mostAskedTopics.map((topic, index) => (
                      <div key={index} className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-300 text-sm">{topic.topic}</span>
                          <span className="text-white font-mono text-sm">{topic.percentage}%</span>
                        </div>
                        <div className="w-full bg-gray-700 rounded-full h-2">
                          <div
                            className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-500"
                            style={{ width: `${topic.percentage}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Daily Usage Chart */}
              <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-green-400" />
                  Daily Usage (Last 7 Days)
                </h3>
                <div className="flex items-end justify-between h-32 gap-2">
                  {data.overview.dailyUsage.map((day, index) => {
                    const maxConversations = Math.max(...data.overview.dailyUsage.map(d => d.conversations));
                    const height = maxConversations > 0 ? (day.conversations / maxConversations) * 100 : 0;
                    
                    return (
                      <div key={index} className="flex-1 flex flex-col items-center gap-2">
                        <div className="text-xs text-gray-400 text-center">
                          {day.conversations}
                        </div>
                        <div
                          className="w-full bg-gradient-to-t from-blue-500 to-cyan-400 rounded-t transition-all duration-500"
                          style={{ height: `${height}%`, minHeight: height > 0 ? '8px' : '2px' }}
                        />
                        <div className="text-xs text-gray-500 text-center">
                          {new Date(day.date).toLocaleDateString('en', { weekday: 'short' })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Real-time Status */}
              <div className="bg-gradient-to-r from-green-500/10 to-blue-500/10 border border-green-500/20 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <Activity className="w-5 h-5 text-green-400" />
                  Real-time Status
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-400">{data.realtime.activeUsers}</div>
                    <div className="text-sm text-gray-300">Active Users</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-400">{data.realtime.requestsLastHour}</div>
                    <div className="text-sm text-gray-300">Requests Last Hour</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-400">{data.realtime.currentCacheSize}</div>
                    <div className="text-sm text-gray-300">Cache Entries</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

interface MetricCardProps {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  value: string;
  change: string;
  positive?: boolean;
  isRealtime?: boolean;
}

function MetricCard({ icon: Icon, title, value, change, positive, isRealtime }: MetricCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gray-800/50 border border-gray-700 rounded-xl p-6"
    >
      <div className="flex items-center justify-between mb-4">
        <Icon className="w-8 h-8 text-blue-400" />
        {isRealtime && <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />}
      </div>
      <div className="text-2xl font-bold text-white mb-1">{value}</div>
      <div className="text-sm text-gray-400 mb-2">{title}</div>
      <div className={`text-xs font-medium ${
        isRealtime ? 'text-gray-500' :
        positive ? 'text-green-400' : 'text-red-400'
      }`}>
        {change}
      </div>
    </motion.div>
  );
}