import React from 'react';
import ReactDOM from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { Calendar, Lightbulb, Code, Users, Sparkles } from 'lucide-react';
import type { TimelineEvent } from './Timeline';

interface TimelineModalProps {
  isOpen: boolean;
  event: TimelineEvent | null;
  eventIndex: number | null;
  totalEvents: number;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
}

const iconOptions = [
  { name: 'Lightbulb', component: Lightbulb, value: 'lightbulb' },
  { name: 'Users', component: Users, value: 'users' },
  { name: 'Code', component: Code, value: 'code' },
  { name: 'Sparkles', component: Sparkles, value: 'sparkles' },
  { name: 'Calendar', component: Calendar, value: 'calendar' }
];

const getIconComponent = (iconName: string) => {
  const iconOption = iconOptions.find(opt => opt.value === iconName);
  return iconOption ? iconOption.component : Calendar;
};

export default function TimelineModal({
  isOpen,
  event,
  eventIndex,
  totalEvents,
  onClose,
  onPrev,
  onNext
}: TimelineModalProps) {
  if (!isOpen || !event || eventIndex === null) return null;

  const modalContent = (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/90 backdrop-blur-sm overflow-y-auto"
          onClick={onClose}
          style={{ 
            position: 'fixed', 
            top: 0, 
            left: 0, 
            right: 0, 
            bottom: 0,
            zIndex: 9990 
          }}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="min-h-screen flex items-center justify-center p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-gray-900 border border-gray-700 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              {/* Modal Header */}
              <div className="sticky top-0 bg-gray-900 border-b border-gray-700 p-6 flex items-center justify-between z-10">
                <div className="flex items-center">
                  <div className={`w-10 h-10 rounded-full bg-gradient-to-r ${event.color} flex items-center justify-center mr-4`}>
                    {React.createElement(getIconComponent(event.icon), { className: "w-5 h-5 text-white" })}
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white">{event.title}</h2>
                    <p className="text-gray-400">{event.year}</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  {/* Navigation */}
                  <button
                    onClick={onPrev}
                    disabled={eventIndex === 0}
                    className="p-2 text-gray-400 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Previous event"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  
                  <span className="text-sm text-gray-400 px-2">
                    {eventIndex + 1} of {totalEvents}
                  </span>
                  
                  <button
                    onClick={onNext}
                    disabled={eventIndex === totalEvents - 1}
                    className="p-2 text-gray-400 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Next event"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                  
                  <div className="w-px h-6 bg-gray-700 mx-2" />
                  
                  <button
                    onClick={onClose}
                    className="p-2 text-gray-400 hover:text-white transition-colors"
                    title="Close"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
              </div>

              {/* Modal Content */}
              <div className="p-8">
                {/* Description */}
                <div className="mb-8">
                  <h3 className="text-xl font-bold text-white mb-4">Overview</h3>
                  <p className="text-lg text-gray-300 leading-relaxed">
                    {event.description}
                  </p>
                </div>

                {/* Full Details */}
                <div className="mb-8">
                  <h3 className="text-xl font-bold text-white mb-4">Details</h3>
                  <div className="prose prose-invert max-w-none">
                    <p className="text-gray-300 leading-relaxed whitespace-pre-line">
                      {event.detail}
                    </p>
                  </div>
                </div>

                {/* Timeline Position */}
                <div className="bg-gray-800/50 rounded-lg p-4">
                  <div className="flex items-center justify-between text-sm">
                    <div className="text-gray-400">
                      <span className="font-medium">Period:</span> {event.year}
                    </div>
                    <div className="text-gray-400">
                      <span className="font-medium">Position:</span> {eventIndex + 1} of {totalEvents} events
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="border-t border-gray-700 p-6 flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  {eventIndex > 0 && (
                    <button
                      onClick={onPrev}
                      className="flex items-center px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors"
                    >
                      <ChevronLeft className="w-4 h-4 mr-2" />
                      Previous
                    </button>
                  )}
                </div>
                
                <button
                  onClick={onClose}
                  className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                  Close
                </button>
                
                <div className="flex items-center space-x-4">
                  {eventIndex < totalEvents - 1 && (
                    <button
                      onClick={onNext}
                      className="flex items-center px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors"
                    >
                      Next
                      <ChevronRight className="w-4 h-4 ml-2" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  // Renderuj modal w portalu bezpośrednio w body
  return ReactDOM.createPortal(
    modalContent,
    document.body
  );
}