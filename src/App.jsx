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
import RevelCRTStage from './RevelCRTStage';
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

  // Re-measure ScrollTriggers once RitualLoader unlocks and layout settles
  useEffect(() => {
    if (!hasEntered) return;
    const timer = setTimeout(() => {
      ScrollTrigger.refresh();
    }, 200);
    return () => clearTimeout(timer);
  }, [hasEntered]);

  useEffect(() => {
    let cancelled = false;

    const verifyDownstreamAssets = async () => {
      // Wait 2 animation frames so all mounted <img> elements are in the DOM
      await new Promise((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(resolve))
      );

      // 1. Explicitly preload & decode the Vidyut SVG logo
      const logoPromise = new Promise((resolve) => {
        const logoImg = new Image();
        logoImg.decoding = 'async';
        logoImg.src = vidyutLogo;
        if (logoImg.complete && logoImg.naturalWidth > 0) {
          logoImg.decode ? logoImg.decode().catch(() => {}).finally(resolve) : resolve();
        } else {
          logoImg.onload = () => {
            logoImg.decode ? logoImg.decode().catch(() => {}).finally(resolve) : resolve();
          };
          logoImg.onerror = resolve;
        }
      });

      // 2. Non-lazy DOM images
      const domImages = Array.from(document.querySelectorAll('img')).filter(
        (img) => img.loading !== 'lazy'
      );

      const imgPromises = domImages.map((img) => {
        if (img.complete && img.naturalWidth > 0) {
          return img.decode ? img.decode().catch(() => {}) : Promise.resolve();
        }
        return new Promise((resolve) => {
          const done = () => {
            img.removeEventListener('load', done);
            img.removeEventListener('error', done);
            if (img.decode) {
              img.decode().catch(() => {}).finally(resolve);
            } else {
              resolve();
            }
          };
          img.addEventListener('load', done, { once: true });
          img.addEventListener('error', done, { once: true });
        });
      });

      // 3. Preload & buffer drone and loop videos before unlocking loader
      const preloadVideos = ['/drone_8s.mp4', '/loop_video.mp4'].map((src) => {
        return new Promise((resolve) => {
          const vid = document.createElement('video');
          vid.preload = 'auto';
          vid.muted = true;
          vid.playsInline = true;
          vid.src = src;

          const done = () => {
            vid.removeEventListener('canplaythrough', done);
            vid.removeEventListener('error', done);
            resolve();
          };

          vid.addEventListener('canplaythrough', done, { once: true });
          vid.addEventListener('error', done, { once: true });
          vid.load();
        });
      });

      // 4. Web fonts
      const fontPromise = document.fonts ? document.fonts.ready : Promise.resolve();

      // Safety cap so slower connections finish buffering videos without hanging forever
      const timeoutPromise = new Promise((resolve) => setTimeout(resolve, 8500));

      await Promise.race([
        Promise.all([logoPromise, ...imgPromises, ...preloadVideos, fontPromise]),
        timeoutPromise,
      ]);

      if (!cancelled) {
        setReadyFlags((prev) => ({ ...prev, downstreamMedia: true }));
        ScrollTrigger.refresh();
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

        <div style={{ scrollMarginTop: '80px' }}>
          <RevelCRTStage
            droneSrc="/drone_8s.mp4"
            loopSrc="/loop_video.mp4"
            lineup={DEFAULT_REVEL_LINEUP}
          />
        </div>

        <ArcShowcaseSection
          id="revel"
          workshops={showcaseConfig.workshops}
          competitions={showcaseConfig.competitions}
        />

        <div id="gallery" style={{ scrollMarginTop: '80px' }}>
          <ElasticGallery />
        </div>
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