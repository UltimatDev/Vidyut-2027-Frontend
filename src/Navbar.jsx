import { useState, useEffect, useRef } from 'react';
import { NavLink, Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import defaultLogo from './logo.svg';
import './Navbar.css';

const DEFAULT_LINKS = [
  { label: 'HOME', to: '/' },
  { label: 'ABOUT', to: '/about' },
  { label: 'EVENTS', to: '/events' },
  { label: 'PROSHOW', to: '/proshow' },
  { label: 'AUTOEXPO', to: '/autoexpo' },
  { label: 'HIGHLIGHTS', to: '/highlights' },

  
];

const REGISTER_LINK = { label: 'REGISTER', to: '/register' };

const SPARKS = [
  { id: 1, left: '22%', size: 3, duration: 3.4, delay: 0.1 },
  { id: 2, left: '50%', size: 4, duration: 3.8, delay: 0.35 },
  { id: 3, left: '78%', size: 3, duration: 3.2, delay: 0.2 },
];

export default function Navbar({
  links = DEFAULT_LINKS,
  registerLink = REGISTER_LINK,
  logoSrc = defaultLogo,
}) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const tickingRef = useRef(false);

  const prefersReducedMotion = useReducedMotion();
  const location = useLocation();

  const navItems = Array.isArray(links)
    ? links
    : [...(links?.left || []), ...(links?.right || [])];

  // Throttled passive scroll listener: only triggers state update when crossing 40px
  useEffect(() => {
    const updateScroll = () => {
      const scrolled = window.scrollY > 40;
      setIsScrolled((prev) => (prev !== scrolled ? scrolled : prev));
      tickingRef.current = false;
    };

    updateScroll();

    const onScroll = () => {
      if (!tickingRef.current) {
        window.requestAnimationFrame(updateScroll);
        tickingRef.current = true;
      }
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Close drawer on route navigation
  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  // Lock body scroll & handle Escape key while drawer is open
  useEffect(() => {
    if (!menuOpen) return;

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const onKeyDown = (e) => {
      if (e.key === 'Escape') setMenuOpen(false);
    };

    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [menuOpen]);

  // Pure GPU-composited transition (opacity + transform only, no clip-path rasterization)
  const drawerVariants = prefersReducedMotion
    ? {
        closed: { opacity: 0 },
        open: { opacity: 1, transition: { duration: 0.18 } },
        exit: { opacity: 0, transition: { duration: 0.15 } },
      }
    : {
        closed: { opacity: 0, y: -14 },
        open: {
          opacity: 1,
          y: 0,
          transition: { duration: 0.32, ease: [0.22, 1, 0.36, 1] },
        },
        exit: {
          opacity: 0,
          y: -10,
          transition: { duration: 0.22, ease: [0.4, 0, 1, 1] },
        },
      };

  return (
    <>
      <header className={`navbar ${isScrolled ? 'navbar--scrolled' : ''}`}>
        <nav className="navbar__inner" aria-label="Main">
          {/* Left: Clean 2-Line Menu Icon */}
          <div className="navbar__left">
            <button
              type="button"
              className="navbar__menu-btn"
              aria-label="Open menu"
              aria-expanded={menuOpen}
              aria-controls="ember-nav-drawer"
              onClick={() => setMenuOpen(true)}
            >
              <span className="navbar__menu-bars" aria-hidden="true">
                <span className="navbar__menu-bar" />
                <span className="navbar__menu-bar" />
              </span>
            </button>
          </div>

          {/* Center: Logo */}
          <Link to="/" className="navbar__logo" aria-label="Vidyut Home">
            <img src={logoSrc} alt="Vidyut Logo" />
          </Link>

          {/* Right: Register Pill */}
          <div className="navbar__right">
            <Link to={registerLink.to} className="navbar__register">
              {registerLink.label}
            </Link>
          </div>
        </nav>
      </header>

      {/* Lightweight GPU-Composited Overlay Drawer */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            id="ember-nav-drawer"
            className="ember-drawer"
            role="dialog"
            aria-modal="true"
            aria-label="Site Navigation"
            variants={drawerVariants}
            initial="closed"
            animate="open"
            exit="exit"
          >
            {!prefersReducedMotion && (
              <div className="ember-drawer__sparks" aria-hidden="true">
                {SPARKS.map((spark) => (
                  <motion.span
                    key={spark.id}
                    className="ember-spark"
                    style={{
                      left: spark.left,
                      width: spark.size,
                      height: spark.size,
                    }}
                    initial={{ y: 0, opacity: 0 }}
                    animate={{
                      y: '-90vh',
                      opacity: [0, 0.75, 0],
                    }}
                    transition={{
                      duration: spark.duration,
                      delay: spark.delay,
                      repeat: Infinity,
                      ease: 'linear',
                    }}
                  />
                ))}
              </div>
            )}

            <div className="ember-drawer__top">
              <button
                type="button"
                className="ember-drawer__close"
                aria-label="Close menu"
                onClick={() => setMenuOpen(false)}
              >
                &times;
              </button>

              <Link
                to="/"
                className="navbar__logo"
                aria-label="Vidyut Home"
                onClick={() => setMenuOpen(false)}
              >
                <img src={logoSrc} alt="Vidyut Logo" />
              </Link>

              <div />
            </div>

            <nav className="ember-drawer__nav" aria-label="Full Menu">
              <ul className="ember-drawer__list">
                {navItems.map((item, idx) => (
                  <motion.li
                    key={item.to}
                    initial={
                      prefersReducedMotion ? false : { opacity: 0, y: 12 }
                    }
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      duration: 0.25,
                      delay: prefersReducedMotion ? 0 : 0.05 + idx * 0.04,
                      ease: [0.22, 1, 0.36, 1],
                    }}
                  >
                    <NavLink
                      to={item.to}
                      end={item.to === '/'}
                      className={({ isActive }) =>
                        `ember-drawer__link ${isActive ? 'active' : ''}`
                      }
                      onClick={() => setMenuOpen(false)}
                    >
                      {item.label}
                    </NavLink>
                  </motion.li>
                ))}
              </ul>
            </nav>

            <div className="ember-drawer__bottom">
              <Link
                to={registerLink.to}
                className="navbar__register"
                onClick={() => setMenuOpen(false)}
              >
                {registerLink.label}
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}