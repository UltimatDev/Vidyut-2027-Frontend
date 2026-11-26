import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import './HeroParallax.css';

import skyImg from './assets/sky.png';
import mountainTheyyamImg from './assets/MOUNTAIN with theyam.png';
import theyyamCharacterImg from './assets/web.png';

// ============================================================================
// EASY AUDIO & LOGO SWAP:
// Drop your .mp3/.wav or logo .png/.svg in src/assets/ and import them here:
import customImpactAudio from './assets/slam.mp3';
import customVidyutLogo from './logo.png';
// ============================================================================
//const customImpactAudio = null;
//const customVidyutLogo = null;

const LOADER_WORDS = [
  'FLAME',
  'BRIGHT',
  'SPARK',
  'ROAR',
  'FURY',
  'PULSE',
  'RISE',
  'LIGHT',
  'POWER',
  'SPIRIT',
  'THUNDER',
  'CHANGE',
];

const TUNNEL_RINGS = [
  {
    id: 'r1',
    radius: 112,
    text: 'VIDYUT • '.repeat(8),
    fontSize: 16,
    className: 'ring-cw-fast',
  },
  {
    id: 'r2',
    radius: 168,
    text: 'VIDYUT • '.repeat(10),
    fontSize: 21,
    className: 'ring-ccw-med',
  },
  {
    id: 'r3',
    radius: 232,
    text: 'VIDYUT • '.repeat(12),
    fontSize: 27,
    className: 'ring-cw-slow',
  },
  {
    id: 'r4',
    radius: 304,
    text: 'VIDYUT • '.repeat(13),
    fontSize: 33,
    className: 'ring-ccw-slow',
  },
  {
    id: 'r5',
    radius: 384,
    text: 'VIDYUT • '.repeat(14),
    fontSize: 40,
    className: 'ring-cw-med',
  },
  {
    id: 'r6',
    radius: 472,
    text: 'VIDYUT • '.repeat(15),
    fontSize: 47,
    className: 'ring-ccw-fast',
  },
];

const SUBTITLE_DEFAULT = 'NATIONAL LEVEL MULTIFEST';
const SUBTITLE_HOVER = 'BE THE CHANGE';
const SCRAMBLE_GLYPHS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789•⚡';

const ScrambleSubtitle = ({ isHovered }) => {
  const [displayText, setDisplayText] = useState(SUBTITLE_DEFAULT);
  const rafRef = useRef(null);

  useEffect(() => {
    const targetText = isHovered ? SUBTITLE_HOVER : SUBTITLE_DEFAULT;
    let frame = 0;
    const totalFrames = 18;

    const step = () => {
      frame += 1;
      const progress = frame / totalFrames;
      const revealCount = Math.floor(progress * targetText.length);

      let nextStr = '';
      for (let i = 0; i < targetText.length; i++) {
        if (targetText[i] === ' ') {
          nextStr += ' ';
        } else if (i < revealCount) {
          nextStr += targetText[i];
        } else {
          nextStr += SCRAMBLE_GLYPHS[Math.floor(Math.random() * SCRAMBLE_GLYPHS.length)];
        }
      }

      setDisplayText(nextStr);

      if (frame < totalFrames) {
        rafRef.current = requestAnimationFrame(step);
      } else {
        setDisplayText(targetText);
      }
    };

    cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(step);

    return () => cancelAnimationFrame(rafRef.current);
  }, [isHovered]);

  return (
    <p className={`vidyut-top-subtitle ${isHovered ? 'subtitle-energized' : ''}`}>
      {displayText}
    </p>
  );
};

const InteractiveVidyutTitle = ({ text = 'VIDYUT' }) => {
  const [hoveredIdx, setHoveredIdx] = useState(null);
  const letterRefs = useRef([]);

  const handleLetterMove = (e, idx) => {
    const el = letterRefs.current[idx];
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const normX = (x - rect.width / 2) / (rect.width / 2);
    const normY = (y - rect.height / 2) / (rect.height / 2);

    el.style.setProperty('--lx', `${x}px`);
    el.style.setProperty('--ly', `${y}px`);
    el.style.transform = `translate3d(${normX * 8}px, ${-12 + normY * 5}px, 28px) rotateZ(${
      normX * 3.5
    }deg) scale(1.08)`;
  };

  const handleLetterLeave = (idx) => {
    const el = letterRefs.current[idx];
    if (el) el.style.transform = '';
    setHoveredIdx(null);
  };

  return (
    <h1 className="vidyut-main-title" aria-label={text}>
      {text.split('').map((char, idx) => {
        const dist = hoveredIdx !== null ? Math.abs(hoveredIdx - idx) : null;
        const neighborClass =
          dist === 1 ? 'letter-neighbor-1' : dist === 2 ? 'letter-neighbor-2' : '';

        return (
          <span
            key={idx}
            ref={(el) => (letterRefs.current[idx] = el)}
            className={`vidyut-char ${hoveredIdx === idx ? 'letter-active' : ''} ${neighborClass}`}
            data-char={char}
            style={{ '--char-index': idx }}
            onMouseEnter={() => setHoveredIdx(idx)}
            onMouseMove={(e) => handleLetterMove(e, idx)}
            onMouseLeave={() => handleLetterLeave(idx)}
          >
            {char}
          </span>
        );
      })}
    </h1>
  );
};

const playSynthesizedGroundSlam = (sharedAudioCtx) => {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = sharedAudioCtx || new AudioCtx();
    if (ctx.state === 'suspended') {
      ctx.resume();
    }

    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const oscGain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(140, now);
    osc.frequency.exponentialRampToValueAtTime(24, now + 0.55);

    oscGain.gain.setValueAtTime(0.95, now);
    oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.75);

    osc.connect(oscGain);
    oscGain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.78);

    const bufferSize = ctx.sampleRate * 0.7;
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = ctx.createBufferSource();
    noise.buffer = noiseBuffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(280, now);
    filter.frequency.exponentialRampToValueAtTime(48, now + 0.65);

    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.65, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.68);

    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(ctx.destination);
    noise.start(now);
  } catch {
    // Ignore audio errors
  }
};

const getTargetDate = () => {
  const now = new Date();
  let year = now.getFullYear();
  const candidate = new Date(`${year}-01-22T00:00:00`);
  if (now >= candidate) {
    year += 1;
  }
  return new Date(`${year}-01-22T00:00:00`).getTime();
};

const PACKED_ORBIT_PHRASE =
  'JAN 22 • 23 • 24 • JAN 22 • 23 • 24 • JAN 22 • 23 • 24 • JAN 22 • 23 • 24 • ';

const HeroParallax = ({
  targetTimestamp = getTargetDate(),
  impactSound = customImpactAudio,
  impactVolume = 0.9,
  logoSrc = customVidyutLogo,
}) => {
  const [wordIndex, setWordIndex] = useState(0);
  const [loadProgress, setLoadProgress] = useState(0);
  const [isLogoReady, setIsLogoReady] = useState(!logoSrc);
  const [isReadyToEnter, setIsReadyToEnter] = useState(false);
  const [isExitingLoader, setIsExitingLoader] = useState(false);
  const [hasEntered, setHasEntered] = useState(false);

  const [isCharacterHovered, setIsCharacterHovered] = useState(false);
  const isCharacterHoveredRef = useRef(false);

  const runwayRef = useRef(null);
  const skyRef = useRef(null);
  const mountainRef = useRef(null);
  const heatHazeLayerRef = useRef(null);
  const characterLayerRef = useRef(null);
  const characterSkirtSwayRef = useRef(null);
  const characterAuraRef = useRef(null);
  const sunPulseAuraRef = useRef(null);
  const titleLayerRef = useRef(null);
  const countdownLayerRef = useRef(null);
  const scrollCueRef = useRef(null);
  const blankVeilRef = useRef(null);
  const dockRef = useRef(null);
  const canvasRef = useRef(null);
  const turbulenceRef = useRef(null);
  const clothTurbulenceRef = useRef(null);

  const orbitPlaneContainerRef = useRef(null);
  const frontSvgRef = useRef(null);
  const frontRingRef = useRef(null);
  const frontCometTrailRef = useRef(null);
  const frontCometHeadRef = useRef(null);
  const ribbonCharRefs = useRef([]);

  const ribbonChars = useMemo(() => PACKED_ORBIT_PHRASE.split(''), []);

  const scrollTarget = useRef(0);
  const scrollCurrent = useRef(0);
  const mouseTarget = useRef({ x: 0, y: 0 });
  const mouseCurrent = useRef({ x: 0, y: 0 });

  const orbitAngleRef = useRef(0);
  const orbitSpeedCurrentRef = useRef(0.0065);
  const characterShineCurrentRef = useRef(0);
  const cometAngleRef = useRef(0.2);

  const shockwaveBurstRef = useRef(false);
  const figureEdgeBurstRef = useRef(false);

  const audioRef = useRef(null);
  const audioCtxRef = useRef(null);

  const [timeLeft, setTimeLeft] = useState({
    days: '00',
    hours: '00',
    minutes: '00',
    seconds: '00',
  });

  // 0. Always Reset Scroll to Top on Refresh & Strictly Lock Scroll Until Entered
  useEffect(() => {
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }
    window.scrollTo(0, 0);

    const handleBeforeUnload = () => {
      window.scrollTo(0, 0);
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);

  useEffect(() => {
    const html = document.documentElement;
    const body = document.body;

    if (!hasEntered) {
      window.scrollTo(0, 0);
      html.style.overflow = 'hidden';
      body.style.overflow = 'hidden';
      body.style.position = 'fixed';
      body.style.top = '0';
      body.style.left = '0';
      body.style.width = '100%';
      body.style.height = '100%';

      const preventScrollEvent = (e) => {
        e.preventDefault();
      };
      const preventScrollKeys = (e) => {
        const scrollKeys = ['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End', ' '];
        if (scrollKeys.includes(e.key) && !isReadyToEnter) {
          e.preventDefault();
        }
      };

      window.addEventListener('wheel', preventScrollEvent, { passive: false });
      window.addEventListener('touchmove', preventScrollEvent, { passive: false });
      window.addEventListener('keydown', preventScrollKeys);

      return () => {
        window.removeEventListener('wheel', preventScrollEvent);
        window.removeEventListener('touchmove', preventScrollEvent);
        window.removeEventListener('keydown', preventScrollKeys);
      };
    } else {
      html.style.overflow = '';
      body.style.overflow = '';
      body.style.position = '';
      body.style.top = '';
      body.style.left = '';
      body.style.width = '';
      body.style.height = '';
      window.scrollTo(0, 0);
    }
  }, [hasEntered, isReadyToEnter]);

  // 1A. High-Priority Logo Decode First so Loader Visuals Never Pop In Late
  useEffect(() => {
    if (!logoSrc) {
      setIsLogoReady(true);
      return;
    }

    let cancelled = false;
    const preloadLink = document.createElement('link');
    preloadLink.rel = 'preload';
    preloadLink.as = 'image';
    preloadLink.href = logoSrc;
    document.head.appendChild(preloadLink);

    const decodeLogo = async () => {
      const img = new Image();
      img.src = logoSrc;
      try {
        if (img.decode) {
          await img.decode();
        } else {
          await new Promise((res) => {
            img.onload = res;
            img.onerror = res;
          });
        }
      } catch {
        // Proceed gracefully
      }
      if (!cancelled) {
        setIsLogoReady(true);
      }
    };

    decodeLogo();

    return () => {
      cancelled = true;
      if (preloadLink.parentNode) {
        preloadLink.parentNode.removeChild(preloadLink);
      }
    };
  }, [logoSrc]);

  // 1B. GPU Image Decode + Font Ready + Kinetic "BE THE ______" Loader
  useEffect(() => {
    if (!isLogoReady) return;

    let isCancelled = false;
    let assetsDecoded = false;

    const preloadAndDecodeAll = async () => {
      const imageSources = [skyImg, mountainTheyyamImg, theyyamCharacterImg];

      const imagePromises = imageSources.map(async (src) => {
        const img = new Image();
        img.src = src;
        try {
          if (img.decode) {
            await img.decode();
          } else {
            await new Promise((res) => {
              img.onload = res;
              img.onerror = res;
            });
          }
        } catch {
          // Proceed gracefully
        }
      });

      const fontPromise = document.fonts ? document.fonts.ready : Promise.resolve();

      let audioPromise = Promise.resolve();
      if (impactSound) {
        const audio = new Audio(impactSound);
        audio.volume = Math.max(0, Math.min(impactVolume, 1));
        audio.preload = 'auto';
        audioRef.current = audio;
        audioPromise = new Promise((res) => {
          audio.addEventListener('canplaythrough', res, { once: true });
          audio.addEventListener('error', res, { once: true });
          setTimeout(res, 1500);
        });
      }

      await Promise.all([...imagePromises, fontPromise, audioPromise]);
      if (!isCancelled) {
        assetsDecoded = true;
      }
    };

    preloadAndDecodeAll();

    let tickCount = 0;
    const minTicks = 18;
    const interval = setInterval(() => {
      if (isCancelled) return;
      tickCount += 1;

      if (!assetsDecoded || tickCount < minTicks) {
        const rawPct = assetsDecoded
          ? Math.round((tickCount / minTicks) * 100)
          : Math.min(94, Math.round((tickCount / (minTicks + 8)) * 94));
        setLoadProgress(rawPct);
        setWordIndex(tickCount % (LOADER_WORDS.length - 1));
      } else {
        setLoadProgress(100);
        setWordIndex(LOADER_WORDS.length - 1);
        setIsReadyToEnter(true);
        clearInterval(interval);
      }
    }, 105);

    return () => {
      isCancelled = true;
      clearInterval(interval);
    };
  }, [isLogoReady, impactSound, impactVolume]);

  // Handle Click on "CLICK TO / BE THE CHANGE"
  const handleStartWebsite = () => {
    if (!isReadyToEnter || isExitingLoader || hasEntered) return;

    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx && !audioCtxRef.current) {
        audioCtxRef.current = new AudioCtx();
      }
      if (audioCtxRef.current && audioCtxRef.current.state === 'suspended') {
        audioCtxRef.current.resume();
      }
    } catch {
      // Fallback
    }

    if (audioRef.current) {
      audioRef.current
        .play()
        .then(() => {
          audioRef.current.pause();
          audioRef.current.currentTime = 0;
        })
        .catch(() => {});
    }

    setIsExitingLoader(true);
    setHasEntered(true);

    setTimeout(() => {
      shockwaveBurstRef.current = true;

      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate([45, 25, 95]);
      }

      if (audioRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current.play().catch(() => {});
      } else {
        playSynthesizedGroundSlam(audioCtxRef.current);
      }
    }, 380);
  };

  // Character Hover / Touch Handlers
  const handleCharacterMouseEnter = useCallback(() => {
    setIsCharacterHovered(true);
    isCharacterHoveredRef.current = true;
    figureEdgeBurstRef.current = true;
  }, []);

  const handleCharacterMouseLeave = useCallback(() => {
    setIsCharacterHovered(false);
    isCharacterHoveredRef.current = false;
  }, []);

  // Countdown Timer
  useEffect(() => {
    const updateTimer = () => {
      const diff = Math.max(targetTimestamp - Date.now(), 0);
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((diff / 1000 / 60) % 60);
      const seconds = Math.floor((diff / 1000) % 60);

      setTimeLeft({
        days: String(days).padStart(2, '0'),
        hours: String(hours).padStart(2, '0'),
        minutes: String(minutes).padStart(2, '0'),
        seconds: String(seconds).padStart(2, '0'),
      });
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [targetTimestamp]);

  // Cursor Tracking
  useEffect(() => {
    const handlePointerMove = (e) => {
      const px = e.clientX / window.innerWidth;
      const py = e.clientY / window.innerHeight;
      mouseTarget.current = { x: (px - 0.5) * 2, y: (py - 0.5) * 2 };
    };

    const handleMouseLeave = () => {
      mouseTarget.current = { x: 0, y: 0 };
    };

    window.addEventListener('pointermove', handlePointerMove, { passive: true });
    document.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, []);

  // Main 60fps Engine
  useEffect(() => {
    if (!hasEntered) return;

    const handleScroll = () => {
      if (!runwayRef.current) return;
      const rect = runwayRef.current.getBoundingClientRect();
      const scrollableDistance = rect.height - window.innerHeight;
      if (scrollableDistance <= 0) return;

      const rawProgress = -rect.top / scrollableDistance;
      scrollTarget.current = Math.max(0, Math.min(rawProgress, 1));
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let rafId;
    const startTime = performance.now();

    const tick = (now) => {
      const elapsed = (now - startTime) * 0.001;

      scrollCurrent.current += (scrollTarget.current - scrollCurrent.current) * 0.095;
      const p = scrollCurrent.current;

      const cur = mouseCurrent.current;
      const tgt = mouseTarget.current;
      cur.x += (tgt.x - cur.x) * 0.07;
      cur.y += (tgt.y - cur.y) * 0.07;

      const hoverTarget = isCharacterHoveredRef.current ? 1 : 0;
      characterShineCurrentRef.current += (hoverTarget - characterShineCurrentRef.current) * 0.08;
      const shine = characterShineCurrentRef.current;

      const sunPulse = (Math.sin(elapsed * 1.05) + 1) * 0.5;
      const idleBreath = Math.sin(elapsed * 1.15);
      const idleSway = Math.cos(elapsed * 0.75);

      if (!prefersReducedMotion) {
        if (turbulenceRef.current) {
          const bfX = 0.012 + Math.sin(elapsed * 1.4) * 0.003;
          const bfY = 0.055 + Math.cos(elapsed * 1.8) * 0.012;
          turbulenceRef.current.setAttribute('baseFrequency', `${bfX.toFixed(4)} ${bfY.toFixed(4)}`);
        }
        if (clothTurbulenceRef.current) {
          const cbfX = 0.016 + Math.sin(elapsed * 1.9) * 0.004;
          const cbfY = 0.028 + Math.cos(elapsed * 1.5) * 0.005;
          clothTurbulenceRef.current.setAttribute(
            'baseFrequency',
            `${cbfX.toFixed(4)} ${cbfY.toFixed(4)}`
          );
        }
      }

      if (skyRef.current) {
        const skyY = p * 165 - cur.y * 10;
        const skyX = -cur.x * 14 + idleSway * 4;
        const skyScale = 1.08 + sunPulse * 0.018 - p * 0.07;
        skyRef.current.style.transform = `translate3d(${skyX}px, ${skyY}px, 0) scale(${skyScale})`;
        skyRef.current.style.filter = `brightness(${0.96 + sunPulse * 0.16}) saturate(${
          1.02 + sunPulse * 0.12
        })`;
      }

      if (sunPulseAuraRef.current) {
        sunPulseAuraRef.current.style.opacity = `${0.32 + sunPulse * 0.38}`;
        sunPulseAuraRef.current.style.transform = `translate3d(${-cur.x * 14}px, ${
          p * 165
        }px, 0) scale(${0.92 + sunPulse * 0.16})`;
      }

      if (titleLayerRef.current) {
        const tY = p * 235;
        const tScale = 1 - p * 0.13;
        const tOpacity = Math.max(1 - p * 1.45, 0);
        titleLayerRef.current.style.transform = `translate3d(${-cur.x * 5}px, ${tY}px, 0) scale(${tScale})`;
        titleLayerRef.current.style.opacity = `${tOpacity}`;
      }

      const mRotY = cur.x * 3.2 + idleSway * 0.5;
      const mRotX = -cur.y * 2.0;
      const mShiftX = cur.x * 10;
      const mShiftY = p * -50 + idleBreath * 3.5 + cur.y * 5;
      const mScale = 1.03 + p * 0.15;
      const scenePlaneTransform = `perspective(1200px) translate3d(${mShiftX}px, ${mShiftY}px, 0) rotateX(${mRotX}deg) rotateY(${mRotY}deg) scale(${mScale})`;

      if (mountainRef.current) mountainRef.current.style.transform = scenePlaneTransform;
      if (heatHazeLayerRef.current) heatHazeLayerRef.current.style.transform = scenePlaneTransform;

      const charFilter = `brightness(${(0.96 + shine * 0.28).toFixed(3)}) contrast(${(
        1.06 +
        shine * 0.08
      ).toFixed(3)}) saturate(${(1.04 + shine * 0.24).toFixed(3)})`;

      if (characterLayerRef.current) {
        characterLayerRef.current.style.transform = scenePlaneTransform;
        characterLayerRef.current.style.filter = charFilter;
      }
      if (characterSkirtSwayRef.current) {
        characterSkirtSwayRef.current.style.transform = scenePlaneTransform;
        characterSkirtSwayRef.current.style.filter = `url(#theyamClothSway) ${charFilter}`;
      }
      if (characterAuraRef.current) {
        characterAuraRef.current.style.opacity = `${(0.12 + shine * 0.68).toFixed(3)}`;
        characterAuraRef.current.style.transform = `translate3d(${mShiftX}px, ${mShiftY}px, 0) scale(${(
          0.95 +
          shine * 0.22
        ).toFixed(3)})`;
      }

      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const isMobile = vw <= 768;
      const cx = vw * 0.5;
      const cy = isMobile ? vh * 0.6 : vh * 0.58;
      const radiusX = isMobile
        ? Math.min(vw * 0.44, 240)
        : Math.min(Math.max(vw * 0.36, 220), 560);
      const radiusY = isMobile
        ? Math.min(vh * 0.048, 42)
        : Math.min(Math.max(vh * 0.068, 36), 68);

      const baseOrbitSpeed = prefersReducedMotion ? 0.0015 : 0.0065;
      const hoveredOrbitSpeed = prefersReducedMotion ? 0.003 : 0.021;
      const targetSpeed = baseOrbitSpeed + (hoveredOrbitSpeed - baseOrbitSpeed) * shine;

      orbitSpeedCurrentRef.current += (targetSpeed - orbitSpeedCurrentRef.current) * 0.06;
      orbitAngleRef.current = (orbitAngleRef.current + orbitSpeedCurrentRef.current) % (Math.PI * 2);

      const seesawDeg =
        (prefersReducedMotion ? 0 : Math.sin(elapsed * 0.85) * 4.2) + cur.x * 4.5;
      const orbitOpacity = Math.max(1 - p * 1.5, 0);

      if (orbitPlaneContainerRef.current) {
        orbitPlaneContainerRef.current.style.transformOrigin = `${cx}px ${cy}px`;
        orbitPlaneContainerRef.current.style.transform = `translate3d(${mShiftX.toFixed(
          1
        )}px, ${mShiftY.toFixed(1)}px, 0) rotateZ(${seesawDeg.toFixed(2)}deg)`;
        orbitPlaneContainerRef.current.style.opacity = `${orbitOpacity}`;
      }

      if (frontSvgRef.current) {
        frontSvgRef.current.setAttribute('viewBox', `0 0 ${vw} ${vh}`);
      }

      const dFrontRing = `M ${(cx - radiusX).toFixed(1)} ${cy.toFixed(1)} A ${radiusX.toFixed(
        1
      )} ${radiusY.toFixed(1)} 0 0 0 ${(cx + radiusX).toFixed(1)} ${cy.toFixed(1)}`;
      if (frontRingRef.current) frontRingRef.current.setAttribute('d', dFrontRing);

      const cometStep = (prefersReducedMotion ? 0.003 : 0.018) * (1 + shine * 1.6);
      cometAngleRef.current = (cometAngleRef.current + cometStep) % Math.PI;
      const cAng = Math.PI - cometAngleRef.current;
      const tailAng = Math.min(Math.PI, cAng + 0.45);
      const headX = cx + Math.cos(cAng) * radiusX;
      const headY = cy + Math.sin(cAng) * radiusY;
      const tailX = cx + Math.cos(tailAng) * radiusX;
      const tailY = cy + Math.sin(tailAng) * radiusY;

      const dComet = `M ${tailX.toFixed(1)} ${tailY.toFixed(1)} A ${radiusX.toFixed(
        1
      )} ${radiusY.toFixed(1)} 0 0 0 ${headX.toFixed(1)} ${headY.toFixed(1)}`;

      if (frontCometTrailRef.current) {
        frontCometTrailRef.current.setAttribute('d', dComet);
        frontCometTrailRef.current.style.opacity = `${0.85 + shine * 0.15}`;
      }
      if (frontCometHeadRef.current) {
        frontCometHeadRef.current.setAttribute('cx', headX.toFixed(1));
        frontCometHeadRef.current.setAttribute('cy', headY.toFixed(1));
        frontCometHeadRef.current.style.opacity = '1';
      }

      const totalChars = ribbonChars.length;
      const stepAngle = (Math.PI * 2) / totalChars;

      for (let i = 0; i < totalChars; i++) {
        const el = ribbonCharRefs.current[i];
        if (!el) continue;

        const theta = (Math.PI - i * stepAngle - orbitAngleRef.current) % (Math.PI * 2);
        const normalizedTheta = theta < 0 ? theta + Math.PI * 2 : theta;

        const cosT = Math.cos(normalizedTheta);
        const sinT = Math.sin(normalizedTheta);

        if (sinT <= 0.04) {
          el.style.opacity = '0';
          continue;
        }

        const x = cx + cosT * radiusX;
        const y = cy + sinT * radiusY;

        const edgeFade = Math.min(1, (sinT - 0.04) / 0.24);
        const perspectiveScale = (isMobile ? 0.72 : 0.78) + sinT * 0.34 + shine * 0.05;
        const foreshortenX = Math.max(0.48, sinT * 0.62 + 0.38);
        const curveTiltDeg = -cosT * (radiusY / radiusX) * (180 / Math.PI) * 1.15;

        el.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(
          1
        )}px, 0) rotate(${curveTiltDeg.toFixed(2)}deg) scale(${(
          perspectiveScale * foreshortenX
        ).toFixed(3)}, ${perspectiveScale.toFixed(3)})`;
        el.style.opacity = edgeFade.toFixed(3);
      }

      if (countdownLayerRef.current) {
        countdownLayerRef.current.style.transform = `translate3d(0, ${p * 95}px, 0)`;
        countdownLayerRef.current.style.opacity = `${Math.max(1 - p * 1.85, 0)}`;
      }

      if (scrollCueRef.current) {
        const cueFade = Math.max(0, 1 - p * 6);
        scrollCueRef.current.style.opacity = `${cueFade}`;
      }

      if (blankVeilRef.current) {
        const veilOpacity = Math.max(0, Math.min((p - 0.32) / 0.6, 1));
        blankVeilRef.current.style.opacity = `${veilOpacity}`;
      }

      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('scroll', handleScroll);
    };
  }, [hasEntered, ribbonChars]);

  // Procedural Fire Plumes + Shockwave Embers + Figure-Edge Hover Ember Burst
  useEffect(() => {
    if (!hasEntered) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;

    const setCanvasSize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    setCanvasSize();
    window.addEventListener('resize', setCanvasSize);

    class FlamePlume {
      constructor() {
        this.reset(true);
      }
      reset(initial = false) {
        this.x = Math.random() * canvas.width;
        this.y = initial
          ? canvas.height - Math.random() * (canvas.height * 0.14)
          : canvas.height + 40;
        this.radius = Math.random() * 62 + 30;
        this.speedY = Math.random() * 1.6 + 0.9;
        this.speedX = (Math.random() - 0.5) * 0.7;
        this.life = 1;
        this.decay = Math.random() * 0.012 + 0.008;
        this.wobble = Math.random() * Math.PI * 2;
      }
      update(scrollBoost) {
        this.wobble += 0.05;
        this.y -= this.speedY * (1 + scrollBoost * 2.2);
        this.x += this.speedX + Math.sin(this.wobble) * 0.8;
        this.radius *= 0.992;
        this.life -= this.decay;
        if (this.life <= 0 || this.radius < 4) this.reset(false);
      }
      draw() {
        const grad = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.radius);
        grad.addColorStop(0, `rgba(255, 190, 50, ${this.life * 0.32})`);
        grad.addColorStop(0.45, `rgba(255, 70, 10, ${this.life * 0.2})`);
        grad.addColorStop(1, 'rgba(180, 15, 0, 0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    const emberColors = ['#ffe066', '#ff9900', '#ff5500', '#ff2a00'];
    class Ember {
      constructor() {
        this.reset(true);
      }
      reset(initial = false) {
        this.x = Math.random() * canvas.width;
        this.y = initial ? Math.random() * canvas.height : canvas.height + Math.random() * 40;
        this.size = Math.random() * 2.6 + 0.85;
        this.speedY = Math.random() * 2.1 + 0.75;
        this.speedX = (Math.random() - 0.5) * 0.85;
        this.wobble = Math.random() * Math.PI * 2;
        this.wobbleSpeed = Math.random() * 0.04 + 0.015;
        this.opacity = Math.random() * 0.85 + 0.15;
        this.color = emberColors[Math.floor(Math.random() * emberColors.length)];
        this.isShockSpark = false;
      }
      blastFromImpact() {
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 9 + 3.5;
        this.x = canvas.width * 0.5 + (Math.random() - 0.5) * 90;
        this.y = canvas.height * 0.68 + (Math.random() - 0.5) * 30;
        this.speedX = Math.cos(angle) * speed;
        this.speedY = -Math.sin(angle) * speed * 0.65 + 2.5;
        this.size = Math.random() * 3.4 + 1.2;
        this.opacity = 1;
        this.isShockSpark = true;
      }
      spawnFromCharacterEdge() {
        const edgeAngle = Math.random() * Math.PI * 2;
        const rx = Math.min(canvas.width * 0.09, 115);
        const ry = Math.min(canvas.height * 0.22, 195);
        const cx = canvas.width * 0.5;
        const cy = canvas.height * 0.53;

        this.x = cx + Math.cos(edgeAngle) * rx;
        this.y = cy + Math.sin(edgeAngle) * ry;

        const outSpeed = Math.random() * 2.8 + 1.1;
        this.speedX = Math.cos(edgeAngle) * outSpeed + (Math.random() - 0.5) * 0.6;
        this.speedY = -Math.sin(edgeAngle) * outSpeed * 0.5 + (Math.random() * 1.6 + 0.8);
        this.size = Math.random() * 2.8 + 1.1;
        this.color = Math.random() > 0.35 ? '#ffe680' : '#ff9914';
        this.opacity = 0.98;
        this.isShockSpark = true;
      }
      update(scrollBoost) {
        if (this.isShockSpark) {
          this.x += this.speedX;
          this.y -= this.speedY;
          this.speedX *= 0.96;
          this.speedY = this.speedY * 0.96 + 0.045;
          this.opacity -= 0.015;
          if (this.opacity <= 0) this.reset(false);
          return;
        }
        this.wobble += this.wobbleSpeed;
        this.y -= this.speedY * (1 + scrollBoost * 2.5);
        this.x += this.speedX + Math.sin(this.wobble) * 0.7;
        this.opacity -= 0.002;
        if (this.y < -15 || this.opacity <= 0) this.reset(false);
      }
      draw() {
        ctx.save();
        ctx.globalAlpha = Math.max(this.opacity, 0);
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    }

    const flames = Array.from(
      { length: Math.min(Math.floor(window.innerWidth / 22), 58) },
      () => new FlamePlume()
    );
    const embers = Array.from(
      { length: Math.min(Math.floor(window.innerWidth / 11), 135) },
      () => new Ember()
    );

    let hoverSpawnTicker = 0;

    const renderLoop = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.globalCompositeOperation = 'lighter';
      const scrollBoost = scrollCurrent.current;

      if (shockwaveBurstRef.current) {
        shockwaveBurstRef.current = false;
        embers.slice(0, 55).forEach((e) => e.blastFromImpact());
      }

      if (figureEdgeBurstRef.current) {
        figureEdgeBurstRef.current = false;
        embers.slice(55, 82).forEach((e) => e.spawnFromCharacterEdge());
      }

      if (isCharacterHoveredRef.current) {
        hoverSpawnTicker += 1;
        if (hoverSpawnTicker % 6 === 0) {
          const candidate = embers.find((e) => !e.isShockSpark);
          if (candidate) candidate.spawnFromCharacterEdge();
        }
      }

      flames.forEach((f) => {
        f.update(scrollBoost);
        f.draw();
      });
      embers.forEach((e) => {
        e.update(scrollBoost);
        e.draw();
      });

      ctx.globalCompositeOperation = 'source-over';
      animationFrameId = requestAnimationFrame(renderLoop);
    };

    renderLoop();
    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', setCanvasSize);
    };
  }, [hasEntered]);

  const handleDockMouseMove = (e) => {
    const el = dockRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    el.style.setProperty('--dx', `${e.clientX - rect.left}px`);
    el.style.setProperty('--dy', `${e.clientY - rect.top}px`);
  };

  return (
    <div className="hero-section-root">
      {/* --- RAGAM-INSPIRED VIDYUT VORTEX + PROMINENT EMBLEM WATERMARK + UNDERSCORE LOADER --- */}
      {!hasEntered && (
        <div
          className={`ritual-preloader-screen ${isReadyToEnter ? 'preloader-ready' : ''} ${
            isExitingLoader ? 'preloader-exiting' : ''
          }`}
          onClick={handleStartWebsite}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') handleStartWebsite();
          }}
        >
          {/* Full-360° Nested Concentric VIDYUT Typography Vortex */}
          <div className="ragam-vortex-layer" aria-hidden="true">
            <svg
              className="ragam-vortex-svg"
              viewBox="0 0 1000 1000"
              preserveAspectRatio="xMidYMid slice"
            >
              <defs>
                {TUNNEL_RINGS.map((ring) => (
                  <path
                    key={ring.id}
                    id={`vortex-${ring.id}`}
                    d={`M 500, 500 m -${ring.radius}, 0 a ${ring.radius},${ring.radius} 0 1,1 ${
                      ring.radius * 2
                    },0 a ${ring.radius},${ring.radius} 0 1,1 -${ring.radius * 2},0`}
                  />
                ))}
              </defs>

              {TUNNEL_RINGS.map((ring) => (
                <g key={ring.id} className={`vortex-ring-group ${ring.className}`}>
                  <text
                    className="vortex-ring-text"
                    style={{ fontSize: `${ring.fontSize}px` }}
                    textLength={Math.round(2 * Math.PI * ring.radius)}
                    lengthAdjust="spacing"
                  >
                    <textPath href={`#vortex-${ring.id}`} startOffset="0%">
                      {ring.text}
                    </textPath>
                  </text>
                </g>
              ))}
            </svg>
          </div>

          {/* Radial Center Vignette (Sits behind the logo so the logo stays bright and visible) */}
          <div className="vortex-center-vignette" />

          {/* Prominent Background Emblem / Logo Watermark (z-index: 2, decoded before reveal) */}
          {isLogoReady && (
            <div className="preloader-bg-logo-wrap" aria-hidden="true">
              <div className="preloader-logo-backglow" />
              {logoSrc ? (
                <img
                  src={logoSrc}
                  alt=""
                  className="preloader-custom-logo"
                  decoding="sync"
                  fetchPriority="high"
                />
              ) : (
                <svg className="preloader-crest-svg" viewBox="0 0 240 240" fill="none">
                  <circle
                    cx="120"
                    cy="120"
                    r="96"
                    stroke="rgba(255, 130, 35, 0.48)"
                    strokeWidth="1.5"
                    strokeDasharray="6 6"
                  />
                  <circle
                    cx="120"
                    cy="120"
                    r="76"
                    stroke="rgba(255, 195, 90, 0.35)"
                    strokeWidth="1.2"
                  />
                  <path
                    d="M120 26 L138 78 L188 64 L154 108 L196 136 L146 144 L158 196 L120 160 L82 196 L94 144 L44 136 L86 108 L52 64 L102 78 Z"
                    stroke="rgba(255, 145, 45, 0.55)"
                    strokeWidth="1.8"
                    fill="rgba(235, 55, 12, 0.16)"
                  />
                  <path
                    d="M120 48 L134 115 L120 186 L106 115 Z"
                    fill="rgba(255, 185, 80, 0.42)"
                  />
                </svg>
              )}
            </div>
          )}

          {/* Center Lockup: CLICK TO / BE THE [________] */}
          <div className="preloader-center-stack">
            <span
              className={`preloader-click-cue ${
                isReadyToEnter ? 'cue-visible' : 'cue-hidden'
              }`}
            >
              CLICK TO
            </span>

            <div className="preloader-mantra-line">
              <span className="mantra-prefix">BE THE</span>
              <span className="mantra-underscore-slot">
                <span
                  key={wordIndex}
                  className={`mantra-slot-word ${
                    isReadyToEnter ? 'slot-word-locked' : 'slot-word-cycle'
                  }`}
                >
                  {LOADER_WORDS[wordIndex]}
                </span>
                <span className="mantra-underscore-track">
                  <span
                    className="mantra-underscore-fill"
                    style={{ width: `${loadProgress}%` }}
                  />
                </span>
              </span>
            </div>

            <span
              className={`preloader-status-sub ${
                isReadyToEnter ? 'status-ready' : ''
              }`}
            >
              {isReadyToEnter ? 'SYSTEMS PRIMED • TAP ANYWHERE' : `AWAKENING ${loadProgress}%`}
            </span>
          </div>
        </div>
      )}

      {/* SVG Filters */}
      <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden="true">
        <defs>
          <filter id="superheroDropBlur" x="-10%" y="-30%" width="120%" height="160%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="0 26" />
          </filter>

          <filter id="volcanicHeatHaze" x="-5%" y="-5%" width="110%" height="110%">
            <feTurbulence
              ref={turbulenceRef}
              type="fractalNoise"
              baseFrequency="0.012 0.055"
              numOctaves="2"
              seed="7"
              result="hazeNoise"
            />
            <feDisplacementMap
              in="SourceGraphic"
              in2="hazeNoise"
              scale="9"
              xChannelSelector="R"
              yChannelSelector="G"
            />
          </filter>

          <filter id="theyamClothSway" x="-5%" y="-5%" width="110%" height="110%">
            <feTurbulence
              ref={clothTurbulenceRef}
              type="fractalNoise"
              baseFrequency="0.016 0.028"
              numOctaves="2"
              seed="19"
              result="clothNoise"
            />
            <feDisplacementMap
              in="SourceGraphic"
              in2="clothNoise"
              scale="11"
              xChannelSelector="R"
              yChannelSelector="G"
            />
          </filter>

          <filter id="orbitCometGlow" x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="3.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
      </svg>

      {/* --- MAIN HERO PARALLAX RUNWAY --- */}
      <section className="hero-scroll-runway" ref={runwayRef}>
        <div className="hero-sticky-viewport">
          {hasEntered && (
            <div className="hero-impact-rig">
              <div className="hero-camera-rig">
                {/* Layer 1: Red Sun & Sky */}
                <div className="parallax-layer-wrapper awaken-sky">
                  <div
                    ref={skyRef}
                    className="parallax-layer layer-sky"
                    style={{ backgroundImage: `url(${skyImg})` }}
                  />
                  <div ref={sunPulseAuraRef} className="solar-corona-pulse" />
                </div>

                {/* Impact Flash Ring */}
                <div className="superhero-impact-flash" />

                {/* Layer 2: Scramble Subtitle + Responsive VIDYUT */}
                <div className="parallax-layer-wrapper awaken-title">
                  <div ref={titleLayerRef} className="hero-poster-layout">
                    <div className="vidyut-poster-lockup">
                      <ScrambleSubtitle isHovered={isCharacterHovered} />
                      <div className="vidyut-glitch-wrapper">
                        <InteractiveVidyutTitle text="VIDYUT" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Layer 2.5: Mountain + Lower Heat Haze */}
                <div className="parallax-layer-wrapper awaken-mountain">
                  <div
                    ref={mountainRef}
                    className="parallax-layer layer-mountain"
                    style={{ backgroundImage: `url(${mountainTheyyamImg})` }}
                  />
                  <div
                    ref={heatHazeLayerRef}
                    className="parallax-layer layer-heat-haze"
                    style={{ backgroundImage: `url(${mountainTheyyamImg})` }}
                  />
                </div>

                {/* Warm Radiance Halo Behind Character */}
                <div ref={characterAuraRef} className="theyyam-hover-radiance" />

                {/* Layer 4: THEYYAM CHARACTER */}
                <div className="parallax-layer-wrapper superhero-land-enter">
                  <div
                    ref={characterLayerRef}
                    className="parallax-layer layer-character-top layer-character-upper"
                    style={{ backgroundImage: `url(${theyyamCharacterImg})` }}
                  />
                  <div
                    ref={characterSkirtSwayRef}
                    className="parallax-layer layer-character-top layer-character-skirt-sway"
                    style={{ backgroundImage: `url(${theyyamCharacterImg})` }}
                  />
                </div>

                {/* Interactive Hitbox over Central Character */}
                <div
                  className="character-hover-hitbox"
                  onMouseEnter={handleCharacterMouseEnter}
                  onMouseLeave={handleCharacterMouseLeave}
                  onTouchStart={handleCharacterMouseEnter}
                  onTouchEnd={handleCharacterMouseLeave}
                  aria-label="Theyyam Figure"
                />

                {/* Layer 5 & 6: Unified Seesaw-Tilting Orbit Plane */}
                <div className="parallax-layer-wrapper layer-orbit-front awaken-orbit">
                  <div ref={orbitPlaneContainerRef} className="orbit-full-viewport-box">
                    <svg ref={frontSvgRef} className="orbit-ring-svg">
                      <path ref={frontRingRef} className="orbit-ellipse-front" />
                      <path
                        ref={frontCometTrailRef}
                        className="orbit-comet-trail"
                        filter="url(#orbitCometGlow)"
                      />
                      <circle
                        ref={frontCometHeadRef}
                        r="4"
                        className="orbit-comet-head"
                        filter="url(#orbitCometGlow)"
                      />
                    </svg>

                    <div className="orbit-dates-stage">
                      {ribbonChars.map((ch, idx) => (
                        <span
                          key={idx}
                          ref={(el) => (ribbonCharRefs.current[idx] = el)}
                          className={`cylinder-char ${ch === '•' ? 'orbit-dot' : ''}`}
                        >
                          {ch === ' ' ? '\u00A0' : ch}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Layer 7: Live Procedural Fire & Embers */}
                <div className="parallax-layer-wrapper awaken-fire">
                  <canvas ref={canvasRef} className="fire-embers-canvas" />
                </div>

                {/* Layer 8: Liquid Glass Countdown */}
                <div className="parallax-layer-wrapper awaken-countdown">
                  <div ref={countdownLayerRef} className="hero-countdown-wrapper">
                    <div
                      ref={dockRef}
                      className="countdown-liquid-strip"
                      onMouseMove={handleDockMouseMove}
                    >
                      <div className="countdown-surface-sheen" />

                      <div className="countdown-cell">
                        <span className="countdown-value">{timeLeft.days}</span>
                        <span className="countdown-label">DAYS</span>
                      </div>

                      <span className="countdown-divider" />

                      <div className="countdown-cell">
                        <span className="countdown-value">{timeLeft.hours}</span>
                        <span className="countdown-label">HRS</span>
                      </div>

                      <span className="countdown-divider" />

                      <div className="countdown-cell">
                        <span className="countdown-value">{timeLeft.minutes}</span>
                        <span className="countdown-label">MIN</span>
                      </div>

                      <span className="countdown-divider" />

                      <div className="countdown-cell">
                        <span className="countdown-value">{timeLeft.seconds}</span>
                        <span className="countdown-label">SEC</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Delayed Animated "SCROLL" Prompt */}
                <div ref={scrollCueRef} className="hero-scroll-cue-wrapper">
                  <div className="hero-scroll-cue">
                    <span className="scroll-cue-label">SCROLL</span>
                    <div className="scroll-cue-track">
                      <div className="scroll-cue-line" />
                    </div>
                  </div>
                </div>

                <div className="hero-bottom-fade" />
              </div>
            </div>
          )}

          {/* Smooth Darkness Veil */}
          <div ref={blankVeilRef} className="hero-blank-transition-veil" />
        </div>
      </section>
    </div>
  );
};

export default HeroParallax;