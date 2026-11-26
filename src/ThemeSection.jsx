import React, { useEffect, useRef, useState } from 'react';
import './ThemeSection.css';
import themeData from './themeConfig.json';

const ThemeSection = () => {
  const sectionRef = useRef(null);
  const canvasRef = useRef(null);
  const [inView, setInView] = useState(false);

  // Intersection Observer for cinematic reveal
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
        }
      },
      { threshold: 0.2 }
    );

    const currentSection = sectionRef.current;
    if (currentSection) {
      observer.observe(currentSection);
    }

    return () => {
      if (currentSection) {
        observer.unobserve(currentSection);
      }
    };
  }, []);

  // High-FPS Cinematic Torchlight, Smoke & Rising Spark Engine (No external images needed)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;

    const resize = () => {
      const rect = canvas.parentElement.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    resize();
    window.addEventListener('resize', resize);

    // Generate organic sparks & drifting ash
    const particles = Array.from({ length: 65 }, (_, i) => ({
      x: Math.random() * 1400,
      y: Math.random() * 800,
      vx: (Math.random() - 0.5) * 0.45,
      vy: -(0.35 + Math.random() * 1.15),
      size: i % 5 === 0 ? 2.2 : 0.8 + Math.random() * 1.2,
      alpha: 0.15 + Math.random() * 0.75,
      phase: Math.random() * Math.PI * 2,
      isHot: i % 3 === 0,
    }));

    let time = 0;

    const render = () => {
      time += 0.016;
      const width = canvas.parentElement.clientWidth;
      const height = canvas.parentElement.clientHeight;

      ctx.clearRect(0, 0, width, height);

      // 1. Dramatic Left-Center Torch Core & Volumetric Beam (inspired by reference lighting)
      const torchX = width * 0.34 + Math.sin(time * 1.7) * 6;
      const torchY = height * 0.62 + Math.cos(time * 2.1) * 4;

      // Wide volumetric light cone sweeping up-right across the typography
      ctx.save();
      const beamGrad = ctx.createRadialGradient(
        torchX,
        torchY,
        10,
        torchX + width * 0.12,
        torchY - height * 0.15,
        Math.max(width, height) * 0.65
      );
      beamGrad.addColorStop(0, 'rgba(255, 196, 110, 0.22)');
      beamGrad.addColorStop(0.25, 'rgba(217, 82, 24, 0.11)');
      beamGrad.addColorStop(0.55, 'rgba(92, 24, 12, 0.04)');
      beamGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = beamGrad;
      ctx.fillRect(0, 0, width, height);
      ctx.restore();

      // Intense white-gold flare core (mimicking the torch hotspot in the reference)
      const coreRadius = 95 + Math.sin(time * 5.2) * 8;
      const coreGrad = ctx.createRadialGradient(torchX, torchY, 0, torchX, torchY, coreRadius);
      coreGrad.addColorStop(0, 'rgba(255, 248, 225, 0.35)');
      coreGrad.addColorStop(0.3, 'rgba(255, 145, 40, 0.16)');
      coreGrad.addColorStop(1, 'rgba(255, 80, 0, 0)');
      ctx.fillStyle = coreGrad;
      ctx.beginPath();
      ctx.arc(torchX, torchY, coreRadius, 0, Math.PI * 2);
      ctx.fill();

      // 2. Drifting Volumetric Smoke Wisps
      for (let s = 0; s < 3; s++) {
        const smokeX = width * (0.35 + s * 0.16) + Math.sin(time * 0.35 + s) * 45;
        const smokeY = height * (0.48 + (s % 2) * 0.12) + Math.cos(time * 0.28 + s) * 20;
        const smokeR = Math.min(width, height) * (0.35 + s * 0.08);
        const smokeGrad = ctx.createRadialGradient(smokeX, smokeY, 0, smokeX, smokeY, smokeR);
        smokeGrad.addColorStop(0, 'rgba(180, 145, 115, 0.045)');
        smokeGrad.addColorStop(0.5, 'rgba(90, 55, 35, 0.02)');
        smokeGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = smokeGrad;
        ctx.fillRect(0, 0, width, height);
      }

      // 3. Rising Embers & Glowing Dust Motes
      particles.forEach((p) => {
        p.x += p.vx + Math.sin(time * 1.4 + p.phase) * 0.25;
        p.y += p.vy;

        if (p.y < -10) {
          p.y = height + 10;
          p.x = width * (0.15 + Math.random() * 0.7);
        }
        if (p.x < 0) p.x = width;
        if (p.x > width) p.x = 0;

        const flicker = 0.65 + 0.35 * Math.sin(time * 6 + p.phase);
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = p.isHot
          ? `rgba(255, 220, 150, ${p.alpha * flicker})`
          : `rgba(255, 115, 35, ${p.alpha * 0.65 * flicker})`;
        ctx.fill();
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <section
      ref={sectionRef}
      className={`btc-cinema-section ${inView ? 'is-visible' : ''}`}
      aria-label={themeData.themeTitle}
    >
      {/* Top Blend Seam from HeroParallax */}
      <div className="btc-top-seam" aria-hidden="true" />

      {/* Procedural Torchlight, Smoke & Sparks Canvas */}
      <canvas ref={canvasRef} className="btc-atmosphere-canvas" aria-hidden="true" />

      {/* Architectural Stone Relief Silhouette (Zero external images) */}
      <div className="btc-relief-backdrop" aria-hidden="true">
        <div className="btc-monolith-beam" />
        <div className="btc-bokeh-orbs">
          <span className="btc-orb orb-1" />
          <span className="btc-orb orb-2" />
          <span className="btc-orb orb-3" />
          <span className="btc-orb orb-4" />
        </div>
      </div>

      {/* Vignette Framing (Pure black edges like the reference frame) */}
      <div className="btc-cinema-vignette" aria-hidden="true" />

      {/* Foreground Typographic Lockup (Matches Reference Composition) */}
      <div className="btc-stage-content">
        <h2 className="btc-editorial-headline" aria-label={themeData.themeTitle}>
          <span className="btc-word-group btc-solid-group">
            {themeData.primaryPhrase.split('').map((char, idx) => (
              <span
                key={idx}
                className="btc-glyph"
                style={{ '--idx': idx }}
              >
                {char === ' ' ? '\u00A0' : char}
              </span>
            ))}
          </span>

          <span className="btc-word-group btc-italic-group">
            {themeData.accentPhrase.split('').map((char, idx) => (
              <span
                key={idx}
                className="btc-glyph"
                style={{ '--idx': idx + themeData.primaryPhrase.length }}
              >
                {char === ' ' ? '\u00A0' : char}
              </span>
            ))}
          </span>
        </h2>

        {themeData.ctaText && (
          <a href={themeData.ctaLink || '#'} className="btc-legacy-cta">
            <span className="btc-cta-label">{themeData.ctaText}</span>
            <span className="btc-cta-arrow" aria-hidden="true">↗</span>
          </a>
        )}
      </div>

      {/* Bottom Blend Seam */}
      <div className="btc-bottom-seam" aria-hidden="true" />
    </section>
  );
};

export default ThemeSection;