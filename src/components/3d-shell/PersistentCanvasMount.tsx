"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

const PersistentCanvas = dynamic(
  () => import("./PersistentCanvas").then((m) => ({ default: m.PersistentCanvas })),
  { ssr: false, loading: () => null },
);

/**
 * Mounts the persistent r3f shell — but only AFTER the page's DOM content has
 * painted. The shell pulls in ~870 KB of three.js + a WebGL context init, which
 * otherwise competes with first paint and makes the app "take forever to load."
 *
 * The landing wordmark, buttons, and every app panel are DOM (not drawn by the
 * canvas), so gating the canvas on `requestIdleCallback` lets the real content
 * appear instantly; the 3D room then fades in on idle. Behaviour is unchanged —
 * RoomRegistry / progress intents are module state the canvas reads on mount, so
 * a late mount still lands in the correct room.
 */
export function PersistentCanvasMount() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const w = window as typeof window & {
      requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number;
      cancelIdleCallback?: (id: number) => void;
    };
    let idleId: number | undefined;
    let timer: ReturnType<typeof setTimeout> | undefined;

    if (typeof w.requestIdleCallback === "function") {
      idleId = w.requestIdleCallback(() => setReady(true), { timeout: 1800 });
    } else {
      // Safari/older: defer one paint past load.
      timer = setTimeout(() => setReady(true), 350);
    }

    return () => {
      if (idleId != null && typeof w.cancelIdleCallback === "function") w.cancelIdleCallback(idleId);
      if (timer) clearTimeout(timer);
    };
  }, []);

  if (!ready) return null;
  return <PersistentCanvas />;
}
