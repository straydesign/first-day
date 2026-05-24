"use client";

import { useEffect, useRef } from "react";
import { setRoomView } from "./3d-shell/RoomRegistry";

// Auto-tour the 3D room shell behind the landing page so first-time visitors
// see the camera dolly through goals → congrats → day → calendar → landing
// before they interact. Cancels on first user input. Honors reduced-motion.
// Visceral: hero isn't a still — the product's full journey acts itself out
// behind the brand mosaic before the user lifts a finger (Tom 2026-05-13).

const TOUR_SEQUENCE: { view: "goals" | "calendar" | "day" | "congrats" | "landing"; dwellMs: number }[] = [
  { view: "goals",    dwellMs: 5000 },
  { view: "congrats", dwellMs: 6500 },
  { view: "day",      dwellMs: 6500 },
  { view: "calendar", dwellMs: 6500 },
  { view: "landing",  dwellMs: 5000 },
];
const INITIAL_DELAY_MS = 4500;

export function HeroAutoTour({ enabled = true }: { enabled?: boolean }) {
  const cancelled = useRef(false);
  const timers = useRef<number[]>([]);

  useEffect(() => {
    if (!enabled || typeof window === "undefined") return;
    const mql = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (mql.matches) return;

    cancelled.current = false;
    const clearAll = () => {
      cancelled.current = true;
      timers.current.forEach((t) => window.clearTimeout(t));
      timers.current = [];
    };
    const onInteract = () => clearAll();
    window.addEventListener("pointerdown", onInteract, { capture: true, once: true });
    window.addEventListener("keydown", onInteract, { capture: true, once: true });
    window.addEventListener("wheel", onInteract, { capture: true, once: true, passive: true });

    let elapsed = INITIAL_DELAY_MS;
    for (const step of TOUR_SEQUENCE) {
      const at = elapsed;
      const id = window.setTimeout(() => {
        if (!cancelled.current) setRoomView(step.view);
      }, at);
      timers.current.push(id);
      elapsed += step.dwellMs;
    }

    return () => {
      clearAll();
      window.removeEventListener("pointerdown", onInteract, { capture: true });
      window.removeEventListener("keydown", onInteract, { capture: true });
      window.removeEventListener("wheel", onInteract, { capture: true });
    };
  }, [enabled]);

  return null;
}
