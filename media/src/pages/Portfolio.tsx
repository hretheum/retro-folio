import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useSearchParams } from 'react-router-dom';
import { 
  ArrowLeft, 
  Filter, 
  Search, 
  Calendar, 
  Users, 
  Eye,
  Grid,
  List,
  X,
  ChevronLeft,
  ChevronRight,
  Target,
  Lightbulb,
  TrendingUp,
  Award
} from 'lucide-react';

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

// Mock case study data for modal
const caseStudyData: Record<string, any> = {
  'tvp-cms': {
    id: 'tvp-cms',
    title: 'Digital Publishing Revolution',
    client: 'TVP - Poland\'s National Broadcaster',
    category: 'Media & Publishing',
    year: '2019-2021',
    duration: '24 months',
    teamSize: '12 people',
    description: 'Complete digital transformation of Poland\'s largest broadcaster',
    challenge: 'Unify 500+ journalists across 16 regions with inconsistent workflows',
    solution: 'Enterprise CMS with real-time collaboration and automated publishing',
    impact: '60% faster publishing, unified brand experience, 10M+ monthly users',
    role: [
      'Led 6-month research phase across all regions',
      'Designed workflows for real-time news publishing',
      'Facilitated first-ever national editorial workshop',
      'Implemented WCAG 2.1 accessibility standards',
      'Created design system for 20+ digital properties'
    ],
    tags: ['Enterprise UX', 'CMS Design', 'Accessibility', 'Workflow Design', 'Design Systems'],
    metrics: {
      'Users': '10M+',
      'Regions': '16',
      'Efficiency': '+60%',
      'Properties': '20+'
    },
    color: 'from-red-500 to-red-600',
    featured: true,
    overview: 'TVP, Poland\'s national broadcaster, faced a critical challenge: 500+ journalists across 16 regional offices were using different systems, creating inconsistent content and inefficient workflows. This project transformed their entire digital publishing infrastructure.',
    problemStatement: 'The existing system was a patchwork of legacy tools that prevented real-time collaboration, created content inconsistencies, and made it impossible to maintain brand standards across regions.',
    keyFeatures: [
      {
        title: 'Real-time Collaboration',
        description: 'Multiple journalists can work on the same article simultaneously with live editing and commenting',
        impact: 'Reduced article production time by 40%'
      },
      {
        title: 'Automated Publishing Workflows',
        description: 'Smart routing system that automatically assigns content based on topic, region, and priority',
        impact: 'Eliminated 80% of manual content routing tasks'
      },
      {
        title: 'Unified Design System',
        description: 'Comprehensive component library ensuring consistent branding across all digital properties',
        impact: 'Achieved 95% brand consistency across all regions'
      }
    ],
    results: [
      {
        metric: 'Publishing Speed',
        before: '45 minutes',
        after: '18 minutes',
        improvement: '60% faster'
      },
      {
        metric: 'Content Consistency',
        before: '40%',
        after: '95%',
        improvement: '55% increase'
      },
      {
        metric: 'User Satisfaction',
        before: '3.2/10',
        after: '8.7/10',
        improvement: '172% increase'
      }
    ]
  },
  'polsat-streaming': {
    id: 'polsat-streaming',
    title: 'Telco to Streaming Platform',
    client: 'Cyfrowy Polsat - Media Transformation',
    category: 'Streaming & Entertainment',
    year: '2015-2018',
    duration: '36 months',
    teamSize: '25 people',
    description: 'Transforming traditional cable TV into Netflix competitor',
    challenge: 'Transform cable TV company into modern streaming platform',
    solution: 'Unified quad-play platform serving TV, Internet, Mobile, and Streaming',
    impact: '40% reduction in support calls, 2M+ active subscribers',
    role: [
      'Multi-year design leadership across all touchpoints',
      'Quad-play service architecture design',
      'Design system for 20+ digital properties',
      'Multi-device experience strategy (TV, mobile, web)',
      'User research and testing programs'
    ],
    tags: ['Design Systems', 'Multi-platform', 'Streaming UX', 'Leadership', 'Service Design'],
    metrics: {
      'Subscribers': '2M+',
      'Properties': '20+',
      'Support Reduction': '40%',
      'Devices': '5+'
    },
    color: 'from-blue-500 to-blue-600',
    featured: true,
    overview: 'Cyfrowy Polsat needed to evolve from a traditional cable TV provider to compete with Netflix and other streaming services. This transformation required reimagining their entire service ecosystem and customer experience.',
    problemStatement: 'Traditional cable TV was losing customers to streaming services. Polsat needed to create a unified platform that could compete with global streaming giants while leveraging their existing infrastructure and content library.',
    keyFeatures: [
      {
        title: 'Unified Content Discovery',
        description: 'AI-powered recommendation engine that works across live TV, VOD, and streaming content',
        impact: 'Increased content engagement by 65%'
      },
      {
        title: 'Cross-Device Continuity',
        description: 'Seamless experience that allows users to start watching on TV and continue on mobile',
        impact: 'Improved user retention by 45%'
      },
      {
        title: 'Simplified Service Management',
        description: 'Single interface to manage TV, internet, mobile, and streaming services',
        impact: 'Reduced support calls by 40%'
      }
    ],
    results: [
      {
        metric: 'Monthly Active Users',
        before: '800K',
        after: '2.1M',
        improvement: '162% increase'
      },
      {
        metric: 'Customer Satisfaction',
        before: '6.2/10',
        after: '8.4/10',
        improvement: '35% increase'
      },
      {
        metric: 'Support Call Volume',
        before: '50K/month',
        after: '30K/month',
        improvement: '40% reduction'
      }
    ]
  },
  'vw-bank': {
    id: 'vw-bank',
    title: 'Banking\'s First UX Tests',
    client: 'Volkswagen Bank - Pioneering Usability',
    category: 'Financial Services',
    year: '2003-2005',
    duration: '18 months',
    teamSize: '8 people',
    description: 'Poland\'s first comprehensive usability testing in banking',
    challenge: 'Launch online banking when Poles didn\'t trust internet transactions',
    solution: 'Evidence-based design through extensive user testing and iteration',
    impact: 'Established UX as legitimate practice in Polish banking industry',
    role: [
      'Conducted 30+ moderated usability tests',
      'Convinced skeptical executives with data',
      'Created reusable design patterns',
      'Documented ROI of UX investment',
      'Trained internal teams on user-centered design'
    ],
    tags: ['User Research', 'Banking UX', 'Usability Testing', 'Innovation', 'Industry Pioneer'],
    metrics: {
      'Tests': '30+',
      'Year': '2003',
      'First': 'Poland',
      'ROI': '300%'
    },
    color: 'from-green-500 to-green-600',
    featured: true,
    overview: 'In 2003, online banking was new and scary for Polish consumers. Volkswagen Bank needed to launch their digital platform in a market where people didn\'t trust internet transactions. This project pioneered user-centered design in Polish banking.',
    problemStatement: 'Polish consumers had very low trust in online financial transactions. Traditional banking interfaces were complex and intimidating. VW Bank needed to create an online banking experience that would feel safe and intuitive for first-time users.',
    keyFeatures: [
      {
        title: 'Progressive Trust Building',
        description: 'Gradual introduction of features that build user confidence over time',
        impact: 'Increased user adoption by 85%'
      },
      {
        title: 'Plain Language Interface',
        description: 'Replaced banking jargon with clear, everyday language',
        impact: 'Reduced support calls by 60%'
      },
      {
        title: 'Visual Security Indicators',
        description: 'Clear, understandable security feedback throughout the experience',
        impact: 'Improved user trust scores by 120%'
      }
    ],
    results: [
      {
        metric: 'User Adoption',
        before: '12%',
        after: '67%',
        improvement: '458% increase'
      },
      {
        metric: 'Task Completion Rate',
        before: '34%',
        after: '89%',
        improvement: '162% increase'
      },
      {
        metric: 'Support Call Volume',
        before: '2.3K/month',
        after: '0.9K/month',
        improvement: '61% reduction'
      }
    ]
  }
};

export default function Portfolio() {
  const [selectedFilter, setSelectedFilter] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchParams, setSearchParams] = useSearchParams();
  const [showModal, setShowModal] = useState(false);
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);
  
  // Check URL params on mount and changes
  useEffect(() => {
    const caseParam = searchParams.get('case');
    const modalParam = searchParams.get('modal');
    
    console.log('Portfolio Debug:', { caseParam, modalParam, showModal: caseParam && modalParam === 'true' });
    
    if (caseParam && modalParam === 'true') {
      setSelectedCaseId(caseParam);
      setShowModal(true);
    } else {
      setSelectedCaseId(null);
      setShowModal(false);
    }
  }, [searchParams]);

  // ESC key handler for closing modal
  useEffect(() => {
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && showModal) {
        handleCloseModal();
      }
    };

    document.addEventListener('keydown', handleEscKey);
    return () => document.removeEventListener('keydown', handleEscKey);
  }, [showModal]);

  const filters = ['All', 'Financial Services', 'Media & Publishing', 'Streaming & Entertainment', 'Banking', 'Enterprise'];

  const projects: Project[] = [
    {
      id: 'tvp-cms',
      title: 'Digital Publishing Revolution',
      client: 'TVP - Poland\'s National Broadcaster',
      category: 'Media & Publishing',
      year: '2019-2021',
      duration: '24 months',
      teamSize: '12 people',
      description: 'Complete digital transformation of Poland\'s largest broadcaster',
      challenge: 'Unify 500+ journalists across 16 regions with inconsistent workflows',
      solution: 'Enterprise CMS with real-time collaboration and automated publishing',
      impact: '60% faster publishing, unified brand experience, 10M+ monthly users',
      role: [
        'Led 6-month research phase across all regions',
        'Designed workflows for real-time news publishing',
        'Facilitated first-ever national editorial workshop',
        'Implemented WCAG 2.1 accessibility standards',
        'Created design system for 20+ digital properties'
      ],
      tags: ['Enterprise UX', 'CMS Design', 'Accessibility', 'Workflow Design', 'Design Systems'],
      metrics: {
        'Users': '10M+',
        'Regions': '16',
        'Efficiency': '+60%',
        'Properties': '20+'
      },
      color: 'from-red-500 to-red-600',
      featured: true
    },
    {
      id: 'polsat-streaming',
      title: 'Telco to Streaming Platform',
      client: 'Cyfrowy Polsat - Media Transformation',
      category: 'Streaming & Entertainment',
      year: '2015-2018',
      duration: '36 months',
      teamSize: '25 people',
      description: 'Transforming traditional cable TV into Netflix competitor',
      challenge: 'Transform cable TV company into modern streaming platform',
      solution: 'Unified quad-play platform serving TV, Internet, Mobile, and Streaming',
      impact: '40% reduction in support calls, 2M+ active subscribers',
      role: [
        'Multi-year design leadership across all touchpoints',
        'Quad-play service architecture design',
        'Design system for 20+ digital properties',
        'Multi-device experience strategy (TV, mobile, web)',
        'User research and testing programs'
      ],
      tags: ['Design Systems', 'Multi-platform', 'Streaming UX', 'Leadership', 'Service Design'],
      metrics: {
        'Subscribers': '2M+',
        'Properties': '20+',
        'Support Reduction': '40%',
        'Devices': '5+'
      },
      color: 'from-blue-500 to-blue-600',
      featured: true
    },
    {
      id: 'vw-bank',
      title: 'Banking\'s First UX Tests',
      client: 'Volkswagen Bank - Pioneering Usability',
      category: 'Financial Services',
      year: '2003-2005',
      duration: '18 months',
      teamSize: '8 people',
      description: 'Poland\'s first comprehensive usability testing in banking',
      challenge: 'Launch online banking when Poles didn\'t trust internet transactions',
      solution: 'Evidence-based design through extensive user testing and iteration',
      impact: 'Established UX as legitimate practice in Polish banking industry',
      role: [
        'Conducted 30+ moderated usability tests',
        'Convinced skeptical executives with data',
        'Created reusable design patterns',
        'Documented ROI of UX investment',
        'Trained internal teams on user-centered design'
      ],
      tags: ['User Research', 'Banking UX', 'Usability Testing', 'Innovation', 'Industry Pioneer'],
      metrics: {
        'Tests': '30+',
        'Year': '2003',
        'First': 'Poland',
        'ROI': '300%'
      },
      color: 'from-green-500 to-green-600',
      featured: true
    },
    {
      id: 'ing-design-system',
      title: 'Enterprise Design System',
      client: 'ING Bank - Design at Scale',
      category: 'Financial Services',
      year: '2017-2022',
      duration: '60 months',
      teamSize: '25 people',
      description: 'Building and scaling design system across multiple countries',
      challenge: 'Inconsistent experiences across 15+ countries and 100+ applications',
      solution: 'Comprehensive design system with governance and adoption strategy',
      impact: 'Unified experience for 38M customers, 70% faster development',
      role: [
        'Led design system team of 8 designers',
        'Established governance model across countries',
        'Created adoption strategy and metrics',
        'Built design-dev collaboration processes',
        'Scaled team from 5 to 25 designers'
      ],
      tags: ['Design Systems', 'Leadership', 'Governance', 'Scale', 'Banking'],
      metrics: {
        'Countries': '15+',
        'Customers': '38M',
        'Faster Dev': '70%',
        'Team Growth': '5→25'
      },
      color: 'from-orange-500 to-orange-600',
      featured: false
    },
    {
      id: 'sportradar-platform',
      title: 'Sports Data Platform',
      client: 'Sportradar - Real-time Sports',
      category: 'Enterprise',
      year: '2022-2024',
      duration: '24 months',
      teamSize: '20 people',
      description: 'Real-time sports data platform for global audience',
      challenge: 'Complex sports data visualization for multiple user types',
      solution: 'Modular platform with customizable dashboards and real-time updates',
      impact: 'Serving 500+ sports organizations worldwide',
      role: [
        'Leading design team of 20+ designers',
        'Cross-functional collaboration with 100+ developers',
        'Real-time data visualization strategy',
        'Multi-tenant platform architecture',
        'Global design system implementation'
      ],
      tags: ['Real-time Data', 'Visualization', 'Platform Design', 'Leadership', 'Global Scale'],
      metrics: {
        'Organizations': '500+',
        'Countries': '50+',
        'Real-time': '24/7',
        'Team': '20+'
      },
      color: 'from-purple-500 to-purple-600',
      featured: false
    },
    {
      id: 'grey-ux-lab',
      title: 'Poland\'s First UX Lab',
      client: 'Grey/Argonauts - Agency Innovation',
      category: 'Enterprise',
      year: '2003-2006',
      duration: '36 months',
      teamSize: '6 people',
      description: 'Establishing UX practice in traditional advertising agency',
      challenge: 'Introduce user research to clients who never heard of UX',
      solution: 'Built complete UX lab with testing facilities and methodologies',
      impact: 'Pioneered UX in Polish market, influenced entire industry',
      role: [
        'Established first professional UX lab in Poland',
        'Created testing methodologies and processes',
        'Educated clients about value of user research',
        'Built team of UX researchers and designers',
        'Developed business case for UX investment'
      ],
      tags: ['UX Research', 'Lab Setup', 'Industry Pioneer', 'Methodology', 'Education'],
      metrics: {
        'First': 'Poland',
        'Year': '2003',
        'Clients': '50+',
        'Tests': '200+'
      },
      color: 'from-cyan-500 to-cyan-600',
      featured: false
    }
  ];

  const filteredProjects = useMemo(() => {
    return projects.filter(project => {
      const matchesFilter = selectedFilter === 'All' || project.category === selectedFilter;
      const matchesSearch = project.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           project.client.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           project.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
      return matchesFilter && matchesSearch;
    });
  }, [selectedFilter, searchTerm]);

  const featuredProjects = filteredProjects.filter(p => p.featured);
  const otherProjects = filteredProjects.filter(p => !p.featured);

  const handleProjectClick = (projectId: string) => {
    console.log('Project clicked:', projectId);
    setSearchParams({ case: projectId, modal: 'true' });
  };

  const handleCloseModal = () => {
    console.log('Closing modal');
    setSearchParams({});
  };

  const nextCaseStudy = () => {
    if (!selectedCaseId) return;
    const caseIds = Object.keys(caseStudyData);
    const currentIndex = caseIds.indexOf(selectedCaseId);
    const nextIndex = (currentIndex + 1) % caseIds.length;
    setSearchParams({ case: caseIds[nextIndex], modal: 'true' });
  };

  const prevCaseStudy = () => {
    if (!selectedCaseId) return;
    const caseIds = Object.keys(caseStudyData);
    const currentIndex = caseIds.indexOf(selectedCaseId);
    const prevIndex = currentIndex === 0 ? caseIds.length - 1 : currentIndex - 1;
    setSearchParams({ case: caseIds[prevIndex], modal: 'true' });
  };

  const selectedCaseStudy = selectedCaseId ? caseStudyData[selectedCaseId] : null;

  return (
    <div className="min-h-screen bg-black text-white portfolio-page" style={{ cursor: 'auto' }}>
      {/* Header */}
      <header className="sticky top-0 z-40 bg-black/90 backdrop-blur-sm border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link
                to="/"
                className="flex items-center text-gray-400 hover:text-white transition-colors"
              >
                <ArrowLeft className="w-5 h-5 mr-2" />
                Back
              </Link>
              <div className="h-6 w-px bg-gray-700" />
              <h1 className="text-2xl font-bold">Portfolio</h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 bg-gray-900 rounded-full p-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-full transition-colors ${
                    viewMode === 'grid' ? 'bg-blue-500 text-white' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  <Grid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-full transition-colors ${
                    viewMode === 'list' ? 'bg-blue-500 text-white' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Filters & Search */}
      <section className="py-8 px-6 border-b border-gray-800">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search projects, clients, technologies..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-3 bg-gray-900 border border-gray-700 rounded-full text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 w-full lg:w-96"
              />
            </div>

            {/* Filters */}
            <div className="flex items-center space-x-2 overflow-x-auto">
              <Filter className="w-5 h-5 text-gray-400 flex-shrink-0" />
              {filters.map((filter) => (
                <button
                  key={filter}
                  onClick={() => setSelectedFilter(filter)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${
                    selectedFilter === filter
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>
          </div>

          {/* Results Count */}
          <div className="mt-4 text-sm text-gray-400">
            Found {filteredProjects.length} project{filteredProjects.length !== 1 ? 's' : ''}
            {searchTerm && ` for "${searchTerm}"`}
            {selectedFilter !== 'All' && ` in category "${selectedFilter}"`}
          </div>
        </div>
      </section>

      {/* Projects */}
      <main className="py-12 px-6">
        <div className="max-w-7xl mx-auto">
          {/* Featured Projects */}
          {featuredProjects.length > 0 && (
            <section className="mb-16">
              <h2 className="text-3xl font-bold text-white mb-8">Featured Projects</h2>
              <div className={`grid gap-8 ${
                viewMode === 'grid' ? 'md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'
              }`}>
                {featuredProjects.map((project, index) => (
                  <ProjectCard
                    key={project.id}
                    project={project}
                    index={index}
                    viewMode={viewMode}
                    onSelect={handleProjectClick}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Other Projects */}
          {otherProjects.length > 0 && (
            <section>
              <h2 className="text-3xl font-bold text-white mb-8">All Projects</h2>
              <div className={`grid gap-8 ${
                viewMode === 'grid' ? 'md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'
              }`}>
                {otherProjects.map((project, index) => (
                  <ProjectCard
                    key={project.id}
                    project={project}
                    index={index + featuredProjects.length}
                    viewMode={viewMode}
                    onSelect={handleProjectClick}
                  />
                ))}
              </div>
            </section>
          )}

          {/* No Results */}
          {filteredProjects.length === 0 && (
            <div className="text-center py-16">
              <div className="text-gray-400 mb-4">
                <Search className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <h3 className="text-xl font-semibold mb-2">No results found</h3>
                <p>Try changing your search criteria or filters</p>
              </div>
              <button
                onClick={() => {
                  setSearchTerm('');
                  setSelectedFilter('All');
                }}
                className="px-6 py-3 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors"
              >
                Clear filters
              </button>
            </div>
          )}
        </div>
      </main>

      {/* Case Study Modal */}
      <AnimatePresence>
        {showModal && selectedCaseStudy && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 overflow-y-auto"
            onClick={handleCloseModal}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="min-h-screen"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <header className="sticky top-0 z-40 bg-black/90 backdrop-blur-sm border-b border-gray-800">
                <div className="max-w-7xl mx-auto px-6 py-4">
                  <div className="flex items-center justify-between">
                    <button
                      onClick={handleCloseModal}
                      className="flex items-center text-gray-400 hover:text-white transition-colors"
                    >
                      <ArrowLeft className="w-5 h-5 mr-2" />
                      Back to Portfolio
                    </button>
                    
                    <div className="flex items-center space-x-4">
                      <button
                        onClick={prevCaseStudy}
                        className="p-2 text-gray-400 hover:text-white transition-colors"
                        title="Previous Case Study"
                      >
                        <ChevronLeft className="w-5 h-5" />
                      </button>
                      <button
                        onClick={nextCaseStudy}
                        className="p-2 text-gray-400 hover:text-white transition-colors"
                        title="Next Case Study"
                      >
                        <ChevronRight className="w-5 h-5" />
                      </button>
                      <button
                        onClick={handleCloseModal}
                        className="p-2 text-gray-400 hover:text-white transition-colors"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              </header>

              {/* Modal Content */}
              <div className="py-20 px-6">
                <div className="max-w-7xl mx-auto">
                  {/* Hero Section */}
                  <motion.div
                    initial={{ opacity: 0, y: 50 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                    className="text-center mb-16"
                  >
                    <div className="flex items-center justify-center mb-6">
                      <div className={`w-6 h-6 rounded-full bg-gradient-to-r ${selectedCaseStudy.color} mr-4`} />
                      <span className="text-gray-400 uppercase tracking-wide">{selectedCaseStudy.category}</span>
                    </div>
                    
                    <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">
                      {selectedCaseStudy.title}
                    </h1>
                    
                    <p className="text-xl text-gray-300 max-w-3xl mx-auto mb-8">
                      {selectedCaseStudy.description}
                    </p>
                    
                    <div className="flex flex-wrap justify-center gap-6 text-sm text-gray-400">
                      <div className="flex items-center">
                        <Calendar className="w-4 h-4 mr-2" />
                        {selectedCaseStudy.year}
                      </div>
                      <div className="flex items-center">
                        <Users className="w-4 h-4 mr-2" />
                        {selectedCaseStudy.teamSize}
                      </div>
                      <div className="flex items-center">
                        <Target className="w-4 h-4 mr-2" />
                        {selectedCaseStudy.duration}
                      </div>
                    </div>
                  </motion.div>

                  {/* Key Metrics */}
                  <motion.div
                    initial={{ opacity: 0, y: 50 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3, duration: 0.8 }}
                    className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-20"
                  >
                    {Object.entries(selectedCaseStudy.metrics).map(([key, value]) => (
                      <div key={key} className="text-center p-6 bg-gray-900/50 border border-gray-800 rounded-2xl">
                        <div className="text-3xl font-bold text-white mb-2">{value}</div>
                        <div className="text-sm text-gray-400 uppercase tracking-wide">{key}</div>
                      </div>
                    ))}
                  </motion.div>

                  {/* Overview */}
                  <section className="py-16 px-6 bg-gray-900/30 rounded-2xl mb-16">
                    <div className="max-w-4xl mx-auto">
                      <motion.div
                        initial={{ opacity: 0, y: 50 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5, duration: 0.8 }}
                      >
                        <h2 className="text-3xl font-bold text-white mb-8">Overview</h2>
                        <p className="text-lg text-gray-300 leading-relaxed">
                          {selectedCaseStudy.overview}
                        </p>
                      </motion.div>
                    </div>
                  </section>

                  {/* Problem & Solution */}
                  <section className="py-16 mb-16">
                    <div className="grid md:grid-cols-2 gap-12">
                      <motion.div
                        initial={{ opacity: 0, x: -50 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.7, duration: 0.8 }}
                      >
                        <h2 className="text-3xl font-bold text-white mb-6 flex items-center">
                          <Target className="w-8 h-8 mr-3 text-red-400" />
                          The Challenge
                        </h2>
                        <p className="text-lg text-gray-300 mb-6">{selectedCaseStudy.problemStatement}</p>
                        <p className="text-lg text-gray-300">{selectedCaseStudy.challenge}</p>
                      </motion.div>

                      <motion.div
                        initial={{ opacity: 0, x: 50 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.9, duration: 0.8 }}
                      >
                        <h2 className="text-3xl font-bold text-white mb-6 flex items-center">
                          <Lightbulb className="w-8 h-8 mr-3 text-blue-400" />
                          The Solution
                        </h2>
                        <p className="text-lg text-gray-300 mb-6">{selectedCaseStudy.solution}</p>
                        
                        <h3 className="text-xl font-bold text-white mb-4">My Role</h3>
                        <ul className="space-y-3">
                          {selectedCaseStudy.role.map((roleItem: string, index: number) => (
                            <li key={index} className="text-gray-300 flex items-start">
                              <span className="w-2 h-2 bg-blue-400 rounded-full mt-2 mr-3 flex-shrink-0" />
                              {roleItem}
                            </li>
                          ))}
                        </ul>
                      </motion.div>
                    </div>
                  </section>

                  {/* Key Features */}
                  <section className="py-16 mb-16">
                    <motion.div
                      initial={{ opacity: 0, y: 50 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 1.1, duration: 0.8 }}
                    >
                      <h2 className="text-3xl font-bold text-white mb-12 text-center">Key Features</h2>
                      
                      <div className="grid md:grid-cols-3 gap-8">
                        {selectedCaseStudy.keyFeatures.map((feature: any, index: number) => (
                          <div key={index} className="bg-gray-900/50 border border-gray-800 rounded-2xl p-8">
                            <h3 className="text-xl font-bold text-white mb-4">{feature.title}</h3>
                            <p className="text-gray-300 mb-4">{feature.description}</p>
                            <div className="text-blue-400 font-medium">{feature.impact}</div>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  </section>

                  {/* Results */}
                  <section className="py-16 px-6 bg-gray-900/30 rounded-2xl mb-16">
                    <motion.div
                      initial={{ opacity: 0, y: 50 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 1.3, duration: 0.8 }}
                    >
                      <h2 className="text-3xl font-bold text-white mb-12 text-center flex items-center justify-center">
                        <TrendingUp className="w-8 h-8 mr-3 text-green-400" />
                        Results & Impact
                      </h2>
                      
                      <div className="grid md:grid-cols-3 gap-6">
                        {selectedCaseStudy.results.map((result: any, index: number) => (
                          <div key={index} className="bg-gray-900/50 border border-gray-800 rounded-2xl p-6 text-center">
                            <h3 className="text-lg font-bold text-white mb-4">{result.metric}</h3>
                            
                            <div className="space-y-2 mb-4">
                              <div className="text-sm text-gray-400">Before: {result.before}</div>
                              <div className="text-sm text-gray-400">After: {result.after}</div>
                            </div>
                            
                            <div className="text-2xl font-bold text-green-400">{result.improvement}</div>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  </section>

                  {/* Navigation */}
                  <section className="py-16 border-t border-gray-800">
                    <div className="flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0">
                      <button
                        onClick={prevCaseStudy}
                        className="flex items-center px-6 py-3 bg-gray-800 text-white rounded-full hover:bg-gray-700 transition-colors"
                      >
                        <ChevronLeft className="w-5 h-5 mr-2" />
                        Previous Case Study
                      </button>
                      
                      <button
                        onClick={handleCloseModal}
                        className="px-6 py-3 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors"
                      >
                        Back to Portfolio
                      </button>
                      
                      <button
                        onClick={nextCaseStudy}
                        className="flex items-center px-6 py-3 bg-gray-800 text-white rounded-full hover:bg-gray-700 transition-colors"
                      >
                        Next Case Study
                        <ChevronRight className="w-5 h-5 ml-2" />
                      </button>
                    </div>
                  </section>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

interface ProjectCardProps {
  project: Project;
  index: number;
  viewMode: 'grid' | 'list';
  onSelect: (projectId: string) => void;
}

function ProjectCard({ project, index, viewMode, onSelect }: ProjectCardProps) {
  const handleViewDetails = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('View Details clicked for:', project.id);
    onSelect(project.id);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.6 }}
      className={`group cursor-pointer ${
        viewMode === 'list' ? 'flex items-center space-x-6' : ''
      }`}
      onClick={handleViewDetails}
    >
      <div className={`bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-2xl overflow-hidden hover:border-blue-500/30 transition-all duration-300 ${
        viewMode === 'list' ? 'flex-1 flex items-center p-6' : 'p-6'
      }`}>
        {viewMode === 'grid' ? (
          <>
            {/* Grid View */}
            <div className="flex items-center mb-4">
              <div className={`w-4 h-4 rounded-full bg-gradient-to-r ${project.color} mr-3`} />
              <span className="text-sm text-gray-400">{project.category}</span>
              {project.featured && (
                <span className="ml-2 px-2 py-1 bg-blue-500/20 text-blue-300 rounded-full text-xs">
                  Featured
                </span>
              )}
            </div>
            
            <h3 className="text-xl font-bold text-white mb-2">{project.title}</h3>
            <p className="text-gray-400 text-sm mb-4">{project.client}</p>
            <p className="text-gray-300 mb-4 line-clamp-3">{project.description}</p>
            
            <div className="flex items-center justify-between text-sm text-gray-400 mb-4">
              <span>{project.year}</span>
              <span>{project.duration}</span>
            </div>
            
            <div className="flex flex-wrap gap-2 mb-4">
              {project.tags.slice(0, 3).map((tag, tagIndex) => (
                <span
                  key={tagIndex}
                  className="px-2 py-1 bg-blue-500/20 text-blue-300 rounded-full text-xs"
                >
                  {tag}
                </span>
              ))}
            </div>
            
            <div className="flex items-center">
              <button 
                onClick={handleViewDetails}
                className="flex items-center text-blue-400 hover:text-blue-300 transition-colors cursor-pointer"
              >
                <Eye className="w-4 h-4 mr-2" />
                View Details
              </button>
            </div>
          </>
        ) : (
          <>
            {/* List View */}
            <div className="flex-1">
              <div className="flex items-center mb-2">
                <div className={`w-3 h-3 rounded-full bg-gradient-to-r ${project.color} mr-3`} />
                <h3 className="text-xl font-bold text-white">{project.title}</h3>
                {project.featured && (
                  <span className="ml-2 px-2 py-1 bg-blue-500/20 text-blue-300 rounded-full text-xs">
                    Featured
                  </span>
                )}
              </div>
              <p className="text-gray-400 mb-2">{project.client} • {project.category}</p>
              <p className="text-gray-300 mb-3">{project.description}</p>
              <div className="flex flex-wrap gap-2">
                {project.tags.slice(0, 4).map((tag, tagIndex) => (
                  <span
                    key={tagIndex}
                    className="px-2 py-1 bg-blue-500/20 text-blue-300 rounded-full text-xs"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-400 mb-2">{project.year}</div>
              <div className="text-sm text-gray-400 mb-4">{project.duration}</div>
              <button 
                onClick={handleViewDetails}
                className="flex items-center text-blue-400 hover:text-blue-300 transition-colors cursor-pointer"
              >
                <Eye className="w-4 h-4 mr-2" />
                Details
              </button>
            </div>
          </>
        )}
      </div>
    </motion.div>
  );
}