import React, { useState, useEffect, useCallback } from 'react';
import Story from './pages/Story';
import End from './pages/End';
import CityDetail from './pages/CityDetail';

import EnergyStation from './pages/EnergyStation';
import { EnergyProvider } from './context/EnergyContext';
import StarshipWidget from './components/game/StarshipWidget';
import Navbar from './components/Navbar';

import KeywordsParticle from './components/KeywordsParticle';
import PinkAnimationHome from './components/PinkAnimationHome';
import FirstsTimeline from './components/firsts/FirstsTimeline';
import HeroSection from './components/HeroSection';
import LettersModule from './components/letters/LettersModule';
import LettersIcon from './components/letters/LettersIcon';
import MusicPlayer from './components/MusicPlayer';
import InviteGate from './components/InviteGate';

export default function App() {
  const [page, setPage] = useState('home');
  const [selectedCity, setSelectedCity] = useState(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [activeTab, setActiveTab] = useState(window.innerWidth < 768 ? 'towhere' : 'keywords');
  const [showMobileNotice, setShowMobileNotice] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      // If we are on keywords and switch to mobile, move to towhere
      if (mobile && activeTab === 'keywords') {
        setActiveTab('towhere');
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [activeTab]);

  // Sync tab state with URL hash for reload persistence
  useEffect(() => {
    // 1. Handle Pathname for direct city links (e.g. /city/珠海)
    const path = decodeURIComponent(window.location.pathname);
    if (path.startsWith('/city/')) {
      const cityName = path.replace('/city/', '');
      if (cityName) {
        setSelectedCity(cityName);
        setPage('city');
      }
    }

    // 2. Handle Hash for tabs
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '');
      if (['keywords', 'towhere', 'breaking', 'letters'].includes(hash)) {
        // Prevent keyboards on mobile
        if (isMobile && hash === 'keywords') {
          setTabWithHash('towhere');
        } else {
          setActiveTab(hash);
        }
      }
    };

    // Initial load
    handleHashChange();

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [isMobile]);

  const setTabWithHash = useCallback((tab) => {
    window.location.hash = tab;
    setActiveTab(tab);
  }, []);

  const handleSetTab = useCallback((tab) => {
    setTabWithHash(tab);
  }, [setTabWithHash]);

  const goTo = useCallback((p) => setPage(p), []);

  const goToCity = useCallback((cityName) => {
    setSelectedCity(cityName);
    setPage('city');
  }, []);

  const goBackToGlobe = useCallback(() => {
    setSelectedCity(null);
    setPage('home');
    handleSetTab('towhere');
  }, [handleSetTab]);

  return (
    <InviteGate>
      <EnergyProvider>
        <div style={{ width: '100%', height: '100%', margin: 0, padding: 0 }}>
          {/* Mobile Notice Modal */}
          {showMobileNotice && isMobile && (
            <div style={{
              position: 'fixed',
              inset: 0,
              zIndex: 200000,
              backgroundColor: 'rgba(0, 0, 0, 0.8)',
              backdropFilter: 'blur(20px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '20px'
            }}>
              <div style={{
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '24px',
                padding: '40px 30px',
                textAlign: 'center',
                maxWidth: '320px',
                boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
                animation: 'modalIn 0.5s cubic-bezier(0.16, 1, 0.3, 1)'
              }}>
                <style>{`
                  @keyframes modalIn {
                    from { opacity: 0; transform: scale(0.9) translateY(20px); }
                    to { opacity: 1; transform: scale(1) translateY(0); }
                  }
                `}</style>
                <div style={{ fontSize: '48px', marginBottom: '20px' }}>📱</div>
                <p style={{
                  color: 'rgba(255, 255, 255, 0.9)',
                  fontSize: '16px',
                  lineHeight: '1.6',
                  marginBottom: '30px',
                  fontWeight: '300'
                }}>
                  手机端APP仍在开发中，<br />
                  当前版本只展示部分功能。<br />
                  想体验完整功能用电脑打开哦～
                </p>
                <button
                  onClick={() => setShowMobileNotice(false)}
                  style={{
                    background: 'linear-gradient(135deg, #ff9a9e 0%, #fad0c4 100%)',
                    border: 'none',
                    borderRadius: '50px',
                    padding: '12px 40px',
                    color: '#000',
                    fontSize: '15px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    boxShadow: '0 10px 20px rgba(255, 154, 158, 0.3)',
                    transition: 'all 0.3s ease'
                  }}
                  onMouseEnter={(e) => e.target.style.transform = 'scale(1.05)'}
                  onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
                >
                  我知道了
                </button>
              </div>
            </div>
          )}

          {/* Render home view if page is home OR city, to keep globe mounted */}
          {(page === 'home' || page === 'city') && (
            <div style={{ display: page === 'city' ? 'none' : 'block', width: '100%', height: '100%' }}>
              {!isMobile && (
                <>
                  <Navbar
                    activeTab={activeTab}
                    setTab={handleSetTab}
                    isMobile={isMobile}
                    isDarkMode={['letters'].includes(activeTab)}
                  />
                  <LettersIcon
                    onClick={() => handleSetTab('letters')}
                    active={activeTab === 'letters'}
                    isDarkMode={['letters'].includes(activeTab)}
                  />
                </>
              )}

              {isMobile && page === 'home' && (activeTab === 'towhere' || activeTab === 'breaking') && (
                <div
                  className="mobile-tab-toggle"
                  onClick={() => handleSetTab(activeTab === 'towhere' ? 'breaking' : 'towhere')}
                  style={{
                    position: 'fixed',
                    top: '20px',
                    left: '20px',
                    zIndex: 100000,
                    width: '40px',
                    height: '40px',
                    background: 'rgba(255, 255, 255, 0.15)',
                    backdropFilter: 'blur(8px)',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    cursor: 'pointer',
                    boxShadow: '0 4px 15px rgba(0,0,0,0.3)'
                  }}
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M2 12l5 5 5-5M22 12l-5-5-5 5" />
                    <line x1="2" y1="12" x2="22" y2="12" />
                  </svg>
                </div>
              )}

              <div className="page-content">
                {activeTab === 'keywords' && !isMobile && (
                  <div style={{
                    position: 'relative',
                    width: '100%',
                    height: '100vh',
                    overflow: 'hidden',
                    backgroundImage: `url(${import.meta.env.BASE_URL}images/Background.jpg)`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    backgroundRepeat: 'no-repeat'
                  }}>
                    {/* KeywordsParticle handles its own layering: Canvas at lowest, UI at highest */}
                    <KeywordsParticle />

                    {/* Middle layer: Interactive planets */}
                    <div style={{ position: 'absolute', inset: 0, zIndex: 10 }}>
                      <HeroSection goTo={goTo} />
                    </div>
                  </div>
                )}
                {activeTab === 'towhere' && <PinkAnimationHome goTo={goTo} goToCity={goToCity} isCityMode={page === 'city'} />}
                {activeTab === 'breaking' && <FirstsTimeline />}
                {activeTab === 'letters' && !isMobile && <LettersModule />}
              </div>
              {activeTab === 'keywords' && !isMobile && (
                <StarshipWidget />
              )}
            </div>
          )}

          {page === 'story' && <Story goTo={goTo} />}
          {page === 'end' && <End goTo={goTo} />}

          {/* CityDetail renders on top, Globe continues to exist hidden */}
          {page === 'city' && selectedCity && (
            <div style={{ position: 'absolute', top: 0, left: 0, width: '100vw', height: '100vh', zIndex: 9999, background: 'linear-gradient(135deg, #0a0f1a 0%, #0d1525 40%, #111d35 100%)' }}>
              <CityDetail cityName={selectedCity} goBack={goBackToGlobe} />
            </div>
          )}

          {page === 'annual' && <EnergyStation goTo={goTo} />}
          <MusicPlayer />
        </div>
      </EnergyProvider>
    </InviteGate>
  );
}