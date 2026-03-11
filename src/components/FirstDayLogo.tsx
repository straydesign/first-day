"use client";

import { memo } from "react";
import { VoronoiMosaic } from "./VoronoiMosaic";
import { VORONOI_LIGHT, VORONOI_PALETTE } from "@/constants";

interface FirstDayLogoProps {
  className?: string;
  width?: number;
  height?: number;
  showTagline?: boolean;
  showLetters?: boolean;
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
  showLetters = true,
  size = "default",
}: FirstDayLogoProps) {
  const isHero = size === "hero";
  const letterSize = isHero ? "clamp(3.5rem, 10vw, 7rem)" : "clamp(1.5rem, 4vw, 2.2rem)";

  return (
    <div className={`flex flex-col items-center ${className}`}>
      <div className={`bg-black border border-white/10 ${isHero ? "px-6 py-4" : "px-3 py-2"} flex flex-col items-center`} style={{ clipPath: "polygon(3% 2%, 12% 0%, 45% 1%, 78% 0%, 97% 3%, 100% 15%, 99% 50%, 100% 85%, 96% 98%, 82% 100%, 50% 99%, 18% 100%, 2% 97%, 0% 80%, 1% 45%, 0% 12%)" }}>
      {showLetters && (
        <>
          {/* FIRST row */}
          <div
            className="flex items-center drop-shadow-[0_2px_16px_rgba(0,0,0,0.6)]"
            style={{ gap: isHero ? "10px" : "5px" }}
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
              gap: isHero ? "10px" : "5px",
              marginTop: isHero ? "4px" : "2px",
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
        </>
      )}

      {/* Tagline — each letter cycles through palette colors */}
      {showTagline && (
        <span
          className={`${showLetters ? "mt-2" : ""} drop-shadow-[0_1px_8px_rgba(0,0,0,0.5)] flex flex-wrap justify-center`}
          style={{
            fontSize: isHero ? "clamp(0.9rem, 2.5vw, 2rem)" : "clamp(0.6rem, 1.5vw, 0.75rem)",
            fontWeight: 900,
            letterSpacing: 1,
            textTransform: "uppercase" as const,
            fontFamily: "var(--font-bebas), system-ui, sans-serif",
            whiteSpace: "nowrap" as const,
            transform: isHero ? "scaleY(1.4)" : undefined,
            transformOrigin: "center",
          }}
        >
          {"first day of the rest of your life".split("").map((char, i) => (
            <span
              key={i}
              style={{
                color: char === " " ? "transparent" : VORONOI_PALETTE[i % VORONOI_PALETTE.length],
                width: char === " " ? "0.3em" : undefined,
              }}
            >
              {char}
            </span>
          ))}
        </span>
      )}
      </div>
    </div>
  );
}

export const FirstDayLogo = memo(FirstDayLogoInner);
