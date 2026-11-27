import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import './VidyutLogoBackdrop.css';

import defaultLogo from './logo.svg';

gsap.registerPlugin(ScrollTrigger);

const VidyutLogoBackdrop = ({ logoSrc = defaultLogo }) => {
  const containerRef = useRef(null);
  const scaleRigRef = useRef(null);
  const parallaxRigRef = useRef(null);
  const glowLayerRef = useRef(null);
  const outlineLayerRef = useRef(null);
  const fillLayerRef = useRef(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    let ctx;

    const initTimer = setTimeout(() => {
      ctx = gsap.context(() => {
        // Start clean & hidden in the Hero so it doesn't fight Theyyam
        gsap.set(containerRef.current, { autoAlpha: 1 });
        gsap.set(scaleRigRef.current, {
          scale: 0.78,
          rotation: 0,
          opacity: 0,
        });
        gsap.set(glowLayerRef.current, { opacity: 0.25 });
        gsap.set(outlineLayerRef.current, { opacity: 0.95 });
        gsap.set(fillLayerRef.current, { opacity: 0.15 });

        const heroEl = document.querySelector('.hero-scroll-runway');
        const themeEl = document.querySelector('.btc-pinned-section');
        const highlightsEl = document.querySelector('#highlights');

        // Timeline 1: Emerge cleanly as Hero fades out -> settle behind ThemeSection
        if (heroEl && themeEl) {
          const flyInTl = gsap.timeline({
            scrollTrigger: {
              trigger: heroEl,
              start: '25% top', // Begins emerging as the Hero starts dissolving
              endTrigger: themeEl,
              end: 'center center',
              scrub: 1,
              invalidateOnRefresh: true,
            },
          });

          flyInTl
            .to(
              scaleRigRef.current,
              {
                scale: 1.08, // Fits cleanly inside viewport without cropping
                opacity: 0.85,
                ease: 'power2.out',
                duration: 0.55,
              },
              0
            )
            .to(
              glowLayerRef.current,
              {
                opacity: 0.7,
                ease: 'power1.inOut',
                duration: 0.55,
              },
              0
            )
            .to(
              scaleRigRef.current,
              {
                scale: 0.92, // Settles neatly behind BE THE CHANGE
                opacity: 0.52,
                ease: 'power2.inOut',
                duration: 0.45,
              },
              0.55
            )
            .to(
              fillLayerRef.current,
              {
                opacity: 0.35,
                ease: 'power1.out',
                duration: 0.45,
              },
              0.55
            );
        }

        // Timeline 2: Fade out cleanly before #highlights
        if (highlightsEl) {
          gsap.fromTo(
            containerRef.current,
            { autoAlpha: 1 },
            {
              autoAlpha: 0,
              ease: 'none',
              immediateRender: false,
              scrollTrigger: {
                trigger: highlightsEl,
                start: 'top bottom',
                end: 'top 55%',
                scrub: true,
                invalidateOnRefresh: true,
              },
            }
          );
        }
      }, containerRef);

      ScrollTrigger.refresh();
    }, 80);

    // Subtle, crisp 2.5D Mouse Parallax (tighter offsets so layers don't look blurry/split)
    const handlePointerMove = (e) => {
      const nx = (e.clientX / window.innerWidth - 0.5) * 2;
      const ny = (e.clientY / window.innerHeight - 0.5) * 2;

      if (glowLayerRef.current) {
        glowLayerRef.current.style.transform = `translate3d(${nx * -8}px, ${ny * -6}px, 0)`;
      }
      if (outlineLayerRef.current) {
        outlineLayerRef.current.style.transform = `translate3d(${nx * 4}px, ${ny * 3}px, 0)`;
      }
      if (fillLayerRef.current) {
        fillLayerRef.current.style.transform = `translate3d(${nx * 8}px, ${ny * 6}px, 0)`;
      }
      if (parallaxRigRef.current) {
        parallaxRigRef.current.style.transform = `perspective(1100px) rotateY(${nx * 3.5}deg) rotateX(${-ny * 2.5}deg)`;
      }
    };

    window.addEventListener('pointermove', handlePointerMove, { passive: true });

    return () => {
      clearTimeout(initTimer);
      if (ctx) ctx.revert();
      window.removeEventListener('pointermove', handlePointerMove);
    };
  }, []);

  // Embers streaming out of the emblem
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let rafId;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const embers = Array.from({ length: 60 }, () => ({
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      size: 1.2,
      life: 0,
      maxLife: 100,
    }));

    const spawnEmber = (e) => {
      const cx = canvas.width * 0.5;
      const cy = canvas.height * 0.5;
      const angle = Math.random() * Math.PI * 2;
      const radius = Math.min(canvas.width, canvas.height) * (0.14 + Math.random() * 0.17);
      e.x = cx + Math.cos(angle) * radius;
      e.y = cy + Math.sin(angle) * radius;
      e.vx = Math.cos(angle) * (0.35 + Math.random() * 0.7) + (Math.random() - 0.5) * 0.4;
      e.vy = -(0.65 + Math.random() * 1.45);
      e.size = 1.1 + Math.random() * 2.2;
      e.life = 0;
      e.maxLife = 75 + Math.random() * 75;
    };

    embers.forEach((e) => {
      spawnEmber(e);
      e.life = Math.random() * e.maxLife;
    });

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.globalCompositeOperation = 'lighter';

      const scrollRatio = Math.min(Math.max(window.scrollY / (window.innerHeight * 0.85), 0), 1);

      if (scrollRatio > 0.08) {
        embers.forEach((e) => {
          e.life += 1;
          e.x += e.vx + Math.sin(e.life * 0.06) * 0.35;
          e.y += e.vy;

          if (e.life >= e.maxLife) {
            spawnEmber(e);
          }

          const progress = e.life / e.maxLife;
          const fade = Math.sin(progress * Math.PI) * scrollRatio;

          ctx.fillStyle =
            progress < 0.35
              ? `rgba(255, 232, 165, ${fade * 0.85})`
              : `rgba(255, 98, 24, ${fade * 0.7})`;
          ctx.beginPath();
          ctx.arc(e.x, e.y, e.size, 0, Math.PI * 2);
          ctx.fill();
        });
      }

      ctx.globalCompositeOperation = 'source-over';
      rafId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <div ref={containerRef} className="vidyut-fixed-logo-backdrop" aria-hidden="true">
      <canvas ref={canvasRef} className="vidyut-logo-embers-canvas" />

      <div ref={scaleRigRef} className="vidyut-logo-scale-rig">
        <div ref={parallaxRigRef} className="vidyut-logo-25d-rig">
          {/* Layer 1: Warm Ember Halo */}
          <div ref={glowLayerRef} className="vidyut-logo-plane layer-glow">
            <img src={logoSrc} alt="" className="vidyut-logo-img" />
          </div>

          {/* Layer 2: Crisp Outlined / Edge-Lit Logo + Light Sweep */}
          <div ref={outlineLayerRef} className="vidyut-logo-plane layer-outline">
            <img src={logoSrc} alt="" className="vidyut-logo-img" />
            <div className="vidyut-logo-light-sweep" />
          </div>

          {/* Layer 3: Inner Fill Depth Plane */}
          <div ref={fillLayerRef} className="vidyut-logo-plane layer-fill">
            <img src={logoSrc} alt="" className="vidyut-logo-img" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default VidyutLogoBackdrop;