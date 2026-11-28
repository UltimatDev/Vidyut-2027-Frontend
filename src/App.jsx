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
  const [droneBlobUrl, setDroneBlobUrl] = useState(null);
  const [loadProgress, setLoadProgress] = useState(5);
  const [readyFlags, setReadyFlags] = useState({
    hero: false,
    downstreamMedia: false,
  });

  const handleHeroReady = useCallback(() => {
    setReadyFlags((prev) => ({ ...prev, hero: true }));
    setLoadProgress((prev) => Math.max(prev, 35));
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
    let createdBlobUrl = null;

    const verifyCriticalAssets = async () => {
      await new Promise((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(resolve))
      );

      // 1. Eager DOM images (Navbar logo, etc.)
      const eagerImages = Array.from(document.querySelectorAll('img')).filter(
        (img) => img.loading !== 'lazy'
      );

      const imgPromises = eagerImages.map((img) => {
        if (img.complete && img.naturalWidth > 0) return Promise.resolve();
        return new Promise((resolve) => {
          img.addEventListener('load', resolve, { once: true });
          img.addEventListener('error', resolve, { once: true });
        });
      });

      // 2. Stream /drone_8s.mp4 with real byte progress (35% -> 85%)
      const dronePromise = fetch('/drone_8s.mp4')
        .then(async (res) => {
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          const contentLength = Number(res.headers.get('content-length')) || 0;

          if (!res.body || !contentLength) {
            const blob = await res.blob();
            if (!cancelled) setLoadProgress((p) => Math.max(p, 85));
            return blob;
          }

          const reader = res.body.getReader();
          const chunks = [];
          let received = 0;

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            chunks.push(value);
            received += value.length;
            if (!cancelled) {
              const pct = 35 + Math.round((received / contentLength) * 50);
              setLoadProgress((p) => Math.max(p, Math.min(85, pct)));
            }
          }

          return new Blob(chunks, { type: 'video/mp4' });
        })
        .then((blob) => {
          if (!cancelled) {
            createdBlobUrl = URL.createObjectURL(blob);
            setDroneBlobUrl(createdBlobUrl);
          }
        })
        .catch((err) => console.warn('Drone video preload skipped:', err));

      // 3. Buffer /loop_video.mp4 (85% -> 95%)
      const loopPromise = new Promise((resolve) => {
        const vid = document.createElement('video');
        vid.preload = 'auto';
        vid.muted = true;
        vid.playsInline = true;
        vid.src = '/loop_video.mp4';

        const done = () => {
          vid.removeEventListener('canplaythrough', done);
          vid.removeEventListener('loadeddata', done);
          vid.removeEventListener('error', done);
          if (!cancelled) setLoadProgress((p) => Math.max(p, 95));
          resolve();
        };

        vid.addEventListener('canplaythrough', done, { once: true });
        vid.addEventListener('loadeddata', done, { once: true });
        vid.addEventListener('error', done, { once: true });
        vid.load();
      });

      const fontPromise = document.fonts ? document.fonts.ready : Promise.resolve();
      const emergencyTimeout = new Promise((resolve) => setTimeout(resolve, 25000));

      await Promise.race([
        Promise.all([...imgPromises, dronePromise, loopPromise, fontPromise]),
        emergencyTimeout,
      ]);

      if (!cancelled) {
        setLoadProgress(100);
        setReadyFlags((prev) => ({ ...prev, downstreamMedia: true }));
        ScrollTrigger.refresh();
      }
    };

    verifyCriticalAssets();

    return () => {
      cancelled = true;
      if (createdBlobUrl) URL.revokeObjectURL(createdBlobUrl);
    };
  }, []);

  const allReady = readyFlags.hero && readyFlags.downstreamMedia;

  return (
    <>
      <RitualLoader
        isSceneReady={allReady}
        progressValue={loadProgress}
        onEnter={() => setHasEntered(true)}
      />

      {/* Continuous 2.5D Logo Layer behind HeroParallax & ThemeSection */}
    
      <HeroParallax isActive={hasEntered} onReady={handleHeroReady} />

      <ThemeSection />

      {/* Solid background wrapper at z-index: 5 so downstream sections cleanly cover the fixed backdrop */}
      <div style={{ position: 'relative', zIndex: 5, backgroundColor: '#050505' }}>
        {allReady && (
          <div id="highlights" style={{ scrollMarginTop: '80px' }}>
            <HighlightsSection />
          </div>
        )}

        <div style={{ scrollMarginTop: '80px' }}>
          <RevelCRTStage
            droneSrc="/drone_8s.mp4"
            preloadedDroneUrl={droneBlobUrl}
            loopSrc="/loop_video.mp4"
            lineup={DEFAULT_REVEL_LINEUP}
          />
        </div>

        {allReady && (
          <>
            <ArcShowcaseSection
              id="revel"
              workshops={showcaseConfig.workshops}
              competitions={showcaseConfig.competitions}
            />

            <div id="gallery" style={{ scrollMarginTop: '80px' }}>
              <ElasticGallery />
            </div>
          </>
        )}
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