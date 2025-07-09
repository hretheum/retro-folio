import React, { forwardRef } from 'react';
import { motion } from 'framer-motion';

interface Section {
  component: React.ComponentType<any>;
  name: string;
}

interface SectionContentProps {
  sections: Section[];
  currentSection: number;
  sectionsRef: React.MutableRefObject<HTMLDivElement[]>;
  sectionContainerRef: React.RefObject<HTMLDivElement>;
  onSectionChange: (index: number) => void;
}

const SectionContent: React.FC<SectionContentProps> = ({
  sections,
  currentSection,
  sectionsRef,
  sectionContainerRef,
  onSectionChange
}) => {
  return (
    <main className="retro-content">
      <div 
        ref={sectionContainerRef}
        className="retro-section-container"
      >
        {sections.map((Section, index) => (
          <motion.div
            key={index}
            ref={el => {
              if (el) sectionsRef.current[index] = el;
            }}
            initial={false}
            animate={{ 
              opacity: currentSection === index ? 1 : 0,
              x: currentSection === index ? 0 : 
                 index > currentSection ? 100 : -100,
              filter: currentSection === index ? 'blur(0px)' : 'blur(10px)',
              scale: currentSection === index ? 1 : 0.95
            }}
            transition={{ 
              duration: 0.4, 
              ease: "easeInOut"
            }}
            className={`${
              currentSection === index ? 'block' : 'hidden'
            } retro-section`}
          >
            <Section.component onSectionChange={onSectionChange} />
          </motion.div>
        ))}
      </div>
    </main>
  );
};

export default SectionContent;