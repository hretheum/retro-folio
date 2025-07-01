import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Lightbulb, Code, Users, Sparkles } from 'lucide-react';
import TimelineModal from './TimelineModal';
import { useContent } from '../hooks/useContent';

export interface TimelineEvent {
  id: string;
  year: string;
  title: string;
  description: string;
  detail: string;
  icon: string;
  color: string;
  position: 'left' | 'right';
  createdAt?: Date;
  updatedAt?: Date;
}

const iconOptions = [
  { name: 'Lightbulb', component: Lightbulb, value: 'lightbulb' },
  { name: 'Users', component: Users, value: 'users' },
  { name: 'Code', component: Code, value: 'code' },
  { name: 'Sparkles', component: Sparkles, value: 'sparkles' },
  { name: 'Calendar', component: Calendar, value: 'calendar' }
];

export default function Timeline() {
  const { items: contentItems, loading } = useContent('timeline');
  const [timelineEvents, setTimelineEvents] = useState<TimelineEvent[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<TimelineEvent | null>(null);
  const [selectedEventIndex, setSelectedEventIndex] = useState<number | null>(null);
  const [showModal, setShowModal] = useState(false);

  // Initialize with content from API or default events
  useEffect(() => {
    // If API data is available, use it
    if (!loading && contentItems.length > 0) {
      const publishedEvents = contentItems
        .filter(item => item.status === 'published')
        .map((item, index) => ({
          id: item.id,
          title: item.title,
          year: item.data.year,
          description: item.data.description,
          detail: item.data.detail,
          icon: item.data.icon || 'calendar',
          color: item.data.color || 'from-blue-500 to-blue-600',
          position: index % 2 === 0 ? 'left' : 'right' as 'left' | 'right',
          createdAt: new Date(item.createdAt),
          updatedAt: new Date(item.updatedAt)
        }))
        .sort((a, b) => {
          const getYear = (yearStr: string) => {
            const match = yearStr.match(/(\d{4})/);
            return match ? parseInt(match[1]) : 0;
          };
          return getYear(b.year) - getYear(a.year);
        });

      if (publishedEvents.length > 0) {
        setTimelineEvents(publishedEvents);
        return;
      }
    }

    // Otherwise, use default events
    const defaultEvents: TimelineEvent[] = [
      {
        id: '1',
        year: '2001-2003',
        title: 'Tech Journalist',
        description: 'First to write about usability in Polish media',
        detail: 'Published groundbreaking articles in Wprost magazine introducing NetPR and web usability concepts to Polish market. This was the beginning of my journey in making technology more human-centered.',
        icon: 'lightbulb',
        color: 'from-purple-500 to-purple-600',
        position: 'left',
        createdAt: new Date('2001-01-01'),
        updatedAt: new Date('2001-01-01')
      },
      {
        id: '2',
        year: '2003-2006',
        title: 'Usability Pioneer',
        description: 'Established Poland\'s first professional UX lab',
        detail: 'At Grey/Argonauts, created testing methodologies and convinced skeptical clients about the value of user research. Built the first professional usability lab in Poland, complete with one-way mirrors and recording equipment.',
        icon: 'users',
        color: 'from-blue-500 to-blue-600',
        position: 'right',
        createdAt: new Date('2003-01-01'),
        updatedAt: new Date('2003-01-01')
      },
      {
        id: '3',
        year: '2007-2009',
        title: 'Agency Founder',
        description: 'Launched komitywa.com (market wasn\'t ready)',
        detail: 'Too early to market with UX-focused agency. Valuable lessons in timing and market education. Sometimes being first means being too early - but the experience was invaluable.',
        icon: 'sparkles',
        color: 'from-red-500 to-red-600',
        position: 'left',
        createdAt: new Date('2007-01-01'),
        updatedAt: new Date('2007-01-01')
      },
      {
        id: '4',
        year: '2017-2022',
        title: 'Design Systems at Scale',
        description: 'Built enterprise design system at ING',
        detail: 'Led chapter of 25+ designers, implemented design systems serving thousands of developers across multiple countries. Created governance models and adoption strategies that became industry standards.',
        icon: 'code',
        color: 'from-green-500 to-green-600',
        position: 'right',
        createdAt: new Date('2017-01-01'),
        updatedAt: new Date('2017-01-01')
      },
      {
        id: '5',
        year: '2023-2024',
        title: 'AI Builder Phase',
        description: 'Creating RAG systems and AI agents',
        detail: 'Building personal knowledge RAG, MCP servers, and hireverse.app - demonstrating the future of AI-assisted work. Moving from design leadership to hands-on AI development.',
        icon: 'sparkles',
        color: 'from-cyan-500 to-cyan-600',
        position: 'left',
        createdAt: new Date('2023-01-01'),
        updatedAt: new Date('2023-01-01')
      },
      {
        id: '6',
        year: '2025',
        title: 'What\'s Next?',
        description: 'Currently building: hireverse.app',
        detail: 'Day-by-day public build of AI agent that interviews recruiters. The future of hiring is being written now. Follow along as I build in public and share every step of the journey.',
        icon: 'calendar',
        color: 'from-yellow-500 to-yellow-600',
        position: 'right',
        createdAt: new Date('2025-01-01'),
        updatedAt: new Date('2025-01-01')
      }
    ];

    // Fall back to default events if no API data
    setTimelineEvents(defaultEvents);
  }, [contentItems, loading]);

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

  const getIconComponent = (iconName: string) => {
    const iconOption = iconOptions.find(opt => opt.value === iconName);
    return iconOption ? iconOption.component : Calendar;
  };

  const handleEventClick = (event: TimelineEvent, index: number) => {
    console.log('Timeline event clicked:', event.title, 'Index:', index);
    setSelectedEvent(event);
    setSelectedEventIndex(index);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    console.log('Closing timeline modal');
    setShowModal(false);
    setSelectedEvent(null);
    setSelectedEventIndex(null);
  };

  const handlePrevEvent = () => {
    if (selectedEventIndex !== null && selectedEventIndex > 0) {
      const prevIndex = selectedEventIndex - 1;
      const prevEvent = timelineEvents[prevIndex];
      setSelectedEvent(prevEvent);
      setSelectedEventIndex(prevIndex);
    }
  };

  const handleNextEvent = () => {
    if (selectedEventIndex !== null && selectedEventIndex < timelineEvents.length - 1) {
      const nextIndex = selectedEventIndex + 1;
      const nextEvent = timelineEvents[nextIndex];
      setSelectedEvent(nextEvent);
      setSelectedEventIndex(nextIndex);
    }
  };

  return (
    <section className="relative min-h-screen py-20 px-6">
      <div className="max-w-6xl mx-auto">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-20"
        >
          <div className="flex items-center justify-center mb-6">
            <h2 className="text-5xl md:text-6xl font-serif font-bold text-white">
              Always 5 Years Ahead
            </h2>
          </div>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            A journey of innovation, from introducing unknown concepts to building the future. 
            What I do today, the industry adopts tomorrow.
          </p>
          <div className="mt-4 text-sm text-gray-400">
            {timelineEvents.length} events • Click any card for full details
          </div>
        </motion.div>

        {/* 5 Years Ahead Indicator */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5, duration: 0.8 }}
          className="text-center mb-16"
        >
          <div className="inline-block bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full p-1">
            <div className="bg-black rounded-full px-8 py-4">
              <div className="text-sm text-gray-400 mb-1">Currently Operating In</div>
              <motion.div
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 3, repeat: Infinity }}
                className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent"
              >
                2029
              </motion.div>
              <div className="text-xs text-gray-500 mt-1">Market catches up in 5 years</div>
            </div>
          </div>
        </motion.div>

        {/* Timeline */}
        <div className="relative">
          {/* Central Line */}
          <div className="absolute left-1/2 transform -translate-x-1/2 w-0.5 h-full bg-gradient-to-b from-blue-500 via-cyan-500 to-yellow-500" />

          {/* Timeline Events */}
          <div className="space-y-16">
            {timelineEvents.map((event, index) => {
              const IconComponent = getIconComponent(event.icon);
              
              return (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, x: event.position === 'left' ? -100 : 100 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.2, duration: 0.8 }}
                  className={`relative flex items-center ${
                    event.position === 'left' ? 'justify-start' : 'justify-end'
                  }`}
                >
                  {/* Timeline Dot */}
                  <div className="absolute left-1/2 transform -translate-x-1/2 z-10">
                    <motion.div
                      whileHover={{ scale: 1.2 }}
                      className={`w-12 h-12 rounded-full bg-gradient-to-r ${event.color} flex items-center justify-center shadow-lg relative cursor-pointer`}
                      onClick={() => handleEventClick(event, index)}
                    >
                      <IconComponent className="w-6 h-6 text-white" />
                    </motion.div>
                  </div>

                  {/* Content Card */}
                  <motion.div
                    whileHover={{ scale: 1.02, y: -5 }}
                    className={`w-5/12 ${
                      event.position === 'left' ? 'mr-auto pr-8' : 'ml-auto pl-8'
                    }`}
                  >
                    <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-2xl p-6 hover:border-blue-500/30 transition-all duration-300 cursor-pointer"
                         onClick={() => handleEventClick(event, index)}>
                      <div className="mb-3">
                        <span className="text-sm text-gray-400 font-mono">{event.year}</span>
                      </div>
                      
                      <h3 className="text-2xl font-bold text-white mb-3">{event.title}</h3>
                      <p className="text-gray-300 mb-4">{event.description}</p>
                      
                      {/* Hint to click for more */}
                      <div className="text-xs text-blue-400 opacity-75">
                        Click to read full story →
                      </div>
                    </div>
                  </motion.div>
                </motion.div>
              );
            })}
          </div>
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
            
            <button className="px-6 py-3 bg-blue-500 text-white rounded-full font-medium hover:bg-blue-600 transition-colors duration-300">
              Watch Live Development →
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

      {/* Timeline Event Modal - renderowany przez portal */}
      <TimelineModal
        isOpen={showModal}
        event={selectedEvent}
        eventIndex={selectedEventIndex}
        totalEvents={timelineEvents.length}
        onClose={handleCloseModal}
        onPrev={handlePrevEvent}
        onNext={handleNextEvent}
      />
    </section>
  );
}