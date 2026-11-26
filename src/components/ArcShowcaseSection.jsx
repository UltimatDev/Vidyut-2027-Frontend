// ArcShowcaseSection.jsx
import React, { useState, useRef, useEffect, Suspense } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float } from "@react-three/drei";
import * as THREE from "three";
import "./ArcShowcaseSection.css";

/* =========================================================
   1. R3F + DREI DYNAMIC PATROL & POINTER-LOCK DRONE
   ========================================================= */
const WireframeDroneMesh = ({ pointerRef, isTrackingRef, onModeChange }) => {
  const droneGroupRef = useRef(null);
  const headEyeRef = useRef(null);
  const scannerRingRef = useRef(null);
  const rotorRefs = useRef([]);
  const lastModeRef = useRef(false);

  useFrame((state, delta) => {
    const t = state.clock.getElapsedTime();
    const now = performance.now();

    const isTracking = now - pointerRef.current.lastMove < 1400;
    if (isTracking !== lastModeRef.current) {
      lastModeRef.current = isTracking;
      isTrackingRef.current = isTracking;
      if (onModeChange) onModeChange(isTracking);
    }

    rotorRefs.current.forEach((rotor, i) => {
      if (rotor) {
        rotor.rotation.y += delta * (i % 2 === 0 ? 24 : -24);
      }
    });

    if (scannerRingRef.current) {
      scannerRingRef.current.rotation.z = t * (isTracking ? 2.4 : 0.8);
      const pulse = 1 + Math.sin(t * (isTracking ? 6 : 2.5)) * 0.06;
      scannerRingRef.current.scale.set(pulse, pulse, 1);
    }

    if (droneGroupRef.current) {
      let targetPosX = 0;
      let targetPosY = 0;
      let targetRotX = 0.22;
      let targetRotY = 0;
      let targetRotZ = 0;

      if (isTracking) {
        const { x, y } = pointerRef.current;
        targetPosX = x * 0.28;
        targetPosY = y * 0.2;
        targetRotY = x * 0.78;
        targetRotX = 0.2 - y * 0.48;
        targetRotZ = -x * 0.28;
      } else {
        targetPosX = Math.sin(t * 1.15) * 0.34;
        targetPosY = Math.sin(t * 2.3) * 0.14;
        targetRotY = Math.sin(t * 1.15) * 0.55;
        targetRotX = 0.24 + Math.cos(t * 1.7) * 0.14;
        targetRotZ = -Math.cos(t * 1.15) * 0.22;
      }

      const lerpFactor = isTracking ? 0.1 : 0.045;

      droneGroupRef.current.position.x = THREE.MathUtils.lerp(
        droneGroupRef.current.position.x,
        targetPosX,
        lerpFactor
      );
      droneGroupRef.current.position.y = THREE.MathUtils.lerp(
        droneGroupRef.current.position.y,
        targetPosY,
        lerpFactor
      );
      droneGroupRef.current.rotation.y = THREE.MathUtils.lerp(
        droneGroupRef.current.rotation.y,
        targetRotY,
        lerpFactor
      );
      droneGroupRef.current.rotation.x = THREE.MathUtils.lerp(
        droneGroupRef.current.rotation.x,
        targetRotX,
        lerpFactor
      );
      droneGroupRef.current.rotation.z = THREE.MathUtils.lerp(
        droneGroupRef.current.rotation.z,
        targetRotZ,
        lerpFactor
      );
    }

    if (headEyeRef.current) {
      const eyeTargetX = isTracking
        ? pointerRef.current.x * 0.16
        : Math.sin(t * 2.2) * 0.12;
      const eyeTargetY = isTracking
        ? pointerRef.current.y * 0.12
        : Math.cos(t * 1.6) * 0.06;

      headEyeRef.current.position.x = THREE.MathUtils.lerp(
        headEyeRef.current.position.x,
        eyeTargetX,
        0.14
      );
      headEyeRef.current.position.y = THREE.MathUtils.lerp(
        headEyeRef.current.position.y,
        eyeTargetY,
        0.14
      );
    }
  });

  const rotorPositions = [
    [-0.95, 0.24, -0.75],
    [0.95, 0.24, -0.75],
    [-0.95, 0.24, 0.75],
    [0.95, 0.24, 0.75],
  ];

  return (
    <Float speed={2.8} rotationIntensity={0.25} floatIntensity={0.5}>
      <group ref={droneGroupRef} scale={0.76}>
        <mesh>
          <octahedronGeometry args={[0.62, 1]} />
          <meshBasicMaterial color="#FB2576" wireframe />
        </mesh>

        <mesh>
          <boxGeometry args={[0.56, 0.3, 0.7]} />
          <meshBasicMaterial color="#3F0071" wireframe />
        </mesh>

        <group position={[0, -0.04, 0.52]}>
          <mesh ref={scannerRingRef}>
            <torusGeometry args={[0.23, 0.026, 12, 24]} />
            <meshBasicMaterial color="#FFFFFF" wireframe />
          </mesh>
          <mesh ref={headEyeRef} position={[0, 0, 0.05]}>
            <sphereGeometry args={[0.1, 12, 12]} />
            <meshBasicMaterial color="#FB2576" wireframe />
          </mesh>
        </group>

        <mesh rotation={[0, Math.PI / 4, 0]} position={[0, 0.1, 0]}>
          <boxGeometry args={[2.15, 0.045, 0.06]} />
          <meshBasicMaterial color="#9D4EDD" wireframe />
        </mesh>
        <mesh rotation={[0, -Math.PI / 4, 0]} position={[0, 0.1, 0]}>
          <boxGeometry args={[2.15, 0.045, 0.06]} />
          <meshBasicMaterial color="#9D4EDD" wireframe />
        </mesh>

        {rotorPositions.map((pos, idx) => (
          <group key={idx} position={pos}>
            <mesh rotation={[Math.PI / 2, 0, 0]}>
              <torusGeometry args={[0.38, 0.02, 8, 24]} />
              <meshBasicMaterial color="#FB2576" wireframe />
            </mesh>
            <mesh
              ref={(el) => (rotorRefs.current[idx] = el)}
              position={[0, 0.03, 0]}
            >
              <boxGeometry args={[0.66, 0.015, 0.07]} />
              <meshBasicMaterial color="#FFFFFF" wireframe />
            </mesh>
          </group>
        ))}
      </group>
    </Float>
  );
};

const CenterDroneStage = ({ pointerRef, isVisible }) => {
  const [isTracking, setIsTracking] = useState(false);
  const isTrackingRef = useRef(false);

  return (
    <div
      className={`center-drone-stage ${isVisible ? "is-revealed" : ""}`}
      style={{ "--stagger-delay": "520ms" }}
      aria-hidden="true"
    >
      <div className="drone-canvas-box">
        <Canvas
          camera={{ position: [0, 0.55, 4.7], fov: 45 }}
          dpr={[1, 1.5]}
          gl={{ alpha: true, antialias: true }}
        >
          <Suspense fallback={null}>
            <WireframeDroneMesh
              pointerRef={pointerRef}
              isTrackingRef={isTrackingRef}
              onModeChange={setIsTracking}
            />
          </Suspense>
        </Canvas>
      </div>
      <span className={`drone-telemetry-tag ${isTracking ? "is-locked" : ""}`}>
        {isTracking ? "SYS.LOCK // TRACKING" : "SYS.PATROL // AUTO"}
      </span>
    </div>
  );
};

/* =========================================================
   2. STREET-SIGN BANNER
   ========================================================= */
const StreetSignBanner = ({
  label,
  isFlipped = false,
  isActive = false,
  isVisible = false,
  staggerDelay = "140ms",
}) => {
  return (
    <div
      className={`street-sign-header ${isFlipped ? "is-flipped" : ""} ${
        isActive ? "is-active" : ""
      } ${isVisible ? "is-revealed" : ""}`}
      style={{ "--stagger-delay": staggerDelay }}
    >
      <span className="sign-slash slash-1" />
      <span className="sign-slash slash-2" />
      <div className="sign-plate">
        <span className="sign-text">{label}</span>
      </div>
    </div>
  );
};

/* =========================================================
   3. 3D COMET TILT POSTER CARD
   ========================================================= */
const CometTiltCard = ({
  item,
  side,
  isArcHovered,
  isVisible,
  staggerDelay = "280ms",
}) => {
  const cardRef = useRef(null);
  const touchMovedRef = useRef(false);
  const defaultRotateY = side === "left" ? 13 : -13;
  const defaultRotateX = 5;

  const [tilt, setTilt] = useState({
    rotateX: defaultRotateX,
    rotateY: defaultRotateY,
    glareX: 50,
    glareY: 50,
    isPointerOver: false,
  });

  const updateTiltFromClientXY = (clientX, clientY) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    const y = Math.max(0, Math.min(1, (clientY - rect.top) / rect.height));

    const tiltX = (0.5 - y) * 24;
    const tiltY = (x - 0.5) * 28;

    setTilt({
      rotateX: tiltX,
      rotateY: tiltY,
      glareX: x * 100,
      glareY: y * 100,
      isPointerOver: true,
    });
  };

  const resetTilt = () => {
    setTilt({
      rotateX: defaultRotateX,
      rotateY: defaultRotateY,
      glareX: 50,
      glareY: 50,
      isPointerOver: false,
    });
  };

  const handlePointerDown = (e) => {
    touchMovedRef.current = false;
    updateTiltFromClientXY(e.clientX, e.clientY);
  };

  const handlePointerMove = (e) => {
    if (e.pointerType === "touch") {
      touchMovedRef.current = true;
    }
    updateTiltFromClientXY(e.clientX, e.clientY);
  };

  const handlePointerUp = () => {
    resetTilt();
  };

  const handleCardClick = (e) => {
    if (touchMovedRef.current) {
      e.preventDefault();
      touchMovedRef.current = false;
    }
  };

  const isHighlighted = tilt.isPointerOver || isArcHovered;

  return (
    <div
      className={`comet-perspective-wrapper ${isVisible ? "is-revealed" : ""}`}
      style={{ "--stagger-delay": staggerDelay }}
    >
      <a
        ref={cardRef}
        href={item.link}
        className={`comet-card ${side === "right" ? "is-right" : "is-left"} ${
          isHighlighted ? "is-highlighted" : ""
        }`}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={resetTilt}
        onPointerCancel={resetTilt}
        onClick={handleCardClick}
        style={{
          transform: `rotateX(${tilt.rotateX}deg) rotateY(${tilt.rotateY}deg) ${
            isHighlighted ? "scale3d(1.035, 1.035, 1.035)" : "scale3d(1, 1, 1)"
          }`,
        }}
      >
        <div
          className="comet-sheen"
          style={{
            background: `radial-gradient(circle at ${tilt.glareX}% ${tilt.glareY}%, rgba(251, 37, 118, 0.28), transparent 65%)`,
          }}
        />

        <div className="comet-poster-window">
          <img
            key={item.id}
            src={item.image}
            alt={item.title}
            className="comet-poster-img"
            draggable={false}
          />

          <div className="comet-top-badge">{item.tag}</div>

          <div className="comet-hover-drawer">
            <span className="comet-drawer-sub">{item.subtitle}</span>
            <span className="comet-drawer-cta">OPEN EVENT →</span>
          </div>
        </div>

        <div className="comet-card-footer">
          <span className="comet-footer-title">{item.title}</span>
          <span className="comet-footer-code">{item.code}</span>
        </div>
      </a>
    </div>
  );
};

/* =========================================================
   4. WHEEL / DRAG / SWIPE / KEYBOARD ARC CAROUSEL COLUMN
   ========================================================= */
const ShowcaseColumn = ({ columnData, sideOverride, isVisible, baseDelay = 140 }) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isColumnHovered, setIsColumnHovered] = useState(false);
  const [isCompactViewport, setIsCompactViewport] = useState(false);

  const hoverTimerRef = useRef(null);
  const wheelLockRef = useRef(false);
  const dragStateRef = useRef({
    isDragging: false,
    startX: 0,
    startY: 0,
    moved: false,
  });

  const side = sideOverride || columnData.side || "left";
  const isRight = side === "right";
  const items = columnData.items;
  const totalItems = items.length;
  const activeItem = items[activeIndex];

  useEffect(() => {
    const checkViewport = () => {
      setIsCompactViewport(window.innerWidth <= 1024);
    };
    checkViewport();
    window.addEventListener("resize", checkViewport);
    return () => {
      window.removeEventListener("resize", checkViewport);
      if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
    };
  }, []);

  const stepIndex = (delta) => {
    setActiveIndex((prev) => (prev + delta + totalItems) % totalItems);
  };

  const handleItemEnter = (idx) => {
    if (isCompactViewport || dragStateRef.current.isDragging) return;
    if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
    hoverTimerRef.current = setTimeout(() => {
      setActiveIndex(idx);
    }, 105);
  };

  const handleWheel = (e) => {
    const dominantDelta =
      Math.abs(e.deltaY) >= Math.abs(e.deltaX) ? e.deltaY : e.deltaX;
    if (Math.abs(dominantDelta) < 12) return;

    e.preventDefault();
    if (wheelLockRef.current) return;

    wheelLockRef.current = true;
    stepIndex(dominantDelta > 0 ? 1 : -1);

    setTimeout(() => {
      wheelLockRef.current = false;
    }, 260);
  };

  const handlePointerDown = (e) => {
    dragStateRef.current = {
      isDragging: true,
      startX: e.clientX,
      startY: e.clientY,
      moved: false,
    };
  };

  const handlePointerMove = (e) => {
    if (!dragStateRef.current.isDragging) return;
    const dx = e.clientX - dragStateRef.current.startX;
    const dy = e.clientY - dragStateRef.current.startY;
    const primaryDelta = isCompactViewport ? dx : dy;

    if (Math.abs(primaryDelta) > 30) {
      dragStateRef.current.moved = true;
      dragStateRef.current.startX = e.clientX;
      dragStateRef.current.startY = e.clientY;
      stepIndex(primaryDelta < 0 ? 1 : -1);
    }
  };

  const handlePointerUp = () => {
    dragStateRef.current.isDragging = false;
    setTimeout(() => {
      dragStateRef.current.moved = false;
    }, 50);
  };

  const handleKeyDown = (e) => {
    if (e.key === "ArrowDown" || e.key === "ArrowRight") {
      e.preventDefault();
      stepIndex(1);
    } else if (e.key === "ArrowUp" || e.key === "ArrowLeft") {
      e.preventDefault();
      stepIndex(-1);
    }
  };

  const getWrappedOffset = (index) => {
    let diff = index - activeIndex;
    const half = Math.floor(totalItems / 2);
    if (diff > half) diff -= totalItems;
    if (diff < -half) diff += totalItems;
    return diff;
  };

  const getArcStyle = (index) => {
    const offset = getWrappedOffset(index);
    const absOffset = Math.abs(offset);

    if (isCompactViewport) {
      const horizontalSpacing = 175;
      const translateX = offset * horizontalSpacing;
      const translateY = absOffset * absOffset * 9;
      const rotateDeg = offset * 6;
      const opacity = isVisible ? (absOffset === 0 ? 1 : absOffset === 1 ? 0.52 : 0) : 0;

      return {
        transform: `translate3d(calc(-50% + ${translateX}px), ${translateY}px, 0) rotate(${rotateDeg}deg)`,
        opacity,
        pointerEvents: absOffset > 1 ? "none" : "auto",
        zIndex: 10 - absOffset,
        transitionDelay: isVisible ? "0ms" : `${baseDelay + 260 + index * 65}ms`,
      };
    }

    const verticalSpacing = 60;
    const curveShift = Math.min(absOffset * absOffset * 5, 22);
    const translateX = isRight ? curveShift : -curveShift;
    const translateY = offset * verticalSpacing;
    const rotateDeg = isRight ? -offset * 6.5 : offset * 6.5;

    // Staggered horizontal slide-in before settling into arc coordinates
    const entryOffsetX = isVisible ? 0 : isRight ? -32 : 32;
    const opacity = isVisible
      ? absOffset === 0
        ? 1
        : absOffset === 1
        ? 0.55
        : absOffset === 2
        ? 0.26
        : 0
      : 0;

    return {
      transform: `translate3d(${translateX + entryOffsetX}px, ${translateY}px, 0) rotate(${rotateDeg}deg)`,
      opacity,
      pointerEvents: absOffset > 2 ? "none" : "auto",
      zIndex: 10 - absOffset,
      transitionDelay: isVisible ? `${baseDelay + 240 + absOffset * 70}ms` : "0ms",
    };
  };

  return (
    <div
      className={`showcase-column ${isRight ? "col-right" : "col-left"}`}
      onMouseEnter={() => setIsColumnHovered(true)}
      onMouseLeave={() => {
        setIsColumnHovered(false);
        if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
      }}
    >
      <StreetSignBanner
        label={columnData.sectionTitle || columnData.title}
        isFlipped={isRight}
        isActive={isColumnHovered}
        isVisible={isVisible}
        staggerDelay={`${baseDelay}ms`}
      />

      <div className="column-stage">
        <CometTiltCard
          item={activeItem}
          side={side}
          isArcHovered={isColumnHovered}
          isVisible={isVisible}
          staggerDelay={`${baseDelay + 140}ms`}
        />

        <div
          className={`arc-track ${isVisible ? "is-revealed" : ""}`}
          style={{ "--stagger-delay": `${baseDelay + 240}ms` }}
          tabIndex={0}
          role="listbox"
          aria-label={`${columnData.sectionTitle || columnData.title} carousel`}
          onWheel={handleWheel}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          onKeyDown={handleKeyDown}
        >
          <ul className="arc-items-list">
            {items.map((item, idx) => {
              const isActive = idx === activeIndex;
              return (
                <li
                  key={item.id}
                  role="option"
                  aria-selected={isActive}
                  className={`arc-node ${isActive ? "is-active" : ""}`}
                  style={getArcStyle(idx)}
                  onMouseEnter={() => handleItemEnter(idx)}
                >
                  <a
                    href={item.link}
                    className="arc-node-link"
                    draggable={false}
                    onClick={(e) => {
                      if (dragStateRef.current.moved) {
                        e.preventDefault();
                        return;
                      }
                      if (!isActive) {
                        e.preventDefault();
                        setActiveIndex(idx);
                      }
                    }}
                  >
                    {!isRight && !isCompactViewport && isActive && (
                      <span className="arc-arrow">▸</span>
                    )}
                    <div className="arc-node-text">
                      <span className="arc-node-title">{item.title}</span>
                      {isActive && (
                        <span className="arc-node-subtitle">{item.subtitle}</span>
                      )}
                    </div>
                    {isRight && !isCompactViewport && isActive && (
                      <span className="arc-arrow">◂</span>
                    )}
                  </a>
                </li>
              );
            })}
          </ul>

          <div className="arc-mobile-controls">
            <button
              type="button"
              className="arc-step-btn"
              aria-label="Previous event"
              onClick={() => stepIndex(-1)}
            >
              ‹
            </button>
            <div className="arc-dots">
              {items.map((it, i) => (
                <button
                  key={it.id}
                  type="button"
                  aria-label={`Select ${it.title}`}
                  className={`arc-dot ${i === activeIndex ? "is-active" : ""}`}
                  onClick={() => setActiveIndex(i)}
                />
              ))}
            </div>
            <button
              type="button"
              className="arc-step-btn"
              aria-label="Next event"
              onClick={() => stepIndex(1)}
            >
              ›
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

/* =========================================================
   5. MAIN EXPORTED SECTION
   ========================================================= */
export default function ArcShowcaseSection({
  workshops,
  competitions,
  viewMore = { label: "VIEW MORE", link: "/events" },
}) {
  const sectionRef = useRef(null);
  const [isVisible, setIsVisible] = useState(false);
  const pointerRef = useRef({ x: 0, y: 0, lastMove: 0 });

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.25 }
    );

    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  const handleSectionPointerMove = (e) => {
    if (!sectionRef.current) return;
    const rect = sectionRef.current.getBoundingClientRect();
    const nx = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const ny = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
    pointerRef.current = { x: nx, y: ny, lastMove: performance.now() };
  };

  return (
    <section
      ref={sectionRef}
      className={`fest-events-viewport ${isVisible ? "section-entered" : ""}`}
      onPointerMove={handleSectionPointerMove}
      onPointerDown={handleSectionPointerMove}
    >
      {/* Top Laser Horizon Line Sweep */}
      <div className="section-entry-horizon" aria-hidden="true" />

      {/* Perspective Animated Retro Grid Floor */}
      <div
        className={`retro-grid-stage ${isVisible ? "is-revealed" : ""}`}
        aria-hidden="true"
      >
        <div className="retro-grid-plane" />
        <div className="retro-grid-horizon-fade" />
      </div>

      <div className="fest-foreground-layer">
        <div className="fest-dual-grid">
          <ShowcaseColumn
            columnData={workshops}
            sideOverride="left"
            isVisible={isVisible}
            baseDelay={140}
          />

          <CenterDroneStage pointerRef={pointerRef} isVisible={isVisible} />

          <ShowcaseColumn
            columnData={competitions}
            sideOverride="right"
            isVisible={isVisible}
            baseDelay={200}
          />
        </div>

        <footer
          className={`fest-bottom-bar ${isVisible ? "is-revealed" : ""}`}
          style={{ "--stagger-delay": "640ms" }}
        >
          <a href={viewMore.link} className="street-sign-btn">
            <span className="sign-slash slash-1" />
            <span className="sign-slash slash-2" />
            <span className="sign-btn-plate">
              <span>{viewMore.label}</span>
              <span className="btn-icon">↗</span>
            </span>
          </a>
        </footer>
      </div>
    </section>
  );
}