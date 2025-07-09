import React, { useEffect, useState, useRef } from 'react';

interface StarParticle {
  id: number;
  x: number;
  y: number;
  opacity: number;
  size: number;
  life: number;
  maxLife: number;
  vx: number;
  vy: number;
}

export default function SaturnCursor() {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [particles, setParticles] = useState<StarParticle[]>([]);
  const [isVisible, setIsVisible] = useState(false);
  const particleIdRef = useRef(0);
  const animationRef = useRef<number>();

  useEffect(() => {
    let lastTime = 0;
    const trailDelay = 50; // milliseconds between particle spawns

    const handleMouseMove = (e: MouseEvent) => {
      const currentTime = Date.now();
      setMousePos({ x: e.clientX, y: e.clientY });
      setIsVisible(true);

      // Create new particles with delay
      if (currentTime - lastTime > trailDelay) {
        const newParticle: StarParticle = {
          id: particleIdRef.current++,
          x: e.clientX,
          y: e.clientY,
          opacity: 1,
          size: Math.random() * 3 + 1,
          life: 0,
          maxLife: 60 + Math.random() * 40, // 1-1.7 seconds at 60fps
          vx: (Math.random() - 0.5) * 2, // Random horizontal drift
          vy: (Math.random() - 0.5) * 2, // Random vertical drift
        };

        setParticles(prev => [...prev, newParticle]);
        lastTime = currentTime;
      }
    };

    const handleMouseLeave = () => {
      setIsVisible(false);
    };

    const handleMouseEnter = () => {
      setIsVisible(true);
    };

    // Animation loop for particles
    const animate = () => {
      setParticles(prev => 
        prev
          .map(particle => ({
            ...particle,
            life: particle.life + 1,
            opacity: Math.max(0, 1 - (particle.life / particle.maxLife)),
            x: particle.x + particle.vx * 0.5,
            y: particle.y + particle.vy * 0.5,
            size: particle.size * (1 - particle.life / particle.maxLife * 0.3), // Shrink over time
          }))
          .filter(particle => particle.life < particle.maxLife)
      );

      animationRef.current = requestAnimationFrame(animate);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseleave', handleMouseLeave);
    document.addEventListener('mouseenter', handleMouseEnter);
    
    animate();

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
      document.removeEventListener('mouseenter', handleMouseEnter);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  if (!isVisible) return null;

  return (
    <div className="saturn-cursor-container">
      {/* Saturn Planet */}
      <div
        className="saturn-planet"
        style={{
          left: mousePos.x - 20,
          top: mousePos.y - 20,
        }}
      >
        <div className="saturn-body">🪐</div>
        <div className="saturn-rings"></div>
      </div>

      {/* Stardust Trail */}
      {particles.map((particle) => (
        <div
          key={particle.id}
          className="star-particle"
          style={{
            left: particle.x - particle.size / 2,
            top: particle.y - particle.size / 2,
            opacity: particle.opacity,
            width: particle.size,
            height: particle.size,
          }}
        >
          ✨
        </div>
      ))}

      <style jsx>{`
        .saturn-cursor-container {
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100vh;
          pointer-events: none;
          z-index: 99999;
          overflow: hidden;
        }

        .saturn-planet {
          position: absolute;
          width: 40px;
          height: 40px;
          pointer-events: none;
          z-index: 100000;
          transition: transform 0.1s ease-out;
          animation: saturn-float 3s ease-in-out infinite;
        }

        .saturn-body {
          font-size: 32px;
          text-align: center;
          filter: drop-shadow(0 0 8px rgba(255, 215, 0, 0.6));
          animation: saturn-rotate 8s linear infinite;
        }

        .saturn-rings {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 50px;
          height: 20px;
          border: 2px solid rgba(255, 215, 0, 0.4);
          border-radius: 50%;
          animation: saturn-rings-pulse 2s ease-in-out infinite alternate;
        }

        .saturn-rings::before {
          content: '';
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 60px;
          height: 25px;
          border: 1px solid rgba(255, 215, 0, 0.2);
          border-radius: 50%;
        }

        .saturn-rings::after {
          content: '';
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 40px;
          height: 15px;
          border: 1px solid rgba(255, 215, 0, 0.3);
          border-radius: 50%;
        }

        .star-particle {
          position: absolute;
          pointer-events: none;
          font-size: 8px;
          color: #FFD700;
          text-shadow: 
            0 0 4px rgba(255, 215, 0, 0.8),
            0 0 8px rgba(255, 215, 0, 0.6),
            0 0 12px rgba(255, 215, 0, 0.4);
          animation: star-twinkle 0.5s ease-in-out infinite alternate;
          z-index: 99999;
        }

        @keyframes saturn-float {
          0%, 100% { 
            transform: translateY(0px) rotate(0deg); 
          }
          50% { 
            transform: translateY(-3px) rotate(2deg); 
          }
        }

        @keyframes saturn-rotate {
          from { 
            transform: rotate(0deg); 
          }
          to { 
            transform: rotate(360deg); 
          }
        }

        @keyframes saturn-rings-pulse {
          0% { 
            opacity: 0.3;
            transform: translate(-50%, -50%) scale(1);
          }
          100% { 
            opacity: 0.6;
            transform: translate(-50%, -50%) scale(1.1);
          }
        }

        @keyframes star-twinkle {
          0% { 
            transform: scale(1) rotate(0deg);
            filter: brightness(1);
          }
          100% { 
            transform: scale(1.2) rotate(180deg);
            filter: brightness(1.5);
          }
        }

        /* Hide on mobile to avoid performance issues */
        @media (max-width: 768px) {
          .saturn-cursor-container {
            display: none;
          }
        }

        /* Hide when hovering over interactive elements */
        .saturn-cursor-container:hover {
          pointer-events: none;
        }
      `}</style>
    </div>
  );
}