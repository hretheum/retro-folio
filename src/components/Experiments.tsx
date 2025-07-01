import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Github, ExternalLink, Calendar, Zap, Brain, MessageSquare, Eye, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Experiment {
  id: string;
  name: string;
  description: string;
  status: string;
  tech: string[];
  highlight: string;
  icon: string;
  color: string;
  links: {
    live?: string;
    github?: string;
    demo?: string;
  };
}

interface ContentItem {
  id: string;
  type: string;
  title: string;
  status: 'draft' | 'published';
  data: Experiment;
}

export default function Experiments() {
  const navigate = useNavigate();
  const [experiments, setExperiments] = useState<Experiment[]>([]);
  const [loading, setLoading] = useState(true);

  // Load experiments from CMS
  useEffect(() => {
    const loadExperiments = () => {
      try {
        const adminExperimentItems = JSON.parse(localStorage.getItem('admin-experiment-items') || '[]') as ContentItem[];
        
        // Filter published experiments and map to Experiment format
        const publishedExperiments = adminExperimentItems
          .filter(item => item.status === 'published')
          .map(item => item.data)
          .sort((a, b) => {
            // Sort by status priority (active experiments first)
            const getStatusPriority = (status: string) => {
              if (status.includes('Day') || status.includes('public build')) return 1;
              if (status.includes('Production') || status.includes('ready')) return 2;
              if (status.includes('Beta') || status.includes('testing')) return 3;
              return 4;
            };
            
            return getStatusPriority(a.status) - getStatusPriority(b.status);
          });

        setExperiments(publishedExperiments);
      } catch (error) {
        console.error('Error loading experiments from CMS:', error);
        setExperiments([]);
      } finally {
        setLoading(false);
      }
    };

    loadExperiments();

    // Listen for storage changes (when admin updates content)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'admin-experiment-items') {
        loadExperiments();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const handleViewDetails = (experimentId: string) => {
    console.log('View Details clicked for:', experimentId);
    navigate(`/experiment/${experimentId}`);
  };

  const handleLiveClick = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleGithubClick = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const getIconComponent = (iconName: string) => {
    const icons: Record<string, any> = {
      MessageSquare,
      Brain,
      Zap
    };
    return icons[iconName] || MessageSquare;
  };

  if (loading) {
    return (
      <section className="relative min-h-screen py-20 px-6 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading experiments...</p>
        </div>
      </section>
    );
  }

  if (experiments.length === 0) {
    return (
      <section className="relative min-h-screen py-20 px-6 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Experiments Coming Soon</h2>
          <p className="text-gray-400">New experiments are being prepared. Check back soon for exciting updates!</p>
        </div>
      </section>
    );
  }

  // Find the main experiment (hireverse-app or first one)
  const mainExperiment = experiments.find(exp => exp.id === 'hireverse-app') || experiments[0];

  return (
    <section className="relative min-h-screen py-20 px-6" id="experiments">
      <div className="max-w-6xl mx-auto">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-20"
        >
          <h2 className="text-5xl md:text-6xl font-serif font-bold text-white mb-6">
            Building in Public
          </h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            While others talk about AI, I'm shipping. {experiments.length} active experiments proving 
            that the future of work is human-AI collaboration, not replacement.
          </p>
          <div className="mt-4 text-sm text-gray-400">
            {experiments.length} experiments • Live from CMS
          </div>
        </motion.div>

        {/* Current Status Indicator */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3, duration: 0.8 }}
          className="text-center mb-16"
        >
          <div className="inline-block bg-gray-900/50 border border-gray-800 rounded-full px-6 py-3">
            <div className="flex items-center space-x-3">
              <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse" />
              <span className="text-white font-medium">Currently Coding</span>
              <span className="text-gray-400">•</span>
              <span className="text-gray-400">12 commits today</span>
            </div>
          </div>
        </motion.div>

        {/* Projects Grid */}
        <div className="grid md:grid-cols-1 gap-8 max-w-4xl mx-auto">
          {experiments.map((experiment, index) => {
            const IconComponent = getIconComponent(experiment.icon);
            
            return (
              <motion.div
                key={experiment.id}
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 + index * 0.2, duration: 0.8 }}
                className="group"
              >
                <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-2xl p-8 hover:border-blue-500/30 transition-all duration-300">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
                    {/* Project Info */}
                    <div className="flex-1">
                      <div className="flex items-center mb-4">
                        <div className={`w-12 h-12 rounded-full bg-gradient-to-r ${experiment.color} flex items-center justify-center mr-4`}>
                          <IconComponent className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <h3 className="text-2xl font-bold text-white">{experiment.name}</h3>
                          <p className="text-sm text-gray-400">{experiment.status}</p>
                        </div>
                      </div>
                      
                      <p className="text-gray-300 text-lg mb-4">{experiment.description}</p>
                      
                      <div className="flex items-center mb-4">
                        <span className="text-blue-400 font-medium mr-2">🔥</span>
                        <span className="text-blue-400">{experiment.highlight}</span>
                      </div>
                      
                      {/* Tech Stack */}
                      <div className="flex flex-wrap gap-2 mb-6">
                        {experiment.tech.map((tech, techIndex) => (
                          <span
                            key={techIndex}
                            className="px-3 py-1 bg-blue-500/20 text-blue-300 rounded-full text-sm"
                          >
                            {tech}
                          </span>
                        ))}
                      </div>
                    </div>
                    
                    {/* Links */}
                    <div className="flex space-x-4 lg:ml-8">
                      <motion.button
                        onClick={() => handleViewDetails(experiment.id)}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="flex items-center px-4 py-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors duration-300"
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        View Details
                      </motion.button>
                      
                      {experiment.links.live && (
                        <motion.button
                          onClick={() => handleLiveClick(experiment.links.live!)}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          className="flex items-center px-4 py-2 border border-gray-600 text-white rounded-full hover:border-blue-400 hover:text-blue-400 transition-all duration-300"
                        >
                          <ExternalLink className="w-4 h-4 mr-2" />
                          Live
                        </motion.button>
                      )}
                      
                      {experiment.links.github && (
                        <motion.button
                          onClick={() => handleGithubClick(experiment.links.github!)}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          className="flex items-center px-4 py-2 border border-gray-600 text-white rounded-full hover:border-blue-400 hover:text-blue-400 transition-all duration-300"
                        >
                          <Github className="w-4 h-4 mr-2" />
                          Code
                        </motion.button>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Live Development Status */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2, duration: 0.8 }}
          className="mt-16 text-center"
        >
          <div className="bg-gray-900/30 border border-gray-800 rounded-2xl p-8 max-w-2xl mx-auto">
            <div className="flex items-center justify-center mb-6">
              <Calendar className="w-6 h-6 text-blue-400 mr-3" />
              <h3 className="text-xl font-bold text-white">30-Day Build Challenge</h3>
            </div>
            
            <div className="mb-6">
              <div className="flex justify-between text-sm text-gray-400 mb-2">
                <span>Progress</span>
                <span>11/30 days</span>
              </div>
              <div className="w-full bg-gray-800 rounded-full h-2">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: '37%' }}
                  transition={{ delay: 1.5, duration: 1 }}
                  className="bg-gradient-to-r from-blue-500 to-cyan-500 h-2 rounded-full"
                />
              </div>
            </div>
            
            <p className="text-gray-300 mb-6">
              Follow along as I build hireverse.app from concept to viral product. 
              Daily commits, weekly demos, full transparency.
            </p>
            
            <button 
              onClick={() => mainExperiment && handleViewDetails(mainExperiment.id)}
              className="px-6 py-3 bg-blue-500 text-white rounded-full font-medium hover:bg-blue-600 transition-colors duration-300 flex items-center mx-auto"
            >
              Watch Live Development
              <ArrowRight className="w-4 h-4 ml-2" />
            </button>
          </div>
        </motion.div>

        {/* Philosophy */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.5, duration: 0.8 }}
          className="mt-16 text-center"
        >
          <blockquote className="text-2xl italic text-gray-300 max-w-3xl mx-auto">
            "The best way to predict the future is to build it. 
            While others debate AI ethics, I'm coding AI solutions."
          </blockquote>
          <p className="text-gray-500 mt-4">— My approach to innovation</p>
        </motion.div>
      </div>
    </section>
  );
}