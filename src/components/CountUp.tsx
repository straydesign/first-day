"use client";

/**
 * CountUp — animates a number from 0 → target when scrolled into view.
 *
 * Uses useMotionValue + textContent updates instead of React state so
 * each frame doesn't trigger a re-render. Maps cleanly to SwiftUI:
 * `Text("\(value)").contentTransition(.numericText())`.
 */

import { useEffect, useRef } from "react";
import { useInView, useMotionValue, animate } from "framer-motion";

interface CountUpProps {
  target: number;
  suffix?: string;
  prefix?: string;
  /** Locale-aware grouping (e.g., "1,450"). Defaults to true. */
  format?: boolean;
  duration?: number;
  /** Delay before starting (seconds). */
  delay?: number;
}

export function CountUp({
  target,
  suffix = "",
  prefix = "",
  format = true,
  duration = 1.4,
  delay = 0,
}: CountUpProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const motionVal = useMotionValue(0);

  useEffect(() => {
    if (!inView) return;
    const controls = animate(motionVal, target, {
      duration,
      delay,
      ease: [0.22, 0.8, 0.3, 1],
    });
    const render = (v: number) => {
      if (!ref.current) return;
      const rounded = Math.round(v);
      const display = format ? rounded.toLocaleString() : String(rounded);
      ref.current.textContent = `${prefix}${display}${suffix}`;
    };
    render(0);
    const unsub = motionVal.on("change", render);
    return () => {
      controls.stop();
      unsub();
    };
  }, [inView, target, duration, delay, suffix, prefix, format, motionVal]);

  return <span ref={ref}>{`${prefix}0${suffix}`}</span>;
}
