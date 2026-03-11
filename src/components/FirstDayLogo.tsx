"use client";

import { memo } from "react";
import { VoronoiMosaic } from "./VoronoiMosaic";
import { VORONOI_LIGHT } from "@/constants";

interface FirstDayLogoProps {
  className?: string;
  width?: number;
  height?: number;
  showTagline?: boolean;
  layout?: "horizontal" | "vertical";
  size?: "default" | "hero";
}

// Per-letter tile colors from sunset light palette
const LETTER_TILES = [
  { letter: "F", color: "#FFE633", tile: "a", rotate: -1.5 },
  { letter: "I", color: "#FF6B2B", tile: "b", rotate: 1.2 },
  { letter: "R", color: "#FF2D55", tile: "c", rotate: -0.8 },
  { letter: "S", color: "#00EAFF", tile: "d", rotate: 1.8 },
  { letter: "T", color: "#FFE633", tile: "a", rotate: -1.2 },
] as const;

const DAY_TILES = [
  { letter: "D", color: "#FF2D55", tile: "b", rotate: 1.5 },
  { letter: "A", color: "#FF6B2B", tile: "c", rotate: -2 },
  { letter: "Y", color: "#00EAFF", tile: "d", rotate: 0.8 },
] as const;

const TILE_CLIP: Record<string, string> = {
  a: "polygon(2% 0%, 100% 0%, 98% 100%, 0% 100%)",
  b: "polygon(0% 0%, 97% 2%, 100% 100%, 3% 98%)",
  c: "polygon(1% 3%, 100% 0%, 99% 97%, 0% 100%)",
  d: "polygon(0% 1%, 98% 0%, 100% 99%, 2% 100%)",
};

interface LetterTileProps {
  letter: string;
  color: string;
  tile: string;
  rotate: number;
  fontSize: string;
  seed: number;
  showMosaic: boolean;
}

function LetterTile({ letter, color, tile, rotate, fontSize, seed, showMosaic }: LetterTileProps) {
  return (
    <div
      className="relative inline-flex items-center justify-center overflow-hidden"
      style={{
        clipPath: TILE_CLIP[tile],
        transform: `rotate(${rotate}deg)`,
        backgroundColor: `${color}15`,
        border: `1px solid ${color}30`,
      }}
    >
      {showMosaic && (
        <VoronoiMosaic
          seed={seed}
          tileCount={7}
          margin={2}
          gap={1}
          palette={[VORONOI_LIGHT[seed % VORONOI_LIGHT.length]]}
          className="absolute inset-0 w-full h-full opacity-20"
        />
      )}
      <span
        className="relative z-10 block leading-none"
        style={{
          fontFamily: "var(--font-bebas), system-ui, sans-serif",
          fontSize,
          fontWeight: 400,
          color,
          textShadow: `0 0 20px ${color}40`,
          padding: "0.1em 0.15em",
        }}
      >
        {letter}
      </span>
    </div>
  );
}

function FirstDayLogoInner({
  className = "",
  showTagline = true,
  size = "default",
}: FirstDayLogoProps) {
  const isHero = size === "hero";
  const letterSize = isHero ? "clamp(3.5rem, 10vw, 7rem)" : "clamp(1.5rem, 4vw, 2.2rem)";

  return (
    <div className={`flex flex-col items-center ${className}`}>
      {/* FIRST row */}
      <div
        className="flex items-center drop-shadow-[0_2px_16px_rgba(0,0,0,0.6)]"
        style={{ gap: isHero ? "4px" : "2px", marginLeft: isHero ? "-2px" : "0" }}
      >
        {LETTER_TILES.map((lt, i) => (
          <LetterTile
            key={lt.letter}
            {...lt}
            fontSize={letterSize}
            seed={i * 7}
            showMosaic={isHero}
          />
        ))}
      </div>

      {/* DAY row */}
      <div
        className="flex items-center drop-shadow-[0_2px_16px_rgba(0,0,0,0.6)]"
        style={{
          gap: isHero ? "4px" : "2px",
          marginTop: isHero ? "-6px" : "-3px",
          marginRight: isHero ? "-4px" : "0",
        }}
      >
        {DAY_TILES.map((lt, i) => (
          <LetterTile
            key={lt.letter}
            {...lt}
            fontSize={letterSize}
            seed={(i + 5) * 11}
            showMosaic={isHero}
          />
        ))}
      </div>

      {/* Tagline */}
      {showTagline && (
        <span
          className="mt-2 drop-shadow-[0_1px_8px_rgba(0,0,0,0.5)]"
          style={{
            fontSize: isHero ? "clamp(0.85rem, 2vw, 1.15rem)" : "clamp(0.6rem, 1.5vw, 0.75rem)",
            fontWeight: 500,
            color: "rgba(255,255,255,0.7)",
            letterSpacing: 3,
            textTransform: "uppercase" as const,
            fontFamily: "var(--font-inter), system-ui, sans-serif",
          }}
        >
          Your first day starts now
        </span>
      )}
    </div>
  );
}

export const FirstDayLogo = memo(FirstDayLogoInner);
