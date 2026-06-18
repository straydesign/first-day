"use client";
/**
 * Background — the ONE interactive backdrop for the whole app.
 *
 * A single greyscale Voronoi field (replaces the ~870KB 3D cosmos shell and the
 * dozens of per-card mosaics). Stays alive: parallax-drifts with the cursor and
 * carries a soft spotlight that follows the pointer. Mounted once in layout.tsx,
 * fixed behind all content. Every view is transparent on top of it.
 */
import { useEffect, useRef } from "react";
import { VoronoiMosaic } from "@/components/VoronoiMosaic";
import { GREY_VORONOI, BG_BASE } from "@/lib/design";

export function Background() {
  const wrap = useRef<HTMLDivElement>(null);
  const layer = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let raf = 0;
    const onMove = (e: MouseEvent) => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const dx = e.clientX / window.innerWidth - 0.5;
        const dy = e.clientY / window.innerHeight - 0.5;
        if (layer.current) layer.current.style.transform = `translate3d(${dx * -16}px, ${dy * -16}px, 0) scale(1.05)`;
        if (wrap.current) {
          wrap.current.style.setProperty("--mx", `${e.clientX}px`);
          wrap.current.style.setProperty("--my", `${e.clientY}px`);
        }
      });
    };
    window.addEventListener("mousemove", onMove);
    return () => {
      window.removeEventListener("mousemove", onMove);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div
      ref={wrap}
      aria-hidden
      className="fixed inset-0 z-0 overflow-hidden pointer-events-none"
      style={{ backgroundColor: BG_BASE }}
    >
      <div
        ref={layer}
        className="absolute inset-0 transition-transform duration-300 ease-out will-change-transform"
        style={{ transform: "scale(1.05)" }}
      >
        <VoronoiMosaic
          seed={808}
          tileCount={46}
          margin={0}
          gap={2}
          palette={GREY_VORONOI as unknown as string[]}
          className="absolute inset-0 h-full w-full"
        />
      </div>
      {/* cursor spotlight — the "alive" cue */}
      <div
        className="absolute inset-0"
        style={{ background: "radial-gradient(360px circle at var(--mx,50%) var(--my,28%), rgba(255,255,255,0.07), transparent 72%)" }}
      />
      {/* bottom vignette to ground content */}
      <div
        className="absolute inset-0"
        style={{ background: "radial-gradient(ellipse at 50% 120%, rgba(0,0,0,0.55), transparent 55%)" }}
      />
    </div>
  );
}
