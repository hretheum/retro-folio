import React from 'react';
import { motion } from 'framer-motion';

interface HeroProps {
  onSectionChange?: (sectionIndex: number) => void;
}

export default function Hero({ onSectionChange }: HeroProps) {
  const handleViewLeadership = () => {
    onSectionChange?.(1); // Leadership section (index 1)
  };

  const handleSeeBuilding = () => {
    onSectionChange?.(4); // Experiments section (index 4)
  };

  return (
    <section className="retro-hero">
      {/* Animated Background Elements */}
      <div className="retro-hero-bg">
        <div className="retro-hero-stars">
          {[...Array(20)].map((_, i) => (
            <div key={i} className="retro-star" style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`
            }}>⭐</div>
          ))}
        </div>
      </div>

      <div className="retro-hero-content">
        {/* Main Headline */}
        <motion.div
          initial={{ opacity: 0, y: 100 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.8, duration: 1, ease: "easeOut" }}
          className="retro-hero-main"
        >
          <h1 className="retro-hero-title">
            <span className="retro-hero-line1">🚀 ERYK ORŁOWSKI 🚀</span>
            <span className="retro-hero-line2">DESIGN LEADER & AI BUILDER</span>
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 3 }}
              className="retro-hero-tagline"
            >
              ⚡ ALWAYS 5 YEARS AHEAD! ⚡
            </motion.span>
          </h1>
        </motion.div>

        {/* Retro Stats */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 2.5, duration: 0.8 }}
          className="retro-hero-stats"
        >
          <div className="retro-stat-box">
            <div className="retro-stat-icon">👥</div>
            <div className="retro-stat-label">Teams Built</div>
            <div className="retro-stat-value">5+</div>
          </div>
          <div className="retro-stat-box">
            <div className="retro-stat-icon">💻</div>
            <div className="retro-stat-label">Years Experience</div>
            <div className="retro-stat-value">20+</div>
          </div>
          <div className="retro-stat-box">
            <div className="retro-stat-icon">🤖</div>
            <div className="retro-stat-label">AI Projects</div>
            <div className="retro-stat-value">3</div>
          </div>
          <div className="retro-stat-box">
            <div className="retro-stat-icon">🏆</div>
            <div className="retro-stat-label">Industry First</div>
            <div className="retro-stat-value">Poland</div>
          </div>
        </motion.div>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 3, duration: 0.8 }}
          className="retro-hero-cta"
        >
          <motion.button
            onClick={handleViewLeadership}
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.95 }}
            className="retro-cta-button retro-cta-primary"
            title="Go to Leadership section"
          >
            <span className="retro-cta-icon">📋</span>
            VIEW MY LEADERSHIP PLAYBOOK
          </motion.button>
          <motion.button
            onClick={handleSeeBuilding}
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.95 }}
            className="retro-cta-button retro-cta-secondary"
            title="Go to Experiments section"
          >
            <span className="retro-cta-icon">🔬</span>
            SEE WHAT I'M BUILDING
          </motion.button>
        </motion.div>

        {/* Years Ahead Indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 3.5 }}
          className="retro-hero-future"
        >
          <div className="retro-future-box">
            <div className="retro-future-label">🔮 CURRENTLY BUILDING IN 🔮</div>
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="retro-future-year"
            >
              2029
            </motion.div>
            <div className="retro-future-subtitle">Market catches up in 5 years!</div>
          </div>
        </motion.div>

        {/* Scroll Indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 4 }}
          className="retro-hero-scroll"
        >
          <div className="retro-scroll-text">
            <span className="retro-blink">⬇️ SCROLL FOR MORE AWESOME STUFF! ⬇️</span>
          </div>
        </motion.div>
      </div>

      <style jsx>{`
        .retro-hero {
          position: relative;
          min-height: 600px;
          background: linear-gradient(45deg, 
            var(--retro-black) 0%, 
            #001122 50%, 
            var(--retro-black) 100%);
          border: 3px inset var(--retro-gray);
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 2rem;
        }

        .retro-hero-bg {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          overflow: hidden;
        }

        .retro-hero-stars {
          position: absolute;
          width: 100%;
          height: 100%;
        }

        .retro-star {
          position: absolute;
          font-size: 1rem;
          animation: retro-twinkle 3s infinite;
        }

        @keyframes retro-twinkle {
          0%, 100% { opacity: 0.3; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.2); }
        }

        .retro-hero-content {
          position: relative;
          z-index: 2;
          text-align: center;
          max-width: 800px;
          width: 100%;
        }

        .retro-hero-main {
          margin-bottom: 2rem;
        }

        .retro-hero-title {
          margin: 0;
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .retro-hero-line1 {
          font-size: 2.5rem;
          font-weight: bold;
          color: var(--retro-neon-green);
          text-shadow: 
            2px 2px 0 var(--retro-black),
            4px 4px 8px rgba(0, 255, 0, 0.5);
          animation: retro-glow-green 2s infinite alternate;
        }

        .retro-hero-line2 {
          font-size: 2rem;
          font-weight: bold;
          color: var(--retro-hot-pink);
          text-shadow: 
            2px 2px 0 var(--retro-black),
            4px 4px 8px rgba(255, 20, 147, 0.5);
          animation: retro-glow-pink 2s infinite alternate;
        }

        .retro-hero-tagline {
          font-size: 1.2rem;
          color: var(--retro-yellow);
          text-shadow: 2px 2px 0 var(--retro-black);
          animation: retro-blink 1s infinite;
        }

        @keyframes retro-glow-green {
          0% { text-shadow: 2px 2px 0 var(--retro-black), 4px 4px 8px rgba(0, 255, 0, 0.5); }
          100% { text-shadow: 2px 2px 0 var(--retro-black), 4px 4px 16px rgba(0, 255, 0, 0.8); }
        }

        @keyframes retro-glow-pink {
          0% { text-shadow: 2px 2px 0 var(--retro-black), 4px 4px 8px rgba(255, 20, 147, 0.5); }
          100% { text-shadow: 2px 2px 0 var(--retro-black), 4px 4px 16px rgba(255, 20, 147, 0.8); }
        }

        .retro-hero-stats {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          gap: 1rem;
          margin-bottom: 2rem;
        }

        .retro-stat-box {
          background: var(--retro-black);
          border: 3px outset var(--retro-gray);
          padding: 1rem;
          text-align: center;
          box-shadow: 
            inset 1px 1px 2px rgba(255, 255, 255, 0.2),
            inset -1px -1px 2px rgba(0, 0, 0, 0.5);
        }

        .retro-stat-icon {
          font-size: 2rem;
          margin-bottom: 0.5rem;
          animation: retro-bounce 2s infinite;
        }

        .retro-stat-label {
          color: var(--retro-cyan);
          font-size: 0.8rem;
          font-weight: bold;
          margin-bottom: 0.25rem;
          text-transform: uppercase;
        }

        .retro-stat-value {
          color: var(--retro-yellow);
          font-size: 1.5rem;
          font-weight: bold;
          text-shadow: 1px 1px 0 var(--retro-black);
          font-family: 'Courier New', monospace;
        }

        .retro-hero-cta {
          display: flex;
          flex-direction: column;
          gap: 1rem;
          align-items: center;
          margin-bottom: 2rem;
        }

        .retro-cta-button {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 1rem 2rem;
          font-family: 'Comic Neue', 'Comic Sans MS', cursive;
          font-weight: bold;
          font-size: 0.9rem;
          border: 3px outset var(--retro-gray);
          cursor: pointer;
          text-shadow: 1px 1px 0 var(--retro-black);
          transition: all 0.3s ease;
          box-shadow: 
            inset 1px 1px 2px rgba(255, 255, 255, 0.3),
            inset -1px -1px 2px rgba(0, 0, 0, 0.3);
        }

        .retro-cta-primary {
          background: linear-gradient(45deg, 
            var(--retro-electric-blue) 0%, 
            var(--retro-cyan) 100%);
          color: var(--retro-white);
        }

        .retro-cta-secondary {
          background: linear-gradient(45deg, 
            var(--retro-hot-pink) 0%, 
            var(--retro-purple) 100%);
          color: var(--retro-white);
        }

        .retro-cta-button:hover {
          transform: translateY(-2px);
          box-shadow: 
            inset 1px 1px 2px rgba(255, 255, 255, 0.3),
            inset -1px -1px 2px rgba(0, 0, 0, 0.3),
            0 4px 8px rgba(0, 0, 0, 0.3);
        }

        .retro-cta-button:active {
          border: 3px inset var(--retro-gray);
          transform: translateY(0);
        }

        .retro-cta-icon {
          font-size: 1.2rem;
        }

        .retro-hero-future {
          margin-bottom: 2rem;
        }

        .retro-future-box {
          background: var(--retro-black);
          border: 4px outset var(--retro-gray);
          padding: 1.5rem;
          display: inline-block;
          box-shadow: 
            inset 2px 2px 4px rgba(255, 255, 255, 0.2),
            inset -2px -2px 4px rgba(0, 0, 0, 0.5),
            0 0 20px rgba(0, 255, 255, 0.3);
        }

        .retro-future-label {
          color: var(--retro-cyan);
          font-size: 0.9rem;
          font-weight: bold;
          margin-bottom: 0.5rem;
        }

        .retro-future-year {
          font-size: 3rem;
          font-weight: bold;
          color: var(--retro-yellow);
          text-shadow: 
            2px 2px 0 var(--retro-black),
            4px 4px 8px rgba(255, 255, 0, 0.5);
          font-family: 'Courier New', monospace;
          margin-bottom: 0.5rem;
        }

        .retro-future-subtitle {
          color: var(--retro-white);
          font-size: 0.8rem;
        }

        .retro-hero-scroll {
          text-align: center;
        }

        .retro-scroll-text {
          color: var(--retro-neon-green);
          font-weight: bold;
          font-size: 1rem;
        }

        @media (max-width: 768px) {
          .retro-hero {
            padding: 1rem;
            min-height: 500px;
          }
          
          .retro-hero-line1 {
            font-size: 1.8rem;
          }
          
          .retro-hero-line2 {
            font-size: 1.4rem;
          }
          
          .retro-hero-tagline {
            font-size: 1rem;
          }
          
          .retro-hero-stats {
            grid-template-columns: repeat(2, 1fr);
          }
          
          .retro-cta-button {
            font-size: 0.8rem;
            padding: 0.8rem 1.5rem;
          }
          
          .retro-future-year {
            font-size: 2rem;
          }
        }
      `}</style>
    </section>
  );
}