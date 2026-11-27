import React, { useEffect, useMemo, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import './ThemeSection.css';
import themeData from './themeConfig.json';

gsap.registerPlugin(ScrollTrigger);

// Deterministic scatter presets (±300px X/Y, -400px Z, ±45° rotation) for 6 letters
const SCATTER_PRESETS = [
  { x: -270, y: -190, z: -400, rot: -38, rotX: 28, rotY: -34 },
  { x: -145, y: 235, z: -400, rot: 31, rotX: -32, rotY: 24 },
  { x: 65, y: -265, z: -400, rot: -42, rotX: 36, rotY: 29 },
  { x: -55, y: 270, z: -400, rot: 44, rotX: -26, rotY: -36 },
  { x: 185, y: -210, z: -400, rot: -29, rotX: 34, rotY: 38 },
  { x: 285, y: 185, z: -400, rot: 37, rotX: -38, rotY: -28 },
];

const ThemeSection = () => {
  const prefix = themeData.prefix || 'BE THE';
  const word = themeData.word || 'CHANGE';
  const letters = useMemo(() => word.split(''), [word]);

  const sectionRef = useRef(null);
  const entryFadeRef = useRef(null);
  const prefixRef = useRef(null);
  const wordRigRef = useRef(null);
  const letterSlotRefs = useRef([]);
  const coldCopyRefs = useRef([]);
  const hotCopyRefs = useRef([]);
  const flashRef = useRef(null);
  const glowRef = useRef(null);
  const emberCanvasRef = useRef(null);

  const prevProgressRef = useRef(0);
  const embersRef = useRef([]);
  const spawnBurstRef = useRef(null);

  const [isInView, setIsInView] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(() =>
    typeof window !== 'undefined'
      ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
      : false
  );

  // Watch prefers-reduced-motion changes
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const onChange = (e) => setPrefersReducedMotion(e.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  // Track viewport visibility to pause embers & ambient flicker off-screen
  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;

    const io = new IntersectionObserver(
      ([entry]) => setIsInView(entry.isIntersecting),
      { threshold: 0.01 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // Lenis smooth inertia scrolling synchronized with GSAP ScrollTrigger
  useEffect(() => {
    if (prefersReducedMotion) return;
    if (typeof window === 'undefined' || window.__vidyutLenisActive) return;

    const lenis = new Lenis({
      lerp: 0.085,
      smoothWheel: true,
      wheelMultiplier: 0.95,
    });

    window.__vidyutLenisActive = true;
    lenis.on('scroll', ScrollTrigger.update);

    const rafTick = (time) => {
      lenis.raf(time * 1000);
    };

    gsap.ticker.add(rafTick);
    gsap.ticker.lagSmoothing(0);

    return () => {
      gsap.ticker.remove(rafTick);
      lenis.destroy();
      window.__vidyutLenisActive = false;
    };
  }, [prefersReducedMotion]);

  // Lightweight Canvas Ember Burst Engine (~30 embers rising from word on Phase 3 lock-in)
  useEffect(() => {
    const canvas = emberCanvasRef.current;
    if (!canvas || prefersReducedMotion) return;
    const ctx = canvas.getContext('2d');

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = window.innerWidth;
      const h = window.innerHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    resize();
    window.addEventListener('resize', resize);

    spawnBurstRef.current = () => {
      const wordEl = wordRigRef.current;
      const rect = wordEl
        ? wordEl.getBoundingClientRect()
        : {
            left: window.innerWidth * 0.2,
            top: window.innerHeight * 0.4,
            width: window.innerWidth * 0.6,
            height: window.innerHeight * 0.16,
          };

      const burst = [];
      for (let i = 0; i < 32; i++) {
        burst.push({
          x: rect.left + Math.random() * rect.width,
          y: rect.top + rect.height * (0.2 + Math.random() * 0.75),
          vx: (Math.random() - 0.5) * 1.45,
          vy: -(1.25 + Math.random() * 2.4),
          size: 1.3 + Math.random() * 2.3,
          life: 0,
          maxLife: 55 + Math.random() * 55,
          swayPhase: Math.random() * Math.PI * 2,
        });
      }
      embersRef.current = [...embersRef.current.slice(-20), ...burst];
    };

    let rafId = null;

    const renderEmbers = () => {
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

      if (embersRef.current.length > 0) {
        ctx.globalCompositeOperation = 'lighter';
        const nextList = [];

        for (let i = 0; i < embersRef.current.length; i++) {
          const e = embersRef.current[i];
          e.life += 1;
          if (e.life >= e.maxLife) continue;

          e.x += e.vx + Math.sin(e.life * 0.1 + e.swayPhase) * 0.45;
          e.y += e.vy;
          e.vy *= 0.992;

          const p = e.life / e.maxLife;
          const alpha = Math.sin(p * Math.PI);
          const radius = e.size * (1 - p * 0.45);

          ctx.fillStyle =
            p < 0.35
              ? `rgba(255, 243, 168, ${alpha * 0.95})`
              : `rgba(255, 122, 26, ${alpha * 0.85})`;
          ctx.beginPath();
          ctx.arc(e.x, e.y, Math.max(0.4, radius), 0, Math.PI * 2);
          ctx.fill();

          nextList.push(e);
        }

        embersRef.current = nextList;
        ctx.globalCompositeOperation = 'source-over';
      }

      rafId = requestAnimationFrame(renderEmbers);
    };

    if (isInView) {
      rafId = requestAnimationFrame(renderEmbers);
    } else {
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
    }

    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      window.removeEventListener('resize', resize);
    };
  }, [isInView, prefersReducedMotion]);

  // GSAP ScrollTrigger: Seamless Entry Crossfade + Pinned Morph Sequence
  useEffect(() => {
    const section = sectionRef.current;
    if (!section || prefersReducedMotion) return;

    const ctx = gsap.context(() => {
      const slots = letterSlotRefs.current.filter(Boolean);
      const colds = coldCopyRefs.current.filter(Boolean);
      const hots = hotCopyRefs.current.filter(Boolean);

      const scatterScale = Math.min(1, window.innerWidth / 960);
      const wideSpreadStep = Math.round(28 * scatterScale);
      const targetWdth = window.innerWidth <= 540 ? 96 : 112;

      const axisProxies = slots.map(() => ({ wght: 100, wdth: 60 }));

      const applyAxes = (i) => {
        const slot = slots[i];
        if (!slot) return;
        const { wght, wdth } = axisProxies[i];
        slot.style.fontVariationSettings = `'wght' ${wght.toFixed(1)}, 'wdth' ${wdth.toFixed(1)}`;
      };

      // Entry initial states (fades smoothly in as Hero finishes dissolving)
      gsap.set(prefixRef.current, { opacity: 0, y: 18 });
      gsap.set(entryFadeRef.current, { opacity: 0 });
      gsap.set(wordRigRef.current, { scale: 1 });
      gsap.set(flashRef.current, { opacity: 0 });
      gsap.set(glowRef.current, { opacity: 0 });

      slots.forEach((slot, i) => {
        const preset = SCATTER_PRESETS[i % SCATTER_PRESETS.length];
        const wideSpreadX = (i - (slots.length - 1) / 2) * wideSpreadStep;

        applyAxes(i);
        gsap.set(slot, {
          x: preset.x * scatterScale + wideSpreadX,
          y: preset.y * scatterScale,
          z: preset.z * scatterScale,
          rotation: preset.rot,
          rotationX: preset.rotX,
          rotationY: preset.rotY,
          opacity: 0.25,
        });
      });

      gsap.set(colds, { opacity: 1 });
      gsap.set(hots, { opacity: 0 });

      // Seamless Entry Trigger: brings "BE THE" & faint scattered letters in before pin locks
      const entryTl = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          start: 'top 82%',
          end: 'top top',
          scrub: 0.8,
        },
      });

      entryTl
        .to(prefixRef.current, { opacity: 1, y: 0, ease: 'power2.out', duration: 0.85 }, 0.1)
        .to(entryFadeRef.current, { opacity: 1, ease: 'power2.out', duration: 0.9 }, 0.05);

      // Pinned Main Sequence (280vh of scroll, scrub: 1)
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          start: 'top top',
          end: '+=280%',
          pin: true,
          scrub: 1,
          anticipatePin: 1,
          onToggle: (self) => {
            section.classList.toggle('is-pinned', self.isActive);
          },
          onUpdate: (self) => {
            const prev = prevProgressRef.current;
            const curr = self.progress;
            if (prev < 0.62 && curr >= 0.62 && spawnBurstRef.current) {
              spawnBurstRef.current();
            }
            prevProgressRef.current = curr;
          },
        },
      });

      // Phase 1 (0.00 -> 0.18): Subtle depth drift while scattered
      slots.forEach((slot, i) => {
        const preset = SCATTER_PRESETS[i % SCATTER_PRESETS.length];
        const wideSpreadX = (i - (slots.length - 1) / 2) * wideSpreadStep;

        tl.to(
          slot,
          {
            x: preset.x * scatterScale * 0.82 + wideSpreadX,
            y: preset.y * scatterScale * 0.82,
            z: preset.z * scatterScale * 0.78,
            opacity: 0.38,
            duration: 0.18,
            ease: 'none',
          },
          0
        );
      });

      // Phase 2 (0.18 -> 0.62): Converge left-to-right, morph wght/wdth, crossfade cold -> heat
      const count = slots.length;
      const letterDur = 0.185;
      const staggerStep = count > 1 ? (0.44 - letterDur) / (count - 1) : 0;

      slots.forEach((slot, i) => {
        const startAt = 0.18 + i * staggerStep;

        tl.to(
          slot,
          {
            x: 0,
            y: 0,
            z: 0,
            rotation: 0,
            rotationX: 0,
            rotationY: 0,
            opacity: 1,
            duration: letterDur,
            ease: 'power3.out',
          },
          startAt
        );

        tl.to(
          axisProxies[i],
          {
            wght: 800,
            wdth: targetWdth,
            duration: letterDur,
            ease: 'power2.inOut',
            onUpdate: () => applyAxes(i),
          },
          startAt
        );

        tl.to(
          colds[i],
          {
            opacity: 0,
            duration: letterDur * 0.72,
            ease: 'power2.inOut',
          },
          startAt + letterDur * 0.24
        );

        tl.to(
          hots[i],
          {
            opacity: 1,
            duration: letterDur * 0.72,
            ease: 'power2.inOut',
          },
          startAt + letterDur * 0.24
        );
      });

      // Phase 3 (0.62 -> 0.78): Whole-word punch (1 -> 1.04 -> 1) + soft radial flash
      tl.to(
        wordRigRef.current,
        {
          scale: 1.04,
          duration: 0.05,
          ease: 'power2.out',
        },
        0.62
      )
        .to(
          wordRigRef.current,
          {
            scale: 1,
            duration: 0.09,
            ease: 'power2.inOut',
          },
          0.67
        )
        .to(
          flashRef.current,
          {
            opacity: 0.85,
            duration: 0.04,
            ease: 'power2.out',
          },
          0.62
        )
        .to(
          flashRef.current,
          {
            opacity: 0,
            duration: 0.12,
            ease: 'power2.inOut',
          },
          0.66
        )
        .to(
          glowRef.current,
          {
            opacity: 1,
            duration: 0.1,
            ease: 'power2.out',
          },
          0.65
        );

      // Phase 4 (0.78 -> 1.00): Hold fully lit with faint flicker glow, then release
      tl.to({}, { duration: 0.22 }, 0.78);
    }, section);

    return () => {
      section.classList.remove('is-pinned');
      ctx.revert();
    };
  }, [letters, prefersReducedMotion]);

  return (
    <div className="btc-seamless-bridge">
      <section
        ref={sectionRef}
        className={`btc-morph-section ${!isInView ? 'is-offscreen' : ''} ${
          prefersReducedMotion ? 'is-reduced-motion' : ''
        }`}
        aria-label={`${prefix} ${word}`}
      >
        {/* Faint Flicker Glow Behind Lit Word */}
        <div ref={glowRef} className="btc-flicker-glow" aria-hidden="true">
          <div className="btc-flicker-core" />
        </div>

        {/* Soft Radial Flash Overlay */}
        <div ref={flashRef} className="btc-flash-overlay" aria-hidden="true" />

        {/* Embers Canvas */}
        {!prefersReducedMotion && (
          <canvas ref={emberCanvasRef} className="btc-embers-canvas" aria-hidden="true" />
        )}

        {/* Centered Stage Positioned Higher to Eliminate Excess Top Void */}
        <div className="btc-stage">
          <p ref={prefixRef} className="btc-prefix">
            {prefix}
          </p>

          <div ref={entryFadeRef} className="btc-entry-fade">
            <div ref={wordRigRef} className="btc-word-rig">
              <h2 className="btc-change-word" aria-label={word}>
                {letters.map((char, idx) => (
                  <span
                    key={`${char}-${idx}`}
                    ref={(el) => (letterSlotRefs.current[idx] = el)}
                    className="btc-letter-slot"
                    aria-hidden="true"
                  >
                    <span
                      ref={(el) => (coldCopyRefs.current[idx] = el)}
                      className="btc-letter-copy btc-letter-cold"
                    >
                      {char}
                    </span>
                    <span
                      ref={(el) => (hotCopyRefs.current[idx] = el)}
                      className="btc-letter-copy btc-letter-hot"
                    >
                      {char}
                    </span>
                  </span>
                ))}
              </h2>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default ThemeSection;