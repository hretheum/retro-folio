import React from 'react';
import { motion } from 'framer-motion';
import { Users, Target, Zap, TrendingUp, Award, Heart } from 'lucide-react';

export default function Leadership() {
  const metrics = [
    { icon: Users, label: 'Teams Built', value: '5', description: 'from scratch' },
    { icon: Target, label: 'Designers Managed', value: '50+', description: 'total' },
    { icon: TrendingUp, label: 'Retention Rate', value: '87%', description: 'average' },
    { icon: Award, label: 'Promotions Enabled', value: '30+', description: 'career growth' },
    { icon: Heart, label: 'Still in Touch', value: '80%', description: 'former team members' }
  ];

  const pillars = [
    {
      title: 'Team Scaling & Organization',
      subtitle: 'From Zero to Chapter',
      content: [
        'Built design teams at ING Bank: 0 → 25 designers in matrix organization',
        'Managing 20+ designers at Sportradar in tribe structure',
        'Created Poland\'s first UX team at Grey/Argonauts',
        'Developed "Hub & Spoke" and "Design Pairs" frameworks'
      ]
    },
    {
      title: 'Ways of Working',
      subtitle: 'Design ↔ Agile Integration',
      content: [
        'Design Sprints ahead of dev sprints',
        'Dual-track agile with continuous discovery',
        'Design system as living organism',
        '3-amigos sessions that designers actually attend'
      ]
    },
    {
      title: 'Leadership Philosophy',
      subtitle: 'Lead by Building',
      content: [
        'Still prototype (in React now)',
        'Still run user research',
        'Still code (AI tools currently)',
        'Teams that innovate, not just execute'
      ]
    }
  ];

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
            Building Teams That Ship
          </h2>
          <p className="text-xl text-gray-300 max-w-4xl mx-auto leading-relaxed">
            I don't just manage designers - I build self-organizing teams that deliver. 
            20+ years of scaling design orgs from 0 to 25+, implementing ways of working 
            that actually work, and bridging the gap between design dreams and agile reality.
          </p>
        </motion.div>

        {/* Impact Metrics */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.8 }}
          className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-20"
        >
          {metrics.map((metric, index) => (
            <motion.div
              key={metric.label}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * index, duration: 0.6 }}
              className="text-center group"
            >
              <div className="mb-4 mx-auto w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center group-hover:bg-blue-500/20 transition-colors duration-300">
                <metric.icon className="w-8 h-8 text-blue-400" />
              </div>
              <div className="text-3xl font-bold text-white mb-2">{metric.value}</div>
              <div className="text-sm text-gray-400 uppercase tracking-wide mb-1">{metric.label}</div>
              <div className="text-xs text-gray-500">{metric.description}</div>
            </motion.div>
          ))}
        </motion.div>

        {/* Three Pillars */}
        <div className="grid md:grid-cols-3 gap-8">
          {pillars.map((pillar, index) => (
            <motion.div
              key={pillar.title}
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

        {/* Interactive Team Growth Visualization */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2, duration: 0.8 }}
          className="mt-20 text-center"
        >
          <h3 className="text-3xl font-bold text-white mb-8">Scaling Framework in Action</h3>
          <div className="bg-gray-900/30 rounded-2xl p-8 border border-gray-800">
            <div className="flex items-center justify-between max-w-4xl mx-auto">
              <div className="text-center">
                <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold mb-2">
                  0
                </div>
                <div className="text-sm text-gray-400">Start</div>
              </div>
              
              <div className="flex-1 h-0.5 bg-gradient-to-r from-blue-500 to-blue-400 mx-4" />
              
              <div className="text-center">
                <div className="w-12 h-12 bg-blue-400 rounded-full flex items-center justify-center text-white font-bold mb-2">
                  5
                </div>
                <div className="text-sm text-gray-400">Month 12</div>
              </div>
              
              <div className="flex-1 h-0.5 bg-gradient-to-r from-blue-400 to-blue-300 mx-4" />
              
              <div className="text-center">
                <div className="w-12 h-12 bg-blue-300 rounded-full flex items-center justify-center text-white font-bold mb-2">
                  25
                </div>
                <div className="text-sm text-gray-400">Year 5</div>
              </div>
            </div>
            <p className="text-gray-400 mt-6">
              The ING Experience: Building Europe's largest design chapter
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}