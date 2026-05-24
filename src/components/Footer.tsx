"use client";

import { useRef, useCallback } from "react";
import { VORONOI_LIGHT } from "@/constants";
import { VoronoiMosaic } from "./VoronoiMosaic";

const PANEL_DARK_PALETTE = ["#0a0a14", "#10122a", "#0f0e1f", "#181a3a", "#0c0d1e"] as const;

interface FooterProps {
  onPrivacyClick?: () => void;
  onTermsClick?: () => void;
}

const SHARD_CLIPS = [
  "polygon(2% 0%, 100% 3%, 98% 100%, 0% 97%)",
  "polygon(0% 2%, 97% 0%, 100% 98%, 3% 100%)",
  "polygon(1% 3%, 100% 0%, 99% 97%, 0% 100%)",
  "polygon(3% 0%, 100% 2%, 97% 100%, 0% 98%)",
  "polygon(0% 0%, 98% 3%, 100% 100%, 2% 97%)",
];

const BASE_ROTATIONS = [1.2, -0.8, 1.5, -1.0, 0.6];

const EFFECT = {
  strength: 36,
  radius: 500,
  rotateStrength: 3,
  pushTransition: "transform 0.5s cubic-bezier(0.22, 0.8, 0.36, 1)",
  returnTransition: "transform 1.5s cubic-bezier(0.25, 2.5, 0.5, 1)",
};

export function Footer({ onPrivacyClick, onTermsClick }: FooterProps) {
  const currentYear = new Date().getFullYear();
  const wrapperRefs = useRef<(HTMLDivElement | null)[]>([]);
  const shardRefs = useRef<(HTMLDivElement | null)[]>([]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const mx = e.clientX;
    const my = e.clientY;

    wrapperRefs.current.forEach((wrapper, i) => {
      const shard = shardRefs.current[i];
      if (!wrapper || !shard) return;

      const rect = wrapper.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const baseRot = BASE_ROTATIONS[i];

      const dx = mx - cx;
      const dy = my - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < EFFECT.radius && dist > 0) {
        const force = (1 - dist / EFFECT.radius) * EFFECT.strength;
        const angle = Math.atan2(dy, dx);
        const pushX = -Math.cos(angle) * force;
        const pushY = -Math.sin(angle) * force;
        const pushR = baseRot + (-Math.cos(angle) * force / EFFECT.strength) * EFFECT.rotateStrength;

        shard.style.transition = EFFECT.pushTransition;
        shard.style.transform = `translate(${pushX}px, ${pushY}px) rotate(${pushR}deg)`;
      } else {
        shard.style.transition = EFFECT.returnTransition;
        shard.style.transform = `rotate(${baseRot}deg)`;
      }
    });
  }, []);

  const handleMouseLeave = useCallback(() => {
    shardRefs.current.forEach((shard, i) => {
      if (!shard) return;
      shard.style.transition = EFFECT.returnTransition;
      shard.style.transform = `rotate(${BASE_ROTATIONS[i]}deg)`;
    });
  }, []);

  const items = [
    {
      content: onPrivacyClick
        ? <button onClick={onPrivacyClick} className="text-black font-bold text-sm hover:opacity-70 transition-opacity">Privacy Policy</button>
        : <a href="/privacy" className="text-black font-bold text-sm hover:opacity-70 transition-opacity">Privacy Policy</a>,
      color: VORONOI_LIGHT[0],
    },
    {
      content: onTermsClick
        ? <button onClick={onTermsClick} className="text-black font-bold text-sm hover:opacity-70 transition-opacity">Terms of Service</button>
        : <a href="/terms" className="text-black font-bold text-sm hover:opacity-70 transition-opacity">Terms of Service</a>,
      color: VORONOI_LIGHT[1],
    },
    {
      content: <span className="text-black font-bold text-xs">&copy; {currentYear} First Day. All rights reserved.</span>,
      color: VORONOI_LIGHT[2],
    },
    {
      content: <a href="mailto:support@firstday.life" className="text-black font-bold text-xs hover:opacity-70 transition-opacity">support@firstday.life</a>,
      color: VORONOI_LIGHT[3],
    },
    {
      content: <a href="https://straywebdesign.co" target="_blank" rel="noopener noreferrer" className="text-black font-bold text-xs hover:opacity-70 transition-opacity">Built by Stray Web Design</a>,
      color: VORONOI_LIGHT[0],
    },
  ];

  return (
    <footer className="relative overflow-hidden py-8 mt-auto">
      <VoronoiMosaic seed={2503} tileCount={56} margin={4} gap={2} palette={PANEL_DARK_PALETTE} className="absolute inset-0 w-full h-full pointer-events-none" />
      <div
        className="relative z-10 max-w-7xl mx-auto px-4"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        <div className="flex flex-wrap gap-3 justify-center items-center">
          {items.map((item, i) => (
            <div
              key={i}
              ref={(el) => { wrapperRefs.current[i] = el; }}
              className="inline-flex"
            >
              <div
                ref={(el) => { shardRefs.current[i] = el; }}
                className="px-4 py-2 inline-flex items-center justify-center"
                style={{
                  backgroundColor: item.color,
                  clipPath: SHARD_CLIPS[i % SHARD_CLIPS.length],
                  transform: `rotate(${BASE_ROTATIONS[i]}deg)`,
                  willChange: "transform",
                }}
              >
                {item.content}
              </div>
            </div>
          ))}
        </div>
      </div>
    </footer>
  );
}
