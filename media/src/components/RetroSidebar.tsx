import React from 'react';
import VisitorCounter from './VisitorCounter';

interface RetroSidebarProps {
  currentSection: number;
  sectionNames: string[];
  sectionOverflows: boolean;
  onSectionChange: (index: number) => void;
}

const RetroSidebar: React.FC<RetroSidebarProps> = ({
  currentSection,
  sectionNames,
  sectionOverflows,
  onSectionChange
}) => {
  const guestbookEntries = JSON.parse(localStorage.getItem('guestbook-entries') || '[]');

  return (
    <aside className="retro-sidebar">
      <VisitorCounter />

      <div className="retro-widget">
        <h3 className="retro-widget-title">📧 Contact Me!</h3>
        <div className="retro-email">
          <span className="retro-email-icon">📮</span>
          <a href="mailto:eof@offline.pl" className="retro-email-link">
            Send me email!
          </a>
        </div>
      </div>


      <div className="retro-widget">
        <h3 className="retro-widget-title">📖 Guestbook</h3>
        <div className="retro-guestbook-widget">
          <div className="retro-guestbook-stats">
            <div className="retro-guestbook-count">
              {guestbookEntries.length} entries
            </div>
            <button
              onClick={() => onSectionChange(5)}
              className="retro-guestbook-link"
            >
              📝 Sign Guestbook!
            </button>
          </div>
          <div className="retro-guestbook-preview">
            Latest: "This site is amazing! 🌟"
          </div>
        </div>
      </div>

      <div className="retro-widget">
        <h3 className="retro-widget-title">🔗 Cool Links</h3>
        <div className="retro-links">
          <a href="#" className="retro-link">🌐 My GeoCities</a>
          <a href="#" className="retro-link">💿 My MP3s</a>
          <a href="#" className="retro-link">📷 Photo Gallery</a>
          <a href="#" className="retro-link">🎮 Games</a>
        </div>
      </div>

      <div className="retro-widget">
        <h3 className="retro-widget-title">🪐 Saturn Info</h3>
        <div className="retro-saturn-info">
          <div className="retro-saturn-fact">
            🌟 Move your mouse to see Saturn follow!
          </div>
          <div className="retro-saturn-fact">
            ✨ Watch the stardust trail sparkle!
          </div>
          <div className="retro-saturn-fact">
            🪐 Authentic 1998 space vibes!
          </div>
        </div>
      </div>

      {/* Section Info Widget */}
      <div className="retro-widget">
        <h3 className="retro-widget-title">📜 Section Info</h3>
        <div className="retro-section-info">
          <div className="retro-section-current">
            Current: {sectionNames[currentSection]}
          </div>
          <div className="retro-section-status">
            {sectionOverflows ? (
              <span className="retro-section-scrollable">
                📜 Scrollable Section
              </span>
            ) : (
              <span className="retro-section-fits">
                ✅ Fits in Viewport
              </span>
            )}
          </div>
          {sectionOverflows && (
            <div className="retro-section-hint">
              Scroll within section, then advance!
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};

export default RetroSidebar;