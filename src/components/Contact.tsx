import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Linkedin, Github, ExternalLink, MessageSquare, Sparkles, Globe, Twitter, BarChart3 } from 'lucide-react';
import { useContactContent } from '../hooks/useContactContent';
import { ErykChatEnhanced } from './ErykChatEnhanced';
import { AnalyticsDashboard } from './AnalyticsDashboard';

export default function Contact() {
  const [showAI, setShowAI] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const { content, loading } = useContactContent();

  // Icon mapping
  const iconMap: Record<string, any> = {
    'mail': Mail,
    'linkedin': Linkedin,
    'github': Github,
    'external-link': ExternalLink,
    'globe': Globe,
    'twitter': Twitter,
    'message-square': MessageSquare
  };

  if (loading) {
    return (
      <section className="relative min-h-screen py-20 px-6 flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </section>
    );
  }

  // Sort and filter preferences
  const openToPrefs = content.preferences
    .filter(p => p.type === 'open')
    .sort((a, b) => a.order - b.order);
  
  const notInterestedPrefs = content.preferences
    .filter(p => p.type === 'not_interested')
    .sort((a, b) => a.order - b.order);

  // Sort contact links
  const sortedLinks = [...content.contactLinks].sort((a, b) => a.order - b.order);

  return (
    <section className="relative min-h-screen py-20 px-6">
      <div className="max-w-4xl mx-auto text-center">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="mb-16"
        >
          <h2 className="text-5xl md:text-6xl font-serif font-bold text-white mb-8">
            {content.mainTitle}
          </h2>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto mb-8">
            {content.mainDescription}
          </p>
        </motion.div>

        {/* Current Status */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.8 }}
          className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-2xl p-8 mb-12"
        >
          <div className="grid md:grid-cols-2 gap-8 text-left">
            <div>
              <h3 className="text-xl font-bold text-white mb-4">{content.openToTitle}</h3>
              <ul className="space-y-3 text-gray-300">
                {openToPrefs.map((pref) => (
                  <li key={pref.id} className="flex items-start">
                    <span className="w-2 h-2 bg-green-400 rounded-full mt-2 mr-3 flex-shrink-0" />
                    {pref.text}
                  </li>
                ))}
              </ul>
            </div>
            
            <div>
              <h3 className="text-xl font-bold text-white mb-4">{content.notInterestedTitle}</h3>
              <ul className="space-y-3 text-gray-400">
                {notInterestedPrefs.map((pref) => (
                  <li key={pref.id} className="flex items-start">
                    <span className="w-2 h-2 bg-red-400 rounded-full mt-2 mr-3 flex-shrink-0" />
                    {pref.text}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </motion.div>

        {/* Enhanced AI Interview CTA */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.8 }}
          className="mb-12"
        >
          <div className="bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border border-blue-500/30 rounded-2xl p-8">
            <div className="flex items-center justify-center mb-6">
              <Sparkles className="w-8 h-8 text-blue-400 mr-3" />
              <h3 className="text-2xl font-bold text-white">{content.aiTitle}</h3>
            </div>
            <p className="text-gray-300 mb-6">
              {content.aiDescription}
            </p>
            
            {/* Enhanced CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <motion.button
                onClick={() => setShowAI(true)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex items-center px-8 py-4 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-full font-medium hover:from-blue-600 hover:to-cyan-600 transition-all duration-300 shadow-lg"
              >
                <MessageSquare className="w-5 h-5 mr-2" />
                {content.aiButtonText || 'Start AI Conversation'}
              </motion.button>
              
              {/* Analytics Button for Demo */}
              <motion.button
                onClick={() => setShowAnalytics(true)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex items-center px-6 py-3 border border-gray-600 text-gray-300 rounded-full font-medium hover:border-blue-500 hover:text-blue-400 transition-all duration-300"
              >
                <BarChart3 className="w-4 h-4 mr-2" />
                View Analytics
              </motion.button>
            </div>
            
            {/* Feature Highlights */}
            <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
              <div className="flex items-center justify-center gap-2 text-gray-400">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                Real-time streaming
              </div>
              <div className="flex items-center justify-center gap-2 text-gray-400">
                <div className="w-2 h-2 bg-blue-400 rounded-full" />
                Enhanced performance
              </div>
              <div className="flex items-center justify-center gap-2 text-gray-400">
                <div className="w-2 h-2 bg-purple-400 rounded-full" />
                Smart analytics
              </div>
            </div>
          </div>
        </motion.div>

        {/* Traditional Contact */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9, duration: 0.8 }}
        >
          <h3 className="text-xl text-gray-400 mb-8">{content.traditionalTitle}</h3>
          
          <div className={`grid gap-6 ${sortedLinks.length <= 4 ? 'grid-cols-2 md:grid-cols-4' : 'grid-cols-2 md:grid-cols-3'}`}>
            {sortedLinks.map((contact, index) => {
              const IconComponent = iconMap[contact.icon] || Mail;
              return (
                <motion.a
                  key={contact.id}
                  href={contact.href}
                  target={contact.href.startsWith('http') ? '_blank' : undefined}
                  rel={contact.href.startsWith('http') ? 'noopener noreferrer' : undefined}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1 + index * 0.1, duration: 0.6 }}
                  whileHover={{ scale: 1.05, y: -5 }}
                  className="group text-center"
                >
                  <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-6 hover:border-blue-500/30 transition-all duration-300">
                    <IconComponent className="w-8 h-8 text-blue-400 mx-auto mb-3 group-hover:text-blue-300 transition-colors" />
                    <div className="text-sm text-gray-400 mb-1">{contact.label}</div>
                    <div className="text-white font-medium text-sm">{contact.value}</div>
                  </div>
                </motion.a>
              );
            })}
          </div>
        </motion.div>

        {/* Final Note */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.5, duration: 0.8 }}
          className="mt-16"
        >
          <p className="text-gray-500 italic">
            {content.finalQuote}
          </p>
        </motion.div>
      </div>

      {/* Enhanced AI Chat Modal */}
      <ErykChatEnhanced 
        isOpen={showAI} 
        onClose={() => setShowAI(false)}
        enableAnalytics={true}
        enableVoice={false} // Can be enabled when voice features are implemented
        enableStreaming={true}
      />
      
      {/* Analytics Dashboard */}
      <AnalyticsDashboard
        isOpen={showAnalytics}
        onClose={() => setShowAnalytics(false)}
      />
    </section>
  );
}