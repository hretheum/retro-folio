import React, { useState, useRef, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Canvas } from '@react-three/fiber';
import Hero from './components/Hero';
import Navigation from './components/Navigation';
import Leadership from './components/Leadership';
import Work from './components/Work';
import Timeline from './components/Timeline';
import Experiments from './components/Experiments';
import Contact from './components/Contact';
import Guestbook from './components/Guestbook';
import Scene3D from './components/Scene3D';
import SaturnCursor from './components/SaturnCursor';
import Portfolio from './pages/Portfolio';
import CaseStudy from './pages/CaseStudy';
import ExperimentDetail from './pages/ExperimentDetail';
import Admin from './pages/Admin';
import AppLayout from './components/AppLayout';
import LoadingScreen from './components/LoadingScreen';
import RetroSidebar from './components/RetroSidebar';
import ScrollProgressBar from './components/ScrollProgressBar';
import SectionNavigator from './components/SectionNavigator';
import ScrollInstructions from './components/ScrollInstructions';
import FloatingElements from './components/FloatingElements';
import SectionContent from './components/SectionContent';
import HamburgerMenu from './components/HamburgerMenu';
import { useScrollNavigation } from './hooks/useScrollNavigation';
import { AuthProvider, useAuth, LoginPage } from './components/AuthWrapper';

function MainApp() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isLoaded, setIsLoaded] = useState(false);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const sectionsRef = useRef<HTMLDivElement[]>([]);
  const sectionContainerRef = useRef<HTMLDivElement>(null);

  const sections = [
    { component: Hero, name: 'Home' },
    { component: Leadership, name: 'About Me' },
    { component: Work, name: 'My Work' },
    { component: Timeline, name: 'Timeline' },
    { component: Experiments, name: 'Cool Stuff' },
    { component: Guestbook, name: 'Guestbook' },
    { component: Contact, name: 'Contact' }
  ];

  // Use scroll navigation hook
  const {
    currentSection,
    scrollProgress,
    isTransitioning,
    sectionScrollPosition,
    sectionOverflows,
    handleSectionChange
  } = useScrollNavigation({
    totalSections: sections.length,
    sectionContainerRef,
    sectionsRef
  });

  useEffect(() => {

    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({
        x: (e.clientX / window.innerWidth) * 2 - 1,
        y: -(e.clientY / window.innerHeight) * 2 + 1
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    
    // Loading animation
    setTimeout(() => setIsLoaded(true), 1000);

    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);




  return (
    <div 
      ref={containerRef}
      className="retro-container"
    >
      {/* Saturn Cursor Trail */}
      <SaturnCursor />

      {/* Retro Background Pattern */}
      <div className="retro-bg-pattern" />

      {/* Mobile Hamburger Menu */}
      <HamburgerMenu 
        currentSection={currentSection}
        onSectionChange={handleSectionChange}
        sections={sections.map(s => s.name)}
      />

      {/* 3D Background Scene (Hidden but still functional) */}
      <div className="fixed inset-0 z-0 opacity-0">
        <Canvas camera={{ position: [0, 0, 8], fov: 75 }}>
          <Scene3D mousePosition={mousePosition} currentSection={currentSection} />
        </Canvas>
      </div>

      {/* Loading Screen */}
      <LoadingScreen isLoaded={isLoaded} />

      {/* Main Container */}
      <AppLayout onSectionChange={handleSectionChange}>

        {/* Navigation */}
        <Navigation 
          currentSection={currentSection}
          onSectionChange={handleSectionChange}
          sections={sections.map(s => s.name)}
        />

        {/* Layout wrapper for sidebar and content */}
        <div className="retro-layout-wrapper">
          {/* Sidebar */}
          <RetroSidebar
            currentSection={currentSection}
            sectionNames={sections.map(s => s.name)}
            sectionOverflows={sectionOverflows}
            onSectionChange={handleSectionChange}
          />

          {/* Main Content with Scrollable Container */}
          <SectionContent
            sections={sections}
            currentSection={currentSection}
            sectionsRef={sectionsRef}
            sectionContainerRef={sectionContainerRef}
            onSectionChange={handleSectionChange}
          />
        </div>

      </AppLayout>

      {/* Scroll Progress Indicator */}
      <ScrollProgressBar
        scrollProgress={scrollProgress}
        isTransitioning={isTransitioning}
        sectionOverflows={sectionOverflows}
        currentSection={currentSection}
        totalSections={sections.length}
        sectionScrollProgress={sectionsRef.current[currentSection] && sectionContainerRef.current
          ? sectionScrollPosition / Math.max(1, sectionsRef.current[currentSection].scrollHeight - window.innerHeight)
          : 0
        }
      />

      {/* Section Navigator */}
      <SectionNavigator
        sections={sections}
        currentSection={currentSection}
        isTransitioning={isTransitioning}
        sectionOverflows={sectionOverflows}
        onSectionChange={handleSectionChange}
      />

      {/* Scroll Instructions */}
      <ScrollInstructions
        currentSection={currentSection}
        isTransitioning={isTransitioning}
        scrollProgress={scrollProgress}
      />



      {/* Floating Retro Elements */}
      <FloatingElements />
    </div>
  );
}

// Protected Route component
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<MainApp />} />
          <Route path="/portfolio" element={<Portfolio />} />
          <Route path="/case/:caseId" element={<CaseStudy />} />
          <Route path="/experiment/:experimentId" element={<ExperimentDetail />} />
          <Route path="/login" element={
            <LoginPage 
              allowedEmails={
                import.meta.env.VITE_ALLOWED_EMAILS 
                  ? import.meta.env.VITE_ALLOWED_EMAILS.split(',').map(e => e.trim())
                  : []
              } 
            />
          } />
          <Route 
            path="/admin" 
            element={
              <ProtectedRoute>
                <Admin />
              </ProtectedRoute>
            } 
          />
          <Route path="*" element={<MainApp />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;