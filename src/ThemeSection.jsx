import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import './ThemeSection.css';
import themeData from './themeConfig.json';

gsap.registerPlugin(ScrollTrigger);

const ThemeSection = () => {
  const sectionRef = useRef(null);
  const contentRef = useRef(null);
  const watermarkRef = useRef(null);
  const eyebrowRef = useRef(null);
  const fixedWordRef = useRef(null);
  const highlightWordRef = useRef(null);
  const ctaRef = useRef(null);

  // GSAP ScrollTrigger Pinned Reveal (pin: true, scrub: 1)
  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top top',
          end: '+=135%',
          pin: true,
          scrub: 1,
          anticipatePin: 1,
        },
      });

      gsap.set(watermarkRef.current, { opacity: 0, scale: 0.9, letterSpacing: '0.26em' });
      gsap.set(eyebrowRef.current, { opacity: 0, y: 20 });
      gsap.set(fixedWordRef.current, { opacity: 0, y: 36 });
      gsap.set(highlightWordRef.current, {
        opacity: 0,
        y: 44,
        scale: 0.94,
      });
      gsap.set(ctaRef.current, { opacity: 0, y: 22 });

      tl.to(
        watermarkRef.current,
        {
          opacity: 1,
          scale: 1,
          letterSpacing: '0.18em',
          duration: 0.4,
          ease: 'power2.out',
        },
        0
      )
        .to(
          eyebrowRef.current,
          {
            opacity: 1,
            y: 0,
            duration: 0.3,
            ease: 'power2.out',
          },
          0.08
        )
        .to(
          fixedWordRef.current,
          {
            opacity: 1,
            y: 0,
            duration: 0.4,
            ease: 'power3.out',
          },
          0.14
        )
        .to(
          highlightWordRef.current,
          {
            opacity: 1,
            y: 0,
            scale: 1,
            duration: 0.48,
            ease: 'power3.out',
          },
          0.22
        )
        .to(
          ctaRef.current,
          {
            opacity: 1,
            y: 0,
            duration: 0.32,
            ease: 'power2.out',
          },
          0.38
        )
        .to(
          contentRef.current,
          {
            y: -22,
            duration: 0.3,
            ease: 'none',
          },
          0.7
        );
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  const highlightText = themeData.highlightWord || 'CHANGE';

  return (
    <section
      ref={sectionRef}
      className="btc-pinned-section"
      aria-label={`${themeData.fixedPrefix} ${highlightText}`}
    >
      {/* Subtle dark outer vignette keeping the center transparent for the glowing 2.5D logo */}
      <div className="btc-radial-vignette" aria-hidden="true" />

      <div ref={contentRef} className="btc-pinned-stage">
        {/* Wide Letter-Spaced Outlined "2027" Behind Headline */}
        <div ref={watermarkRef} className="btc-year-outline" aria-hidden="true">
          {themeData.yearWatermark || '2027'}
        </div>

        {/* Main Typographic Lockup */}
        <div className="btc-headline-block">
          <span ref={eyebrowRef} className="btc-eyebrow">
            {themeData.eyebrow}
          </span>

          <h2 className="btc-main-heading">
            <span ref={fixedWordRef} className="btc-fixed-phrase">
              {themeData.fixedPrefix}
            </span>

            {/* Highlighted "CHANGE" with full vertical/horizontal clearance (no clipping) */}
            <span ref={highlightWordRef} className="btc-highlight-wrap">
              <span className="btc-highlight-word" data-text={highlightText}>
                {highlightText}
              </span>
              <span className="btc-highlight-underline" aria-hidden="true" />
            </span>
          </h2>
        </div>

        {/* Button-Styled CTA with Arrow Motion on Hover */}
        {themeData.ctaText && (
          <div ref={ctaRef} className="btc-cta-wrapper">
            <a href={themeData.ctaLink || '#vision'} className="btc-vision-btn">
              <span className="btc-btn-text">{themeData.ctaText}</span>
              <span className="btc-btn-arrow" aria-hidden="true">
                →
              </span>
            </a>
          </div>
        )}
      </div>
    </section>
  );
};

export default ThemeSection;