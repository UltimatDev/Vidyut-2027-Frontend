import React, { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { DEFAULT_REVEL_LINEUP } from "./revelLineupConfig";

gsap.registerPlugin(ScrollTrigger);

// ============================================================================
// LAYOUT CONFIG
// ============================================================================
export const LINEUP_CARD_DIMENSIONS = {
  panelWidth: "min(82vw, 900px)",
  stageHeight: "clamp(320px, 48vh, 450px)",
  cardWidth: "clamp(215px, 19.5vw, 280px)",
  mobileCardWidth: "156px",
  mobileStageHeight: "225px",
  cardSpreadPercent: 76,
  cardDeckScale: 1,
};

const DAY_ACCENTS = [
  { main: "#ff2837", abA: "#ff3b6b", abB: "#ff9e2c", glow: "rgba(255, 40, 55, 0.34)" },
  { main: "#f59e0b", abA: "#fb7185", abB: "#fde047", glow: "rgba(245, 158, 11, 0.3)" },
  { main: "#f43f5e", abA: "#c084fc", abB: "#fb923c", glow: "rgba(244, 63, 94, 0.3)" },
];
// ============================================================================

const STACK_PATTERN = ["o", "o", "f", "o", "o", "o", "f", "o", "o", "o", "o", "o"];
const STACK_ROWS = STACK_PATTERN.map((style, i, arr) => {
  const t = i / (arr.length - 1);
  return {
    style,
    height: Math.max(2.2, 8.0 - i * 0.42),
    opacity: 0.08 + (1 - t) * 0.04,
    dir: i % 2 === 0 ? 1 : -1,
    duration: 48 + (i % 4) * 12,
    parallaxShift: (i % 2 === 0 ? 1 : -1) * (18 + (i % 3) * 10),
  };
});

function PerformerSilhouette({ index }) {
  return (
    <svg
      viewBox="0 0 240 280"
      fill="none"
      aria-hidden="true"
      style={{
        width: "84%",
        height: "74%",
        position: "absolute",
        bottom: 0,
        right: "2%",
        opacity: 0.42,
        pointerEvents: "none",
      }}
    >
      <defs>
        <linearGradient id={`silGrad-${index}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#260509" />
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
  lineup = DEFAULT_REVEL_LINEUP,
  focusX = 50,
  focusY = 50,
}) {
  const sectionRef = useRef(null);
  const bgVideoSlotRef = useRef(null);
  const droneVideoRef = useRef(null);
  const loopVideoRef = useRef(null);
  const crtShutterTopRef = useRef(null);
  const crtShutterBottomRef = useRef(null);
  const crtBeamRef = useRef(null);
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
  const glowCharRefs = useRef([]);

  const [activeDayIdx, setActiveDayIdx] = useState(0);
  const [pulseKey, setPulseKey] = useState(0);
  const [cueLabel, setCueLabel] = useState("SCROLL");
  const [shouldLoadMedia, setShouldLoadMedia] = useState(Boolean(preloadedDroneUrl));
  const [droneBlobUrl, setDroneBlobUrl] = useState(preloadedDroneUrl);

  const accent = DAY_ACCENTS[activeDayIdx % DAY_ACCENTS.length];
  const currentItem = lineup[activeDayIdx] || lineup[0];

  const selectDay = (nextIdx) => {
    const normalized = (nextIdx + lineup.length) % lineup.length;
    setActiveDayIdx(normalized);
    setPulseKey((k) => k + 1);
  };

  useEffect(() => {
    stackTrackRefs.current.forEach((track, i) => {
      if (!track) return;
      const shift = activeDayIdx * STACK_ROWS[i].parallaxShift;
      gsap.to(track, {
        x: shift,
        duration: 0.45,
        ease: "power2.out",
      });
    });
  }, [activeDayIdx]);

  // 1. Adopt preloaded Blob URL immediately, or lazy-fetch if mounted standalone
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

  // 2. Fallback fetch only if preloadedDroneUrl wasn't supplied
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
    const bgSlot = bgVideoSlotRef.current;
    const droneVideo = droneVideoRef.current;
    const loopVideo = loopVideoRef.current;
    const shutterTop = crtShutterTopRef.current;
    const shutterBottom = crtShutterBottomRef.current;
    const crtBeam = crtBeamRef.current;
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
    const glowChars = glowCharRefs.current;

    if (
      !section ||
      !bgSlot ||
      !droneVideo ||
      !loopVideo ||
      !shutterTop ||
      !shutterBottom ||
      !crtBeam ||
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
    let isLoopActiveInView = false;

    const syncFrame = () => {
      if (!isInView) {
        rafId = null;
        return;
      }
      if (!isSeeking && Math.abs(droneVideo.currentTime - targetTime) > 0.01) {
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
        if (isInView) {
          if (!rafId) rafId = requestAnimationFrame(syncFrame);
          if (isLoopActiveInView && loopVideo && loopVideo.paused) {
            loopVideo.play().catch(() => {});
          }
        } else if (loopVideo && !loopVideo.paused) {
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
          let channelState = "drone"; // "drone" | "loop"
          let switchTween = null;

          const resetCrtOverlay = () => {
            gsap.set(crtBeam, { autoAlpha: 0, scaleX: 0, scaleY: 0.25 });
            gsap.set([shutterTop, shutterBottom], { scaleY: 0 });
            gsap.set(crtStatic, { opacity: 0 });
          };

          const runCrtChannelSwitch = (toChannel, { animate = true } = {}) => {
            if (channelState === toChannel) {
              if (toChannel === "loop" && loopVideo.paused) {
                loopVideo.play().catch(() => {});
              }
              return;
            }
            channelState = toChannel;
            isLoopActiveInView = toChannel === "loop";

            if (switchTween) switchTween.kill();
            resetCrtOverlay();

            if (!animate) {
              gsap.set(loopVideo, { opacity: toChannel === "loop" ? 1 : 0 });
              gsap.set(crtScanlines, { opacity: toChannel === "loop" ? 1 : 0 });
              gsap.set(crtStatic, { opacity: toChannel === "loop" ? 0.06 : 0 });
              if (toChannel === "loop") {
                loopVideo.play().catch(() => {});
              } else if (!loopVideo.paused) {
                loopVideo.pause();
              }
              return;
            }

            if (toChannel === "loop") {
              loopVideo.currentTime = 0;
              loopVideo.play().catch(() => {});
            }

            switchTween = gsap.timeline({
              onComplete: () => {
                resetCrtOverlay();
                if (toChannel === "drone" && !loopVideo.paused) {
                  loopVideo.pause();
                }
              },
            });

            switchTween
              .to(crtScanlines, { opacity: 1, duration: 0.14, ease: "power2.out" }, 0)
              .to(crtStatic, { opacity: 0.45, duration: 0.14, ease: "power1.in" }, 0.02)
              .to(
                [shutterTop, shutterBottom],
                { scaleY: 1, duration: 0.22, ease: "power3.in" },
                0
              )
              .to(
                crtBeam,
                { autoAlpha: 1, scaleX: 1, scaleY: 1, duration: 0.12, ease: "power2.out" },
                0.16
              )
              .set(loopVideo, { opacity: toChannel === "loop" ? 1 : 0 }, 0.27)
              .to(crtBeam, { scaleX: 0.2, duration: 0.1, ease: "power2.in" }, 0.28)
              .to(
                crtBeam,
                { scaleX: 1.05, scaleY: 0.2, autoAlpha: 0, duration: 0.18, ease: "power2.out" },
                0.37
              )
              .to(
                [shutterTop, shutterBottom],
                { scaleY: 0, duration: 0.24, ease: "power3.out" },
                0.31
              )
              .to(
                crtStatic,
                { opacity: toChannel === "loop" ? 0.06 : 0, duration: 0.2, ease: "power2.out" },
                0.31
              );
          };

          gsap.set(bgSlot, { opacity: 1 });
          gsap.set(crtScanlines, { opacity: 0 });
          gsap.set(loopVideo, { opacity: 0 });
          resetCrtOverlay();
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
          glowChars.forEach((el, index) => {
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
              end: isMobile ? "+=480%" : "+=550%",
              pin: true,
              scrub: isMobile ? 0.75 : 0.65,
              anticipatePin: 1,
              invalidateOnRefresh: true,
              onUpdate: (self) => {
                setCueLabel((prev) => {
                  const next = self.progress < 0.18 ? "SCROLL" : "KEEP SCROLLING";
                  return prev === next ? prev : next;
                });

                if (self.progress >= 0.56 && self.progress <= 0.94) {
                  runCrtChannelSwitch("loop", { animate: true });
                } else if (self.progress < 0.52) {
                  runCrtChannelSwitch("drone", { animate: true });
                } else if (self.progress > 0.94) {
                  // Allow seamless re-entry into loop playback when scrolling back up
                  channelState = "drone";
                  isLoopActiveInView = false;
                }
              },
            },
          });

          // 1. Outlined staggered REVEL assembly
          chars.forEach((el, index) => {
            const targets = [el, glowChars[index]].filter(Boolean);
            if (targets.length) {
              tl.to(
                targets,
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

          // 2. Zoom through REVEL into full-bleed background drone shot
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

          // 3. Smooth continuous drone scrub in background
          tl.to(
            playhead,
            {
              time: Math.max(0, duration - 0.02),
              ease: "none",
              duration: 3.1,
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
                duration: 0.25,
                ease: "power2.in",
              },
              "stageReveal-=0.2"
            );
          }

          // 4. Reveal centered carousel & background marquee texture
          tl.addLabel("stageReveal", "zoomThrough+=3.05");
          tl.to(
            stackLayer,
            {
              autoAlpha: 1,
              duration: 0.65,
              ease: "power2.out",
            },
            "stageReveal"
          );
          tl.fromTo(
            stageCards,
            {
              autoAlpha: 0,
              y: isMobile ? 20 : 26,
            },
            {
              autoAlpha: 1,
              y: 0,
              ease: "power3.out",
              duration: 0.65,
            },
            "stageReveal+=0.08"
          );

          // 5. Hold docked stage briefly
          tl.to({}, { duration: 1.15 });

          // 6. Clean handoff into the next section (keep bgSlot visible so re-entry from below is instant)
          tl.addLabel("parallaxExit");
          tl.to(
            stageCards,
            {
              autoAlpha: 0,
              y: isMobile ? -36 : -48,
              duration: 0.55,
              ease: "power2.inOut",
            },
            "parallaxExit"
          );
          tl.to(
            stackLayer,
            {
              autoAlpha: 0,
              y: -56,
              duration: 0.6,
              ease: "power2.inOut",
            },
            "parallaxExit"
          );

          return () => {
            if (switchTween) switchTween.kill();
          };
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
  }, [droneBlobUrl]);

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

        @keyframes revelCardSwitchPulse {
          0% { transform: scale(0.985); filter: brightness(1.18); }
          100% { transform: scale(1); filter: brightness(1); }
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

        .revel-bottom-seam {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          height: 110px;
          background: linear-gradient(to top, #050505 0%, rgba(5, 5, 5, 0) 100%);
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
          z-index: 12;
          display: flex;
          flex-direction: column;
          justify-content: center;
          gap: 0.45vh;
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
          font-size: clamp(4.5rem, 10.5vh, 8.2rem);
          line-height: 1;
          margin-top: -1.4vh;
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
          text-shadow: 1.5px 0 var(--ab-a), -1.5px 0 var(--ab-b);
        }

        .revel-stack-track.is-outline {
          color: transparent;
          -webkit-text-stroke: 1.5px var(--row-color);
          filter: drop-shadow(1px 0 0 var(--ab-a)) drop-shadow(-1px 0 0 var(--ab-b));
        }

        .revel-marquee-scanlines {
          position: absolute;
          inset: 0;
          background: repeating-linear-gradient(
            to bottom,
            rgba(255, 255, 255, 0.03) 0px,
            rgba(255, 255, 255, 0.03) 1px,
            transparent 1px,
            transparent 4px
          );
          pointer-events: none;
        }

        .revel-center-vignette {
          position: absolute;
          inset: 0;
          background: radial-gradient(
            ellipse 58% 64% at 50% 50%,
            rgba(3, 3, 5, 0.92) 0%,
            rgba(3, 3, 5, 0.66) 54%,
            rgba(3, 3, 5, 0.22) 100%
          );
          pointer-events: none;
        }

        .revel-crt-scanlines {
          background: repeating-linear-gradient(
            to bottom,
            rgba(255, 255, 255, 0.04) 0px,
            rgba(255, 255, 255, 0.04) 1px,
            rgba(0, 0, 0, 0.34) 2px,
            rgba(0, 0, 0, 0.34) 4px
          );
        }

        .revel-crt-vignette {
          box-shadow:
            inset 0 0 70px rgba(0, 0, 0, 0.92),
            inset 0 0 24px rgba(251, 191, 36, 0.06);
          background: radial-gradient(
            ellipse 80% 72% at 50% 50%,
            transparent 56%,
            rgba(0, 0, 0, 0.68) 100%
          );
        }

        .revel-crt-static {
          background-image: repeating-radial-gradient(#fff 0 0.0001%, #000 0 0.0002%);
          background-size: 180% 180%;
          animation: revelStaticAnim 0.12s infinite steps(2);
          mix-blend-mode: screen;
        }

        .revel-crt-shutter {
          position: absolute;
          left: 0;
          right: 0;
          height: 50.5%;
          background: #020203;
          z-index: 6;
          pointer-events: none;
          will-change: transform;
        }

        .revel-crt-shutter.is-top {
          top: 0;
          transform-origin: top center;
        }

        .revel-crt-shutter.is-bottom {
          bottom: 0;
          transform-origin: bottom center;
        }

        .revel-crt-beam {
          position: absolute;
          left: 4%;
          right: 4%;
          top: 50%;
          height: 3px;
          margin-top: -1.5px;
          border-radius: 999px;
          background: linear-gradient(
            90deg,
            rgba(255, 255, 255, 0.05) 0%,
            rgba(254, 243, 199, 0.95) 20%,
            #ffffff 50%,
            rgba(254, 243, 199, 0.95) 80%,
            rgba(255, 255, 255, 0.05) 100%
          );
          box-shadow:
            0 0 14px 2px rgba(255, 255, 255, 0.95),
            0 0 32px 8px rgba(251, 191, 36, 0.55);
          z-index: 7;
          pointer-events: none;
          will-change: transform, opacity;
        }

        .revel-deck-panel {
          position: relative;
          width: ${LINEUP_CARD_DIMENSIONS.panelWidth};
          max-width: 94vw;
          margin: 0 auto;
          padding: 12px 0 16px;
          transform: scale(${LINEUP_CARD_DIMENSIONS.cardDeckScale});
          transform-origin: center center;
          opacity: 0;
          visibility: hidden;
          z-index: 30;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 16px;
        }

        .revel-deck-stage {
          position: relative;
          width: 100%;
          height: ${LINEUP_CARD_DIMENSIONS.stageHeight};
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .revel-deck-cards-wrap {
          position: relative;
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .revel-deck-cards-wrap.is-pulsing {
          animation: revelCardSwitchPulse 0.16s ease-out;
        }

        .revel-lineup-card {
          position: absolute;
          width: ${LINEUP_CARD_DIMENSIONS.cardWidth};
          height: 100%;
          border-radius: 18px;
          overflow: hidden;
          cursor: pointer;
          transition:
            transform 0.32s cubic-bezier(0.22, 1, 0.36, 1),
            opacity 0.25s ease,
            box-shadow 0.25s ease,
            border-color 0.25s ease;
          background:
            radial-gradient(circle at 50% 18%, rgba(251, 191, 36, 0.24) 0%, transparent 56%),
            radial-gradient(rgba(255, 255, 255, 0.06) 1px, transparent 1px),
            linear-gradient(168deg, #b91c1c 0%, #5c0810 56%, #140204 100%);
          background-size: 100% 100%, 10px 10px, 100% 100%;
          border: 1px solid rgba(255, 255, 255, 0.14);
          box-shadow:
            inset 0 1px 0 rgba(255, 255, 255, 0.14),
            0 20px 44px rgba(0, 0, 0, 0.88);
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          padding: 18px 18px 20px;
          user-select: none;
        }

        .revel-lineup-card.is-active {
          border-color: rgba(253, 224, 71, 0.82);
          box-shadow:
            inset 0 1px 0 rgba(255, 255, 255, 0.26),
            0 30px 64px rgba(0, 0, 0, 0.96),
            0 0 36px var(--day-glow, rgba(220, 38, 38, 0.45));
        }

        .revel-card-top {
          position: relative;
          z-index: 3;
          text-align: center;
        }

        .revel-card-day-tag {
          font-family: 'Oswald', sans-serif;
          font-size: 0.78rem;
          font-weight: 700;
          letter-spacing: 0.22em;
          color: #fde68a;
          text-transform: uppercase;
          margin-bottom: 5px;
        }

        .revel-card-title {
          font-family: 'Oswald', sans-serif;
          font-size: clamp(1.45rem, 2.15vw, 2.15rem);
          font-weight: 700;
          line-height: 1.04;
          letter-spacing: 0.04em;
          color: #fffbeb;
          text-transform: uppercase;
          text-shadow: 0 4px 18px rgba(0, 0, 0, 0.72);
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
          gap: 6px;
          line-height: 1;
        }

        .revel-card-date-num {
          font-family: 'Oswald', sans-serif;
          font-size: clamp(2.1rem, 2.9vw, 2.85rem);
          font-weight: 700;
          color: #fef3c7;
          text-shadow: 0 2px 10px rgba(0, 0, 0, 0.7);
        }

        .revel-card-date-month {
          writing-mode: vertical-rl;
          transform: rotate(180deg);
          font-family: 'Oswald', sans-serif;
          font-size: 0.65rem;
          font-weight: 700;
          letter-spacing: 0.16em;
          color: rgba(254, 243, 199, 0.9);
          text-transform: uppercase;
        }

        .revel-card-badge {
          font-size: 0.64rem;
          font-weight: 700;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: #fef3c7;
          background: rgba(5, 3, 4, 0.72);
          border: 1px solid rgba(253, 224, 71, 0.34);
          padding: 5px 10px;
          border-radius: 999px;
        }

        .revel-deck-nav-btn {
          position: absolute;
          top: 50%;
          transform: translateY(-50%);
          z-index: 12;
          width: 38px;
          height: 38px;
          border-radius: 50%;
          background: rgba(12, 4, 6, 0.88);
          border: 1px solid rgba(253, 224, 71, 0.4);
          color: #fef3c7;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          font-size: 1.05rem;
          transition: background 0.2s ease, transform 0.2s ease;
        }

        .revel-deck-nav-btn:hover {
          background: rgba(185, 28, 28, 0.95);
          transform: translateY(-50%) scale(1.06);
        }

        .revel-channel-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 14px;
          padding: 6px 8px 6px 14px;
          border-radius: 999px;
          background:
            linear-gradient(90deg, rgba(24, 6, 9, 0.92) 0%, rgba(10, 4, 5, 0.9) 100%);
          border: 1px solid rgba(253, 224, 71, 0.28);
          box-shadow:
            0 12px 30px rgba(0, 0, 0, 0.75),
            inset 0 1px 0 rgba(255, 255, 255, 0.08);
          backdrop-filter: blur(10px);
          z-index: 5;
        }

        .revel-live-tag {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          font-family: 'Oswald', sans-serif;
          font-size: 0.68rem;
          font-weight: 700;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: #fde68a;
          white-space: nowrap;
        }

        .revel-live-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #ff2837;
          box-shadow: 0 0 10px #ff2837;
        }

        .revel-day-pills {
          display: flex;
          align-items: center;
          gap: 5px;
        }

        .revel-day-pill {
          padding: 5px 14px;
          border-radius: 999px;
          font-family: 'Oswald', sans-serif;
          font-size: 0.74rem;
          font-weight: 700;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          cursor: pointer;
          border: 1px solid transparent;
          background: rgba(255, 255, 255, 0.04);
          color: #e7e5e4;
          transition: all 0.2s ease;
        }

        .revel-day-pill:hover {
          border-color: rgba(253, 224, 71, 0.35);
          color: #fffbeb;
        }

        .revel-day-pill.is-active {
          background: linear-gradient(180deg, #fffbeb 0%, #fde68a 100%);
          color: #1c0407;
          border-color: #fef3c7;
          box-shadow: 0 0 16px rgba(253, 224, 71, 0.35);
        }

        @media (max-width: 768px) {
          .revel-stack-row:nth-child(even) {
            display: none;
          }

          .revel-stack-track {
            font-size: 3.4rem;
          }

          .revel-center-vignette {
            background: radial-gradient(
              ellipse 90% 72% at 50% 50%,
              rgba(3, 3, 5, 0.92) 0%,
              rgba(3, 3, 5, 0.68) 62%,
              rgba(3, 3, 5, 0.24) 100%
            );
          }

          .revel-deck-panel {
            width: 94vw;
            padding: 8px 0 12px;
            gap: 12px;
          }

          .revel-deck-stage {
            height: ${LINEUP_CARD_DIMENSIONS.mobileStageHeight};
          }

          .revel-lineup-card {
            width: ${LINEUP_CARD_DIMENSIONS.mobileCardWidth};
            padding: 12px 12px 14px;
            border-radius: 14px;
          }

          .revel-card-title {
            font-size: 1.1rem;
          }

          .revel-card-date-num {
            font-size: 1.55rem;
          }

          .revel-deck-nav-btn {
            width: 32px;
            height: 32px;
            font-size: 0.95rem;
          }

          .revel-channel-bar {
            width: 100%;
            max-width: 360px;
            justify-content: center;
            flex-wrap: wrap;
            border-radius: 16px;
            padding: 6px 10px;
            gap: 6px 10px;
          }

          .revel-live-tag {
            font-size: 0.6rem;
          }

          .revel-day-pill {
            padding: 4px 10px;
            font-size: 0.68rem;
          }
        }
      `}</style>

      <section
        ref={sectionRef}
        style={{
          position: "relative",
          width: "100%",
          minHeight: "100vh",
          height: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
          background: "#030305",
        }}
      >
        <div className="revel-top-seam" aria-hidden="true" />
        <div className="revel-bottom-seam" aria-hidden="true" />

        <div
          ref={bgVideoSlotRef}
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            overflow: "hidden",
            backgroundColor: "#000",
            zIndex: 10,
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
              zIndex: 4,
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
              zIndex: 5,
              pointerEvents: "none",
            }}
          />

          <div ref={crtShutterTopRef} className="revel-crt-shutter is-top" />
          <div ref={crtShutterBottomRef} className="revel-crt-shutter is-bottom" />
          <div ref={crtBeamRef} className="revel-crt-beam" />

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
              zIndex: 14,
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
              zIndex: 15,
              opacity: 1,
              pointerEvents: "none",
            }}
          >
            <div ref={glowContainerRef} className="revel-letters-box">
              {["R", "E", "V", "E", "L"].map((char, i) => (
                <span
                  key={i}
                  ref={(el) => (glowCharRefs.current[i] = el)}
                  className="revel-glow-char"
                >
                  {char}
                </span>
              ))}
            </div>
          </div>
        </div>

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
                style={{
                  "--row-color": accent.main,
                  "--ab-a": accent.abA,
                  "--ab-b": accent.abB,
                }}
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
          <div className="revel-marquee-scanlines" />
          <div className="revel-center-vignette" />
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
              onClick={() => selectDay(activeDayIdx - 1)}
              aria-label="Previous day"
            >
              ‹
            </button>

            <div
              key={pulseKey}
              className={`revel-deck-cards-wrap ${pulseKey > 0 ? "is-pulsing" : ""}`}
            >
              {lineup.map((item, idx) => {
                let offset = idx - activeDayIdx;
                if (offset > 1) offset -= lineup.length;
                if (offset < -1) offset += lineup.length;

                const isActive = offset === 0;
                const translateX = offset * LINEUP_CARD_DIMENSIONS.cardSpreadPercent;
                const scale = isActive ? 1.03 : 0.78;
                const rotateY = offset * -7;

                return (
                  <div
                    key={item.day}
                    onClick={() => selectDay(idx)}
                    className={`revel-lineup-card ${isActive ? "is-active" : ""}`}
                    style={{
                      "--day-glow": accent.glow,
                      zIndex: isActive ? 5 : 2,
                      opacity: isActive ? 1 : 0.44,
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
            </div>

            <button
              type="button"
              className="revel-deck-nav-btn"
              style={{ right: 0 }}
              onClick={() => selectDay(activeDayIdx + 1)}
              aria-label="Next day"
            >
              ›
            </button>
          </div>

          <div className="revel-channel-bar" role="tablist" aria-label="Lineup Day Channel Selector">
            <span className="revel-live-tag">
              <span className="revel-live-dot" />
              CH 0{activeDayIdx + 1} · NOW SHOWING · {currentItem?.day}
            </span>
            <div className="revel-day-pills">
              {lineup.map((item, idx) => (
                <button
                  key={item.day}
                  type="button"
                  role="tab"
                  aria-selected={idx === activeDayIdx}
                  onClick={() => selectDay(idx)}
                  className={`revel-day-pill ${idx === activeDayIdx ? "is-active" : ""}`}
                >
                  {item.day}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}