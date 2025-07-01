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
  ChevronRight,
  Github,
  Zap,
  Brain,
  MessageSquare,
  Code,
  Play,
  Star
} from 'lucide-react';

interface ExperimentData {
  id: string;
  name: string;
  description: string;
  status: string;
  tech: string[];
  highlight: string;
  icon: string;
  color: string;
  category: string;
  startDate: string;
  duration: string;
  teamSize: string;
  
  // Extended experiment data
  overview: string;
  motivation: string;
  technicalChallenges: string[];
  keyFeatures: {
    title: string;
    description: string;
    techDetails: string;
  }[];
  architecture: {
    component: string;
    description: string;
    tech: string[];
  }[];
  learnings: string[];
  metrics: {
    metric: string;
    value: string;
    description: string;
  }[];
  futureWork: string[];
  links: {
    live?: string;
    github?: string;
    demo?: string;
    docs?: string;
  };
}

export default function ExperimentDetail() {
  const { experimentId } = useParams<{ experimentId: string }>();
  const navigate = useNavigate();
  const [experiment, setExperiment] = useState<ExperimentData | null>(null);
  
  // Check if we're in modal mode based on URL params
  const urlParams = new URLSearchParams(window.location.search);
  const isModalMode = urlParams.get('modal') === 'true';

  // Mock experiment data - in real app this would come from API/database
  const experiments: Record<string, ExperimentData> = {
    'hireverse-app': {
      id: 'hireverse-app',
      name: 'hireverse.app',
      description: 'AI that interviews recruiters (yes, reversed)',
      status: 'Day 11/30 of public build',
      tech: ['Next.js 15', 'GPT-4', 'TypeScript'],
      highlight: 'Viral on day 8',
      icon: 'MessageSquare',
      color: 'from-green-500 to-green-600',
      category: 'AI Agent',
      startDate: 'December 2024',
      duration: '30 days',
      teamSize: '1 person (solo)',
      
      overview: 'Hireverse.app flips the traditional hiring process on its head. Instead of candidates being interviewed by recruiters, an AI agent interviews recruiters to assess their quality, approach, and whether they\'re worth a candidate\'s time. This experiment explores the power dynamics in hiring and uses AI to level the playing field.',
      
      motivation: 'After 20+ years in the industry, I\'ve seen countless bad recruiters waste candidates\' time with generic outreach, unrealistic expectations, and poor communication. What if we could flip this dynamic? What if recruiters had to prove their worth to candidates first?',
      
      technicalChallenges: [
        'Creating conversational AI that can assess recruiter quality',
        'Building real-time interview flows with dynamic questioning',
        'Implementing scoring algorithms for recruiter evaluation',
        'Handling edge cases in natural language processing',
        'Scaling to handle viral traffic (8x spike on day 8)'
      ],
      
      keyFeatures: [
        {
          title: 'AI Interview Agent',
          description: 'Sophisticated conversational AI that conducts structured interviews with recruiters',
          techDetails: 'Built with GPT-4 API, custom prompt engineering, and conversation state management'
        },
        {
          title: 'Dynamic Scoring System',
          description: 'Real-time evaluation of recruiter responses across multiple dimensions',
          techDetails: 'Algorithm considers communication quality, role understanding, and candidate respect'
        },
        {
          title: 'Public Build Process',
          description: 'Complete transparency with daily updates and live development streaming',
          techDetails: 'Git commits, progress tracking, and community feedback integration'
        }
      ],
      
      architecture: [
        {
          component: 'Frontend',
          description: 'Next.js 15 application with real-time chat interface',
          tech: ['Next.js 15', 'TypeScript', 'Tailwind CSS', 'Framer Motion']
        },
        {
          component: 'AI Engine',
          description: 'GPT-4 powered conversation engine with custom prompts',
          tech: ['OpenAI GPT-4', 'Custom Prompts', 'Context Management']
        },
        {
          component: 'Analytics',
          description: 'Real-time tracking of interviews and scoring metrics',
          tech: ['Vercel Analytics', 'Custom Metrics', 'Performance Monitoring']
        }
      ],
      
      learnings: [
        'Viral growth happens when you solve a real pain point people didn\'t know they had',
        'Building in public creates accountability and community engagement',
        'AI conversation design is as much art as science',
        'Simple concepts executed well beat complex features',
        'The hiring industry is ready for disruption'
      ],
      
      metrics: [
        {
          metric: 'Daily Active Users',
          value: '2,500+',
          description: 'Peak traffic on day 8 after viral spread'
        },
        {
          metric: 'Interviews Conducted',
          value: '850+',
          description: 'Recruiters interviewed by the AI agent'
        },
        {
          metric: 'Average Score',
          value: '6.2/10',
          description: 'Most recruiters need improvement'
        },
        {
          metric: 'Completion Rate',
          value: '78%',
          description: 'Recruiters who finish the full interview'
        }
      ],
      
      futureWork: [
        'Add recruiter certification system',
        'Implement candidate matching based on recruiter scores',
        'Create recruiter improvement recommendations',
        'Build company culture assessment features',
        'Expand to other hiring stakeholders (hiring managers, etc.)'
      ],
      
      links: {
        live: 'https://hireverse.app',
        github: 'https://github.com/eryk/hireverse',
        demo: 'https://hireverse.app/demo'
      }
    },
    
    'personal-rag': {
      id: 'personal-rag',
      name: 'Personal Knowledge RAG',
      description: '10 years of design wisdom, instantly searchable',
      status: 'Production ready',
      tech: ['n8n', 'Pinecone', 'OpenAI'],
      highlight: 'Answers questions about past projects',
      icon: 'Brain',
      color: 'from-blue-500 to-blue-600',
      category: 'Knowledge Management',
      startDate: 'October 2024',
      duration: '6 weeks',
      teamSize: '1 person (solo)',
      
      overview: 'A Retrieval-Augmented Generation (RAG) system that indexes 10+ years of my design work, project documentation, and learnings. It can instantly answer questions about past projects, design decisions, and lessons learned, making my accumulated knowledge searchable and actionable.',
      
      motivation: 'After 20+ years in design, I have thousands of documents, project files, and notes scattered across different systems. When someone asks about a specific project or approach, I often struggle to find the exact details. This RAG system makes my entire knowledge base instantly searchable.',
      
      technicalChallenges: [
        'Processing diverse document types (PDFs, Figma files, notes, emails)',
        'Creating meaningful embeddings for design concepts',
        'Handling context windows for complex project queries',
        'Maintaining data privacy while using cloud services',
        'Building efficient retrieval mechanisms for large datasets'
      ],
      
      keyFeatures: [
        {
          title: 'Multi-format Document Processing',
          description: 'Ingests PDFs, Word docs, Figma files, Notion pages, and more',
          techDetails: 'Custom parsers for each format, OCR for images, API integrations'
        },
        {
          title: 'Semantic Search',
          description: 'Find projects by concept, not just keywords',
          techDetails: 'OpenAI embeddings with Pinecone vector database for similarity search'
        },
        {
          title: 'Contextual Answers',
          description: 'Provides detailed answers with source citations',
          techDetails: 'RAG pipeline with GPT-4 for answer generation and source attribution'
        }
      ],
      
      architecture: [
        {
          component: 'Data Ingestion',
          description: 'n8n workflows for automated document processing',
          tech: ['n8n', 'Custom Parsers', 'OCR APIs', 'File Watchers']
        },
        {
          component: 'Vector Database',
          description: 'Pinecone for storing and searching document embeddings',
          tech: ['Pinecone', 'OpenAI Embeddings', 'Metadata Indexing']
        },
        {
          component: 'Query Interface',
          description: 'Simple chat interface for natural language queries',
          tech: ['Next.js', 'OpenAI GPT-4', 'Streaming Responses']
        }
      ],
      
      learnings: [
        'RAG quality depends heavily on document preprocessing',
        'Metadata is as important as content for retrieval',
        'Chunk size optimization is crucial for context relevance',
        'Human feedback loops improve retrieval accuracy over time',
        'Privacy-first design is essential for personal knowledge systems'
      ],
      
      metrics: [
        {
          metric: 'Documents Indexed',
          value: '2,847',
          description: 'Total documents across 10+ years'
        },
        {
          metric: 'Query Response Time',
          value: '<2s',
          description: 'Average time to generate answers'
        },
        {
          metric: 'Accuracy Rate',
          value: '89%',
          description: 'Relevant answers based on manual evaluation'
        },
        {
          metric: 'Knowledge Coverage',
          value: '10+ years',
          description: 'Spans entire design career'
        }
      ],
      
      futureWork: [
        'Add real-time document sync from active projects',
        'Implement conversation memory for follow-up questions',
        'Create knowledge graph visualization',
        'Add collaborative features for team knowledge sharing',
        'Integrate with design tools for contextual assistance'
      ],
      
      links: {
        github: 'https://github.com/eryk/personal-rag',
        docs: 'https://docs.personal-rag.dev'
      }
    },
    
    'mcp-meeting-intelligence': {
      id: 'mcp-meeting-intelligence',
      name: 'MCP Meeting Intelligence',
      description: 'Never lose meeting context again',
      status: 'Beta testing',
      tech: ['Model Context Protocol', 'Notion', 'Confluence'],
      highlight: 'AI-enhanced notes',
      icon: 'Zap',
      color: 'from-purple-500 to-purple-600',
      category: 'Productivity Tool',
      startDate: 'November 2024',
      duration: '4 weeks',
      teamSize: '1 person (solo)',
      
      overview: 'An AI-powered meeting intelligence system built on the Model Context Protocol (MCP) that automatically captures, processes, and contextualizes meeting content. It integrates with existing tools like Notion and Confluence to create actionable insights and never lose important decisions or context.',
      
      motivation: 'Meetings are where decisions happen, but context often gets lost. Traditional meeting notes are incomplete, action items get forgotten, and important discussions disappear into the void. This system ensures every meeting contributes to organizational knowledge.',
      
      technicalChallenges: [
        'Real-time audio processing and transcription accuracy',
        'Identifying speakers and maintaining conversation context',
        'Integrating with multiple knowledge management systems',
        'Handling sensitive information and privacy concerns',
        'Creating meaningful summaries from unstructured conversations'
      ],
      
      keyFeatures: [
        {
          title: 'Real-time Transcription',
          description: 'Live transcription with speaker identification and context awareness',
          techDetails: 'Whisper API integration with custom speaker diarization'
        },
        {
          title: 'Intelligent Summarization',
          description: 'AI-generated summaries with action items and key decisions',
          techDetails: 'GPT-4 with custom prompts for meeting structure analysis'
        },
        {
          title: 'Knowledge Integration',
          description: 'Automatic sync with Notion, Confluence, and other knowledge bases',
          techDetails: 'MCP protocol for seamless tool integration and context sharing'
        }
      ],
      
      architecture: [
        {
          component: 'Audio Processing',
          description: 'Real-time audio capture and transcription pipeline',
          tech: ['Whisper API', 'Speaker Diarization', 'Audio Streaming']
        },
        {
          component: 'MCP Integration',
          description: 'Model Context Protocol for tool connectivity',
          tech: ['MCP Protocol', 'Tool Adapters', 'Context Management']
        },
        {
          component: 'Knowledge Sync',
          description: 'Automated integration with knowledge management tools',
          tech: ['Notion API', 'Confluence API', 'Custom Webhooks']
        }
      ],
      
      learnings: [
        'MCP protocol enables powerful tool integrations with minimal setup',
        'Meeting context is more valuable than just transcripts',
        'Privacy and security are paramount for meeting intelligence',
        'Integration quality matters more than feature quantity',
        'Real-time processing requires careful performance optimization'
      ],
      
      metrics: [
        {
          metric: 'Meetings Processed',
          value: '127',
          description: 'Total meetings analyzed during beta'
        },
        {
          metric: 'Transcription Accuracy',
          value: '94%',
          description: 'Word-level accuracy in controlled tests'
        },
        {
          metric: 'Action Item Detection',
          value: '87%',
          description: 'Successfully identified actionable items'
        },
        {
          metric: 'User Satisfaction',
          value: '8.3/10',
          description: 'Beta tester feedback score'
        }
      ],
      
      futureWork: [
        'Add video meeting integration (Zoom, Teams, Meet)',
        'Implement sentiment analysis for meeting dynamics',
        'Create meeting effectiveness scoring',
        'Add calendar integration for automatic scheduling',
        'Build team collaboration features'
      ],
      
      links: {
        github: 'https://github.com/eryk/mcp-meeting-intelligence',
        demo: 'https://meeting-intelligence.demo.dev'
      }
    }
  };

  useEffect(() => {
    if (experimentId && experiments[experimentId]) {
      setExperiment(experiments[experimentId]);
    } else {
      // Experiment not found, redirect to main page
      navigate('/');
    }
  }, [experimentId, navigate]);

  const handleClose = () => {
    if (isModalMode) {
      navigate('/#experiments');
    } else {
      navigate(-1);
    }
  };

  const nextExperiment = () => {
    const experimentIds = Object.keys(experiments);
    const currentIndex = experimentIds.indexOf(experimentId!);
    const nextIndex = (currentIndex + 1) % experimentIds.length;
    if (isModalMode) {
      navigate(`/?experiment=${experimentIds[nextIndex]}&modal=true#experiments`);
    } else {
      navigate(`/experiment/${experimentIds[nextIndex]}`);
    }
  };

  const prevExperiment = () => {
    const experimentIds = Object.keys(experiments);
    const currentIndex = experimentIds.indexOf(experimentId!);
    const prevIndex = currentIndex === 0 ? experimentIds.length - 1 : currentIndex - 1;
    if (isModalMode) {
      navigate(`/?experiment=${experimentIds[prevIndex]}&modal=true#experiments`);
    } else {
      navigate(`/experiment/${experimentIds[prevIndex]}`);
    }
  };

  const getIconComponent = (iconName: string) => {
    const icons: Record<string, any> = {
      MessageSquare,
      Brain,
      Zap,
      Code,
      Target,
      Lightbulb
    };
    return icons[iconName] || MessageSquare;
  };

  if (!experiment) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Experiment Not Found</h1>
          <Link to="/#experiments" className="text-blue-400 hover:text-blue-300">
            ← Back to Experiments
          </Link>
        </div>
      </div>
    );
  }

  const IconComponent = getIconComponent(experiment.icon);

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
              {isModalMode ? 'Back to Experiments' : 'Back'}
            </button>
            
            <div className="flex items-center space-x-4">
              <button
                onClick={prevExperiment}
                className="p-2 text-gray-400 hover:text-white transition-colors"
                title="Previous Experiment"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={nextExperiment}
                className="p-2 text-gray-400 hover:text-white transition-colors"
                title="Next Experiment"
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
              <div className={`w-12 h-12 rounded-full bg-gradient-to-r ${experiment.color} flex items-center justify-center mr-4`}>
                <IconComponent className="w-6 h-6 text-white" />
              </div>
              <span className="text-gray-400 uppercase tracking-wide">{experiment.category}</span>
            </div>
            
            <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">
              {experiment.name}
            </h1>
            
            <p className="text-xl text-gray-300 max-w-3xl mx-auto mb-8">
              {experiment.description}
            </p>
            
            <div className="flex flex-wrap justify-center gap-6 text-sm text-gray-400 mb-8">
              <div className="flex items-center">
                <Calendar className="w-4 h-4 mr-2" />
                {experiment.startDate}
              </div>
              <div className="flex items-center">
                <Users className="w-4 h-4 mr-2" />
                {experiment.teamSize}
              </div>
              <div className="flex items-center">
                <Target className="w-4 h-4 mr-2" />
                {experiment.duration}
              </div>
            </div>

            {/* Status & Links */}
            <div className="flex flex-wrap justify-center gap-4">
              <div className="px-4 py-2 bg-blue-500/20 text-blue-300 rounded-full text-sm font-medium">
                {experiment.status}
              </div>
              <div className="px-4 py-2 bg-green-500/20 text-green-300 rounded-full text-sm font-medium">
                {experiment.highlight}
              </div>
            </div>

            {/* Action Links */}
            <div className="flex flex-wrap justify-center gap-4 mt-8">
              {experiment.links.live && (
                <a
                  href={experiment.links.live}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center px-6 py-3 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors"
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Live Demo
                </a>
              )}
              {experiment.links.github && (
                <a
                  href={experiment.links.github}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center px-6 py-3 border border-gray-600 text-white rounded-full hover:border-blue-400 hover:text-blue-400 transition-all"
                >
                  <Github className="w-4 h-4 mr-2" />
                  Source Code
                </a>
              )}
            </div>
          </motion.div>

          {/* Tech Stack */}
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.8 }}
            className="flex flex-wrap justify-center gap-3 mb-20"
          >
            {experiment.tech.map((tech, index) => (
              <span
                key={index}
                className="px-4 py-2 bg-gray-900/50 border border-gray-800 rounded-full text-gray-300 text-sm"
              >
                {tech}
              </span>
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
            <p className="text-lg text-gray-300 leading-relaxed mb-8">
              {experiment.overview}
            </p>
            
            <h3 className="text-xl font-bold text-white mb-4">Motivation</h3>
            <p className="text-lg text-gray-300 leading-relaxed">
              {experiment.motivation}
            </p>
          </motion.div>
        </div>
      </section>

      {/* Technical Challenges */}
      <section className="py-16 px-6">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, duration: 0.8 }}
          >
            <h2 className="text-3xl font-bold text-white mb-8 flex items-center">
              <Target className="w-8 h-8 mr-3 text-red-400" />
              Technical Challenges
            </h2>
            
            <ul className="space-y-4">
              {experiment.technicalChallenges.map((challenge, index) => (
                <li key={index} className="text-gray-300 flex items-start">
                  <span className="w-2 h-2 bg-red-400 rounded-full mt-2 mr-3 flex-shrink-0" />
                  {challenge}
                </li>
              ))}
            </ul>
          </motion.div>
        </div>
      </section>

      {/* Key Features */}
      <section className="py-16 px-6 bg-gray-900/30">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9, duration: 0.8 }}
          >
            <h2 className="text-3xl font-bold text-white mb-12 text-center">Key Features</h2>
            
            <div className="grid md:grid-cols-3 gap-8">
              {experiment.keyFeatures.map((feature, index) => (
                <div key={index} className="bg-gray-900/50 border border-gray-800 rounded-2xl p-8">
                  <h3 className="text-xl font-bold text-white mb-4">{feature.title}</h3>
                  <p className="text-gray-300 mb-4">{feature.description}</p>
                  <div className="text-sm text-blue-400 bg-blue-500/10 rounded-lg p-3">
                    <strong>Tech:</strong> {feature.techDetails}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Architecture */}
      <section className="py-16 px-6">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.1, duration: 0.8 }}
          >
            <h2 className="text-3xl font-bold text-white mb-12 text-center">Architecture</h2>
            
            <div className="grid md:grid-cols-3 gap-8">
              {experiment.architecture.map((component, index) => (
                <div key={index} className="relative">
                  <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-6 h-full">
                    <h3 className="text-xl font-bold text-white mb-4">{component.component}</h3>
                    <p className="text-gray-300 mb-4">{component.description}</p>
                    
                    <div className="space-y-2">
                      {component.tech.map((tech, techIndex) => (
                        <span
                          key={techIndex}
                          className="inline-block px-2 py-1 bg-blue-500/20 text-blue-300 rounded text-xs mr-2 mb-2"
                        >
                          {tech}
                        </span>
                      ))}
                    </div>
                  </div>
                  
                  {index < experiment.architecture.length - 1 && (
                    <div className="hidden md:block absolute top-1/2 -right-4 w-8 h-0.5 bg-blue-500 transform -translate-y-1/2" />
                  )}
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Metrics */}
      <section className="py-16 px-6 bg-gray-900/30">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.3, duration: 0.8 }}
          >
            <h2 className="text-3xl font-bold text-white mb-12 text-center flex items-center justify-center">
              <TrendingUp className="w-8 h-8 mr-3 text-green-400" />
              Current Metrics
            </h2>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {experiment.metrics.map((metric, index) => (
                <div key={index} className="bg-gray-900/50 border border-gray-800 rounded-2xl p-6 text-center">
                  <h3 className="text-lg font-bold text-white mb-2">{metric.metric}</h3>
                  <div className="text-3xl font-bold text-green-400 mb-2">{metric.value}</div>
                  <div className="text-sm text-gray-400">{metric.description}</div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Learnings & Future Work */}
      <section className="py-16 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 1.5, duration: 0.8 }}
            >
              <h2 className="text-3xl font-bold text-white mb-8 flex items-center">
                <Award className="w-8 h-8 mr-3 text-yellow-400" />
                Key Learnings
              </h2>
              
              <ul className="space-y-4">
                {experiment.learnings.map((learning, index) => (
                  <li key={index} className="text-gray-300 flex items-start">
                    <span className="w-2 h-2 bg-yellow-400 rounded-full mt-2 mr-3 flex-shrink-0" />
                    {learning}
                  </li>
                ))}
              </ul>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 1.7, duration: 0.8 }}
            >
              <h2 className="text-3xl font-bold text-white mb-8">Future Work</h2>
              
              <ul className="space-y-4">
                {experiment.futureWork.map((item, index) => (
                  <li key={index} className="text-gray-300 flex items-start">
                    <span className="w-2 h-2 bg-blue-400 rounded-full mt-2 mr-3 flex-shrink-0" />
                    {item}
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
              onClick={prevExperiment}
              className="flex items-center px-6 py-3 bg-gray-800 text-white rounded-full hover:bg-gray-700 transition-colors"
            >
              <ChevronLeft className="w-5 h-5 mr-2" />
              Previous Experiment
            </button>
            
            <Link
              to="/#experiments"
              className="px-6 py-3 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors"
            >
              View All Experiments
            </Link>
            
            <button
              onClick={nextExperiment}
              className="flex items-center px-6 py-3 bg-gray-800 text-white rounded-full hover:bg-gray-700 transition-colors"
            >
              Next Experiment
              <ChevronRight className="w-5 h-5 ml-2" />
            </button>
          </div>
        </div>
      </section>
    </div>
  );

  return content;
}