import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowRight } from 'lucide-react';

interface IntroSplashProps {
  onComplete: () => void;
}

const STAR_FIELD = [
  { top: '8%', left: '12%', size: 2, delay: '0s', opacity: 0.55 },
  { top: '14%', left: '28%', size: 1.5, delay: '0.9s', opacity: 0.4 },
  { top: '10%', left: '47%', size: 2, delay: '1.6s', opacity: 0.5 },
  { top: '16%', left: '66%', size: 1.5, delay: '0.4s', opacity: 0.45 },
  { top: '9%', left: '84%', size: 2.5, delay: '1.2s', opacity: 0.6 },
  { top: '23%', left: '8%', size: 1.5, delay: '2.1s', opacity: 0.35 },
  { top: '26%', left: '21%', size: 2, delay: '0.6s', opacity: 0.5 },
  { top: '22%', left: '76%', size: 2, delay: '1.9s', opacity: 0.45 },
  { top: '29%', left: '91%', size: 1.5, delay: '0.8s', opacity: 0.4 },
  { top: '37%', left: '14%', size: 2, delay: '1.4s', opacity: 0.42 },
  { top: '34%', left: '86%', size: 2, delay: '2.4s', opacity: 0.48 },
  { top: '45%', left: '6%', size: 1.5, delay: '1.1s', opacity: 0.35 },
  { top: '48%', left: '93%', size: 1.5, delay: '0.3s', opacity: 0.4 },
  { top: '57%', left: '18%', size: 2, delay: '1.8s', opacity: 0.38 },
  { top: '54%', left: '80%', size: 2, delay: '0.7s', opacity: 0.42 },
  { top: '18%', left: '37%', size: 1.5, delay: '2.6s', opacity: 0.35 },
  { top: '19%', left: '58%', size: 2, delay: '1.3s', opacity: 0.52 },
  { top: '41%', left: '26%', size: 1.5, delay: '2.2s', opacity: 0.3 },
  { top: '43%', left: '73%', size: 1.5, delay: '0.5s', opacity: 0.34 },
  { top: '61%', left: '89%', size: 2, delay: '1.5s', opacity: 0.36 },
];

export const IntroSplash: React.FC<IntroSplashProps> = ({ onComplete }) => {
  const [exiting, setExiting] = useState(false);
  const completedRef = useRef(false);
  const exitTimerRef = useRef<number | null>(null);
  const finishTimerRef = useRef<number | null>(null);

  const prefersReducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

  const triggerExit = useCallback(() => {
    if (completedRef.current) return;
    completedRef.current = true;
    setExiting(true);

    if (exitTimerRef.current !== null) {
      window.clearTimeout(exitTimerRef.current);
      exitTimerRef.current = null;
    }

    const fadeMs = prefersReducedMotion ? 180 : 550;
    finishTimerRef.current = window.setTimeout(() => {
      onComplete();
    }, fadeMs);
  }, [onComplete, prefersReducedMotion]);

  useEffect(() => {
    const autoDismissMs = prefersReducedMotion ? 1500 : 3400;
    exitTimerRef.current = window.setTimeout(() => {
      triggerExit();
    }, autoDismissMs);

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' || event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        triggerExit();
      }
    };

    const keyListenerTimer = window.setTimeout(() => {
      window.addEventListener('keydown', handleKeyDown);
    }, 250);

    return () => {
      window.clearTimeout(keyListenerTimer);
      window.removeEventListener('keydown', handleKeyDown);
      if (exitTimerRef.current !== null) window.clearTimeout(exitTimerRef.current);
      if (finishTimerRef.current !== null) window.clearTimeout(finishTimerRef.current);
    };
  }, [prefersReducedMotion, triggerExit]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="ASTRA Mission Control Introduction"
      className={`no-print fixed inset-0 z-[60] flex flex-col items-center justify-center overflow-hidden bg-[#071629] text-white select-none transition-all ${
        prefersReducedMotion ? 'duration-200' : 'duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]'
      } ${exiting ? 'opacity-0 scale-[1.012] pointer-events-none' : 'opacity-100 scale-100'}`}
    >
      {/* Deep Space Atmospheric Backdrop */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 85% 60% at 50% 42%, rgba(24, 62, 110, 0.38) 0%, rgba(10, 29, 56, 0.72) 52%, #071629 100%)',
        }}
      />

      {/* Subtle Starfield Particles */}
      <div className="astra-splash-stars pointer-events-none absolute inset-0" aria-hidden="true">
        {STAR_FIELD.map((star, index) => (
          <span
            key={index}
            className="astra-splash-star absolute rounded-full bg-[#DCEEFF]"
            style={{
              top: star.top,
              left: star.left,
              width: `${star.size}px`,
              height: `${star.size}px`,
              opacity: star.opacity,
              animationDelay: star.delay,
            }}
          />
        ))}
      </div>

      {/* Subtle Orbital Reference Ring */}
      <div
        aria-hidden="true"
        className="astra-splash-horizon pointer-events-none absolute inset-x-0 bottom-0 h-[44vh] min-h-[260px] max-h-[460px] flex items-end justify-center overflow-hidden"
      >
        <svg
          viewBox="0 0 1440 420"
          preserveAspectRatio="xMidYMax slice"
          className="w-full h-full"
        >
          <defs>
            <radialGradient id="astra-planet-body" cx="50%" cy="100%" r="72%">
              <stop offset="0%" stopColor="#091D38" />
              <stop offset="68%" stopColor="#061427" />
              <stop offset="100%" stopColor="#040D1B" />
            </radialGradient>
            <linearGradient id="astra-horizon-rim" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#2878C7" stopOpacity="0" />
              <stop offset="22%" stopColor="#2878C7" stopOpacity="0.55" />
              <stop offset="50%" stopColor="#55B9E8" stopOpacity="0.95" />
              <stop offset="78%" stopColor="#2878C7" stopOpacity="0.55" />
              <stop offset="100%" stopColor="#2878C7" stopOpacity="0" />
            </linearGradient>
            <radialGradient id="astra-atmos-halo" cx="50%" cy="60%" r="50%">
              <stop offset="0%" stopColor="#55B9E8" stopOpacity="0.28" />
              <stop offset="48%" stopColor="#2878C7" stopOpacity="0.14" />
              <stop offset="100%" stopColor="#071629" stopOpacity="0" />
            </radialGradient>
            <filter id="astra-rim-blur" x="-10%" y="-40%" width="120%" height="180%">
              <feGaussianBlur stdDeviation="8" />
            </filter>
          </defs>

          {/* Outer Atmospheric Glow */}
          <ellipse cx="720" cy="400" rx="820" ry="260" fill="url(#astra-atmos-halo)" />

          {/* Subtle Orbital Track Arc */}
          <path
            d="M 80 390 Q 720 120 1360 390"
            fill="none"
            stroke="#55B9E8"
            strokeOpacity="0.16"
            strokeWidth="1"
            strokeDasharray="4 7"
          />

          {/* Diffused Cyan/Blue Horizon Rim */}
          <path
            d="M -60 420 Q 720 126 1500 420"
            fill="none"
            stroke="url(#astra-horizon-rim)"
            strokeWidth="10"
            filter="url(#astra-rim-blur)"
          />

          {/* Earth Limb Body */}
          <path
            d="M -80 430 Q 720 138 1520 430 L 1520 460 L -80 460 Z"
            fill="url(#astra-planet-body)"
          />

          {/* Crisp Atmospheric Limb Line */}
          <path
            d="M -60 422 Q 720 138 1500 422"
            fill="none"
            stroke="url(#astra-horizon-rim)"
            strokeWidth="2"
          />
        </svg>
      </div>

      {/* Centered Brand Lockup */}
      <div className="relative z-10 flex flex-col items-center text-center px-6 max-w-2xl -mt-8 sm:-mt-12">
        <p className="astra-splash-desc text-[10px] sm:text-[11px] font-medium uppercase tracking-[0.26em] text-[#8ECAF0]/85 mb-4">
          ASTRONAUT HEALTH MONITORING &amp; RISK ASSESSMENT SYSTEM
        </p>

        <h1
          className="astra-splash-title text-5xl sm:text-7xl font-bold tracking-[0.22em] text-white pl-[0.22em]"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          ASTRA
        </h1>

        <p className="astra-splash-subtitle mt-3 text-xs sm:text-sm font-medium uppercase tracking-[0.38em] text-[#55B9E8]/90 pl-[0.38em]">
          BY ASTERIONS
        </p>

        <div className="astra-splash-tagline mt-7 flex flex-col items-center gap-3">
          <div className="h-px w-16 bg-gradient-to-r from-transparent via-[#55B9E8]/55 to-transparent" />
          <p className="text-sm sm:text-base text-[#CBD9E8] font-normal tracking-wide max-w-md">
            &ldquo;A New Perspective on Astronaut Health Monitoring.&rdquo;
          </p>
        </div>

        {/* Initialization Indicator */}
        <div className="astra-splash-status mt-9 flex flex-col items-center gap-3">
          <div className="flex items-center gap-2.5 text-[11px] font-mono tracking-[0.18em] text-[#7FB8DE]">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#55B9E8] shadow-[0_0_8px_#55B9E8]" />
            <span>INITIALISING MISSION CONTROL...</span>
          </div>

          <div className="w-44 h-[2px] rounded-full bg-white/10 overflow-hidden">
            <div className="astra-splash-progress-bar h-full w-full bg-gradient-to-r from-[#2878C7] via-[#55B9E8] to-[#8EE0FF]" />
          </div>
        </div>
      </div>

      {/* Subtle Skip Control */}
      <div className="astra-splash-status fixed bottom-7 sm:bottom-9 inset-x-0 z-20 flex justify-center px-4">
        <button
          type="button"
          onClick={triggerExit}
          className="astra-btn group inline-flex items-center gap-2 rounded-lg border border-white/15 bg-white/[0.05] px-4 py-2 text-xs font-medium tracking-wide text-[#CFE4F7] backdrop-blur-sm hover:border-[#55B9E8]/50 hover:bg-white/[0.1] hover:text-white focus:outline-none focus:ring-2 focus:ring-[#55B9E8]/50"
        >
          <span>Enter Mission Control</span>
          <ArrowRight className="w-3.5 h-3.5 text-[#55B9E8] transition-transform duration-150 group-hover:translate-x-0.5" />
        </button>
      </div>
    </div>
  );
};
