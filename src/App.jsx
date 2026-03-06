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
  const [activeTab, setActiveTab] = useState('keywords');

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
        setActiveTab(hash);
      }
    };

    // Initial load
    handleHashChange();

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const handleSetTab = useCallback((tab) => {
    window.location.hash = tab;
    setActiveTab(tab);
  }, []);

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
          {/* Render home view if page is home OR city, to keep globe mounted */}
          {(page === 'home' || page === 'city') && (
            <div style={{ display: page === 'city' ? 'none' : 'block', width: '100%', height: '100%' }}>
              <Navbar
                activeTab={activeTab}
                setTab={handleSetTab}
                isDarkMode={['letters'].includes(activeTab)}
              />
              <LettersIcon
                onClick={() => handleSetTab('letters')}
                active={activeTab === 'letters'}
                isDarkMode={['letters'].includes(activeTab)}
              />
              <div className="page-content">
                {activeTab === 'keywords' && (
                  <div style={{
                    position: 'relative',
                    width: '100%',
                    height: '100vh',
                    overflow: 'hidden',
                    backgroundImage: 'url(/images/Background.jpg)',
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
                {activeTab === 'letters' && <LettersModule />}
              </div>
              {activeTab === 'keywords' && (
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