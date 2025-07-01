import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Linkedin, Github, ExternalLink, MessageSquare, Sparkles } from 'lucide-react';

export default function Contact() {
  const [showAI, setShowAI] = useState(false);

  const contactInfo = [
    {
      icon: Mail,
      label: 'Email',
      value: 'eof@offline.pl',
      href: 'mailto:eof@offline.pl'
    },
    {
      icon: Linkedin,
      label: 'LinkedIn',
      value: '/in/eofek',
      href: 'https://linkedin.com/in/eofek'
    },
    {
      icon: Github,
      label: 'GitLab',
      value: 'gitlab.com/eof3',
      href: 'https://gitlab.com/eof3'
    },
    {
      icon: ExternalLink,
      label: 'Live Build',
      value: 'hireverse.app',
      href: 'https://hireverse.app'
    }
  ];

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
            Let's Talk
          </h2>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto mb-8">
            Currently leading design at Sportradar while building AI tools. 
            Looking for my next challenge where leadership meets innovation.
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
              <h3 className="text-xl font-bold text-white mb-4">Open to:</h3>
              <ul className="space-y-3 text-gray-300">
                <li className="flex items-start">
                  <span className="w-2 h-2 bg-green-400 rounded-full mt-2 mr-3 flex-shrink-0" />
                  Roles where design leadership meets technical innovation
                </li>
                <li className="flex items-start">
                  <span className="w-2 h-2 bg-green-400 rounded-full mt-2 mr-3 flex-shrink-0" />
                  Companies pushing boundaries of human-AI collaboration
                </li>
                <li className="flex items-start">
                  <span className="w-2 h-2 bg-green-400 rounded-full mt-2 mr-3 flex-shrink-0" />
                  Teams that ship, not just strategize
                </li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-xl font-bold text-white mb-4">Not interested in:</h3>
              <ul className="space-y-3 text-gray-400">
                <li className="flex items-start">
                  <span className="w-2 h-2 bg-red-400 rounded-full mt-2 mr-3 flex-shrink-0" />
                  Roles where designers just push pixels
                </li>
                <li className="flex items-start">
                  <span className="w-2 h-2 bg-red-400 rounded-full mt-2 mr-3 flex-shrink-0" />
                  "AI strategy" without building
                </li>
                <li className="flex items-start">
                  <span className="w-2 h-2 bg-red-400 rounded-full mt-2 mr-3 flex-shrink-0" />
                  Politics over products
                </li>
              </ul>
            </div>
          </div>
        </motion.div>

        {/* AI Interview CTA */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.8 }}
          className="mb-12"
        >
          <div className="bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border border-blue-500/30 rounded-2xl p-8">
            <div className="flex items-center justify-center mb-6">
              <Sparkles className="w-8 h-8 text-blue-400 mr-3" />
              <h3 className="text-2xl font-bold text-white">Try Something Different</h3>
            </div>
            <p className="text-gray-300 mb-6">
              Instead of the usual "let's chat" email, why not let my AI interview you first? 
              It's like hireverse.app, but for potential collaborators.
            </p>
            <motion.button
              onClick={() => setShowAI(true)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center mx-auto px-8 py-4 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-full font-medium hover:from-blue-600 hover:to-cyan-600 transition-all duration-300 shadow-lg"
            >
              <MessageSquare className="w-5 h-5 mr-2" />
              Start AI Conversation
            </motion.button>
          </div>
        </motion.div>

        {/* Traditional Contact */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9, duration: 0.8 }}
        >
          <h3 className="text-xl text-gray-400 mb-8">Or reach out the traditional way:</h3>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {contactInfo.map((contact, index) => (
              <motion.a
                key={contact.label}
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
                  <contact.icon className="w-8 h-8 text-blue-400 mx-auto mb-3 group-hover:text-blue-300 transition-colors" />
                  <div className="text-sm text-gray-400 mb-1">{contact.label}</div>
                  <div className="text-white font-medium text-sm">{contact.value}</div>
                </div>
              </motion.a>
            ))}
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
            "The future belongs to those who can bridge human creativity with AI capability. 
            Let's build it together."
          </p>
        </motion.div>
      </div>

      {/* AI Chat Modal Placeholder */}
      {showAI && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-6"
          onClick={() => setShowAI(false)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-gray-900 border border-gray-700 rounded-2xl p-8 max-w-lg w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-2xl font-bold text-white mb-4">AI Interview Coming Soon</h3>
            <p className="text-gray-300 mb-6">
              This feature is being built as part of my 30-day hireverse.app challenge. 
              For now, let's stick to traditional contact methods!
            </p>
            <button
              onClick={() => setShowAI(false)}
              className="px-6 py-3 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors"
            >
              Close
            </button>
          </motion.div>
        </motion.div>
      )}
    </section>
  );
}