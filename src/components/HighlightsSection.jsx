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

  // 1. Pinned Scroll Choreography:
  // Enters -> Pins Fullscreen -> Lingers -> Recedes smoothly in depth as next page slides over
  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    let rafId = null;
    let lastPlayState = false;

    const sendPlayerCommand = (func) => {
      const win = ytIframeRef.current?.contentWindow;
      if (!win) return;
      win.postMessage(
        JSON.stringify({ event: "command", func, args: [] }),
        "*"
      );
    };

    const updatePinnedScroll = () => {
      const rect = track.getBoundingClientRect();
      const vh = window.innerHeight || 1;
      const pinDistance = Math.max(rect.height - vh, 1);

      // Approach progress before pinning (0 -> 1 as top of track reaches top of viewport)
      const enter = smoothstep(vh * 0.88, 0, rect.top);

      // Normalized pin progress (0 when pin starts -> 1 when pin finishes)
      const pinP = clamp(-rect.top / pinDistance, 0, 1);

      // Settles into full-bleed 1.0 scale right after pinning (0 -> 0.16)
      const settle = smoothstep(0.0, 0.16, pinP);

      // Smoothly recedes backward during the final 38% of the pin (0.62 -> 1.0)
      const exit = smoothstep(0.62, 1.0, pinP);

      // Combined spatial scale: 0.86 on approach -> 0.94 at pin -> 1.0 during linger -> 0.87 on exit
      const planeScale = (
        0.86 +
        0.08 * enter +
        0.06 * settle -
        0.13 * exit
      ).toFixed(4);

      const planeRadius = (
        (1 - enter) * 24 +
        (1 - settle) * 10 * enter +
        exit * 26
      ).toFixed(1);

      const planeOpacity = (
        0.2 +
        0.8 * enter -
        0.68 * exit
      ).toFixed(3);

      const borderGlow = (
        0.22 * (1 - settle) * enter +
        0.28 * exit
      ).toFixed(3);

      // Staggered letter wave peaks during approach and locks cleanly to 0 once pinned
      const waveT = clamp((vh * 0.88 - rect.top) / (vh * 0.95));
      const stagger = Math.sin(waveT * Math.PI);

      const titleScale = (1.28 - enter * 0.28).toFixed(3);
      const titleY = ((1 - enter) * 38).toFixed(1);
      const cueOpacity = clamp(settle * (1 - exit * 2.8), 0, 1).toFixed(3);

      track.style.setProperty("--hl-plane-scale", planeScale);
      track.style.setProperty("--hl-plane-radius", `${planeRadius}px`);
      track.style.setProperty("--hl-plane-opacity", planeOpacity);
      track.style.setProperty("--hl-plane-border", borderGlow);
      track.style.setProperty("--hl-stagger", stagger.toFixed(3));
      track.style.setProperty("--hl-title-scale", titleScale);
      track.style.setProperty("--hl-title-y", `${titleY}px`);
      track.style.setProperty("--hl-cue-opacity", cueOpacity);

      // Play video while section is centered/pinned; pause as soon as exit recession begins
      const isCurrentlyActive = enter > 0.55 && exit < 0.35 && rect.bottom > vh * 0.25;
      if (isCurrentlyActive !== lastPlayState) {
        lastPlayState = isCurrentlyActive;
        if (isCurrentlyActive) {
          setHasMountedPlayer(true);
          sendPlayerCommand("playVideo");
        } else {
          sendPlayerCommand("pauseVideo");
        }
      }
    };

    const onScroll = () => {
      if (rafId) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(updatePinnedScroll);
    };

    updatePinnedScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (rafId) cancelAnimationFrame(rafId);
    };
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
    <section ref={trackRef} className="hl-pin-track" id="highlights">
      {/* Pinned 100dvh Viewport */}
      <div className="hl-sticky-viewport">
        {/* Receding / Expanding Depth Plane */}
        <div className="hl-depth-plane">
          {/* Background Atmosphere */}
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

            <div className="hl-black-seam-top" />
          </div>

          {/* Main Content Stage */}
          <div className="hl-main-container">
            {/* Scroll-Staggered Frontage Header */}
            <header className="hl-header">
              <h2 className="hl-title-cluster" aria-label="HIGHLIGHTS">
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
                      aria-hidden="true"
                    >
                      <span className="hl-char-shadow">{char}</span>
                      <span className="hl-char-echo">{char}</span>
                      <span className="hl-char-core">{char}</span>
                    </span>
                  );
                })}
              </h2>
            </header>

            {/* Two-Column Media Showcase */}
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

                            {isCenter && hasMountedPlayer && vidId && (
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

            {/* Triple-Chevron Page-Transition Cue */}
            <div className="hl-triple-chevron" aria-hidden="true">
              <svg viewBox="0 0 24 12" width="22" height="11" fill="none" stroke="currentColor" strokeWidth="2.2">
                <polyline points="4 2 12 10 20 2" />
              </svg>
              <svg viewBox="0 0 24 12" width="22" height="11" fill="none" stroke="currentColor" strokeWidth="2.2">
                <polyline points="4 2 12 10 20 2" />
              </svg>
              <svg viewBox="0 0 24 12" width="22" height="11" fill="none" stroke="currentColor" strokeWidth="2.2">
                <polyline points="4 2 12 10 20 2" />
              </svg>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}