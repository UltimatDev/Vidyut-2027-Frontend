import React, { useEffect, useState } from 'react';
import './RitualLoader.css';

const AWAKENING_PHRASES = [
  'AWAKENING THE FLAME',
  'ALIGNING THE REALMS',
  'SUMMONING THE SPIRIT',
  'AWAKENING VIDYUT',
];

const RitualLoader = ({
  isSceneReady = false,
  logoSrc = null,
  onEnter,
}) => {
  const [progress, setProgress] = useState(0);
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [logoReady, setLogoReady] = useState(!logoSrc);
  const [logoFailed, setLogoFailed] = useState(false);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const [isUnmounted, setIsUnmounted] = useState(false);

  // Preload logoSrc and unblock even if browser doesn't fire onload for cached SVG
  useEffect(() => {
    if (!logoSrc) {
      setLogoReady(true);
      setLogoFailed(false);
      return;
    }

    let cancelled = false;
    setLogoReady(false);
    setLogoFailed(false);

    const img = new window.Image();
    img.src = logoSrc;

    const done = () => {
      if (!cancelled) setLogoReady(true);
    };

    const fail = () => {
      if (!cancelled) {
        setLogoFailed(true);
        setLogoReady(true);
      }
    };

    if (img.complete) {
      done();
    } else {
      img.onload = done;
      img.onerror = fail;
    }

    const safety = setTimeout(done, 1200);
    return () => {
      cancelled = true;
      clearTimeout(safety);
    };
  }, [logoSrc]);

  // Lock scroll while loader is visible
  useEffect(() => {
    if (isUnmounted) return;

    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }
    window.scrollTo(0, 0);

    const html = document.documentElement;
    const body = document.body;
    html.style.overflow = 'hidden';
    body.style.overflow = 'hidden';

    const preventScroll = (e) => e.preventDefault();
    window.addEventListener('wheel', preventScroll, { passive: false });
    window.addEventListener('touchmove', preventScroll, { passive: false });

    return () => {
      html.style.overflow = '';
      body.style.overflow = '';
      window.removeEventListener('wheel', preventScroll);
      window.removeEventListener('touchmove', preventScroll);
    };
  }, [isUnmounted]);

  const everythingReady = isSceneReady && logoReady;

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (!everythingReady) {
          const next = prev + (92 - prev) * 0.08;
          return Math.min(92, Math.round(next * 10) / 10);
        }
        if (prev < 100) {
          const next = Math.min(100, prev + 6);
          if (next >= 100) {
            setIsUnlocked(true);
            clearInterval(interval);
          }
          return next;
        }
        setIsUnlocked(true);
        clearInterval(interval);
        return 100;
      });
    }, 55);

    return () => clearInterval(interval);
  }, [everythingReady]);

  useEffect(() => {
    if (isUnlocked) return;
    const phraseTimer = setInterval(() => {
      setPhraseIndex((prev) => (prev + 1) % AWAKENING_PHRASES.length);
    }, 1100);
    return () => clearInterval(phraseTimer);
  }, [isUnlocked]);

  const handleEnterClick = () => {
    if (!isUnlocked || isExiting) return;
    setIsExiting(true);
    if (onEnter) onEnter();
    setTimeout(() => {
      setIsUnmounted(true);
    }, 650);
  };

  if (isUnmounted) return null;

  return (
    <div
      className={`ophanim-loader-overlay ${isUnlocked ? 'loader-ready' : ''} ${
        isExiting ? 'loader-exiting' : ''
      }`}
      onClick={handleEnterClick}
      role="button"
      tabIndex={0}
      aria-label={isUnlocked ? 'Click to Enter' : 'Awakening'}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') handleEnterClick();
      }}
    >
      <div className="ophanim-ambient-core" />

      <div className="ophanim-gimbal-stage" aria-hidden="true">
        <div className="ophanim-ring-plane plane-1">
          <svg className="ophanim-strip-svg" viewBox="0 0 400 400">
            <circle cx="200" cy="200" r="186" className="strip-hairline" />
            <circle cx="200" cy="200" r="180" className="strip-arc-bright" />
            <circle cx="200" cy="200" r="173" className="strip-ticks" />
          </svg>
        </div>

        <div className="ophanim-ring-plane plane-2">
          <svg className="ophanim-strip-svg" viewBox="0 0 400 400">
            <circle cx="200" cy="200" r="160" className="strip-arc-medium" />
            <circle cx="200" cy="200" r="153" className="strip-hairline" />
          </svg>
        </div>

        <div className="ophanim-ring-plane plane-3">
          <svg className="ophanim-strip-svg" viewBox="0 0 400 400">
            <circle cx="200" cy="200" r="136" className="strip-arc-bright" />
            <circle cx="200" cy="200" r="129" className="strip-ticks-fine" />
          </svg>
        </div>

        <div className="ophanim-eye-pupil">
          <div className="eye-halo-pulse" />
          {logoSrc && !logoFailed ? (
            <img
              src={logoSrc}
              alt="Vidyut"
              onLoad={() => setLogoReady(true)}
              onError={() => {
                setLogoFailed(true);
                setLogoReady(true);
              }}
              className="ophanim-center-logo"
            />
          ) : (
            <svg className="ophanim-fallback-crest" viewBox="0 0 160 160" fill="none">
              <path
                d="M14 80 Q80 22 146 80 Q80 138 14 80 Z"
                stroke="rgba(255, 255, 255, 0.72)"
                strokeWidth="1.5"
              />
              <circle
                cx="80"
                cy="80"
                r="28"
                stroke="rgba(255, 255, 255, 0.85)"
                strokeWidth="1.5"
              />
              <path
                d="M80 42 L90 74 L118 80 L90 86 L80 118 L70 86 L42 80 L70 74 Z"
                fill="#ffffff"
              />
            </svg>
          )}
        </div>
      </div>

      <div className="ophanim-status-block">
        {!isUnlocked ? (
          <>
            <p className="ophanim-awakening-text">{AWAKENING_PHRASES[phraseIndex]}</p>
            <div className="ophanim-progress-bar">
              <div
                className="ophanim-progress-fill"
                style={{ width: `${Math.round(progress)}%` }}
              />
            </div>
            <span className="ophanim-progress-num">{Math.round(progress)}%</span>
          </>
        ) : (
          <div className="ophanim-enter-prompt">
            <span className="enter-kicker">AWAKENING COMPLETE</span>
            <span className="enter-cta">CLICK TO ENTER</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default RitualLoader;