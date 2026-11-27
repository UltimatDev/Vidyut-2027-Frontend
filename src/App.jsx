import React, { useCallback, useEffect, useState } from 'react';
import RitualLoader from './RitualLoader';
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

// Optional: point to your Vidyut logo asset (or pass null for the built-in crest)
import vidyutLogo from '/logo.svg';

function App() {
  const [hasEntered, setHasEntered] = useState(false);
  const [readyFlags, setReadyFlags] = useState({
    hero: false,
    downstreamMedia: false,
  });

  const handleHeroReady = useCallback(() => {
    setReadyFlags((prev) => ({ ...prev, hero: true }));
  }, []);

  // Automatically verifies downstream images, fonts, and Revel CRT video headers without editing child components
  useEffect(() => {
    let cancelled = false;

    const verifyDownstreamAssets = async () => {
      // Wait one frame for all child sections to mount into the DOM
      await new Promise((resolve) => requestAnimationFrame(resolve));

      // 1. Wait for all above-the-fold & eager <img> elements in downstream sections
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

      // 2. Warm up RevelCrtStage video metadata (/drone_8s.mp4 & /loop_video.mp4)
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

      // Cap wait at 2.8s so slow network videos never block the user from entering
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

      <Navbar />

      <HeroParallax
        isActive={hasEntered}
        onReady={handleHeroReady}
      />

      <ThemeSection />
      <HighlightsSection />
      <ElasticGallery />
      <RevelCrtStage
        droneSrc="/drone_8s.mp4"
        loopSrc="/loop_video.mp4"
        holeLeft={4}
        holeTop={13}
        holeWidth={72}
        holeHeight={77}
        lineup={DEFAULT_REVEL_LINEUP}
      />
      <ArcShowcaseSection
        workshops={showcaseConfig.workshops}
        competitions={showcaseConfig.competitions}
      />
      <Footer />
    </>
  );
}

export default App;