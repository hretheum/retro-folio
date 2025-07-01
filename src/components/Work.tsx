import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ExternalLink, Users, TrendingUp, Zap, ArrowRight, Grid, Eye } from 'lucide-react';
import { Link } from 'react-router-dom';

interface Project {
  id: string;
  title: string;
  client: string;
  category: string;
  year: string;
  duration: string;
  teamSize: string;
  description: string;
  challenge: string;
  solution: string;
  impact: string;
  role: string[];
  tags: string[];
  metrics: Record<string, string>;
  color: string;
  featured: boolean;
}

interface ContentItem {
  id: string;
  type: string;
  title: string;
  status: 'draft' | 'published';
  featured?: boolean;
  data: Project;
}

export default function Work() {
  const [selectedCase, setSelectedCase] = useState<number | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  // Load projects from CMS
  useEffect(() => {
    const loadProjects = () => {
      try {
        const adminWorkItems = JSON.parse(localStorage.getItem('admin-work-items') || '[]') as ContentItem[];
        
        // Filter published projects and map to Project format
        const publishedProjects = adminWorkItems
          .filter(item => item.status === 'published')
          .map(item => ({
            ...item.data,
            featured: item.featured || false
          }))
          .sort((a, b) => {
            // Sort by featured first, then by year (newest first)
            if (a.featured && !b.featured) return -1;
            if (!a.featured && b.featured) return 1;
            
            const yearA = parseInt(a.year.split('-')[0]);
            const yearB = parseInt(b.year.split('-')[0]);
            return yearB - yearA;
          });

        setProjects(publishedProjects);
      } catch (error) {
        console.error('Error loading projects from CMS:', error);
        // Fallback to empty array if there's an error
        setProjects([]);
      } finally {
        setLoading(false);
      }
    };

    loadProjects();

    // Listen for storage changes (when admin updates content)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'admin-work-items') {
        loadProjects();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  if (loading) {
    return (
      <section className="relative min-h-screen py-20 px-6 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading projects...</p>
        </div>
      </section>
    );
  }

  if (projects.length === 0) {
    return (
      <section className="relative min-h-screen py-20 px-6 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-white mb-4">No Projects Available</h2>
          <p className="text-gray-400 mb-8">Projects are being updated. Please check back soon.</p>
          <Link
            to="/portfolio"
            className="inline-flex items-center px-6 py-3 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors"
          >
            <Grid className="w-5 h-5 mr-2" />
            View Portfolio
          </Link>
        </div>
      </section>
    );
  }

  const featuredProjects = projects.filter(p => p.featured);
  const regularProjects = projects.filter(p => !p.featured);
  const displayProjects = [...featuredProjects, ...regularProjects].slice(0, 3); // Show top 3

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
            Impact at Scale
          </h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto mb-8">
            Three decades of pioneering digital experiences across industries, 
            from Poland's first usability tests to enterprise transformations.
          </p>
          
          {/* Portfolio CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.8 }}
            className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-4"
          >
            <Link
              to="/portfolio"
              className="group flex items-center px-8 py-4 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-full font-medium hover:from-blue-600 hover:to-cyan-600 transition-all duration-300 shadow-lg hover:shadow-blue-500/25"
            >
              <Grid className="w-5 h-5 mr-2" />
              View All Projects
              <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
            </Link>
            <div className="text-sm text-gray-400">
              {projects.length} projects • {featuredProjects.length} featured • Live from CMS
            </div>
          </motion.div>
        </motion.div>

        {/* Featured Case Studies */}
        <div className="grid gap-8">
          {displayProjects.map((project, index) => (
            <motion.div
              key={project.id}
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 + index * 0.2, duration: 0.8 }}
              className="group cursor-pointer"
              onClick={() => setSelectedCase(selectedCase === index ? null : index)}
            >
              <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-2xl overflow-hidden hover:border-blue-500/30 transition-all duration-300">
                {/* Main Content */}
                <div className="p-8">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex-1">
                      <div className="flex items-center mb-4">
                        <div className={`w-4 h-4 rounded-full bg-gradient-to-r ${project.color} mr-3`} />
                        <span className="text-sm text-gray-400 uppercase tracking-wide">
                          {project.client}
                        </span>
                        <span className="text-xs text-gray-500 ml-4">
                          {project.year}
                        </span>
                        {project.featured && (
                          <span className="ml-4 px-2 py-1 bg-blue-500/20 text-blue-300 rounded-full text-xs">
                            Featured
                          </span>
                        )}
                      </div>
                      <h3 className="text-3xl font-bold text-white mb-4">
                        {project.title}
                      </h3>
                      <p className="text-gray-300 text-lg mb-6">
                        <strong>Challenge:</strong> {project.challenge}
                      </p>
                      <p className="text-blue-400 text-lg mb-4">
                        <strong>Impact:</strong> {project.impact}
                      </p>
                      
                      {/* Tags */}
                      <div className="flex flex-wrap gap-2 mb-6">
                        {project.tags.slice(0, 3).map((tag, tagIndex) => (
                          <span
                            key={tagIndex}
                            className="px-3 py-1 bg-blue-500/20 text-blue-300 rounded-full text-sm"
                          >
                            {tag}
                          </span>
                        ))}
                        {project.tags.length > 3 && (
                          <span className="px-3 py-1 bg-gray-700 text-gray-300 rounded-full text-sm">
                            +{project.tags.length - 3} more
                          </span>
                        )}
                      </div>
                    </div>
                    
                    {/* Metrics */}
                    <div className="mt-8 lg:mt-0 lg:ml-8">
                      <div className="flex lg:flex-col space-x-6 lg:space-x-0 lg:space-y-4">
                        {Object.entries(project.metrics).slice(0, 3).map(([key, value]) => (
                          <div key={key} className="text-center">
                            <div className="text-2xl font-bold text-white">{value}</div>
                            <div className="text-xs text-gray-400 uppercase">{key}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Expand Button */}
                  <div className="mt-6 flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <button className="flex items-center text-blue-400 hover:text-blue-300 transition-colors">
                        <Eye className="w-4 h-4 mr-2" />
                        <span className="mr-2">View Details</span>
                      </button>
                      <Link
                        to={`/case/${project.id}`}
                        className="flex items-center text-gray-400 hover:text-white transition-colors"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <ExternalLink className="w-4 h-4 mr-2" />
                        <span>Full Case Study</span>
                      </Link>
                    </div>
                    <motion.div
                      animate={{ rotate: selectedCase === index ? 180 : 0 }}
                      transition={{ duration: 0.3 }}
                      className="text-gray-400"
                    >
                      ▼
                    </motion.div>
                  </div>
                </div>

                {/* Expanded Content */}
                <AnimatePresence>
                  {selectedCase === index && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3 }}
                      className="border-t border-gray-800"
                    >
                      <div className="p-8 bg-gray-900/30">
                        <h4 className="text-xl font-bold text-white mb-4">My Role & Approach</h4>
                        <ul className="space-y-3 mb-6">
                          {project.role.map((item, roleIndex) => (
                            <li key={roleIndex} className="text-gray-300 flex items-start">
                              <span className="w-2 h-2 bg-blue-400 rounded-full mt-2 mr-3 flex-shrink-0" />
                              {item}
                            </li>
                          ))}
                        </ul>
                        
                        <div className="flex flex-wrap gap-3 mb-6">
                          {project.tags.map((tag, tagIndex) => (
                            <span
                              key={tagIndex}
                              className="px-3 py-1 bg-blue-500/20 text-blue-300 rounded-full text-sm"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                        
                        <div className="mt-6 pt-6 border-t border-gray-700">
                          <Link
                            to={`/case/${project.id}`}
                            className="inline-flex items-center px-6 py-3 bg-blue-500 text-white rounded-full font-medium hover:bg-blue-600 transition-colors duration-300"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <ExternalLink className="w-4 h-4 mr-2" />
                            Read Full Case Study
                          </Link>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2, duration: 0.8 }}
          className="text-center mt-16"
        >
          <div className="bg-gray-900/30 border border-gray-800 rounded-2xl p-8 max-w-2xl mx-auto">
            <h3 className="text-2xl font-bold text-white mb-4">
              This is just the beginning
            </h3>
            <p className="text-gray-300 mb-6">
              These projects are just the tip of the iceberg. In the portfolio you'll find 
              complete case studies, design process details, and comprehensive result analysis.
            </p>
            <Link
              to="/portfolio"
              className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-full font-medium hover:from-blue-600 hover:to-cyan-600 transition-all duration-300 shadow-lg hover:shadow-blue-500/25"
            >
              <Grid className="w-5 h-5 mr-2" />
              Browse Full Portfolio
              <ArrowRight className="w-5 h-5 ml-2" />
            </Link>
            
            {projects.length > 3 && (
              <div className="mt-4 text-sm text-gray-400">
                Showing 3 of {projects.length} projects
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </section>
  );
}