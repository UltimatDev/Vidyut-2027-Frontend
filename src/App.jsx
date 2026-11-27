import React, { useCallback, useEffect, useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import RitualLoader from './RitualLoader';
import VidyutLogoBackdrop from './VidyutLogoBackdrop';
import HeroParallax from './HeroParallax';
import Navbar from './Navbar';
import ThemeSection from './ThemeSection';
import HighlightsSection from './components/HighlightsSection';
import ElasticGallery from './components/gallery/ElasticGallery';
import RevelCrtStage from './RevelCRTStage';
import { DEFAULT_REVEL_LINEUP } from './revelLineupConfig';
import ArcShowcaseSection from './components/ArcShowcaseSection';
import { showcaseConfig } from './components/showcaseConfig';
import Footer from './components/Footer/Footer';

import vidyutLogo from './logo.svg';

gsap.registerPlugin(ScrollTrigger);

function HomePage() {
  const [hasEntered, setHasEntered] = useState(false);
  const [readyFlags, setReadyFlags] = useState({
    hero: false,
    downstreamMedia: false,
  });

  const handleHeroReady = useCallback(() => {
    setReadyFlags((prev) => ({ ...prev, hero: true }));
  }, []);

  // Re-measure all GSAP ScrollTriggers once RitualLoader unlocks page scroll
  useEffect(() => {
    if (!hasEntered) return;
    const timer = setTimeout(() => {
      ScrollTrigger.refresh();
    }, 150);
    return () => clearTimeout(timer);
  }, [hasEntered]);

  useEffect(() => {
    let cancelled = false;

    const verifyDownstreamAssets = async () => {
      await new Promise((resolve) => requestAnimationFrame(resolve));

      const domImages = Array.from(document.querySelectorAll('img')).filter(
        (img) => img.loading !== 'lazy'
      );

      const imgPromises = domImages.map((img) => {
        if (img.complete && img.naturalWidth > 0) return Promise.resolve();
        return new Promise((resolve) => {
          img.addEventListener('load', resolve, { once: true });
          img.addEventListener('error', resolve, { once: true });
        });
      });

      const videoSources = ['/drone_8s.mp4', '/loop_video.mp4'];
      const videoPromises = videoSources.map(
        (src) =>
          new Promise((resolve) => {
            const vid = document.createElement('video');
            vid.preload = 'metadata';
            vid.muted = true;
            vid.src = src;
            vid.addEventListener('loadedmetadata', resolve, { once: true });
            vid.addEventListener('error', resolve, { once: true });
          })
      );

      const fontPromise = document.fonts ? document.fonts.ready : Promise.resolve();
      const timeoutPromise = new Promise((resolve) => setTimeout(resolve, 2800));

      await Promise.race([
        Promise.all([...imgPromises, ...videoPromises, fontPromise]),
        timeoutPromise,
      ]);

      if (!cancelled) {
        setReadyFlags((prev) => ({ ...prev, downstreamMedia: true }));
      }
    };

    verifyDownstreamAssets();

    return () => {
      cancelled = true;
    };
  }, []);

  const allReady = readyFlags.hero && readyFlags.downstreamMedia;

  return (
    <>
      <RitualLoader
        isSceneReady={allReady}
        logoSrc={vidyutLogo}
        onEnter={() => setHasEntered(true)}
      />

      {/* Continuous 2.5D Logo Layer behind HeroParallax & ThemeSection */}
      <VidyutLogoBackdrop logoSrc={vidyutLogo} />

      <HeroParallax isActive={hasEntered} onReady={handleHeroReady} />

      <ThemeSection />

      {/* Solid background wrapper at z-index: 5 so downstream sections cleanly cover the fixed backdrop */}
      <div style={{ position: 'relative', zIndex: 5, backgroundColor: '#050505' }}>
        <div id="highlights" style={{ scrollMarginTop: '80px' }}>
          <HighlightsSection />
        </div>

        <div id="autoexpo" style={{ scrollMarginTop: '80px' }}>
          <ElasticGallery />
        </div>

        <div id="revel" style={{ scrollMarginTop: '80px' }}>
          <RevelCrtStage
            droneSrc="/drone_8s.mp4"
            loopSrc="/loop_video.mp4"
            holeLeft={4}
            holeTop={13}
            holeWidth={72}
            holeHeight={77}
            lineup={DEFAULT_REVEL_LINEUP}
          />
        </div>

        <ArcShowcaseSection
          workshops={showcaseConfig.workshops}
          competitions={showcaseConfig.competitions}
        />
      </div>
    </>
  );
}

function BlankPage({ title }) {
  return (
    <main
      style={{
        minHeight: '100vh',
        background: '#0a0a0a',
        color: '#fff',
        display: 'grid',
        placeItems: 'center',
      }}
    >
      <h1>{title}</h1>
    </main>
  );
}

function App() {
  return (
    <>
      <Navbar />

      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/about" element={<BlankPage title="About" />} />
        <Route path="/workshops" element={<BlankPage title="Workshops" />} />
        <Route path="/competitions" element={<BlankPage title="Competitions" />} />
        <Route path="/register" element={<BlankPage title="Register" />} />
      </Routes>

      <Footer />
    </>
  );
}

export default App;