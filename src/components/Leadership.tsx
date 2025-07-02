import React from 'react';
import { motion } from 'framer-motion';
import { Users, Target, Zap, TrendingUp, Award, Heart, MessageCircle, Calendar } from 'lucide-react';
import { useLeadershipContent } from '../hooks/useLeadershipContent';

export default function Leadership() {
  const { content, loading } = useLeadershipContent();

  // Icon mapping
  const iconMap: Record<string, any> = {
    'users': Users,
    'target': Target,
    'trending-up': TrendingUp,
    'award': Award,
    'heart': Heart,
    'zap': Zap,
    'message-circle': MessageCircle,
    'calendar': Calendar
  };

  if (loading) {
    return (
      <section className="relative min-h-screen py-20 px-6 flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </section>
    );
  }

  // Sort metrics and pillars by order
  const sortedMetrics = Array.isArray(content.metrics) 
    ? [...content.metrics].sort((a, b) => a.order - b.order)
    : [];
  const sortedPillars = Array.isArray(content.pillars)
    ? [...content.pillars].sort((a, b) => a.order - b.order)
    : [];

  return (
    <section className="relative min-h-screen py-20 px-6">
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-20"
        >
          <h2 className="text-5xl md:text-6xl font-serif font-bold text-white mb-6">
            {content.mainTitle}
          </h2>
          <p className="text-xl text-gray-300 max-w-4xl mx-auto leading-relaxed">
            {content.mainDescription}
          </p>
        </motion.div>

        {/* Impact Metrics */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.8 }}
          className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-20"
        >
          {sortedMetrics.map((metric, index) => {
            const IconComponent = iconMap[metric.icon] || Users;
            return (
              <motion.div
                key={metric.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * index, duration: 0.6 }}
                className="text-center group"
              >
                <div className="mb-4 mx-auto w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center group-hover:bg-blue-500/20 transition-colors duration-300">
                  <IconComponent className="w-8 h-8 text-blue-400" />
                </div>
                <div className="text-3xl font-bold text-white mb-2">{metric.value}</div>
                <div className="text-sm text-gray-400 uppercase tracking-wide mb-1">{metric.label}</div>
                <div className="text-xs text-gray-500">{metric.description}</div>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Three Pillars */}
        <div className="grid md:grid-cols-3 gap-8">
          {sortedPillars.map((pillar, index) => (
            <motion.div
              key={pillar.id}
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 + index * 0.2, duration: 0.8 }}
              className="group"
            >
              <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-2xl p-8 h-full hover:border-blue-500/30 transition-all duration-300">
                <div className="mb-6">
                  <h3 className="text-2xl font-bold text-white mb-2">{pillar.title}</h3>
                  <p className="text-blue-400 font-medium">{pillar.subtitle}</p>
                </div>
                <ul className="space-y-3">
                  {pillar.content.map((item, itemIndex) => (
                    <li key={itemIndex} className="text-gray-300 flex items-start">
                      <span className="w-2 h-2 bg-blue-400 rounded-full mt-2 mr-3 flex-shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Let's Talk Section */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.5, duration: 0.8 }}
          className="mt-20 text-center"
        >
          <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-2xl p-12 border border-gray-800">
            <h3 className="text-3xl font-bold text-white mb-6">{content.letsTalkTitle}</h3>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto mb-8">
              {content.letsTalkDescription}
            </p>
            <button 
              onClick={() => window.location.href = '#contact'}
              className="px-8 py-4 bg-blue-500 text-white rounded-full font-medium hover:bg-blue-600 transition-colors duration-300 inline-flex items-center gap-3"
            >
              <MessageCircle className="w-5 h-5" />
              {content.letsTalkCTA}
            </button>
          </div>
        </motion.div>
      </div>
    </section>
  );
}