import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { GALLERY_ITEMS, TICKER_TOP, TICKER_BOTTOM } from './galleryConfig';
import './ElasticGallery.css';

export default function ElasticGallery() {
  const total = GALLERY_ITEMS.length;
  const [activeIndex, setActiveIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  const sectionRef = useRef(null);
  const topTickerRef = useRef(null);
  const bottomTickerRef = useRef(null);
  const stageRef = useRef(null);

  const activeIndexRef = useRef(0);
  const targetProgressRef = useRef(0);
  const currentProgressRef = useRef(0);
  const rafIdRef = useRef(null);
  const preloadedSetRef = useRef(new Set());

  // Preload & off-thread decode only immediate neighbor frames
  useEffect(() => {
    if (total <= 1) return;
    [activeIndex - 1, activeIndex + 1].forEach((rawIdx) => {
      const idx = ((rawIdx % total) + total) % total;
      const src = GALLERY_ITEMS[idx]?.image;
      if (!src || preloadedSetRef.current.has(src)) return;

      preloadedSetRef.current.add(src);
      const img = new Image();
      img.decoding = 'async';
      img.src = src;
      img.decode?.().catch(() => {});
    });
  }, [activeIndex, total]);

  // Passive scroll listener + on-demand rAF ticker smoother
  useEffect(() => {
    if (total === 0) return;

    const updateFrame = () => {
      const target = targetProgressRef.current;
      const current = currentProgressRef.current;
      const delta = target - current;

      const next = Math.abs(delta) < 0.0002 ? target : current + delta * 0.14;
      currentProgressRef.current = next;

      // 1. Scrub opposing marquee rows via GPU translate3d
      const shiftPx = next * Math.max(420, total * 130);
      if (topTickerRef.current) {
        topTickerRef.current.style.transform = `translate3d(-${shiftPx.toFixed(1)}px, 0, 0)`;
      }
      if (bottomTickerRef.current) {
        bottomTickerRef.current.style.transform = `translate3d(${(shiftPx - 360).toFixed(1)}px, 0, 0)`;
      }

      // 2. Smooth exit dissolve in the final 12% of scroll into the footer
      if (stageRef.current) {
        if (next > 0.88) {
          const exitT = (next - 0.88) / 0.12;
          stageRef.current.style.opacity = Math.max(0, 1 - exitT * 0.85).toFixed(3);
          stageRef.current.style.transform = `translate3d(0, ${(-exitT * 24).toFixed(1)}px, 0)`;
        } else {
          stageRef.current.style.opacity = '1';
          stageRef.current.style.transform = 'translate3d(0, 0, 0)';
        }
      }

      // 3. Hard-cut active slide only when crossing a frame boundary
      const nextIdx = Math.min(total - 1, Math.max(0, Math.floor(next * total)));
      if (nextIdx !== activeIndexRef.current) {
        activeIndexRef.current = nextIdx;
        setActiveIndex(nextIdx);
      }

      if (Math.abs(target - next) > 0.0002) {
        rafIdRef.current = requestAnimationFrame(updateFrame);
      } else {
        rafIdRef.current = null;
      }
    };

    const onScroll = () => {
      const el = sectionRef.current;
      if (!el) return;

      const rect = el.getBoundingClientRect();
      const vh = window.innerHeight;

      if (rect.top > vh + 100 && currentProgressRef.current === 0) return;
      if (rect.bottom < -100 && currentProgressRef.current === 1) return;

      const scrollable = Math.max(1, el.offsetHeight - vh);
      const raw = -rect.top / scrollable;
      targetProgressRef.current = Math.max(0, Math.min(1, raw));

      if (rafIdRef.current === null) {
        rafIdRef.current = requestAnimationFrame(updateFrame);
      }
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    return () => {
      window.removeEventListener('scroll', onScroll);
      if (rafIdRef.current !== null) cancelAnimationFrame(rafIdRef.current);
    };
  }, [total]);

  // Smooth scroll to a specific frame when clicking a filmstrip tick
  const jumpToFrame = (idx) => {
    const el = sectionRef.current;
    if (!el || total === 0) return;

    const sectionTop = window.scrollY + el.getBoundingClientRect().top;
    const scrollable = Math.max(1, el.offsetHeight - window.innerHeight);
    const targetProgress = (idx + 0.5) / total;

    window.scrollTo({
      top: sectionTop + targetProgress * scrollable,
      behavior: 'smooth'
    });
  };

  // Keyboard navigation when lightbox is open
  useEffect(() => {
    if (!lightboxOpen || total === 0) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const onKeyDown = (e) => {
      if (e.key === 'Escape') {
        setLightboxOpen(false);
      } else if (e.key === 'ArrowRight') {
        setActiveIndex((prev) => {
          const next = (prev + 1) % total;
          activeIndexRef.current = next;
          return next;
        });
      } else if (e.key === 'ArrowLeft') {
        setActiveIndex((prev) => {
          const next = (prev - 1 + total) % total;
          activeIndexRef.current = next;
          return next;
        });
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [lightboxOpen, total]);

  if (total === 0) return null;

  const activeItem = GALLERY_ITEMS[activeIndex] || GALLERY_ITEMS[0];
  const runwayHeight = `${Math.max(180, total * 40)}vh`;
  const formattedCurrent = String(activeIndex + 1).padStart(2, '0');
  const formattedTotal = String(total).padStart(2, '0');

  return (
    <section
      ref={sectionRef}
      className="vp-section"
      style={{ height: runwayHeight }}
    >
      <div className="vp-sticky">
        <div className="vp-ambient" aria-hidden="true" />
        <div className="vp-fade-top" aria-hidden="true" />
        <div className="vp-fade-bottom" aria-hidden="true" />

        {/* Opposing Kinetic Typography Ticker */}
        <div className="vp-ticker-layer" aria-hidden="true">
          <div ref={topTickerRef} className="vp-ticker-row is-top">
            <span className="vp-ticker-span">{TICKER_TOP.repeat(4)}</span>
          </div>
          <div ref={bottomTickerRef} className="vp-ticker-row is-bottom">
            <span className="vp-ticker-span">{TICKER_BOTTOM.repeat(4)}</span>
          </div>
        </div>

        {/* Pinned 35mm Viewport Frame */}
        <div ref={stageRef} className="vp-stage">
          <div
            className="vp-frame"
            onClick={() => setLightboxOpen(true)}
          >
            <span className="vp-corner tl" aria-hidden="true" />
            <span className="vp-corner tr" aria-hidden="true" />
            <span className="vp-corner bl" aria-hidden="true" />
            <span className="vp-corner br" aria-hidden="true" />

            <img
              key={activeItem.id}
              src={activeItem.image}
              alt=""
              decoding="async"
              className="vp-img"
            />
          </div>

          {/* Minimalist Frame Counter & Interactive Scrubber Ticks */}
          <div className="vp-hud">
            <span className="vp-counter">
              {formattedCurrent} / {formattedTotal}
            </span>

            <div className="vp-ticks" role="tablist" aria-label="Gallery frames">
              {GALLERY_ITEMS.map((item, idx) => (
                <button
                  key={item.id}
                  type="button"
                  className={`vp-tick${idx === activeIndex ? ' is-active' : ''}`}
                  onClick={() => jumpToFrame(idx)}
                  aria-label={`Frame ${idx + 1}`}
                >
                  <span className="vp-tick-bar" />
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Portaled Fullscreen Lightbox */}
      {lightboxOpen &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            className="vp-lightbox"
            onClick={() => setLightboxOpen(false)}
          >
            <button
              type="button"
              className="vp-lb-btn vp-lb-close"
              onClick={() => setLightboxOpen(false)}
              aria-label="Close image"
            >
              <X size={18} />
            </button>

            <button
              type="button"
              className="vp-lb-btn vp-lb-prev"
              onClick={(e) => {
                e.stopPropagation();
                const next = (activeIndex - 1 + total) % total;
                activeIndexRef.current = next;
                setActiveIndex(next);
              }}
              aria-label="Previous image"
            >
              <ChevronLeft size={20} />
            </button>

            <img
              src={activeItem.image}
              alt=""
              className="vp-lightbox-img"
              onClick={(e) => e.stopPropagation()}
            />

            <button
              type="button"
              className="vp-lb-btn vp-lb-next"
              onClick={(e) => {
                e.stopPropagation();
                const next = (activeIndex + 1) % total;
                activeIndexRef.current = next;
                setActiveIndex(next);
              }}
              aria-label="Next image"
            >
              <ChevronRight size={20} />
            </button>
          </div>,
          document.body
        )}
    </section>
  );
}