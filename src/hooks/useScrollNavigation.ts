import { useState, useRef, useEffect, useCallback } from 'react';

interface UseScrollNavigationProps {
  totalSections: number;
  sectionContainerRef: React.RefObject<HTMLDivElement>;
  sectionsRef: React.MutableRefObject<HTMLDivElement[]>;
}

export const useScrollNavigation = ({
  totalSections,
  sectionContainerRef,
  sectionsRef
}: UseScrollNavigationProps) => {
  const [currentSection, setCurrentSection] = useState(0);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [sectionScrollPosition, setSectionScrollPosition] = useState(0);
  const [sectionOverflows, setSectionOverflows] = useState(false);

  const scrollAccumulator = useRef(0);
  const lastScrollTime = useRef(0);

  // Check if current section content overflows viewport
  const checkSectionOverflow = useCallback(() => {
    const currentSectionElement = sectionsRef.current[currentSection];
    if (!currentSectionElement || !sectionContainerRef.current) return false;

    const sectionHeight = currentSectionElement.scrollHeight;
    const containerHeight = sectionContainerRef.current.clientHeight;
    
    return sectionHeight > containerHeight + 50; // Add 50px buffer
  }, [currentSection, sectionContainerRef, sectionsRef]);

  // Check if user has scrolled to bottom of current section
  const isAtSectionBottom = useCallback(() => {
    if (!sectionContainerRef.current) return true;
    
    const container = sectionContainerRef.current;
    const scrollTop = container.scrollTop;
    const scrollHeight = container.scrollHeight;
    const clientHeight = container.clientHeight;
    
    // Consider "bottom" when within 100px of actual bottom
    return scrollTop + clientHeight >= scrollHeight - 100;
  }, [sectionContainerRef]);

  // Check if user is at top of current section
  const isAtSectionTop = useCallback(() => {
    if (!sectionContainerRef.current) return true;
    return sectionContainerRef.current.scrollTop <= 100;
  }, [sectionContainerRef]);

  // Update section overflow status when section changes or window resizes
  useEffect(() => {
    const updateOverflowStatus = () => {
      const overflows = checkSectionOverflow();
      setSectionOverflows(overflows);
    };

    // Check immediately
    updateOverflowStatus();

    // Check on window resize
    window.addEventListener('resize', updateOverflowStatus);
    
    // Check after a short delay to ensure DOM is updated
    const timeout = setTimeout(updateOverflowStatus, 100);

    return () => {
      window.removeEventListener('resize', updateOverflowStatus);
      clearTimeout(timeout);
    };
  }, [currentSection, checkSectionOverflow]);

  const handleSectionChange = useCallback((index: number) => {
    if (isTransitioning || index === currentSection) return;
    
    setIsTransitioning(true);
    setCurrentSection(index);
    setScrollProgress(0);
    scrollAccumulator.current = 0;
    
    // Reset section scroll position
    if (sectionContainerRef.current) {
      sectionContainerRef.current.scrollTop = 0;
    }
    
    setTimeout(() => {
      setIsTransitioning(false);
    }, 400);
  }, [isTransitioning, currentSection, sectionContainerRef]);

  // Enhanced scroll handling with section overflow detection
  useEffect(() => {
    let resetTimeout: NodeJS.Timeout;

    const handleWheel = (e: WheelEvent) => {
      // Don't prevent default if we're transitioning
      if (isTransitioning) {
        e.preventDefault();
        return;
      }

      const now = Date.now();
      const timeDiff = now - lastScrollTime.current;
      
      // Reset accumulator if too much time has passed
      if (timeDiff > 150) {
        scrollAccumulator.current = 0;
        setScrollProgress(0);
      }
      
      lastScrollTime.current = now;

      // If section overflows, handle internal scrolling first
      if (sectionOverflows) {
        const scrollingDown = e.deltaY > 0;
        const scrollingUp = e.deltaY < 0;
        
        // Allow normal scrolling within section
        if (scrollingDown && !isAtSectionBottom()) {
          // Let browser handle normal scrolling down
          return; // Don't prevent default
        }
        
        if (scrollingUp && !isAtSectionTop()) {
          // Let browser handle normal scrolling up
          return; // Don't prevent default
        }
      }

      // Prevent default for section transitions
      e.preventDefault();
      
      // Accumulate scroll delta
      scrollAccumulator.current += e.deltaY;
      
      // Calculate progress (0-100%)
      const threshold = 80;
      const progress = Math.min(Math.abs(scrollAccumulator.current) / threshold * 100, 100);
      setScrollProgress(progress);
      
      // Clear any existing reset timeout
      if (resetTimeout) {
        clearTimeout(resetTimeout);
      }
      
      // Set new reset timeout to clear progress
      resetTimeout = setTimeout(() => {
        scrollAccumulator.current = 0;
        setScrollProgress(0);
      }, 150);
      
      // Trigger section change when threshold is reached
      if (Math.abs(scrollAccumulator.current) >= threshold) {
        let newSection = currentSection;
        
        if (scrollAccumulator.current > 0 && currentSection < totalSections - 1) {
          // Scroll down
          newSection = currentSection + 1;
        } else if (scrollAccumulator.current < 0 && currentSection > 0) {
          // Scroll up
          newSection = currentSection - 1;
        }
        
        if (newSection !== currentSection) {
          handleSectionChange(newSection);
        }
      }
    };

    // Monitor section scroll position
    const handleSectionScroll = () => {
      if (sectionContainerRef.current) {
        setSectionScrollPosition(sectionContainerRef.current.scrollTop);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (isTransitioning) return;
      
      let newSection = currentSection;
      
      switch (e.key) {
        case 'ArrowDown':
        case 'PageDown':
          e.preventDefault();
          // Only change section if we're at bottom of current section or it doesn't overflow
          if (!sectionOverflows || isAtSectionBottom()) {
            if (currentSection < totalSections - 1) {
              newSection = currentSection + 1;
            }
          } else {
            // Scroll within section
            if (sectionContainerRef.current) {
              sectionContainerRef.current.scrollBy({ top: 200, behavior: 'smooth' });
            }
            return;
          }
          break;
        case 'ArrowUp':
        case 'PageUp':
          e.preventDefault();
          // Only change section if we're at top of current section or it doesn't overflow
          if (!sectionOverflows || isAtSectionTop()) {
            if (currentSection > 0) {
              newSection = currentSection - 1;
            }
          } else {
            // Scroll within section
            if (sectionContainerRef.current) {
              sectionContainerRef.current.scrollBy({ top: -200, behavior: 'smooth' });
            }
            return;
          }
          break;
        case 'Home':
          e.preventDefault();
          newSection = 0;
          break;
        case 'End':
          e.preventDefault();
          newSection = totalSections - 1;
          break;
        // Number keys 1-7 for direct section navigation
        case '1':
        case '2':
        case '3':
        case '4':
        case '5':
        case '6':
        case '7':
          e.preventDefault();
          const sectionIndex = parseInt(e.key) - 1; // Convert to 0-based index
          if (sectionIndex >= 0 && sectionIndex < totalSections) {
            newSection = sectionIndex;
          }
          break;
      }
      
      if (newSection !== currentSection) {
        handleSectionChange(newSection);
      }
    };

    // Touch handling for mobile
    let touchStartY = 0;
    let touchStartTime = 0;
    
    const handleTouchStart = (e: TouchEvent) => {
      touchStartY = e.touches[0].clientY;
      touchStartTime = Date.now();
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (isTransitioning) return;
      
      const touchEndY = e.changedTouches[0].clientY;
      const touchEndTime = Date.now();
      const deltaY = touchStartY - touchEndY;
      const deltaTime = touchEndTime - touchStartTime;
      
      // Check for valid swipe (minimum distance and not too slow)
      if (Math.abs(deltaY) > 50 && deltaTime < 500) {
        // Check section boundaries for touch
        if (sectionOverflows) {
          if (deltaY > 0 && !isAtSectionBottom()) return; // Scrolling down but not at bottom
          if (deltaY < 0 && !isAtSectionTop()) return; // Scrolling up but not at top
        }
        
        let newSection = currentSection;
        
        if (deltaY > 0 && currentSection < totalSections - 1) {
          // Swipe up - go to next section
          newSection = currentSection + 1;
        } else if (deltaY < 0 && currentSection > 0) {
          // Swipe down - go to previous section
          newSection = currentSection - 1;
        }
        
        if (newSection !== currentSection) {
          handleSectionChange(newSection);
        }
      }
    };

    window.addEventListener('wheel', handleWheel, { passive: false });
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchend', handleTouchEnd, { passive: true });
    
    if (sectionContainerRef.current) {
      sectionContainerRef.current.addEventListener('scroll', handleSectionScroll, { passive: true });
    }

    return () => {
      window.removeEventListener('wheel', handleWheel);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchend', handleTouchEnd);
      if (sectionContainerRef.current) {
        sectionContainerRef.current.removeEventListener('scroll', handleSectionScroll);
      }
      if (resetTimeout) clearTimeout(resetTimeout);
    };
  }, [currentSection, isTransitioning, totalSections, sectionOverflows, handleSectionChange, isAtSectionBottom, isAtSectionTop, sectionContainerRef]);

  return {
    currentSection,
    scrollProgress,
    isTransitioning,
    sectionScrollPosition,
    sectionOverflows,
    handleSectionChange
  };
};