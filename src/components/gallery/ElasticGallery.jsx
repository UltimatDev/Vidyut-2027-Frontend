import React, { useState, useEffect, useLayoutEffect, useRef, useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { GALLERY_IMAGES, MARQUEE_ROWS } from './galleryConfig';
import './ElasticGallery.css';

const WINDOW_RADIUS = 5; // Renders 11 slots total (-5 .. +5) regardless of folder image count
const SLOT_OFFSETS = Array.from({ length: WINDOW_RADIUS * 2 + 1 }, (_, i) => i - WINDOW_RADIUS);

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function getCardMetrics(distance, isMobile, hoverBoost) {
  const heroW = isMobile ? 265 : 580;
  const heroH = isMobile ? 280 : 420;
  const sideW1 = isMobile ? 76 : 156;
  const sideW2 = isMobile ? 30 : 60;
  const sideW3 = isMobile ? 13 : 24;
  const sideH = isMobile ? 225 : 336;
  const baseGap = isMobile ? 8 : 14;

  const swellW = hoverBoost * (isMobile ? 10 : 20);
  const swellH = hoverBoost * (isMobile ? 6 : 12);

  if (distance <= 1) {
    return {
      width: lerp(heroW, sideW1, distance) + swellW * distance,
      height: lerp(heroH, sideH, distance) + swellH * distance,
      gap: baseGap,
      desaturate: Math.max(0, distance - hoverBoost * 0.25),
      dim: lerp(0, 0.24, distance) * (1 - hoverBoost * 0.4),
      opacity: 1
    };
  }

  if (distance <= 2) {
    const t = distance - 1;
    return {
      width: lerp(sideW1, sideW2, t) + swellW,
      height: sideH + swellH,
      gap: baseGap,
      desaturate: Math.max(0, 1 - hoverBoost * 0.25),
      dim: lerp(0.24, 0.4, t) * (1 - hoverBoost * 0.4),
      opacity: 1
    };
  }

  if (distance <= 3) {
    const t = distance - 2;
    return {
      width: lerp(sideW2, sideW3, t) + swellW * 0.7,
      height: sideH + swellH * 0.7,
      gap: baseGap,
      desaturate: Math.max(0, 1 - hoverBoost * 0.25),
      dim: lerp(0.4, 0.54, t) * (1 - hoverBoost * 0.4),
      opacity: 1
    };
  }

  if (distance <= 3.75) {
    const t = (distance - 3) / 0.75;
    return {
      width: lerp(sideW3, 0, t),
      height: sideH,
      gap: lerp(baseGap, 0, t),
      desaturate: 1,
      dim: 0.56,
      opacity: lerp(1, 0, t)
    };
  }

  return {
    width: 0,
    height: sideH,
    gap: 0,
    desaturate: 1,
    dim: 0.56,
    opacity: 0
  };
}

export default function ElasticGallery() {
  const setLength = GALLERY_IMAGES.length;

  const [activeIndex, setActiveIndex] = useState(0);
  const [anchorIndex, setAnchorIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [isInView, setIsInView] = useState(false);

  const rootRef = useRef(null);
  const trackRef = useRef(null);
  const cardRefs = useRef(new Map());
  const desatRefs = useRef(new Map());
  const dimRefs = useRef(new Map());
  const hoverAmountsRef = useRef(new Map());

  const targetPosRef = useRef(0);
  const currentPosRef = useRef(0);
  const velocityPosRef = useRef(0);
  const activeIndexRef = useRef(0);
  const anchorIndexRef = useRef(0);
  const hoveredVIdxRef = useRef(null);

  const rafIdRef = useRef(null);
  const lastTimeRef = useRef(0);

  const isDraggingRef = useRef(false);
  const dragStartXRef = useRef(0);
  const dragStartPosRef = useRef(0);
  const dragMovedRef = useRef(false);

  // Apply exact geometry & compositor opacities for the 11 active virtual slots
  const applyLayout = useCallback((pos, dt) => {
    const vw = window.innerWidth;
    const mobile = vw < 768;
    const anchor = anchorIndexRef.current;
    const hoverLerp = dt > 0 ? 1 - Math.exp(-14 * dt) : 1;

    let hoverStillMoving = false;
    let cursor = 0;
    let focusX = 0;

    for (let idx = 0; idx < SLOT_OFFSETS.length; idx++) {
      const offset = SLOT_OFFSETS[idx];
      const vIdx = anchor + offset;

      const targetHover =
        !isDraggingRef.current && hoveredVIdxRef.current === vIdx && vIdx !== activeIndexRef.current
          ? 1
          : 0;
      const prevHover = hoverAmountsRef.current.get(vIdx) ?? 0;
      const nextHover = prevHover + (targetHover - prevHover) * hoverLerp;

      if (Math.abs(targetHover - nextHover) > 0.005) {
        hoverStillMoving = true;
      }
      hoverAmountsRef.current.set(vIdx, Math.abs(nextHover) < 0.001 ? 0 : nextHover);

      const dist = Math.abs(vIdx - pos);
      const m = getCardMetrics(dist, mobile, nextHover);
      const center = cursor + m.width * 0.5;
      cursor += m.width + m.gap;

      // Interpolate track focal center around `pos`
      const floorPos = Math.floor(pos);
      if (vIdx === floorPos) {
        focusX += center * (1 - (pos - floorPos));
      } else if (vIdx === floorPos + 1) {
        focusX += center * (pos - floorPos);
      }

      const cardEl = cardRefs.current.get(vIdx);
      if (cardEl) {
        cardEl.style.width = `${m.width.toFixed(1)}px`;
        cardEl.style.height = `${m.height.toFixed(1)}px`;
        cardEl.style.marginRight = `${m.gap.toFixed(1)}px`;
        cardEl.style.opacity = m.opacity.toFixed(3);
        cardEl.style.pointerEvents = m.width > 6 ? 'auto' : 'none';
      }

      const desatEl = desatRefs.current.get(vIdx);
      if (desatEl) {
        desatEl.style.opacity = m.desaturate.toFixed(3);
      }

      const dimEl = dimRefs.current.get(vIdx);
      if (dimEl) {
        dimEl.style.opacity = m.dim.toFixed(3);
      }
    }

    if (trackRef.current) {
      const translateX = vw * 0.5 - focusX;
      trackRef.current.style.transform = `translate3d(${translateX.toFixed(1)}px, 0, 0)`;
    }

    return hoverStillMoving;
  }, []);

  // On-demand spring loop: automatically sleeps when settled so idle CPU = 0%
  const startSpringLoop = useCallback(() => {
    if (rafIdRef.current !== null) return;
    lastTimeRef.current = performance.now();

    const tick = (now) => {
      const dt = Math.min((now - lastTimeRef.current) / 1000, 0.05);
      lastTimeRef.current = now;

      let springMoving = false;

      if (!isDraggingRef.current) {
        const displacement = targetPosRef.current - currentPosRef.current;

        if (Math.abs(displacement) > 0.0005 || Math.abs(velocityPosRef.current) > 0.0005) {
          springMoving = true;
          const stiffness = 135;
          const damping = 18.5;
          const accel = displacement * stiffness - velocityPosRef.current * damping;

          velocityPosRef.current += accel * dt;
          currentPosRef.current += velocityPosRef.current * dt;
        } else {
          currentPosRef.current = targetPosRef.current;
          velocityPosRef.current = 0;
        }
      }

      const nextAnchor = Math.floor(currentPosRef.current);
      if (nextAnchor !== anchorIndexRef.current) {
        anchorIndexRef.current = nextAnchor;
        setAnchorIndex(nextAnchor);
      }

      const hoverMoving = applyLayout(currentPosRef.current, dt);

      if (springMoving || hoverMoving || isDraggingRef.current) {
        rafIdRef.current = requestAnimationFrame(tick);
      } else {
        rafIdRef.current = null;
      }
    };

    rafIdRef.current = requestAnimationFrame(tick);
  }, [applyLayout]);

  // Synchronously position newly mounted edge slots before paint
  useLayoutEffect(() => {
    applyLayout(currentPosRef.current, 0);
  }, [anchorIndex, applyLayout]);

  // Recalculate on resize without running a continuous loop
  useEffect(() => {
    const handleResize = () => applyLayout(currentPosRef.current, 0);
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      if (rafIdRef.current !== null) cancelAnimationFrame(rafIdRef.current);
    };
  }, [applyLayout]);

  // IntersectionObserver: triggers entrance once & pauses background marquee when offscreen
  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsInView(entry.isIntersecting);
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.08 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Preload only immediate upcoming neighbor images (keeps RAM & CPU usage low)
  useEffect(() => {
    if (setLength <= 1) return;
    [-3, 3].forEach((step) => {
      const idx = (((activeIndex + step) % setLength) + setLength) % setLength;
      const preloader = new Image();
      preloader.decoding = 'async';
      preloader.src = GALLERY_IMAGES[idx].image;
    });
  }, [activeIndex, setLength]);

  const selectIndex = useCallback(
    (nextIdx) => {
      targetPosRef.current = nextIdx;
      activeIndexRef.current = nextIdx;
      setActiveIndex(nextIdx);
      startSpringLoop();
    },
    [startSpringLoop]
  );

  // Keyboard navigation when gallery is in view
  useEffect(() => {
    if (!isInView) return;
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowRight') {
        selectIndex(activeIndexRef.current + 1);
      } else if (e.key === 'ArrowLeft') {
        selectIndex(activeIndexRef.current - 1);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isInView, selectIndex]);

  // Pointer & Touch Drag Handlers
  const handlePointerDown = (e) => {
    isDraggingRef.current = true;
    dragMovedRef.current = false;
    velocityPosRef.current = 0;
    const x = e.clientX ?? (e.touches && e.touches[0].clientX) ?? 0;
    dragStartXRef.current = x;
    dragStartPosRef.current = currentPosRef.current;
    startSpringLoop();
  };

  const handlePointerMove = (e) => {
    if (!isDraggingRef.current) return;
    const x = e.clientX ?? (e.touches && e.touches[0].clientX) ?? 0;
    const dx = dragStartXRef.current - x;

    if (Math.abs(dx) > 6) {
      dragMovedRef.current = true;
    }

    const dragSensitivity = window.innerWidth < 768 ? 160 : 240;
    const nextPos = dragStartPosRef.current + dx / dragSensitivity;
    currentPosRef.current = nextPos;
    targetPosRef.current = nextPos;

    const nearest = Math.round(nextPos);
    if (nearest !== activeIndexRef.current) {
      activeIndexRef.current = nearest;
      setActiveIndex(nearest);
    }
  };

  const handlePointerUp = () => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;
    selectIndex(Math.round(currentPosRef.current));
  };

  const handleCardClick = (vIdx) => {
    if (dragMovedRef.current) return;
    if (vIdx !== activeIndexRef.current) {
      selectIndex(vIdx);
    }
  };

  return (
    <section
      ref={rootRef}
      className={`eg-root${isVisible ? ' is-visible' : ''}${isInView ? ' is-inview' : ''}`}
    >
      <div className="eg-nebula-left" />
      <div className="eg-nebula-right" />

      <div className="eg-marquee-layer" aria-hidden="true">
        {MARQUEE_ROWS.map((row, rowIdx) => (
          <div
            key={rowIdx}
            className={`eg-marquee-row style-${row.style} dir-${row.direction}`}
            style={{ animationDuration: `${row.duration}s` }}
          >
            <span className="eg-marquee-span">{row.text.repeat(3)}</span>
            <span className="eg-marquee-span">{row.text.repeat(3)}</span>
          </div>
        ))}
      </div>

      <div className="eg-fade-top" />
      <div className="eg-fade-bottom" />
      <div className="eg-bridge" aria-hidden="true" />

      <div
        className="eg-stage"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
      >
        <button
          type="button"
          className="eg-nav-btn eg-nav-prev"
          onClick={(e) => {
            e.stopPropagation();
            selectIndex(activeIndex - 1);
          }}
          aria-label="Previous image"
        >
          <ChevronLeft size={18} />
        </button>

        <button
          type="button"
          className="eg-nav-btn eg-nav-next"
          onClick={(e) => {
            e.stopPropagation();
            selectIndex(activeIndex + 1);
          }}
          aria-label="Next image"
        >
          <ChevronRight size={18} />
        </button>

        <div ref={trackRef} className="eg-track">
          {SLOT_OFFSETS.map((offset) => {
            const vIdx = anchorIndex + offset;
            const imgIdx = ((vIdx % setLength) + setLength) % setLength;
            const item = GALLERY_IMAGES[imgIdx];
            const isCenter = vIdx === activeIndex;
            const isPriority = Math.abs(offset) <= 2;

            return (
              <div
                key={vIdx}
                ref={(el) => {
                  if (el) cardRefs.current.set(vIdx, el);
                  else cardRefs.current.delete(vIdx);
                }}
                onMouseEnter={() => {
                  hoveredVIdxRef.current = vIdx;
                  startSpringLoop();
                }}
                onMouseLeave={() => {
                  if (hoveredVIdxRef.current === vIdx) {
                    hoveredVIdxRef.current = null;
                    startSpringLoop();
                  }
                }}
                onClick={() => handleCardClick(vIdx)}
                className={`eg-card${isCenter ? ' is-center' : ''}`}
              >
                <div
                  className="eg-card-inner"
                  style={{
                    transitionDelay: isVisible ? '0ms' : `${Math.abs(offset) * 55}ms`
                  }}
                >
                  <img
                    src={item.image}
                    alt=""
                    loading={isPriority ? 'eager' : 'lazy'}
                    decoding="async"
                    fetchPriority={isCenter ? 'high' : 'auto'}
                    className="eg-card-img"
                  />
                  <div
                    ref={(el) => {
                      if (el) desatRefs.current.set(vIdx, el);
                      else desatRefs.current.delete(vIdx);
                    }}
                    className="eg-card-desat"
                  />
                  <div
                    ref={(el) => {
                      if (el) dimRefs.current.set(vIdx, el);
                      else dimRefs.current.delete(vIdx);
                    }}
                    className="eg-card-dim"
                  />
                  <div className="eg-card-border" />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}