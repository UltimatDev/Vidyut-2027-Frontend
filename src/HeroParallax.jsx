import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import './HeroParallax.css';

import skyImg from './assets/sky.png';
import mountainTheyyamImg from './assets/MOUNTAIN with theyam.png';
import theyyamCharacterImg from './assets/web.png';
import customImpactAudio from './assets/slam.mp3';

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
    if (window.innerWidth <= 768) return;
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
  isActive = true,
  onReady,
  targetTimestamp = getTargetDate(),
  impactSound = customImpactAudio,
  impactVolume = 0.9,
}) => {
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
  const frontPlaneFadeRef = useRef(null);
  const fireLayerRef = useRef(null);
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
  const hasTriggeredEntranceRef = useRef(false);

  const [timeLeft, setTimeLeft] = useState({
    days: '00',
    hours: '00',
    minutes: '00',
    seconds: '00',
  });

  // 1. Preload & GPU-Decode Textures, Fonts & slam.mp3, Then Signal `onReady()`
  useEffect(() => {
    let cancelled = false;

    const prepareScene = async () => {
      const imageSources = [skyImg, mountainTheyyamImg, theyyamCharacterImg];

      const imagePromises = imageSources.map(
        (src) =>
          new Promise((resolve) => {
            const img = new window.Image();
            img.decoding = 'async';
            img.src = src;

            const finish = () => {
              if (typeof img.decode === 'function') {
                img.decode().catch(() => {}).finally(resolve);
              } else {
                resolve();
              }
            };

            if (img.complete && img.naturalWidth > 0) {
              finish();
            } else {
              img.onload = finish;
              img.onerror = resolve;
            }
          })
      );

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

      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          if (!cancelled && onReady) {
            onReady();
          }
        });
      });
    };

    prepareScene();

    return () => {
      cancelled = true;
    };
  }, [impactSound, impactVolume, onReady]);

  // 2. Trigger Superhero Drop + Synchronized slam.mp3 Playback when `isActive` turns true
  useEffect(() => {
    if (!isActive || hasTriggeredEntranceRef.current) return;
    hasTriggeredEntranceRef.current = true;

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

    const impactTimer = setTimeout(() => {
      shockwaveBurstRef.current = true;

      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate([45, 25, 95]);
      }

      if (audioRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current.play().catch(() => {
          playSynthesizedGroundSlam(audioCtxRef.current);
        });
      } else {
        playSynthesizedGroundSlam(audioCtxRef.current);
      }
    }, 380);

    return () => clearTimeout(impactTimer);
  }, [isActive]);

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

  // Cursor Tracking (Desktop)
  useEffect(() => {
    const handlePointerMove = (e) => {
      if (window.innerWidth <= 768) return;
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
    if (!isActive) return;

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
    let lastSvgFilterTime = 0;

    const tick = (now) => {
      const elapsed = (now - startTime) * 0.001;
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const isMobile = vw <= 768;

      scrollCurrent.current += (scrollTarget.current - scrollCurrent.current) * 0.095;
      const p = scrollCurrent.current;

      // Pause heavy hero DOM updates once completely scrolled past the runway
      if (p >= 0.995) {
        rafId = requestAnimationFrame(tick);
        return;
      }

      const cur = mouseCurrent.current;
      const tgt = mouseTarget.current;
      cur.x = isMobile ? 0 : cur.x + (tgt.x - cur.x) * 0.07;
      cur.y = isMobile ? 0 : cur.y + (tgt.y - cur.y) * 0.07;

      const hoverTarget = isCharacterHoveredRef.current ? 1 : 0;
      characterShineCurrentRef.current += (hoverTarget - characterShineCurrentRef.current) * 0.08;
      const shine = characterShineCurrentRef.current;

      const sunPulse = (Math.sin(elapsed * 1.05) + 1) * 0.5;
      const idleBreath = Math.sin(elapsed * 1.15);
      const idleSway = Math.cos(elapsed * 0.75);

      // 1. Throttled SVG Heat Haze & Cloth Sway Turbulence (15fps, Desktop Only, Resting Hero)
      if (!prefersReducedMotion && !isMobile && p < 0.25 && now - lastSvgFilterTime > 66) {
        lastSvgFilterTime = now;
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

      // 2. Sky & GPU Solar Corona Pulse (no per-frame CSS filter recalc)
      if (skyRef.current) {
        const skyY = p * 165 - cur.y * 10;
        const skyX = -cur.x * 14 + (isMobile ? 0 : idleSway * 4);
        const skyScale = 1.08 + sunPulse * 0.018 - p * 0.07;
        skyRef.current.style.transform = `translate3d(${skyX.toFixed(1)}px, ${skyY.toFixed(
          1
        )}px, 0) scale(${skyScale.toFixed(3)})`;
      }

      if (sunPulseAuraRef.current) {
        sunPulseAuraRef.current.style.opacity = `${0.32 + sunPulse * 0.38}`;
        sunPulseAuraRef.current.style.transform = `translate3d(${-cur.x * 14}px, ${
          p * 165
        }px, 0) scale(${0.92 + sunPulse * 0.16})`;
      }

      // 3. Title Lockup
      if (titleLayerRef.current) {
        const tY = p * 235;
        const tScale = 1 - p * 0.13;
        const tOpacity = Math.max(1 - p * 1.45, 0);
        titleLayerRef.current.style.transform = `translate3d(${-cur.x * 5}px, ${tY.toFixed(
          1
        )}px, 0) scale(${tScale.toFixed(3)})`;
        titleLayerRef.current.style.opacity = `${tOpacity}`;
      }

      // 4. Mountain, Character & Lower Skirt Sway Layers
      const mRotY = cur.x * 3.2 + idleSway * 0.5;
      const mRotX = -cur.y * 2.0;
      const mShiftX = cur.x * 10;
      const mShiftY = p * -50 + idleBreath * 3.5 + cur.y * 5;
      const mScale = 1.03 + p * 0.15;
      const scenePlaneTransform = isMobile
        ? `translate3d(0px, ${mShiftY.toFixed(1)}px, 0) scale(${mScale.toFixed(3)})`
        : `perspective(1200px) translate3d(${mShiftX.toFixed(1)}px, ${mShiftY.toFixed(
            1
          )}px, 0) rotateX(${mRotX.toFixed(2)}deg) rotateY(${mRotY.toFixed(2)}deg) scale(${mScale.toFixed(
            3
          )})`;

      if (mountainRef.current) mountainRef.current.style.transform = scenePlaneTransform;
      if (heatHazeLayerRef.current && !isMobile) {
        heatHazeLayerRef.current.style.transform = scenePlaneTransform;
      }

      const charFilter = `brightness(${(0.96 + shine * 0.28).toFixed(3)}) contrast(${(
        1.06 +
        shine * 0.08
      ).toFixed(3)}) saturate(${(1.04 + shine * 0.24).toFixed(3)})`;

      if (characterLayerRef.current) {
        characterLayerRef.current.style.transform = scenePlaneTransform;
        if (!isMobile) {
          characterLayerRef.current.style.filter = charFilter;
        }
      }
      if (characterSkirtSwayRef.current && !isMobile) {
        characterSkirtSwayRef.current.style.transform = scenePlaneTransform;
        characterSkirtSwayRef.current.style.filter = `url(#theyamClothSway) ${charFilter}`;
      }
      if (characterAuraRef.current) {
        characterAuraRef.current.style.opacity = `${(0.12 + shine * 0.68).toFixed(3)}`;
        characterAuraRef.current.style.transform = `translate3d(${mShiftX.toFixed(
          1
        )}px, ${mShiftY.toFixed(1)}px, 0) scale(${(0.95 + shine * 0.22).toFixed(3)})`;
      }

      // 5. Continuous Packed Orbit + Comet
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

      // 6. Preserve Full Parallax for First 62% of Scroll, Then Dissolve Cleanly into ThemeSection
      const veilOpacity = Math.max(0, Math.min((p - 0.62) / 0.36, 1));
      if (blankVeilRef.current) {
        blankVeilRef.current.style.opacity = `${veilOpacity}`;
      }
      if (frontPlaneFadeRef.current) {
        frontPlaneFadeRef.current.style.opacity = `${Math.max(0, 1 - veilOpacity)}`;
      }
      if (fireLayerRef.current) {
        fireLayerRef.current.style.opacity = `${Math.max(0, 1 - veilOpacity * 1.15)}`;
      }

      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('scroll', handleScroll);
    };
  }, [isActive, ribbonChars]);

  // Procedural Fire Plumes + Shockwave Embers + Figure-Edge Hover Ember Burst
  useEffect(() => {
    if (!isActive) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;

    const isMobile = window.innerWidth <= 768;

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
        this.radius = Math.random() * (isMobile ? 48 : 62) + 30;
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

    const flameCount = isMobile ? 16 : Math.min(Math.floor(window.innerWidth / 22), 58);
    const emberCount = isMobile ? 36 : Math.min(Math.floor(window.innerWidth / 11), 135);

    const flames = Array.from({ length: flameCount }, () => new FlamePlume());
    const embers = Array.from({ length: emberCount }, () => new Ember());

    let hoverSpawnTicker = 0;

    const renderLoop = () => {
      const scrollBoost = scrollCurrent.current;

      if (scrollBoost >= 0.96) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        animationFrameId = requestAnimationFrame(renderLoop);
        return;
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.globalCompositeOperation = 'lighter';

      if (shockwaveBurstRef.current) {
        shockwaveBurstRef.current = false;
        const burstSlice = isMobile ? 18 : 55;
        embers.slice(0, burstSlice).forEach((e) => e.blastFromImpact());
      }

      if (figureEdgeBurstRef.current) {
        figureEdgeBurstRef.current = false;
        const startIdx = isMobile ? 18 : 55;
        const endIdx = isMobile ? 30 : 82;
        embers.slice(startIdx, endIdx).forEach((e) => e.spawnFromCharacterEdge());
      }

      if (isCharacterHoveredRef.current && !isMobile) {
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
  }, [isActive]);

  const handleDockMouseMove = (e) => {
    if (window.innerWidth <= 768) return;
    const el = dockRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    el.style.setProperty('--dx', `${e.clientX - rect.left}px`);
    el.style.setProperty('--dy', `${e.clientY - rect.top}px`);
  };

  // Pre-render all hero layers underneath RitualLoader so GPU textures are painted before enter,
  // then trigger the entrance drop animations cleanly when `isActive` turns true.
  const rigGateStyle = isActive
    ? { opacity: 1, visibility: 'visible' }
    : { opacity: 0, visibility: 'hidden', pointerEvents: 'none' };

  return (
    <div className="hero-section-root">
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
        {/* BACK STICKY TRACK (z-index: 1 — Renders BEHIND VidyutLogoBackdrop z-index: 3) */}
        <div className="hero-sticky-track track-back">
          <div className="hero-sticky-viewport viewport-back">
            <div className={isActive ? 'hero-impact-rig' : ''} style={rigGateStyle}>
              <div className={isActive ? 'hero-camera-rig' : ''}>
                <div className={isActive ? 'parallax-layer-wrapper awaken-sky' : 'parallax-layer-wrapper'}>
                  <div
                    ref={skyRef}
                    className="parallax-layer layer-sky"
                    style={{ backgroundImage: `url(${skyImg})` }}
                  />
                  <div ref={sunPulseAuraRef} className="solar-corona-pulse" />
                </div>

                {isActive && <div className="superhero-impact-flash" />}

                <div className={isActive ? 'parallax-layer-wrapper awaken-title' : 'parallax-layer-wrapper'}>
                  <div ref={titleLayerRef} className="hero-poster-layout">
                    <div className="vidyut-poster-lockup">
                      <ScrambleSubtitle isHovered={isCharacterHovered} />
                      <div className="vidyut-glitch-wrapper">
                        <InteractiveVidyutTitle text="VIDYUT" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div ref={blankVeilRef} className="hero-blank-transition-veil" />
          </div>
        </div>

        {/* FRONT STICKY TRACK (z-index: 4 — Renders IN FRONT OF VidyutLogoBackdrop z-index: 3) */}
        <div className="hero-sticky-track track-front">
          <div ref={frontPlaneFadeRef} className="hero-sticky-viewport viewport-front">
            <div className={isActive ? 'hero-impact-rig' : ''} style={rigGateStyle}>
              <div className={isActive ? 'hero-camera-rig' : ''}>
                <div className={isActive ? 'parallax-layer-wrapper awaken-mountain' : 'parallax-layer-wrapper'}>
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

                <div ref={characterAuraRef} className="theyyam-hover-radiance" />

                <div className={isActive ? 'parallax-layer-wrapper superhero-land-enter' : 'parallax-layer-wrapper'}>
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

                <div
                  className="character-hover-hitbox"
                  onMouseEnter={handleCharacterMouseEnter}
                  onMouseLeave={handleCharacterMouseLeave}
                  onTouchStart={handleCharacterMouseEnter}
                  onTouchEnd={handleCharacterMouseLeave}
                  aria-label="Theyyam Figure"
                />

                <div className={isActive ? 'parallax-layer-wrapper layer-orbit-front awaken-orbit' : 'parallax-layer-wrapper layer-orbit-front'}>
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

                <div ref={fireLayerRef} className={isActive ? 'parallax-layer-wrapper awaken-fire' : 'parallax-layer-wrapper'}>
                  <canvas ref={canvasRef} className="fire-embers-canvas" />
                </div>

                <div className={isActive ? 'parallax-layer-wrapper awaken-countdown' : 'parallax-layer-wrapper'}>
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
          </div>
        </div>
      </section>
    </div>
  );
};

export default HeroParallax;