import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  Plus, 
  Edit, 
  Trash2, 
  Save, 
  X, 
  Settings,
  Briefcase,
  Clock,
  Lightbulb,
  Search,
  Filter,
  Eye,
  Copy,
  Download,
  Upload,
  RefreshCw,
  Star
} from 'lucide-react';
import { sanitizeInput } from '../utils/validation';

interface ContentItem {
  id: string;
  type: 'work' | 'timeline' | 'experiment';
  title: string;
  createdAt: Date;
  updatedAt: Date;
  status: 'draft' | 'published';
  featured?: boolean;
  data: any; // Specific data structure for each type
}

export default function Admin() {
  const [activeTab, setActiveTab] = useState<'work' | 'timeline' | 'experiment'>('work');
  const [items, setItems] = useState<ContentItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<ContentItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'draft' | 'published'>('all');
  const [isEditing, setIsEditing] = useState(false);
  const [editingItem, setEditingItem] = useState<ContentItem | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

  // Add admin-page class to body on mount
  useEffect(() => {
    document.body.classList.add('admin-page');
    return () => {
      document.body.classList.remove('admin-page');
    };
  }, []);

  // Load data on mount and tab change
  useEffect(() => {
    loadItems();
  }, [activeTab]);

  // Filter items based on search and status
  useEffect(() => {
    let filtered = items.filter(item => item.type === activeTab);
    
    if (searchTerm) {
      filtered = filtered.filter(item => 
        item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        JSON.stringify(item.data).toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (statusFilter !== 'all') {
      filtered = filtered.filter(item => item.status === statusFilter);
    }
    
    setFilteredItems(filtered);
  }, [items, activeTab, searchTerm, statusFilter]);

  const loadItems = () => {
    // Load existing data and migrate to admin format
    const allItems: ContentItem[] = [];
    
    // Load Work items (from existing hardcoded data in Work.tsx)
    const existingWorkProjects = [
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
      }
    ];

    // Load Timeline items (from existing data in Timeline.tsx)
    const existingTimelineEvents = [
      {
        id: '1',
        year: '2001-2003',
        title: 'Tech Journalist',
        description: 'First to write about usability in Polish media',
        detail: 'Published groundbreaking articles in Wprost magazine introducing NetPR and web usability concepts to Polish market',
        icon: 'lightbulb',
        color: 'from-purple-500 to-purple-600',
        position: 'left'
      },
      {
        id: '2',
        year: '2003-2006',
        title: 'Usability Pioneer',
        description: 'Established Poland\'s first professional UX lab',
        detail: 'At Grey/Argonauts, created testing methodologies and convinced skeptical clients about the value of user research',
        icon: 'users',
        color: 'from-blue-500 to-blue-600',
        position: 'right'
      },
      {
        id: '3',
        year: '2007-2009',
        title: 'Agency Founder',
        description: 'Launched komitywa.com (market wasn\'t ready)',
        detail: 'Too early to market with UX-focused agency. Valuable lessons in timing and market education',
        icon: 'sparkles',
        color: 'from-red-500 to-red-600',
        position: 'left'
      },
      {
        id: '4',
        year: '2017-2022',
        title: 'Design Systems at Scale',
        description: 'Built enterprise design system at ING',
        detail: 'Led chapter of 25+ designers, implemented design systems serving thousands of developers across multiple countries',
        icon: 'code',
        color: 'from-green-500 to-green-600',
        position: 'right'
      },
      {
        id: '5',
        year: '2023-2024',
        title: 'AI Builder Phase',
        description: 'Creating RAG systems and AI agents',
        detail: 'Building personal knowledge RAG, MCP servers, and hireverse.app - demonstrating the future of AI-assisted work',
        icon: 'sparkles',
        color: 'from-cyan-500 to-cyan-600',
        position: 'left'
      },
      {
        id: '6',
        year: '2025',
        title: 'What\'s Next?',
        description: 'Currently building: hireverse.app',
        detail: 'Day-by-day public build of AI agent that interviews recruiters. The future of hiring is being written now.',
        icon: 'calendar',
        color: 'from-yellow-500 to-yellow-600',
        position: 'right'
      }
    ];

    // Load Experiment items (from existing data in Experiments.tsx)
    const existingExperiments = [
      {
        id: 'hireverse-app',
        name: 'hireverse.app',
        description: 'AI that interviews recruiters (yes, reversed)',
        status: 'Day 11/30 of public build',
        tech: ['Next.js 15', 'GPT-4', 'TypeScript'],
        highlight: 'Viral on day 8',
        icon: 'MessageSquare',
        color: 'from-green-500 to-green-600',
        links: {
          live: 'https://hireverse.app',
          github: '#'
        }
      },
      {
        id: 'personal-rag',
        name: 'Personal Knowledge RAG',
        description: '10 years of design wisdom, instantly searchable',
        status: 'Production ready',
        tech: ['n8n', 'Pinecone', 'OpenAI'],
        highlight: 'Answers questions about past projects',
        icon: 'Brain',
        color: 'from-blue-500 to-blue-600',
        links: {
          github: '#',
          demo: '#'
        }
      },
      {
        id: 'mcp-meeting-intelligence',
        name: 'MCP Meeting Intelligence',
        description: 'Never lose meeting context again',
        status: 'Beta testing',
        tech: ['Model Context Protocol', 'Notion', 'Confluence'],
        highlight: 'AI-enhanced notes',
        icon: 'Zap',
        color: 'from-purple-500 to-purple-600',
        links: {
          github: '#'
        }
      }
    ];

    // Check if we have admin data, if not migrate from existing data
    const adminWorkItems = JSON.parse(localStorage.getItem('admin-work-items') || '[]');
    const adminTimelineItems = JSON.parse(localStorage.getItem('admin-timeline-items') || '[]');
    const adminExperimentItems = JSON.parse(localStorage.getItem('admin-experiment-items') || '[]');

    // If no admin data exists, migrate from existing hardcoded data
    if (adminWorkItems.length === 0) {
      const migratedWorkItems = existingWorkProjects.map(project => ({
        id: project.id,
        type: 'work',
        title: project.title,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date(),
        status: 'published',
        featured: project.featured,
        data: project
      }));
      localStorage.setItem('admin-work-items', JSON.stringify(migratedWorkItems));
      allItems.push(...migratedWorkItems);
    } else {
      allItems.push(...adminWorkItems.map((item: any) => ({ 
        ...item, 
        type: 'work', 
        createdAt: new Date(item.createdAt), 
        updatedAt: new Date(item.updatedAt) 
      })));
    }

    if (adminTimelineItems.length === 0) {
      const migratedTimelineItems = existingTimelineEvents.map(event => ({
        id: event.id,
        type: 'timeline',
        title: event.title,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date(),
        status: 'published',
        data: event
      }));
      localStorage.setItem('admin-timeline-items', JSON.stringify(migratedTimelineItems));
      allItems.push(...migratedTimelineItems);
    } else {
      allItems.push(...adminTimelineItems.map((item: any) => ({ 
        ...item, 
        type: 'timeline', 
        createdAt: new Date(item.createdAt), 
        updatedAt: new Date(item.updatedAt) 
      })));
    }

    if (adminExperimentItems.length === 0) {
      const migratedExperimentItems = existingExperiments.map(experiment => ({
        id: experiment.id,
        type: 'experiment',
        title: experiment.name,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date(),
        status: 'published',
        data: experiment
      }));
      localStorage.setItem('admin-experiment-items', JSON.stringify(migratedExperimentItems));
      allItems.push(...migratedExperimentItems);
    } else {
      allItems.push(...adminExperimentItems.map((item: any) => ({ 
        ...item, 
        type: 'experiment', 
        createdAt: new Date(item.createdAt), 
        updatedAt: new Date(item.updatedAt) 
      })));
    }
    
    setItems(allItems);
  };

  const saveItems = (updatedItems: ContentItem[]) => {
    const workItems = updatedItems.filter(item => item.type === 'work');
    const timelineItems = updatedItems.filter(item => item.type === 'timeline');
    const experimentItems = updatedItems.filter(item => item.type === 'experiment');
    
    localStorage.setItem('admin-work-items', JSON.stringify(workItems));
    localStorage.setItem('admin-timeline-items', JSON.stringify(timelineItems));
    localStorage.setItem('admin-experiment-items', JSON.stringify(experimentItems));
    
    setItems(updatedItems);
  };

  const handleCreate = () => {
    const newItem: ContentItem = {
      id: Date.now().toString(),
      type: activeTab,
      title: 'New Item',
      createdAt: new Date(),
      updatedAt: new Date(),
      status: 'draft',
      data: getDefaultData(activeTab)
    };
    
    setEditingItem(newItem);
    setIsEditing(true);
  };

  const handleEdit = (item: ContentItem) => {
    setEditingItem({ ...item });
    setIsEditing(true);
  };

  const handleSave = (updatedItem: ContentItem) => {
    updatedItem.updatedAt = new Date();
    
    const updatedItems = editingItem?.id && items.find(item => item.id === editingItem.id)
      ? items.map(item => item.id === updatedItem.id ? updatedItem : item)
      : [...items, updatedItem];
    
    saveItems(updatedItems);
    setIsEditing(false);
    setEditingItem(null);
  };

  const handleDelete = (id: string) => {
    const updatedItems = items.filter(item => item.id !== id);
    saveItems(updatedItems);
    setShowDeleteConfirm(null);
  };

  const handleDuplicate = (item: ContentItem) => {
    const duplicatedItem: ContentItem = {
      ...item,
      id: Date.now().toString(),
      title: `${item.title} (Copy)`,
      createdAt: new Date(),
      updatedAt: new Date(),
      status: 'draft'
    };
    
    const updatedItems = [...items, duplicatedItem];
    saveItems(updatedItems);
  };

  const handleToggleStatus = (item: ContentItem) => {
    const updatedItem = {
      ...item,
      status: item.status === 'published' ? 'draft' : 'published',
      updatedAt: new Date()
    } as ContentItem;
    
    const updatedItems = items.map(i => i.id === item.id ? updatedItem : i);
    saveItems(updatedItems);
  };

  const handleToggleFeatured = (item: ContentItem) => {
    const updatedItem = {
      ...item,
      featured: !item.featured,
      updatedAt: new Date()
    };
    
    const updatedItems = items.map(i => i.id === item.id ? updatedItem : i);
    saveItems(updatedItems);
  };

  const exportData = () => {
    const data = {
      work: items.filter(item => item.type === 'work'),
      timeline: items.filter(item => item.type === 'timeline'),
      experiments: items.filter(item => item.type === 'experiment'),
      exportDate: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `portfolio-content-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        const importedItems = [
          ...data.work.map((item: any) => ({ ...item, type: 'work', createdAt: new Date(item.createdAt), updatedAt: new Date(item.updatedAt) })),
          ...data.timeline.map((item: any) => ({ ...item, type: 'timeline', createdAt: new Date(item.createdAt), updatedAt: new Date(item.updatedAt) })),
          ...data.experiments.map((item: any) => ({ ...item, type: 'experiment', createdAt: new Date(item.createdAt), updatedAt: new Date(item.updatedAt) }))
        ];
        
        saveItems(importedItems);
        alert('Data imported successfully!');
      } catch (error) {
        alert('Error importing data. Please check the file format.');
      }
    };
    reader.readAsText(file);
  };

  const getDefaultData = (type: string) => {
    switch (type) {
      case 'work':
        return {
          client: '',
          category: '',
          year: new Date().getFullYear().toString(),
          duration: '',
          teamSize: '',
          description: '',
          challenge: '',
          solution: '',
          impact: '',
          role: [],
          tags: [],
          metrics: {},
          color: 'from-blue-500 to-blue-600'
        };
      case 'timeline':
        return {
          year: new Date().getFullYear().toString(),
          description: '',
          detail: '',
          icon: 'calendar',
          color: 'from-blue-500 to-blue-600',
          position: 'left'
        };
      case 'experiment':
        return {
          name: '',
          description: '',
          status: '',
          tech: [],
          highlight: '',
          icon: 'lightbulb',
          color: 'from-blue-500 to-blue-600',
          links: {}
        };
      default:
        return {};
    }
  };

  const tabs = [
    { id: 'work', label: 'My Work', icon: Briefcase, count: items.filter(i => i.type === 'work').length },
    { id: 'timeline', label: 'Timeline', icon: Clock, count: items.filter(i => i.type === 'timeline').length },
    { id: 'experiment', label: 'Experiments', icon: Lightbulb, count: items.filter(i => i.type === 'experiment').length }
  ];

  return (
    <div className="min-h-screen bg-black text-white admin-page">
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
                Back to Site
              </Link>
              <div className="h-6 w-px bg-gray-700" />
              <h1 className="text-2xl font-bold flex items-center">
                <Settings className="w-6 h-6 mr-2" />
                Content Management
              </h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <button
                onClick={exportData}
                className="flex items-center px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                <Download className="w-4 h-4 mr-2" />
                Export
              </button>
              
              <label className="flex items-center px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors cursor-pointer">
                <Upload className="w-4 h-4 mr-2" />
                Import
                <input
                  type="file"
                  accept=".json"
                  onChange={importData}
                  className="hidden"
                />
              </label>
              
              <button
                onClick={loadItems}
                className="flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <section className="py-6 px-6 border-b border-gray-800">
        <div className="max-w-7xl mx-auto">
          <div className="flex space-x-1 bg-gray-900 rounded-lg p-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center px-6 py-3 rounded-lg font-medium transition-all ${
                  activeTab === tab.id
                    ? 'bg-blue-500 text-white'
                    : 'text-gray-400 hover:text-white hover:bg-gray-800'
                }`}
              >
                <tab.icon className="w-5 h-5 mr-2" />
                {tab.label}
                <span className="ml-2 px-2 py-1 bg-gray-700 text-xs rounded-full">
                  {tab.count}
                </span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Filters & Actions */}
      <section className="py-6 px-6 border-b border-gray-800">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
            {/* Search & Filters */}
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search content..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 w-64"
                />
              </div>
              
              <div className="flex items-center space-x-2">
                <Filter className="w-5 h-5 text-gray-400" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                  className="px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="all">All Status</option>
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                </select>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-400">
                {filteredItems.length} of {items.filter(i => i.type === activeTab).length} items
              </div>
              
              <button
                onClick={handleCreate}
                className="flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add New
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Content List */}
      <main className="py-8 px-6">
        <div className="max-w-7xl mx-auto">
          {filteredItems.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-gray-400 mb-4">
                <Briefcase className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <h3 className="text-xl font-semibold mb-2">No content found</h3>
                <p>Create your first {activeTab} item to get started</p>
              </div>
              <button
                onClick={handleCreate}
                className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                <Plus className="w-4 h-4 mr-2 inline" />
                Add New {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
              </button>
            </div>
          ) : (
            <div className="grid gap-6">
              {filteredItems.map((item, index) => (
                <ContentItemCard
                  key={item.id}
                  item={item}
                  index={index}
                  onEdit={handleEdit}
                  onDelete={() => setShowDeleteConfirm(item.id)}
                  onDuplicate={handleDuplicate}
                  onToggleStatus={handleToggleStatus}
                  onToggleFeatured={handleToggleFeatured}
                />
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Edit Modal */}
      <AnimatePresence>
        {isEditing && editingItem && (
          <ContentEditModal
            item={editingItem}
            onSave={handleSave}
            onCancel={() => {
              setIsEditing(false);
              setEditingItem(null);
            }}
          />
        )}
      </AnimatePresence>

      {/* Delete Confirmation */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-6"
            onClick={() => setShowDeleteConfirm(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-gray-900 border border-gray-700 rounded-2xl p-8 max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-2xl font-bold text-white mb-4">Confirm Delete</h3>
              <p className="text-gray-300 mb-6">
                Are you sure you want to delete this item? This action cannot be undone.
              </p>
              <div className="flex items-center justify-end space-x-4">
                <button
                  onClick={() => setShowDeleteConfirm(null)}
                  className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDelete(showDeleteConfirm)}
                  className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

interface ContentItemCardProps {
  item: ContentItem;
  index: number;
  onEdit: (item: ContentItem) => void;
  onDelete: () => void;
  onDuplicate: (item: ContentItem) => void;
  onToggleStatus: (item: ContentItem) => void;
  onToggleFeatured: (item: ContentItem) => void;
}

function ContentItemCard({ 
  item, 
  index, 
  onEdit, 
  onDelete, 
  onDuplicate, 
  onToggleStatus, 
  onToggleFeatured 
}: ContentItemCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.6 }}
      className="bg-gray-900/50 border border-gray-800 rounded-2xl p-6 hover:border-blue-500/30 transition-all duration-300"
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center mb-3">
            <h3 className="text-xl font-bold text-white mr-3">{item.title}</h3>
            
            <div className="flex items-center space-x-2">
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                item.status === 'published' 
                  ? 'bg-green-500/20 text-green-300' 
                  : 'bg-yellow-500/20 text-yellow-300'
              }`}>
                {item.status}
              </span>
              
              {item.featured && (
                <span className="px-2 py-1 bg-blue-500/20 text-blue-300 rounded-full text-xs font-medium">
                  Featured
                </span>
              )}
            </div>
          </div>
          
          <div className="text-sm text-gray-400 mb-4">
            <div>Created: {item.createdAt.toLocaleDateString()}</div>
            <div>Updated: {item.updatedAt.toLocaleDateString()}</div>
          </div>
          
          {/* Type-specific preview */}
          <div className="text-gray-300 text-sm">
            {item.type === 'work' && (
              <div>
                <div><strong>Client:</strong> {item.data.client || 'Not set'}</div>
                <div><strong>Category:</strong> {item.data.category || 'Not set'}</div>
                <div><strong>Year:</strong> {item.data.year || 'Not set'}</div>
              </div>
            )}
            
            {item.type === 'timeline' && (
              <div>
                <div><strong>Title:</strong> {item.data.title || 'Not set'}</div>
                <div><strong>Year:</strong> {item.data.year || 'Not set'}</div>
                <div><strong>Description:</strong> {item.data.description || 'Not set'}</div>
              </div>
            )}
            
            {item.type === 'experiment' && (
              <div>
                <div><strong>Name:</strong> {item.data.name || 'Not set'}</div>
                <div><strong>Status:</strong> {item.data.status || 'Not set'}</div>
                <div><strong>Tech:</strong> {item.data.tech?.join(', ') || 'Not set'}</div>
              </div>
            )}
          </div>
        </div>
        
        {/* Actions */}
        <div className="flex items-center space-x-2 ml-4">
          <button
            onClick={() => onToggleStatus(item)}
            className={`p-2 rounded-lg transition-colors ${
              item.status === 'published'
                ? 'bg-green-500/20 text-green-300 hover:bg-green-500/30'
                : 'bg-yellow-500/20 text-yellow-300 hover:bg-yellow-500/30'
            }`}
            title={item.status === 'published' ? 'Unpublish' : 'Publish'}
          >
            <Eye className="w-4 h-4" />
          </button>
          
          {item.type === 'work' && (
            <button
              onClick={() => onToggleFeatured(item)}
              className={`p-2 rounded-lg transition-colors ${
                item.featured
                  ? 'bg-blue-500/20 text-blue-300 hover:bg-blue-500/30'
                  : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
              }`}
              title={item.featured ? 'Remove from featured' : 'Add to featured'}
            >
              <Star className="w-4 h-4" />
            </button>
          )}
          
          <button
            onClick={() => onEdit(item)}
            className="p-2 bg-blue-500/20 text-blue-300 rounded-lg hover:bg-blue-500/30 transition-colors"
            title="Edit"
          >
            <Edit className="w-4 h-4" />
          </button>
          
          <button
            onClick={() => onDuplicate(item)}
            className="p-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition-colors"
            title="Duplicate"
          >
            <Copy className="w-4 h-4" />
          </button>
          
          <button
            onClick={onDelete}
            className="p-2 bg-red-500/20 text-red-300 rounded-lg hover:bg-red-500/30 transition-colors"
            title="Delete"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}

interface ContentEditModalProps {
  item: ContentItem;
  onSave: (item: ContentItem) => void;
  onCancel: () => void;
}

function ContentEditModal({ item, onSave, onCancel }: ContentEditModalProps) {
  const [formData, setFormData] = useState(item);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate title
    if (!formData.title.trim() || formData.title.trim().length < 2) {
      alert('Title must be at least 2 characters long');
      return;
    }
    
    // Sanitize title
    const sanitizedData = {
      ...formData,
      title: sanitizeInput(formData.title.trim())
    };
    
    onSave(sanitizedData);
  };

  const updateField = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const updateDataField = (field: string, value: any) => {
    // Sanitize string values
    const sanitizedValue = typeof value === 'string' ? sanitizeInput(value) : value;
    
    setFormData(prev => ({
      ...prev,
      data: {
        ...prev.data,
        [field]: sanitizedValue
      }
    }));
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 overflow-y-auto"
      onClick={onCancel}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="min-h-screen flex items-center justify-center p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-gray-900 border border-gray-700 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="sticky top-0 bg-gray-900 border-b border-gray-700 p-6 flex items-center justify-between">
            <h2 className="text-2xl font-bold text-white">
              {item.id && item.id !== Date.now().toString() ? 'Edit' : 'Create'} {item.type.charAt(0).toUpperCase() + item.type.slice(1)}
            </h2>
            <button
              onClick={onCancel}
              className="p-2 text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Basic Fields */}
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Title *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => updateField('title', e.target.value)}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => updateField('status', e.target.value)}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                </select>
              </div>
            </div>

            {/* Type-specific fields */}
            {formData.type === 'work' && (
              <WorkFields data={formData.data} onChange={updateDataField} />
            )}
            
            {formData.type === 'timeline' && (
              <TimelineFields data={formData.data} onChange={updateDataField} />
            )}
            
            {formData.type === 'experiment' && (
              <ExperimentFields data={formData.data} onChange={updateDataField} />
            )}

            {/* Actions */}
            <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-700">
              <button
                type="button"
                onClick={onCancel}
                className="px-6 py-3 text-gray-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex items-center px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                <Save className="w-4 h-4 mr-2" />
                Save
              </button>
            </div>
          </form>
        </div>
      </motion.div>
    </motion.div>
  );
}

// Type-specific form components
function WorkFields({ data, onChange }: { data: any; onChange: (field: string, value: any) => void }) {
  return (
    <>
      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Client</label>
          <input
            type="text"
            value={data.client || ''}
            onChange={(e) => onChange('client', e.target.value)}
            className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Category</label>
          <input
            type="text"
            value={data.category || ''}
            onChange={(e) => onChange('category', e.target.value)}
            className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
          />
        </div>
      </div>
      
      <div className="grid md:grid-cols-3 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Year</label>
          <input
            type="text"
            value={data.year || ''}
            onChange={(e) => onChange('year', e.target.value)}
            className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Duration</label>
          <input
            type="text"
            value={data.duration || ''}
            onChange={(e) => onChange('duration', e.target.value)}
            className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Team Size</label>
          <input
            type="text"
            value={data.teamSize || ''}
            onChange={(e) => onChange('teamSize', e.target.value)}
            className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
          />
        </div>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
        <textarea
          value={data.description || ''}
          onChange={(e) => onChange('description', e.target.value)}
          rows={3}
          className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 resize-none"
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">Challenge</label>
        <textarea
          value={data.challenge || ''}
          onChange={(e) => onChange('challenge', e.target.value)}
          rows={3}
          className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 resize-none"
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">Solution</label>
        <textarea
          value={data.solution || ''}
          onChange={(e) => onChange('solution', e.target.value)}
          rows={3}
          className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 resize-none"
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">Impact</label>
        <textarea
          value={data.impact || ''}
          onChange={(e) => onChange('impact', e.target.value)}
          rows={2}
          className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 resize-none"
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">Tags (comma separated)</label>
        <input
          type="text"
          value={Array.isArray(data.tags) ? data.tags.join(', ') : ''}
          onChange={(e) => onChange('tags', e.target.value.split(',').map((tag: string) => tag.trim()).filter(Boolean))}
          className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
        />
      </div>
    </>
  );
}

function TimelineFields({ data, onChange }: { data: any; onChange: (field: string, value: any) => void }) {
  return (
    <>
      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Year/Period</label>
          <input
            type="text"
            value={data.year || ''}
            onChange={(e) => onChange('year', e.target.value)}
            placeholder="e.g., 2023-2024 or 2025"
            className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Icon</label>
          <select
            value={data.icon || 'calendar'}
            onChange={(e) => onChange('icon', e.target.value)}
            className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
          >
            <option value="calendar">Calendar</option>
            <option value="lightbulb">Lightbulb</option>
            <option value="users">Users</option>
            <option value="code">Code</option>
            <option value="sparkles">Sparkles</option>
          </select>
        </div>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
        <textarea
          value={data.description || ''}
          onChange={(e) => onChange('description', e.target.value)}
          rows={3}
          className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 resize-none"
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">Details</label>
        <textarea
          value={data.detail || ''}
          onChange={(e) => onChange('detail', e.target.value)}
          rows={4}
          className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 resize-none"
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">Color</label>
        <select
          value={data.color || 'from-blue-500 to-blue-600'}
          onChange={(e) => onChange('color', e.target.value)}
          className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
        >
          <option value="from-blue-500 to-blue-600">Blue</option>
          <option value="from-green-500 to-green-600">Green</option>
          <option value="from-red-500 to-red-600">Red</option>
          <option value="from-purple-500 to-purple-600">Purple</option>
          <option value="from-yellow-500 to-yellow-600">Yellow</option>
          <option value="from-cyan-500 to-cyan-600">Cyan</option>
          <option value="from-orange-500 to-orange-600">Orange</option>
          <option value="from-pink-500 to-pink-600">Pink</option>
        </select>
      </div>
    </>
  );
}

function ExperimentFields({ data, onChange }: { data: any; onChange: (field: string, value: any) => void }) {
  return (
    <>
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">Name</label>
        <input
          type="text"
          value={data.name || ''}
          onChange={(e) => onChange('name', e.target.value)}
          className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
        />
      </div>
      
      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Status</label>
          <input
            type="text"
            value={data.status || ''}
            onChange={(e) => onChange('status', e.target.value)}
            placeholder="e.g., Day 11/30 of public build"
            className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Highlight</label>
          <input
            type="text"
            value={data.highlight || ''}
            onChange={(e) => onChange('highlight', e.target.value)}
            placeholder="e.g., Viral on day 8"
            className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
          />
        </div>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
        <textarea
          value={data.description || ''}
          onChange={(e) => onChange('description', e.target.value)}
          rows={3}
          className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 resize-none"
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">Technologies (comma separated)</label>
        <input
          type="text"
          value={Array.isArray(data.tech) ? data.tech.join(', ') : ''}
          onChange={(e) => onChange('tech', e.target.value.split(',').map((tech: string) => tech.trim()).filter(Boolean))}
          placeholder="e.g., Next.js 15, GPT-4, TypeScript"
          className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
        />
      </div>
      
      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Live URL</label>
          <input
            type="url"
            value={data.links?.live || ''}
            onChange={(e) => onChange('links', { ...data.links, live: e.target.value })}
            className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">GitHub URL</label>
          <input
            type="url"
            value={data.links?.github || ''}
            onChange={(e) => onChange('links', { ...data.links, github: e.target.value })}
            className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
          />
        </div>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">Icon</label>
        <select
          value={data.icon || 'lightbulb'}
          onChange={(e) => onChange('icon', e.target.value)}
          className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
        >
          <option value="lightbulb">Lightbulb</option>
          <option value="brain">Brain</option>
          <option value="zap">Zap</option>
          <option value="messagesquare">Message Square</option>
          <option value="code">Code</option>
        </select>
      </div>
    </>
  );
}