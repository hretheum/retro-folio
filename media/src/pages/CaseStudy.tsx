import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, 
  ExternalLink, 
  Calendar, 
  Users, 
  Target,
  Lightbulb,
  TrendingUp,
  Award,
  X,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

interface CaseStudyData {
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
  
  // Extended case study data
  overview: string;
  problemStatement: string;
  researchFindings: string[];
  designProcess: {
    phase: string;
    description: string;
    deliverables: string[];
  }[];
  keyFeatures: {
    title: string;
    description: string;
    impact: string;
  }[];
  results: {
    metric: string;
    before: string;
    after: string;
    improvement: string;
  }[];
  lessons: string[];
  nextSteps: string[];
}

export default function CaseStudy() {
  const { caseId } = useParams<{ caseId: string }>();
  const navigate = useNavigate();
  const [caseStudy, setCaseStudy] = useState<CaseStudyData | null>(null);
  
  // Check if we're in modal mode based on URL params
  const urlParams = new URLSearchParams(window.location.search);
  const isModalMode = urlParams.get('modal') === 'true';

  // Mock case study data - in real app this would come from API/database
  const caseStudies: Record<string, CaseStudyData> = {
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
      
      // Extended data
      overview: 'TVP, Poland\'s national broadcaster, faced a critical challenge: 500+ journalists across 16 regional offices were using different systems, creating inconsistent content and inefficient workflows. This project transformed their entire digital publishing infrastructure.',
      
      problemStatement: 'The existing system was a patchwork of legacy tools that prevented real-time collaboration, created content inconsistencies, and made it impossible to maintain brand standards across regions. Journalists were spending more time fighting technology than creating content.',
      
      researchFindings: [
        'Journalists were using 8 different content management systems',
        'Average article publishing time was 45 minutes due to manual processes',
        'Content quality varied significantly between regions',
        'No centralized asset management or brand guidelines',
        'Accessibility compliance was inconsistent across properties'
      ],
      
      designProcess: [
        {
          phase: 'Discovery & Research',
          description: 'Conducted extensive field research across all 16 regional offices',
          deliverables: ['User journey maps', 'Workflow analysis', 'Technical audit', 'Stakeholder interviews']
        },
        {
          phase: 'Strategy & Planning',
          description: 'Developed unified content strategy and technical architecture',
          deliverables: ['Content strategy', 'Information architecture', 'Technical specifications', 'Migration plan']
        },
        {
          phase: 'Design & Prototyping',
          description: 'Created comprehensive design system and interactive prototypes',
          deliverables: ['Design system', 'Interactive prototypes', 'User testing results', 'Accessibility guidelines']
        },
        {
          phase: 'Implementation & Testing',
          description: 'Rolled out system in phases with continuous user feedback',
          deliverables: ['Production system', 'Training materials', 'Performance metrics', 'User adoption reports']
        }
      ],
      
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
        },
        {
          metric: 'Accessibility Compliance',
          before: '30%',
          after: '100%',
          improvement: 'Full WCAG 2.1 AA'
        }
      ],
      
      lessons: [
        'Change management is as important as the technology itself',
        'Regional differences require flexible, not rigid, solutions',
        'Early and continuous user involvement prevents costly redesigns',
        'Accessibility should be built in from day one, not retrofitted'
      ],
      
      nextSteps: [
        'Implement AI-powered content recommendations',
        'Expand system to international TVP offices',
        'Develop mobile-first editorial tools',
        'Integrate with social media publishing platforms'
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
      
      researchFindings: [
        'Customers wanted Netflix-like experience but with local content',
        'Multi-device viewing was becoming the norm',
        'Traditional TV interfaces felt outdated and slow',
        'Customer support was overwhelmed with technical issues',
        'Content discovery was poor across all platforms'
      ],
      
      designProcess: [
        {
          phase: 'Market Research',
          description: 'Analyzed global streaming platforms and local market needs',
          deliverables: ['Competitive analysis', 'Market research', 'User personas', 'Opportunity mapping']
        },
        {
          phase: 'Service Design',
          description: 'Designed end-to-end service experience across all touchpoints',
          deliverables: ['Service blueprints', 'Customer journey maps', 'Touchpoint analysis', 'Experience principles']
        },
        {
          phase: 'Platform Architecture',
          description: 'Created unified design system for all devices and platforms',
          deliverables: ['Design system', 'Component library', 'Platform guidelines', 'Technical specifications']
        },
        {
          phase: 'Implementation & Optimization',
          description: 'Launched platform with continuous optimization based on user data',
          deliverables: ['Production platform', 'Analytics dashboard', 'A/B testing results', 'Performance reports']
        }
      ],
      
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
        },
        {
          metric: 'Content Engagement',
          before: '2.3 hours/day',
          after: '3.8 hours/day',
          improvement: '65% increase'
        }
      ],
      
      lessons: [
        'Legacy infrastructure can be an advantage if leveraged correctly',
        'Local content preferences are crucial for competing with global platforms',
        'Cross-device experience is table stakes, not a differentiator',
        'Customer support integration is critical for service platforms'
      ],
      
      nextSteps: [
        'Expand to international markets',
        'Integrate with smart home devices',
        'Develop original content production tools',
        'Implement advanced personalization features'
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
      
      researchFindings: [
        'Users were afraid of making mistakes that could cost them money',
        'Banking terminology was confusing and intimidating',
        'Security indicators were not understood by average users',
        'Multi-step processes caused high abandonment rates',
        'Error messages were technical and unhelpful'
      ],
      
      designProcess: [
        {
          phase: 'User Research',
          description: 'Conducted extensive research on banking behaviors and fears',
          deliverables: ['User interviews', 'Behavioral analysis', 'Trust factors study', 'Competitive analysis']
        },
        {
          phase: 'Usability Testing',
          description: 'Ran 30+ moderated usability tests with iterative improvements',
          deliverables: ['Test protocols', 'Video recordings', 'Usability reports', 'Improvement recommendations']
        },
        {
          phase: 'Design Iteration',
          description: 'Created multiple design iterations based on user feedback',
          deliverables: ['Wireframes', 'Prototypes', 'Design patterns', 'Style guide']
        },
        {
          phase: 'Implementation & Validation',
          description: 'Launched platform with continuous monitoring and optimization',
          deliverables: ['Production interface', 'Analytics setup', 'Success metrics', 'ROI documentation']
        }
      ],
      
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
        },
        {
          metric: 'User Satisfaction',
          before: '4.1/10',
          after: '8.2/10',
          improvement: '100% increase'
        }
      ],
      
      lessons: [
        'User testing is invaluable for building trust in new technologies',
        'Small usability improvements can have massive business impact',
        'Data-driven design decisions are more convincing than opinions',
        'Industry-first initiatives require extra validation and documentation'
      ],
      
      nextSteps: [
        'Expand testing methodology to other financial products',
        'Create industry standards for banking UX in Poland',
        'Develop mobile banking experience',
        'Share learnings with broader banking community'
      ]
    }
  };

  useEffect(() => {
    if (caseId && caseStudies[caseId]) {
      setCaseStudy(caseStudies[caseId]);
    } else {
      // Case study not found, redirect to portfolio
      navigate('/portfolio');
    }
  }, [caseId, navigate]);

  const handleClose = () => {
    if (isModalMode) {
      navigate('/portfolio');
    } else {
      navigate(-1);
    }
  };

  const nextCaseStudy = () => {
    const caseIds = Object.keys(caseStudies);
    const currentIndex = caseIds.indexOf(caseId!);
    const nextIndex = (currentIndex + 1) % caseIds.length;
    if (isModalMode) {
      navigate(`/portfolio?case=${caseIds[nextIndex]}&modal=true`);
    } else {
      navigate(`/case/${caseIds[nextIndex]}`);
    }
  };

  const prevCaseStudy = () => {
    const caseIds = Object.keys(caseStudies);
    const currentIndex = caseIds.indexOf(caseId!);
    const prevIndex = currentIndex === 0 ? caseIds.length - 1 : currentIndex - 1;
    if (isModalMode) {
      navigate(`/portfolio?case=${caseIds[prevIndex]}&modal=true`);
    } else {
      navigate(`/case/${caseIds[prevIndex]}`);
    }
  };

  if (!caseStudy) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Case Study Not Found</h1>
          <Link to="/portfolio" className="text-blue-400 hover:text-blue-300">
            ← Back to Portfolio
          </Link>
        </div>
      </div>
    );
  }

  const content = (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-black/90 backdrop-blur-sm border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={handleClose}
              className="flex items-center text-gray-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              {isModalMode ? 'Back to Portfolio' : 'Back'}
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
              {isModalMode && (
                <button
                  onClick={handleClose}
                  className="p-2 text-gray-400 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <div className="flex items-center justify-center mb-6">
              <div className={`w-6 h-6 rounded-full bg-gradient-to-r ${caseStudy.color} mr-4`} />
              <span className="text-gray-400 uppercase tracking-wide">{caseStudy.category}</span>
            </div>
            
            <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">
              {caseStudy.title}
            </h1>
            
            <p className="text-xl text-gray-300 max-w-3xl mx-auto mb-8">
              {caseStudy.description}
            </p>
            
            <div className="flex flex-wrap justify-center gap-6 text-sm text-gray-400">
              <div className="flex items-center">
                <Calendar className="w-4 h-4 mr-2" />
                {caseStudy.year}
              </div>
              <div className="flex items-center">
                <Users className="w-4 h-4 mr-2" />
                {caseStudy.teamSize}
              </div>
              <div className="flex items-center">
                <Target className="w-4 h-4 mr-2" />
                {caseStudy.duration}
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
            {Object.entries(caseStudy.metrics).map(([key, value]) => (
              <div key={key} className="text-center p-6 bg-gray-900/50 border border-gray-800 rounded-2xl">
                <div className="text-3xl font-bold text-white mb-2">{value}</div>
                <div className="text-sm text-gray-400 uppercase tracking-wide">{key}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Overview */}
      <section className="py-16 px-6 bg-gray-900/30">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.8 }}
          >
            <h2 className="text-3xl font-bold text-white mb-8">Overview</h2>
            <p className="text-lg text-gray-300 leading-relaxed">
              {caseStudy.overview}
            </p>
          </motion.div>
        </div>
      </section>

      {/* Problem & Solution */}
      <section className="py-16 px-6">
        <div className="max-w-7xl mx-auto">
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
              <p className="text-lg text-gray-300 mb-6">{caseStudy.problemStatement}</p>
              
              <h3 className="text-xl font-bold text-white mb-4">Key Findings</h3>
              <ul className="space-y-3">
                {caseStudy.researchFindings.map((finding, index) => (
                  <li key={index} className="text-gray-300 flex items-start">
                    <span className="w-2 h-2 bg-red-400 rounded-full mt-2 mr-3 flex-shrink-0" />
                    {finding}
                  </li>
                ))}
              </ul>
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
              <p className="text-lg text-gray-300 mb-6">{caseStudy.solution}</p>
              
              <h3 className="text-xl font-bold text-white mb-4">My Role</h3>
              <ul className="space-y-3">
                {caseStudy.role.map((roleItem, index) => (
                  <li key={index} className="text-gray-300 flex items-start">
                    <span className="w-2 h-2 bg-blue-400 rounded-full mt-2 mr-3 flex-shrink-0" />
                    {roleItem}
                  </li>
                ))}
              </ul>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Design Process */}
      <section className="py-16 px-6 bg-gray-900/30">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.1, duration: 0.8 }}
          >
            <h2 className="text-3xl font-bold text-white mb-12 text-center">Design Process</h2>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              {caseStudy.designProcess.map((phase, index) => (
                <div key={index} className="relative">
                  <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-6 h-full">
                    <div className="text-center mb-4">
                      <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-lg mx-auto mb-3">
                        {index + 1}
                      </div>
                      <h3 className="text-xl font-bold text-white">{phase.phase}</h3>
                    </div>
                    
                    <p className="text-gray-300 mb-4">{phase.description}</p>
                    
                    <div>
                      <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wide mb-2">
                        Deliverables
                      </h4>
                      <ul className="space-y-1">
                        {phase.deliverables.map((deliverable, deliverableIndex) => (
                          <li key={deliverableIndex} className="text-sm text-gray-400">
                            • {deliverable}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                  
                  {index < caseStudy.designProcess.length - 1 && (
                    <div className="hidden lg:block absolute top-1/2 -right-4 w-8 h-0.5 bg-blue-500 transform -translate-y-1/2" />
                  )}
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Key Features */}
      <section className="py-16 px-6">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.3, duration: 0.8 }}
          >
            <h2 className="text-3xl font-bold text-white mb-12 text-center">Key Features</h2>
            
            <div className="grid md:grid-cols-3 gap-8">
              {caseStudy.keyFeatures.map((feature, index) => (
                <div key={index} className="bg-gray-900/50 border border-gray-800 rounded-2xl p-8">
                  <h3 className="text-xl font-bold text-white mb-4">{feature.title}</h3>
                  <p className="text-gray-300 mb-4">{feature.description}</p>
                  <div className="text-blue-400 font-medium">{feature.impact}</div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Results */}
      <section className="py-16 px-6 bg-gray-900/30">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.5, duration: 0.8 }}
          >
            <h2 className="text-3xl font-bold text-white mb-12 text-center flex items-center justify-center">
              <TrendingUp className="w-8 h-8 mr-3 text-green-400" />
              Results & Impact
            </h2>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {caseStudy.results.map((result, index) => (
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
        </div>
      </section>

      {/* Lessons & Next Steps */}
      <section className="py-16 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 1.7, duration: 0.8 }}
            >
              <h2 className="text-3xl font-bold text-white mb-8 flex items-center">
                <Award className="w-8 h-8 mr-3 text-yellow-400" />
                Lessons Learned
              </h2>
              
              <ul className="space-y-4">
                {caseStudy.lessons.map((lesson, index) => (
                  <li key={index} className="text-gray-300 flex items-start">
                    <span className="w-2 h-2 bg-yellow-400 rounded-full mt-2 mr-3 flex-shrink-0" />
                    {lesson}
                  </li>
                ))}
              </ul>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 1.9, duration: 0.8 }}
            >
              <h2 className="text-3xl font-bold text-white mb-8">Next Steps</h2>
              
              <ul className="space-y-4">
                {caseStudy.nextSteps.map((step, index) => (
                  <li key={index} className="text-gray-300 flex items-start">
                    <span className="w-2 h-2 bg-blue-400 rounded-full mt-2 mr-3 flex-shrink-0" />
                    {step}
                  </li>
                ))}
              </ul>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Navigation */}
      <section className="py-16 px-6 border-t border-gray-800">
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0">
            <button
              onClick={prevCaseStudy}
              className="flex items-center px-6 py-3 bg-gray-800 text-white rounded-full hover:bg-gray-700 transition-colors"
            >
              <ChevronLeft className="w-5 h-5 mr-2" />
              Previous Case Study
            </button>
            
            <Link
              to="/portfolio"
              className="px-6 py-3 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors"
            >
              View All Projects
            </Link>
            
            <button
              onClick={nextCaseStudy}
              className="flex items-center px-6 py-3 bg-gray-800 text-white rounded-full hover:bg-gray-700 transition-colors"
            >
              Next Case Study
              <ChevronRight className="w-5 h-5 ml-2" />
            </button>
          </div>
        </div>
      </section>
    </div>
  );

  return content;
}