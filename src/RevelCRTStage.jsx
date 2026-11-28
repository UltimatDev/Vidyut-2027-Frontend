import React, { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { DEFAULT_REVEL_LINEUP } from "./revelLineupConfig";
import oldTvFrameImg from "./old-tv-frame.png";

gsap.registerPlugin(ScrollTrigger);

// ============================================================================
// DIMENSION & LAYOUT CONFIG
// ============================================================================
export const TV_DIMENSIONS = {
  desktopWidth: "min(38vw, 490px)",
  mobileWidth: "min(80vw, 330px)",
  aspectRatio: "1 / 1",
  desktopLeft: "5vw",
  desktopTop: "50%",
  mobileTop: "11vh",
  tiltY: 12,
  tiltX: 2,
  dockScale: 0.54,
  heightStretch: 1.18,
  dockOffsetX: -68,
  dockOffsetY: 0,
};

export const SCREEN_HOLE_DIMENSIONS = {
  left: 8.7,
  top: 32.4,
  width: 57.8,
  height: 47.4,
  radius: 26,
};

export const LINEUP_CARD_DIMENSIONS = {
  panelWidth: "min(46vw, 620px)",
  stageHeight: "clamp(300px, 46vh, 420px)",
  cardWidth: "clamp(190px, 17vw, 240px)",
  mobileCardWidth: "152px",
  mobileStageHeight: "225px",
  cardSpreadPercent: 74,
  cardDeckScale: 0.97,
};
// ============================================================================

const STACK_PATTERN = ["o", "f", "f", "o", "f", "o", "f", "f", "o", "f", "o", "f", "f", "o"];
const STACK_ROWS = STACK_PATTERN.map((style, i, arr) => {
  const t = i / (arr.length - 1);
  const lerp = (a, b) => Math.round(a + (b - a) * t);
  return {
    style,
    height: Math.max(1.2, 11 - i * 0.8),
    color: `rgb(${lerp(255, 140)}, ${lerp(40, 8)}, ${lerp(55, 35)})`,
    opacity: 1 - t * 0.5,
    dir: i % 2 === 0 ? 1 : -1,
    duration: 26 + (i % 5) * 4,
  };
});

function PerformerSilhouette({ index }) {
  return (
    <svg
      viewBox="0 0 240 280"
      fill="none"
      aria-hidden="true"
      style={{
        width: "80%",
        height: "72%",
        position: "absolute",
        bottom: 0,
        right: "3%",
        opacity: 0.38,
        pointerEvents: "none",
      }}
    >
      <defs>
        <linearGradient id={`silGrad-${index}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#1c0407" />
          <stop offset="100%" stopColor="#070102" />
        </linearGradient>
      </defs>
      {index === 0 ? (
        <path
          d="M128 36c13 0 23 10 23 23s-10 23-23 23-23-10-23-23 10-23 23-23zm-46 56l42-6 48-24 14 17-42 32 10 54 34 68-22 10-32-56-24 58-23-9 25-72-12-40-36 14-10-20 28-26z"
          fill={`url(#silGrad-${index})`}
        />
      ) : index === 1 ? (
        <path
          d="M132 34c14 0 24 11 24 24s-10 24-24 24-24-11-24-24 10-24 24-24zm-28 58h56l24 44-16 12-16-26v158H96V122l-24 30-16-14 48-46zm-26 34h6v154h-6V126z"
          fill={`url(#silGrad-${index})`}
        />
      ) : (
        <path
          d="M124 38c14 0 24 10 24 24s-10 24-24 24-24-10-24-24 10-24 24-24zM66 56l44 36h32l40-44 16 14-42 54v164H96V116L50 70l16-14z"
          fill={`url(#silGrad-${index})`}
        />
      )}
    </svg>
  );
}

export default function RevelCRTStage({
  droneSrc = "/drone_8s.mp4",
  preloadedDroneUrl = null,
  loopSrc = "/loop_video.mp4",
  tvFrameSrc = oldTvFrameImg,
  lineup = DEFAULT_REVEL_LINEUP,
  holeLeft = SCREEN_HOLE_DIMENSIONS.left,
  holeTop = SCREEN_HOLE_DIMENSIONS.top,
  holeWidth = SCREEN_HOLE_DIMENSIONS.width,
  holeHeight = SCREEN_HOLE_DIMENSIONS.height,
  focusX = 50,
  focusY = 50,
}) {
  const sectionRef = useRef(null);
  const tvRigRef = useRef(null);
  const tvScreenSlotRef = useRef(null);
  const tvChassisRef = useRef(null);
  const droneVideoRef = useRef(null);
  const loopVideoRef = useRef(null);
  const crtStaticRef = useRef(null);
  const crtScanlinesRef = useRef(null);
  const stageCardsRef = useRef(null);
  const scrollCueRef = useRef(null);

  const stackLayerRef = useRef(null);
  const stackTrackRefs = useRef([]);
  const glowLayerRef = useRef(null);
  const glowContainerRef = useRef(null);
  const multiplyLayerRef = useRef(null);
  const lettersContainerRef = useRef(null);
  const charRefs = useRef([]);

  const [activeDayIdx, setActiveDayIdx] = useState(0);
  const [cueLabel, setCueLabel] = useState("SCROLL");
  const [shouldLoadMedia, setShouldLoadMedia] = useState(Boolean(preloadedDroneUrl));
  const [droneBlobUrl, setDroneBlobUrl] = useState(preloadedDroneUrl);

  // 1. Adopt preloaded Blob URL from App.jsx immediately, or lazy-fetch if mounted standalone
  useEffect(() => {
    if (preloadedDroneUrl) {
      setDroneBlobUrl(preloadedDroneUrl);
      setShouldLoadMedia(true);
      return;
    }

    const section = sectionRef.current;
    if (!section || shouldLoadMedia) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setShouldLoadMedia(true);
          observer.disconnect();
        }
      },
      { rootMargin: "900px 0px" }
    );

    observer.observe(section);
    return () => observer.disconnect();
  }, [preloadedDroneUrl, shouldLoadMedia]);

  // 2. Fallback fetch only if App.jsx didn't supply preloadedDroneUrl
  useEffect(() => {
    if (preloadedDroneUrl || !shouldLoadMedia || !droneSrc) return;

    let active = true;
    let createdUrl = null;

    fetch(droneSrc)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.blob();
      })
      .then((blob) => {
        if (!active) return;
        createdUrl = URL.createObjectURL(blob);
        setDroneBlobUrl((prev) => {
          if (prev && prev.startsWith("blob:")) URL.revokeObjectURL(prev);
          return createdUrl;
        });
      })
      .catch((err) => console.error("Drone video preload error:", err));

    return () => {
      active = false;
      if (createdUrl) URL.revokeObjectURL(createdUrl);
    };
  }, [preloadedDroneUrl, shouldLoadMedia, droneSrc]);

  // 3. ScrollTrigger Timeline
  useEffect(() => {
    const section = sectionRef.current;
    const tvRig = tvRigRef.current;
    const tvSlot = tvScreenSlotRef.current;
    const tvChassis = tvChassisRef.current;
    const droneVideo = droneVideoRef.current;
    const loopVideo = loopVideoRef.current;
    const crtStatic = crtStaticRef.current;
    const crtScanlines = crtScanlinesRef.current;
    const stageCards = stageCardsRef.current;
    const scrollCue = scrollCueRef.current;
    const stackLayer = stackLayerRef.current;
    const stackTracks = stackTrackRefs.current;
    const glowLayer = glowLayerRef.current;
    const glowContainer = glowContainerRef.current;
    const multiplyLayer = multiplyLayerRef.current;
    const lettersContainer = lettersContainerRef.current;
    const chars = charRefs.current;

    if (
      !section ||
      !tvRig ||
      !tvSlot ||
      !tvChassis ||
      !droneVideo ||
      !loopVideo ||
      !multiplyLayer ||
      !glowLayer ||
      !glowContainer ||
      !stackLayer ||
      !droneBlobUrl
    ) {
      return;
    }

    let isSeeking = false;
    let targetTime = 0;
    let rafId = null;
    let isInView = false;

    const syncFrame = () => {
      if (!isInView) {
        rafId = null;
        return;
      }
      if (!isSeeking && Math.abs(droneVideo.currentTime - targetTime) > 0.008) {
        isSeeking = true;
        if (typeof droneVideo.fastSeek === "function") {
          droneVideo.fastSeek(targetTime);
        } else {
          droneVideo.currentTime = targetTime;
        }
      }
      rafId = requestAnimationFrame(syncFrame);
    };

    const onSeeked = () => {
      isSeeking = false;
    };

    droneVideo.addEventListener("seeked", onSeeked);

    const visibilityObserver = new IntersectionObserver(
      (entries) => {
        isInView = entries.some((entry) => entry.isIntersecting);
        if (isInView && !rafId) {
          rafId = requestAnimationFrame(syncFrame);
        } else if (!isInView && loopVideo && !loopVideo.paused) {
          loopVideo.pause();
        }
      },
      { threshold: 0 }
    );
    visibilityObserver.observe(section);

    const mm = gsap.matchMedia();

    const buildTimeline = () => {
      const duration = droneVideo.duration || 8;
      droneVideo.currentTime = 0.001;

      if (isInView && !rafId) {
        rafId = requestAnimationFrame(syncFrame);
      }

      mm.add(
        {
          isDesktop: "(min-width: 769px)",
          isMobile: "(max-width: 768px)",
        },
        (context) => {
          const { isMobile } = context.conditions;
          const playhead = { time: 0 };
          let inTvMode = false;

          const getDockedTarget = () => {
            const vw = window.innerWidth;
            const vh = window.innerHeight;
            const rigRect = tvRig.getBoundingClientRect();
            const rigWidth = rigRect.width || vw;
            const rigHeight = rigRect.height || vh;

            const targetHoleW = rigWidth * (holeWidth / 100) * TV_DIMENSIONS.dockScale;
            const targetHoleH =
              rigHeight *
              (holeHeight / 100) *
              TV_DIMENSIONS.dockScale *
              TV_DIMENSIONS.heightStretch;

            const targetTvWidth = targetHoleW / (holeWidth / 100);
            const targetTvHeight = targetHoleH / (holeHeight / 100);

            const targetTvLeft = isMobile ? (vw - targetTvWidth) / 2 : vw * 0.05;
            const targetTvTop = isMobile
              ? Math.max(vh * 0.09, 64)
              : (vh - targetTvHeight) / 2;

            const targetHoleCenterX =
              targetTvLeft + targetTvWidth * (holeLeft / 100) + targetHoleW / 2;
            const targetHoleCenterY =
              targetTvTop + targetTvHeight * (holeTop / 100) + targetHoleH / 2;

            return {
              scaleX: targetHoleW / rigWidth,
              scaleY: targetHoleH / rigHeight,
              x: targetHoleCenterX - vw / 2 + TV_DIMENSIONS.dockOffsetX,
              y: targetHoleCenterY - vh / 2 + TV_DIMENSIONS.dockOffsetY,
              rotateY: isMobile ? 5 : TV_DIMENSIONS.tiltY,
              rotateX: isMobile ? 2 : TV_DIMENSIONS.tiltX,
            };
          };

          const enterTvMode = () => {
            if (inTvMode) return;
            inTvMode = true;
            gsap.killTweensOf([loopVideo, crtStatic]);
            loopVideo.currentTime = 0;
            loopVideo.play().catch(() => {});

            gsap.fromTo(
              crtStatic,
              { opacity: 0.85 },
              { opacity: 0.08, duration: 0.35, ease: "power2.out" }
            );
            gsap.to(loopVideo, { opacity: 1, duration: 0.25, ease: "power1.out" });
          };

          const exitTvMode = () => {
            if (!inTvMode) return;
            inTvMode = false;
            gsap.killTweensOf([loopVideo, crtStatic]);
            gsap.fromTo(
              crtStatic,
              { opacity: 0.55 },
              { opacity: 0, duration: 0.2, ease: "power2.out" }
            );
            gsap.to(loopVideo, {
              opacity: 0,
              duration: 0.2,
              onComplete: () => {
                if (!inTvMode) loopVideo.pause();
              },
            });
          };

          gsap.set(tvRig, {
            x: 0,
            y: 0,
            opacity: 1,
            scaleX: 1,
            scaleY: 1,
            rotateY: 0,
            rotateX: 0,
            rotateZ: 0,
          });
          gsap.set(tvChassis, { opacity: 0 });
          gsap.set(tvSlot, { borderRadius: "0px" });
          gsap.set(crtScanlines, { opacity: 0 });
          gsap.set(multiplyLayer, { autoAlpha: 1 });
          gsap.set(lettersContainer, { scale: 1, transformOrigin: "50% 72%" });
          gsap.set(glowLayer, { autoAlpha: 1 });
          gsap.set(glowContainer, { scale: 1, transformOrigin: "50% 72%" });
          if (scrollCue) gsap.set(scrollCue, { autoAlpha: 0.85, y: 0 });

          gsap.set(stackLayer, { autoAlpha: 0, y: 0 });
          stackTracks.forEach((track, i) => {
            if (!track) return;
            const row = STACK_ROWS[i];
            gsap.fromTo(
              track,
              { xPercent: row.dir === 1 ? 0 : -50 },
              {
                xPercent: row.dir === 1 ? -50 : 0,
                duration: row.duration,
                ease: "none",
                repeat: -1,
              }
            );
          });

          const yDirections = [-48, 48, -48, 48, -48];
          chars.forEach((el, index) => {
            if (el) {
              gsap.set(el, {
                y: `${yDirections[index]}vh`,
                scale: 0.92,
                opacity: 0,
              });
            }
          });

          gsap.set(droneVideo, {
            filter: "brightness(2.25) contrast(1.2) saturate(1.25)",
          });

          const tl = gsap.timeline({
            scrollTrigger: {
              trigger: section,
              start: "top top",
              end: isMobile ? "+=520%" : "+=580%",
              pin: true,
              scrub: 0.35,
              anticipatePin: 1,
              invalidateOnRefresh: true,
              onUpdate: (self) => {
                setCueLabel((prev) => {
                  const next = self.progress < 0.18 ? "SCROLL" : "KEEP SCROLLING";
                  return prev === next ? prev : next;
                });

                if (self.progress >= 0.62) {
                  enterTvMode();
                } else {
                  exitTvMode();
                }
              },
            },
          });

          // 1. Staggered REVEL entry
          chars.forEach((el, index) => {
            if (el) {
              tl.to(
                el,
                {
                  y: "0vh",
                  scale: 1,
                  opacity: 1,
                  ease: "power2.out",
                  duration: 0.65,
                },
                index * 0.09
              );
            }
          });

          // 2. Zoom through REVEL into drone shot
          tl.addLabel("zoomThrough");
          tl.to(
            lettersContainer,
            {
              scale: isMobile ? 55 : 75,
              ease: "expo.in",
              duration: 0.9,
            },
            "zoomThrough"
          );
          tl.to(
            glowContainer,
            {
              scale: isMobile ? 55 : 75,
              ease: "expo.in",
              duration: 0.9,
            },
            "zoomThrough"
          );
          tl.to(
            glowLayer,
            {
              autoAlpha: 0,
              duration: 0.35,
              ease: "power1.out",
            },
            "zoomThrough+=0.35"
          );
          tl.to(
            droneVideo,
            {
              filter: "brightness(1) contrast(1) saturate(1)",
              duration: 0.55,
              ease: "power1.out",
            },
            "zoomThrough+=0.2"
          );
          tl.to(
            multiplyLayer,
            {
              autoAlpha: 0,
              duration: 0.35,
              ease: "power1.out",
            },
            "zoomThrough+=0.45"
          );

          // 3. Continuous drone scrub flowing directly into the TV pull-back
          tl.to(
            playhead,
            {
              time: Math.max(0, duration - 0.02),
              ease: "none",
              duration: 3.4,
              onUpdate: () => {
                targetTime = playhead.time;
              },
            },
            "zoomThrough+=0.15"
          );

          if (scrollCue) {
            tl.to(
              scrollCue,
              {
                autoAlpha: 0,
                y: 8,
                duration: 0.3,
                ease: "power2.in",
              },
              "pullback-=0.2"
            );
          }

          // 4. Pull back into TV + reveal right-side lineup cards + play loop video
          tl.addLabel("pullback");
          tl.to(
            tvChassis,
            {
              opacity: 1,
              duration: 0.45,
              ease: "power2.out",
            },
            "pullback"
          );
          tl.to(
            tvRig,
            {
              x: () => getDockedTarget().x,
              y: () => getDockedTarget().y,
              scaleX: () => getDockedTarget().scaleX,
              scaleY: () => getDockedTarget().scaleY,
              rotateY: () => getDockedTarget().rotateY,
              rotateX: () => getDockedTarget().rotateX,
              rotateZ: -1,
              ease: "power2.inOut",
              duration: 1.4,
            },
            "pullback"
          );
          tl.to(
            tvSlot,
            {
              borderRadius: `${SCREEN_HOLE_DIMENSIONS.radius}px`,
              ease: "power2.inOut",
              duration: 1.4,
            },
            "pullback"
          );
          tl.to(
            crtScanlines,
            {
              opacity: 1,
              duration: 1.0,
              ease: "power2.out",
            },
            "pullback+=0.25"
          );
          tl.to(
            stackLayer,
            {
              autoAlpha: 1,
              duration: 1.0,
              ease: "power2.out",
            },
            "pullback+=0.2"
          );
          tl.fromTo(
            stageCards,
            {
              autoAlpha: 0,
              x: isMobile ? 0 : 60,
              y: isMobile ? 35 : 0,
            },
            {
              autoAlpha: 1,
              x: 0,
              y: 0,
              ease: "power3.out",
              duration: 0.85,
            },
            "pullback+=0.45"
          );

          // 5. Hold docked in TV + lineup view cleanly until section unpins
          tl.to({}, { duration: 1.6 });
        }
      );

      ScrollTrigger.refresh();
    };

    if (droneVideo.readyState >= 2) {
      buildTimeline();
    } else {
      droneVideo.addEventListener("loadeddata", buildTimeline, { once: true });
    }

    return () => {
      droneVideo.removeEventListener("seeked", onSeeked);
      visibilityObserver.disconnect();
      if (rafId) cancelAnimationFrame(rafId);
      mm.revert();
    };
  }, [droneBlobUrl, holeLeft, holeTop, holeWidth, holeHeight]);

  const chassisWidthPct = (100 / holeWidth) * 100;
  const chassisHeightPct = (100 / holeHeight) * 100;
  const chassisLeftPct = -(holeLeft / holeWidth) * 100;
  const chassisTopPct = -(holeTop / holeHeight) * 100;

  const stepDay = (delta) => {
    setActiveDayIdx((prev) => (prev + delta + lineup.length) % lineup.length);
  };

  return (
    <div className="revel-crt-wrapper">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=Oswald:wght@600;700&family=Plus+Jakarta+Sans:wght@500;600;700&display=swap');

        .revel-crt-wrapper {
          position: relative;
          width: 100%;
          background-color: #030305;
          color: #ffffff;
          font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
          -webkit-font-smoothing: antialiased;
        }

        .revel-crt-wrapper *,
        .revel-crt-wrapper *::before,
        .revel-crt-wrapper *::after {
          box-sizing: border-box;
        }

        @keyframes revelStaticAnim {
          0% { background-position: 0 0; }
          50% { background-position: -25px 20px; }
          100% { background-position: 20px -25px; }
        }

        @keyframes revelHairlinePulse {
          0%, 100% { opacity: 0.35; transform: scaleY(0.75); }
          50% { opacity: 0.9; transform: scaleY(1); }
        }

        .revel-ember-backdrop {
          position: absolute;
          inset: 0;
          background:
            radial-gradient(ellipse 68% 48% at 50% 52%, rgba(190, 24, 34, 0.28) 0%, rgba(120, 12, 20, 0.14) 48%, rgba(3, 3, 5, 0.94) 82%),
            linear-gradient(180deg, rgba(3, 3, 5, 0.85) 0%, rgba(26, 5, 8, 0.55) 50%, rgba(3, 3, 5, 0.95) 100%);
          pointer-events: none;
        }

        .revel-top-seam {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 96px;
          background: linear-gradient(to bottom, #030305 0%, rgba(3, 3, 5, 0) 100%);
          z-index: 28;
          pointer-events: none;
        }

        .revel-scroll-cue {
          position: absolute;
          bottom: 24px;
          left: 50%;
          transform: translateX(-50%);
          z-index: 27;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 7px;
          pointer-events: none;
          opacity: 0.85;
        }

        .revel-scroll-cue-text {
          font-family: 'Oswald', sans-serif;
          font-size: 0.62rem;
          font-weight: 600;
          letter-spacing: 0.28em;
          text-transform: uppercase;
          color: rgba(255, 255, 255, 0.68);
          text-shadow: 0 1px 8px rgba(0, 0, 0, 0.9);
        }

        .revel-scroll-cue-line {
          width: 1px;
          height: 20px;
          background: linear-gradient(to bottom, rgba(251, 191, 36, 0.85), rgba(255, 255, 255, 0));
          transform-origin: top center;
          animation: revelHairlinePulse 1.9s ease-in-out infinite;
        }

        .revel-letters-box {
          position: relative;
          z-index: 2;
          display: flex;
          gap: clamp(0.4rem, 1.5vw, 1.8rem);
          font-family: 'Syne', sans-serif;
          font-weight: 800;
          font-size: clamp(4.5rem, 18vw, 16rem);
          text-transform: uppercase;
          line-height: 1;
          user-select: none;
        }

        .revel-portal-char {
          display: inline-block;
          color: #ffffff;
        }

        .revel-glow-layer {
          filter: drop-shadow(0 0 12px rgba(251, 191, 36, 0.35));
        }

        .revel-glow-char {
          display: inline-block;
          color: transparent;
          -webkit-text-stroke: 2px rgba(255, 255, 255, 0.92);
        }

        .revel-stack-layer {
          position: absolute;
          inset: 0;
          z-index: 1;
          display: flex;
          flex-direction: column;
          justify-content: center;
          gap: 0.5vh;
          overflow: hidden;
          pointer-events: none;
        }

        .revel-stack-row {
          flex: none;
          overflow: hidden;
          position: relative;
        }

        .revel-stack-track {
          display: flex;
          width: max-content;
          white-space: nowrap;
          font-family: 'Syne', sans-serif;
          font-weight: 800;
          font-size: 13vh;
          line-height: 1;
          margin-top: -1.8vh;
          text-transform: uppercase;
          will-change: transform;
        }

        .revel-stack-group {
          display: flex;
          gap: 0.35em;
          padding-right: 0.35em;
        }

        .revel-stack-track.is-fill {
          color: var(--row-color);
        }

        .revel-stack-track.is-outline {
          color: transparent;
          -webkit-text-stroke: 2px var(--row-color);
        }

        .revel-stack-dim {
          position: absolute;
          inset: 0;
          background:
            linear-gradient(90deg, rgba(3,3,5,0.12) 0%, rgba(3,3,5,0.12) 42%, rgba(3,3,5,0.72) 62%, rgba(3,3,5,0.85) 100%);
          box-shadow: inset 0 0 16vh rgba(3, 3, 5, 0.9);
        }

        @media (max-width: 768px) {
          .revel-stack-dim {
            background:
              linear-gradient(180deg, rgba(3,3,5,0.12) 0%, rgba(3,3,5,0.12) 44%, rgba(3,3,5,0.86) 100%);
          }
        }

        .revel-crt-scanlines {
          background: linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.38) 50%);
          background-size: 100% 4px;
        }

        .revel-crt-vignette {
          box-shadow: inset 0 0 55px rgba(0,0,0,0.88), inset 0 0 18px rgba(0,0,0,0.65);
          background: radial-gradient(circle at 30% 25%, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0) 45%);
        }

        .revel-crt-static {
          background-image: repeating-radial-gradient(#fff 0 0.0001%, #000 0 0.0002%);
          background-size: 180% 180%;
          animation: revelStaticAnim 0.12s infinite steps(2);
          mix-blend-mode: screen;
        }

        .revel-deck-panel {
          position: absolute;
          right: 4.5vw;
          top: 50%;
          transform: translateY(-50%) scale(${LINEUP_CARD_DIMENSIONS.cardDeckScale});
          transform-origin: center right;
          width: ${LINEUP_CARD_DIMENSIONS.panelWidth};
          opacity: 0;
          visibility: hidden;
          z-index: 30;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 18px;
        }

        .revel-deck-stage {
          position: relative;
          width: 100%;
          height: ${LINEUP_CARD_DIMENSIONS.stageHeight};
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .revel-lineup-card {
          position: absolute;
          width: ${LINEUP_CARD_DIMENSIONS.cardWidth};
          height: 100%;
          border-radius: 16px;
          overflow: hidden;
          cursor: pointer;
          transition:
            transform 0.55s cubic-bezier(0.22, 1, 0.36, 1),
            opacity 0.45s ease,
            box-shadow 0.45s ease,
            border-color 0.45s ease;
          background:
            radial-gradient(circle at 50% 22%, rgba(245, 158, 11, 0.22) 0%, transparent 55%),
            radial-gradient(rgba(255, 255, 255, 0.06) 1px, transparent 1px),
            linear-gradient(165deg, #b91c1c 0%, #6b0913 55%, #1d0306 100%);
          background-size: 100% 100%, 10px 10px, 100% 100%;
          border: 1px solid rgba(251, 191, 36, 0.25);
          box-shadow: 0 22px 46px rgba(0, 0, 0, 0.8);
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          padding: 16px 16px 18px;
          user-select: none;
        }

        .revel-lineup-card.is-active {
          border-color: rgba(253, 224, 71, 0.72);
          box-shadow:
            0 28px 60px rgba(0, 0, 0, 0.92),
            0 0 32px rgba(220, 38, 38, 0.4);
        }

        .revel-card-top {
          position: relative;
          z-index: 3;
          text-align: center;
        }

        .revel-card-day-tag {
          font-family: 'Oswald', sans-serif;
          font-size: 0.74rem;
          font-weight: 700;
          letter-spacing: 0.2em;
          color: #fde68a;
          text-transform: uppercase;
          margin-bottom: 4px;
        }

        .revel-card-title {
          font-family: 'Oswald', sans-serif;
          font-size: clamp(1.35rem, 1.9vw, 1.9rem);
          font-weight: 700;
          line-height: 1.04;
          letter-spacing: 0.04em;
          color: #fffbeb;
          text-transform: uppercase;
          text-shadow: 0 4px 16px rgba(0, 0, 0, 0.55);
        }

        .revel-card-bottom {
          position: relative;
          z-index: 3;
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 8px;
        }

        .revel-card-date-lockup {
          display: flex;
          align-items: center;
          gap: 5px;
          line-height: 1;
        }

        .revel-card-date-num {
          font-family: 'Oswald', sans-serif;
          font-size: clamp(1.95rem, 2.7vw, 2.6rem);
          font-weight: 700;
          color: #fef3c7;
        }

        .revel-card-date-month {
          writing-mode: vertical-rl;
          transform: rotate(180deg);
          font-family: 'Oswald', sans-serif;
          font-size: 0.62rem;
          font-weight: 700;
          letter-spacing: 0.16em;
          color: rgba(254, 243, 199, 0.85);
          text-transform: uppercase;
        }

        .revel-card-badge {
          font-size: 0.6rem;
          font-weight: 700;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: #fde68a;
          background: rgba(0, 0, 0, 0.5);
          border: 1px solid rgba(253, 224, 71, 0.25);
          padding: 4px 8px;
          border-radius: 999px;
        }

        .revel-deck-nav-btn {
          position: absolute;
          top: 50%;
          transform: translateY(-50%);
          z-index: 12;
          width: 34px;
          height: 34px;
          border-radius: 50%;
          background: rgba(12, 4, 6, 0.82);
          border: 1px solid rgba(253, 224, 71, 0.35);
          color: #fef3c7;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          font-size: 1rem;
          transition: background 0.2s ease, transform 0.2s ease;
        }

        .revel-deck-nav-btn:hover {
          background: rgba(185, 28, 28, 0.9);
          transform: translateY(-50%) scale(1.06);
        }

        .revel-day-pills {
          display: flex;
          align-items: center;
          gap: 10px;
          z-index: 5;
        }

        .revel-day-pill {
          padding: 6px 16px;
          border-radius: 999px;
          font-family: 'Oswald', sans-serif;
          font-size: 0.8rem;
          font-weight: 700;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          cursor: pointer;
          border: 1px solid rgba(253, 224, 71, 0.32);
          background: rgba(15, 5, 7, 0.82);
          color: #e7e5e4;
          transition: all 0.25s ease;
        }

        .revel-day-pill.is-active {
          background: #fef3c7;
          color: #1c0407;
          border-color: #fef3c7;
          box-shadow: 0 0 18px rgba(253, 224, 71, 0.32);
        }

        @media (max-width: 768px) {
          .revel-deck-panel {
            right: 4vw;
            left: 4vw;
            top: auto;
            bottom: 3.2vh;
            transform: scale(${LINEUP_CARD_DIMENSIONS.cardDeckScale});
            transform-origin: bottom center;
            width: 92vw;
            gap: 12px;
          }

          .revel-deck-stage {
            height: ${LINEUP_CARD_DIMENSIONS.mobileStageHeight};
          }

          .revel-lineup-card {
            width: ${LINEUP_CARD_DIMENSIONS.mobileCardWidth};
            padding: 12px 12px 14px;
            border-radius: 13px;
          }

          .revel-card-title {
            font-size: 1.15rem;
          }

          .revel-card-date-num {
            font-size: 1.65rem;
          }
        }
      `}</style>

      <section
        ref={sectionRef}
        style={{
          position: "relative",
          width: "100%",
          height: "100vh",
          overflow: "hidden",
          perspective: "1200px",
          background: "#030305",
        }}
      >
        <div className="revel-top-seam" aria-hidden="true" />

        <div ref={stackLayerRef} className="revel-stack-layer" aria-hidden="true">
          {STACK_ROWS.map((row, i) => (
            <div
              key={i}
              className="revel-stack-row"
              style={{ height: `${row.height}vh`, opacity: row.opacity }}
            >
              <div
                ref={(el) => (stackTrackRefs.current[i] = el)}
                className={`revel-stack-track ${row.style === "o" ? "is-outline" : "is-fill"}`}
                style={{ "--row-color": row.color }}
              >
                {[0, 1].map((g) => (
                  <span key={g} className="revel-stack-group">
                    {Array.from({ length: 8 }).map((_, k) => (
                      <span key={k}>REVEL</span>
                    ))}
                  </span>
                ))}
              </div>
            </div>
          ))}
          <div className="revel-stack-dim" />
        </div>

        <div
          ref={tvRigRef}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            transformStyle: "preserve-3d",
            transformOrigin: "50% 50%",
            willChange: "transform, opacity",
            zIndex: 20,
          }}
        >
          <div
            ref={tvScreenSlotRef}
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              overflow: "hidden",
              backgroundColor: "#000",
              zIndex: 15,
            }}
          >
            {droneBlobUrl && (
              <video
                ref={droneVideoRef}
                src={droneBlobUrl}
                muted
                playsInline
                preload="auto"
                style={{
                  position: "absolute",
                  inset: 0,
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  objectPosition: `${focusX}% ${focusY}%`,
                  display: "block",
                }}
              />
            )}

            {shouldLoadMedia && loopSrc && (
              <video
                ref={loopVideoRef}
                src={loopSrc}
                muted
                loop
                playsInline
                preload="auto"
                style={{
                  position: "absolute",
                  inset: 0,
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  opacity: 0,
                  display: "block",
                  zIndex: 2,
                }}
              />
            )}

            <div
              ref={crtStaticRef}
              className="revel-crt-static"
              style={{
                position: "absolute",
                inset: 0,
                opacity: 0,
                zIndex: 3,
                pointerEvents: "none",
              }}
            />

            <div
              ref={crtScanlinesRef}
              className="revel-crt-scanlines revel-crt-vignette"
              style={{
                position: "absolute",
                inset: 0,
                opacity: 0,
                zIndex: 4,
                borderRadius: "inherit",
                pointerEvents: "none",
              }}
            />

            <div
              ref={multiplyLayerRef}
              style={{
                position: "absolute",
                inset: 0,
                backgroundColor: "#030305",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                mixBlendMode: "multiply",
                zIndex: 10,
                pointerEvents: "none",
              }}
            >
              <div className="revel-ember-backdrop" aria-hidden="true" />
              <div ref={lettersContainerRef} className="revel-letters-box">
                {["R", "E", "V", "E", "L"].map((char, i) => (
                  <span
                    key={i}
                    ref={(el) => (charRefs.current[i] = el)}
                    className="revel-portal-char"
                  >
                    {char}
                  </span>
                ))}
              </div>
            </div>

            <div
              ref={glowLayerRef}
              className="revel-glow-layer"
              style={{
                position: "absolute",
                inset: 0,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                zIndex: 11,
                opacity: 1,
                pointerEvents: "none",
              }}
            >
              <div ref={glowContainerRef} className="revel-letters-box">
                {["R", "E", "V", "E", "L"].map((char, i) => (
                  <span key={i} className="revel-glow-char">
                    {char}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div
            ref={tvChassisRef}
            style={{
              position: "absolute",
              left: `${chassisLeftPct}%`,
              top: `${chassisTopPct}%`,
              width: `${chassisWidthPct}%`,
              height: `${chassisHeightPct * TV_DIMENSIONS.heightStretch}%`,
              transformStyle: "preserve-3d",
              pointerEvents: "none",
              zIndex: 30,
              mixBlendMode: "normal",
              opacity: 0,
            }}
          >
            {tvFrameSrc ? (
              <img
                src={tvFrameSrc}
                alt="Vintage CRT Television Frame"
                style={{
                  position: "absolute",
                  inset: 0,
                  width: "100%",
                  height: "100%",
                  objectFit: "fill",
                  filter: "drop-shadow(-20px 30px 48px rgba(0,0,0,0.9))",
                }}
              />
            ) : null}
          </div>
        </div>

        <div ref={scrollCueRef} className="revel-scroll-cue" aria-hidden="true">
          <span className="revel-scroll-cue-text">{cueLabel}</span>
          <span className="revel-scroll-cue-line" />
        </div>

        <div ref={stageCardsRef} className="revel-deck-panel">
          <div className="revel-deck-stage">
            <button
              type="button"
              className="revel-deck-nav-btn"
              style={{ left: 0 }}
              onClick={() => stepDay(-1)}
              aria-label="Previous day"
            >
              ‹
            </button>

            {lineup.map((item, idx) => {
              let offset = idx - activeDayIdx;
              if (offset > 1) offset -= lineup.length;
              if (offset < -1) offset += lineup.length;

              const isActive = offset === 0;
              const translateX = offset * LINEUP_CARD_DIMENSIONS.cardSpreadPercent;
              const scale = isActive ? 1 : 0.78;
              const rotateY = offset * -8;

              return (
                <div
                  key={item.day}
                  onClick={() => setActiveDayIdx(idx)}
                  className={`revel-lineup-card ${isActive ? "is-active" : ""}`}
                  style={{
                    zIndex: isActive ? 5 : 2,
                    opacity: isActive ? 1 : 0.42,
                    transform: `translateX(${translateX}%) scale(${scale}) perspective(900px) rotateY(${rotateY}deg)`,
                  }}
                >
                  <div className="revel-card-top">
                    <div className="revel-card-day-tag">{item.day}</div>
                    <div className="revel-card-title">{item.title}</div>
                  </div>

                  {item.image ? (
                    <img
                      src={item.image}
                      alt={item.title}
                      style={{
                        position: "absolute",
                        bottom: 0,
                        left: "50%",
                        transform: "translateX(-50%)",
                        height: "78%",
                        width: "auto",
                        objectFit: "contain",
                        zIndex: 2,
                        pointerEvents: "none",
                      }}
                    />
                  ) : (
                    <PerformerSilhouette index={idx} />
                  )}

                  <div className="revel-card-bottom">
                    <div className="revel-card-date-lockup">
                      <span className="revel-card-date-num">{item.dateNum}</span>
                      <span className="revel-card-date-month">{item.month}</span>
                    </div>
                    <span className="revel-card-badge">
                      {item.image ? item.subtitle : "TBA"}
                    </span>
                  </div>
                </div>
              );
            })}

            <button
              type="button"
              className="revel-deck-nav-btn"
              style={{ right: 0 }}
              onClick={() => stepDay(1)}
              aria-label="Next day"
            >
              ›
            </button>
          </div>

          <div className="revel-day-pills">
            {lineup.map((item, idx) => (
              <button
                key={item.day}
                type="button"
                onClick={() => setActiveDayIdx(idx)}
                className={`revel-day-pill ${idx === activeDayIdx ? "is-active" : ""}`}
              >
                {item.day}
              </button>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}