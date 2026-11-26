// src/components/highlights/HighlightsSection.jsx
import React, { useState, useEffect, useRef } from "react";
import { highlightsConfig } from "./highlightsConfig";
import "./HighlightsSection.css";

const getYouTubeId = (url = "") => {
  const match = url.match(
    /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))([^&?/\s]{11})/
  );
  return match ? match[1] : null;
};

const clamp = (val, min = 0, max = 1) => Math.min(Math.max(val, min), max);
const smoothstep = (edge0, edge1, x) => {
  const t = clamp((x - edge0) / (edge1 - edge0));
  return t * t * (3 - 2 * t);
};

// Golden dust motes matching the hero and BE THE CHANGE sections
const DUST_MOTES = [
  { left: "8%", top: "76%", delay: "0s", dur: "9s", size: "3px" },
  { left: "18%", top: "62%", delay: "-2.4s", dur: "10.5s", size: "2px" },
  { left: "28%", top: "84%", delay: "-4.1s", dur: "9.5s", size: "3px" },
  { left: "42%", top: "80%", delay: "-5.6s", dur: "8.8s", size: "2.5px" },
  { left: "58%", top: "72%", delay: "-3.1s", dur: "10s", size: "2.5px" },
  { left: "72%", top: "56%", delay: "-1.9s", dur: "10.8s", size: "2px" },
  { left: "84%", top: "78%", delay: "-4.7s", dur: "9.4s", size: "3px" },
  { left: "93%", top: "66%", delay: "-2.8s", dur: "8.6s", size: "2.5px" },
];

const TITLE_LETTERS = "HIGHLIGHTS".split("");

export default function HighlightsSection({ config = highlightsConfig }) {
  const {
    instagramHandle = "vidyutmultifest",
    instagramProfileUrl = "https://www.instagram.com/vidyutmultifest/",
    youtube = [],
  } = config;

  const [activeYt, setActiveYt] = useState(0);
  const [hasMountedPlayer, setHasMountedPlayer] = useState(false);
  const [ytMuted, setYtMuted] = useState(true);

  const trackRef = useRef(null);
  const ytIframeRef = useRef(null);
  const ytTouchStart = useRef({ x: 0, y: 0 });

  // 1. Scroll-driven entry stagger -> docked header + expanding showcase (clamps once docked)
  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    let rafId = null;
    let lastClampedP = null;

    const updateScrollChoreography = () => {
      const rect = track.getBoundingClientRect();
      const vh = window.innerHeight || 1;
      const scrollableDistance = Math.max(rect.height - vh, 1);

      const rawP = -rect.top / scrollableDistance;
      // Clamp progress once settled so scrolling down into the gallery triggers zero DOM writes
      const p = clamp(rawP, -1.65, 1.0);
      if (p === lastClampedP) return;
      lastClampedP = p;

      // Fade in smoothly from pitch black as section enters viewport
      const enterFade = smoothstep(-1.55, -0.55, p);

      // Per-letter stagger wave while HIGHLIGHTS is large, snapping cleanly to 0 as it docks
      const entryT = clamp((p - -1.45) / 1.75);
      const staggerAmount = Math.sin(entryT * Math.PI);

      // Shrinks from monumental center text (1.0) into compact top header (0.39)
      const dock = smoothstep(-0.45, 0.45, p);
      const titleScale = (1 - dock * 0.61).toFixed(3);

      // Video showcase expands into place right below the docked header and stays solid
      const stageIn = smoothstep(-0.25, 0.55, p);
      const stageScale = (0.76 + 0.24 * stageIn).toFixed(3);
      const stageLift = ((1 - stageIn) * 38).toFixed(1);

      track.style.setProperty("--hl-enter", enterFade.toFixed(3));
      track.style.setProperty("--hl-stagger", staggerAmount.toFixed(3));
      track.style.setProperty("--hl-dock", dock.toFixed(3));
      track.style.setProperty("--hl-title-scale", titleScale);
      track.style.setProperty("--hl-stage-opacity", stageIn.toFixed(3));
      track.style.setProperty("--hl-stage-scale", stageScale);
      track.style.setProperty("--hl-stage-y", `${stageLift}px`);
    };

    const onScroll = () => {
      if (rafId) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(updateScrollChoreography);
    };

    updateScrollChoreography();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, []);

  // 2. Auto-play YouTube when section is in view; pause immediately when scrolling into gallery
  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    const sendPlayerCommand = (func) => {
      const win = ytIframeRef.current?.contentWindow;
      if (!win) return;
      win.postMessage(
        JSON.stringify({ event: "command", func, args: [] }),
        "*"
      );
    };

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && entry.intersectionRatio >= 0.45) {
          setHasMountedPlayer(true);
          sendPlayerCommand("playVideo");
        } else {
          sendPlayerCommand("pauseVideo");
        }
      },
      { threshold: [0, 0.45] }
    );

    observer.observe(track);
    return () => observer.disconnect();
  }, []);

  const changeYt = (dir) => {
    if (youtube.length <= 1) return;
    setActiveYt((prev) => (prev + dir + youtube.length) % youtube.length);
  };

  const onYtTouchStart = (e) => {
    ytTouchStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  };

  const onYtTouchEnd = (e) => {
    if (youtube.length <= 1) return;
    const dx = ytTouchStart.current.x - e.changedTouches[0].clientX;
    const dy = Math.abs(ytTouchStart.current.y - e.changedTouches[0].clientY);
    if (Math.abs(dx) > 40 && Math.abs(dx) > dy) {
      changeYt(dx > 0 ? 1 : -1);
    }
  };

  const getYtCardState = (index) => {
    if (index === activeYt) return "is-active";
    if (youtube.length > 1) {
      const prevIdx = (activeYt - 1 + youtube.length) % youtube.length;
      const nextIdx = (activeYt + 1) % youtube.length;
      if (index === prevIdx) return "is-prev";
      if (index === nextIdx) return "is-next";
    }
    return "is-hidden";
  };

  const cleanHandle = instagramHandle.replace(/^@/, "");

  return (
    <section ref={trackRef} className="hl-scroll-track" id="highlights">
      <div className="hl-sticky-viewport">
        {/* Layer 1: Lightweight Warm Amber/Crimson Atmosphere & Dust Motes */}
        <div className="hl-atmosphere" aria-hidden="true">
          <div className="hl-micro-grid" />
          <div className="hl-haze-orb hl-haze-amber" />
          <div className="hl-haze-orb hl-haze-crimson" />

          <div className="hl-viewfinder-frame">
            <span className="hl-vf-corner hl-vf-tl" />
            <span className="hl-vf-corner hl-vf-tr" />
            <span className="hl-vf-corner hl-vf-bl" />
            <span className="hl-vf-corner hl-vf-br" />
          </div>

          <div className="hl-motes-layer">
            {DUST_MOTES.map((mote, idx) => (
              <span
                key={idx}
                className="hl-mote"
                style={{
                  left: mote.left,
                  top: mote.top,
                  width: mote.size,
                  height: mote.size,
                  animationDelay: mote.delay,
                  animationDuration: mote.dur,
                }}
              />
            ))}
          </div>

          {/* Seamless entry blend from previous section */}
          <div className="hl-black-seam-top" />
        </div>

        {/* Layer 2: Scroll-Staggered "HIGHLIGHTS" Title (Big -> Docks as Top Header) */}
        <div className="hl-title-stage" aria-hidden="true">
          <div className="hl-title-cluster">
            {TITLE_LETTERS.map((char, idx) => {
              const waveDir = idx % 2 === 0 ? -1 : 1;
              const waveAmp = 0.65 + ((idx * 3) % 5) * 0.14;

              return (
                <span
                  key={idx}
                  className="hl-char-box"
                  style={{
                    "--wave-dir": waveDir,
                    "--wave-amp": waveAmp.toFixed(2),
                  }}
                >
                  <span className="hl-char-shadow">{char}</span>
                  <span className="hl-char-echo">{char}</span>
                  <span className="hl-char-core">{char}</span>
                </span>
              );
            })}
          </div>
        </div>

        {/* Layer 3: Expanding Two-Column Media Stage (Stays solid for Gallery transition) */}
        <div className="hl-showcase-stage">
          <div className="hl-stage-backlight" aria-hidden="true" />

          <div className="hl-split-grid">
            {/* LEFT COLUMN: SMOKED-OBSIDIAN INSTAGRAM PROFILE EMBED */}
            <div className="hl-ig-card">
              <div className="hl-ig-card-top">
                <div className="hl-ig-brand">
                  <span className="hl-ig-pulse-dot" />
                  <span className="hl-ig-handle">@{cleanHandle}</span>
                </div>
                <a
                  href={instagramProfileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hl-ig-follow-pill"
                >
                  FOLLOW ↗
                </a>
              </div>

              <div className="hl-ig-frame-crop">
                <iframe
                  className="hl-ig-iframe"
                  src={`https://www.instagram.com/${cleanHandle}/embed/`}
                  title={`@${cleanHandle} Instagram Profile`}
                  loading="lazy"
                  scrolling="no"
                  allowTransparency="true"
                />
              </div>

              <a
                href={instagramProfileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="hl-ig-card-bottom"
              >
                <span>OPEN OFFICIAL INSTAGRAM</span>
                <svg
                  viewBox="0 0 24 24"
                  width="13"
                  height="13"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                >
                  <line x1="7" y1="17" x2="17" y2="7" />
                  <polyline points="7 7 17 7 17 17" />
                </svg>
              </a>
            </div>

            {/* RIGHT COLUMN: YOUTUBE COVERFLOW DECK */}
            {youtube.length > 0 && (
              <div
                className="hl-yt-col"
                onTouchStart={onYtTouchStart}
                onTouchEnd={onYtTouchEnd}
              >
                <button
                  type="button"
                  className="hl-nav-btn hl-prev"
                  onClick={() => changeYt(-1)}
                  disabled={youtube.length <= 1}
                  aria-label="Previous Video"
                >
                  <svg
                    viewBox="0 0 24 24"
                    width="20"
                    height="20"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.2"
                  >
                    <polyline points="15 18 9 12 15 6" />
                  </svg>
                </button>

                <div className="hl-yt-deck">
                  {youtube.map((video, idx) => {
                    const vidId = getYouTubeId(video.url);
                    const stateClass = getYtCardState(idx);
                    const isCenter = idx === activeYt;

                    return (
                      <div
                        key={video.id || idx}
                        className={`hl-yt-card ${stateClass}`}
                        onClick={() => {
                          if (!isCenter) setActiveYt(idx);
                        }}
                      >
                        {isCenter && hasMountedPlayer && vidId ? (
                          <div className="hl-yt-live-wrap">
                            <iframe
                              ref={ytIframeRef}
                              key={`${vidId}-${ytMuted ? "muted" : "sound"}`}
                              className="hl-yt-iframe"
                              src={`https://www.youtube.com/embed/${vidId}?enablejsapi=1&autoplay=1&mute=${
                                ytMuted ? 1 : 0
                              }&loop=1&playlist=${vidId}&playsinline=1&rel=0&modestbranding=1`}
                              title={`YouTube Highlight ${idx + 1}`}
                              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                              allowFullScreen
                            />
                            <button
                              type="button"
                              className="hl-sound-pill"
                              onClick={(e) => {
                                e.stopPropagation();
                                setYtMuted((m) => !m);
                              }}
                            >
                              {ytMuted ? "🔇 TAP FOR SOUND" : "🔊 SOUND ON"}
                            </button>
                          </div>
                        ) : (
                          <div className="hl-yt-facade">
                            {vidId ? (
                              <img
                                src={`https://i.ytimg.com/vi/${vidId}/maxresdefault.jpg`}
                                onError={(e) => {
                                  e.currentTarget.onerror = null;
                                  e.currentTarget.src = `https://i.ytimg.com/vi/${vidId}/hqdefault.jpg`;
                                }}
                                alt=""
                                loading="lazy"
                                draggable="false"
                              />
                            ) : (
                              <div className="hl-fallback">
                                Invalid YouTube URL
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                <button
                  type="button"
                  className="hl-nav-btn hl-next"
                  onClick={() => changeYt(1)}
                  disabled={youtube.length <= 1}
                  aria-label="Next Video"
                >
                  <svg
                    viewBox="0 0 24 24"
                    width="20"
                    height="20"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.2"
                  >
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}