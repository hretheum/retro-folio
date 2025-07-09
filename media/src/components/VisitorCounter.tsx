import React, { useEffect, useState } from 'react';

interface VisitorCounterProps {
  className?: string;
}

const VisitorCounter: React.FC<VisitorCounterProps> = ({ className = '' }) => {
  const [visitorCount, setVisitorCount] = useState(0);

  useEffect(() => {
    // Force clear localStorage and set to 2137
    localStorage.removeItem('visitor-count');
    
    // Initialize visitor counter with the legendary 2137
    const count = localStorage.getItem('visitor-count');
    let newCount;
    
    if (!count) {
      // First time - set to 2137
      newCount = 2137;
    } else {
      // Subsequent visits - increment from 2137 base
      const currentCount = parseInt(count);
      newCount = currentCount + 1;
    }
    
    setVisitorCount(newCount);
    localStorage.setItem('visitor-count', newCount.toString());
    
    console.log('🎯 Visitor count set to:', newCount); // Debug log
  }, []);

  return (
    <div className={`retro-widget ${className}`}>
      <h3 className="retro-widget-title">📊 Site Stats</h3>
      <div className="retro-counter">
        <div className="retro-counter-label">Visitors:</div>
        <div className="retro-counter-value">{visitorCount.toLocaleString()}</div>
      </div>
      <div className="retro-updated">
        Last updated: December 15, 1998
      </div>
    </div>
  );
};

export default VisitorCounter;