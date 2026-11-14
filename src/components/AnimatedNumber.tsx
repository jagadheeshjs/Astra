import React, { useEffect, useRef, useState } from 'react';

interface AnimatedNumberProps {
  value: number;
  decimals?: number;
  durationMs?: number;
  className?: string;
}

export const AnimatedNumber: React.FC<AnimatedNumberProps> = ({
  value,
  decimals = 0,
  durationMs = 380,
  className = '',
}) => {
  const [displayValue, setDisplayValue] = useState<number>(value);
  const currentRef = useRef<number>(value);
  const hasMountedRef = useRef<boolean>(false);

  useEffect(() => {
    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion || !Number.isFinite(value)) {
      currentRef.current = value;
      setDisplayValue(value);
      return;
    }

    const startVal = hasMountedRef.current ? currentRef.current : Math.max(0, value * 0.88);
    hasMountedRef.current = true;
    const endVal = value;

    if (Math.abs(endVal - startVal) < 0.0001) {
      currentRef.current = endVal;
      setDisplayValue(endVal);
      return;
    }

    let frameId = 0;
    const startTime = performance.now();

    const step = (now: number) => {
      const elapsed = now - startTime;
      const t = Math.min(1, elapsed / durationMs);
      // Cubic ease-out
      const eased = 1 - Math.pow(1 - t, 3);
      const next = startVal + (endVal - startVal) * eased;
      currentRef.current = next;
      setDisplayValue(next);
      if (t < 1) {
        frameId = requestAnimationFrame(step);
      } else {
        currentRef.current = endVal;
        setDisplayValue(endVal);
      }
    };

    frameId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frameId);
  }, [value, durationMs]);

  return <span className={className}>{displayValue.toFixed(decimals)}</span>;
};
