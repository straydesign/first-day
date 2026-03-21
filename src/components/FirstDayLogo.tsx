"use client";

import { useRef, useCallback, memo } from "react";
import { VoronoiMosaic } from "./VoronoiMosaic";
import { VORONOI_LIGHT } from "@/constants";
import { useMonotone } from "./MonotoneContext";

/** Tagline palette — blues instead of purple */
const TAGLINE_PALETTE = [
  "#FFE633", "#FF6B2B", "#FF2D55", "#00EAFF",
  "#FF10F0", "#FF1493", "#4FC3F7", "#FF4500",
] as const;

/** Tagline rows — pairs of words cascading top-left → bottom-right */
const TAGLINE_ROWS = [
  { words: ["FIRST", "DAY"],   offset: 2 },
  { words: ["OF", "THE"],      offset: 8 },
  { words: ["REST", "OF"],     offset: 14 },
  { words: ["YOUR", "LIFE"],   offset: 20 },
] as const;

/** Shard clip-path variants for tagline word chips */
const SHARD_CLIPS_TAGLINE = [
  "polygon(2% 0%, 100% 3%, 98% 100%, 0% 97%)",
  "polygon(0% 3%, 98% 0%, 100% 97%, 2% 100%)",
  "polygon(1% 0%, 100% 2%, 99% 100%, 0% 98%)",
  "polygon(3% 2%, 100% 0%, 97% 98%, 0% 100%)",
] as const;

/** Per-word rotations for shard feel */
const TAGLINE_ROTATIONS = [-0.8, 0.6, -0.4, 1.0, -0.6, 0.3, -0.5, 0.8] as const;

/* ─── Effect config for interactive mouse-repulsion ─── */

export interface EffectConfig {
  strength: number;
  radius: number;
  rotateStrength: number;
  /** CSS transition for the push (mouse near) */
  pushTransition: string;
  /** CSS transition for the return (mouse away) */
  returnTransition: string;
}

export const DEFAULT_EFFECT_CONFIG: EffectConfig = {
  strength: 36,
  radius: 500,
  rotateStrength: 3,
  pushTransition: "transform 0.5s cubic-bezier(0.22, 0.8, 0.36, 1)",
  returnTransition: "transform 1.5s cubic-bezier(0.25, 2.5, 0.5, 1)",
};

/* ─── Props ─── */

interface FirstDayLogoProps {
  className?: string;
  width?: number;
  height?: number;
  showTagline?: boolean;
  showLetters?: boolean;
  layout?: "horizontal" | "vertical";
  size?: "default" | "hero";
  compact?: boolean;
  interactive?: boolean;
  effectConfig?: EffectConfig;
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
  monotone?: boolean;
}

function LetterTile({ letter, color, tile, rotate, fontSize, seed, showMosaic, monotone }: LetterTileProps) {
  const c = monotone ? "#ffffff" : color;
  return (
    <div
      className="relative inline-flex items-center justify-center overflow-hidden"
      style={{
        clipPath: TILE_CLIP[tile],
        transform: `rotate(${rotate}deg)`,
        backgroundColor: `${c}15`,
        border: `1px solid ${c}30`,
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
          color: c,
          textShadow: `0 0 20px ${c}40`,
          padding: "0.1em 0.15em",
        }}
      >
        {letter}
      </span>
    </div>
  );
}

/** Compact header text: FIRST DAY */
const COMPACT_LETTERS = [
  { char: "F", color: "#FFE633" },
  { char: "I", color: "#FF6B2B" },
  { char: "R", color: "#FF2D55" },
  { char: "S", color: "#00EAFF" },
  { char: "T", color: "#FF10F0" },
  { char: " ", color: "transparent" },
  { char: "D", color: "#FF1493" },
  { char: "A", color: "#4FC3F7" },
  { char: "Y", color: "#FF4500" },
] as const;

/* ─── Main component ─── */

function FirstDayLogoInner({
  className = "",
  showTagline = true,
  showLetters = true,
  size = "default",
  compact = false,
  interactive = false,
  effectConfig,
}: FirstDayLogoProps) {
  const { monotone } = useMonotone();
  const isHero = size === "hero";
  const letterSize = isHero ? "clamp(3.5rem, 10vw, 7rem)" : "clamp(1.5rem, 4vw, 2.2rem)";

  const config = effectConfig ?? DEFAULT_EFFECT_CONFIG;

  // Refs for direct DOM manipulation (interactive mode only)
  // Wrappers stay in place for position calculation; inner spans get the transform
  const wordWrapperRefs = useRef<(HTMLDivElement | null)[]>([]);
  const wordSpanRefs = useRef<(HTMLSpanElement | null)[]>([]);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      const mx = e.clientX;
      const my = e.clientY;

      wordWrapperRefs.current.forEach((wrapper, i) => {
        const span = wordSpanRefs.current[i];
        if (!wrapper || !span) return;

        const rect = wrapper.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        const baseRot = TAGLINE_ROTATIONS[i];

        const dx = mx - cx;
        const dy = my - cy;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < config.radius && dist > 0) {
          const force = (1 - dist / config.radius) * config.strength;
          const angle = Math.atan2(dy, dx);
          const pushX = -Math.cos(angle) * force;
          const pushY = -Math.sin(angle) * force;
          const pushR =
            baseRot +
            (-Math.cos(angle) * force / config.strength) * config.rotateStrength;

          span.style.transition = config.pushTransition;
          span.style.transform = `translate(${pushX}px, ${pushY}px) rotate(${pushR}deg)`;
        } else {
          span.style.transition = config.returnTransition;
          span.style.transform = `rotate(${baseRot}deg)`;
        }
      });
    },
    [config],
  );

  const handleMouseLeave = useCallback(() => {
    wordSpanRefs.current.forEach((span, i) => {
      if (!span) return;
      span.style.transition = config.returnTransition;
      span.style.transform = `rotate(${TAGLINE_ROTATIONS[i]}deg)`;
    });
  }, [config]);

  if (compact) {
    return (
      <div className={`flex items-center gap-0.5 ${className}`}>
        {COMPACT_LETTERS.map((l, i) =>
          l.char === " " ? (
            <span key={i} style={{ width: "0.3em" }} />
          ) : (
            <span
              key={i}
              style={{
                color: monotone ? "#ffffff" : l.color,
                fontFamily: "var(--font-bebas), system-ui, sans-serif",
                fontSize: "clamp(2.5rem, 7vw, 4.5rem)",
                fontWeight: 900,
                transform: "scaleY(1.3)",
                display: "inline-block",
              }}
            >
              {l.char}
            </span>
          )
        )}
      </div>
    );
  }

  return (
    <div className={`flex flex-col items-center ${className}`}>
      {showLetters ? (
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
                monotone={monotone}
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
                monotone={monotone}
              />
            ))}
          </div>
        </>
      )}

      {/* Tagline — each letter cycles through palette colors */}
      {showLetters && showTagline && (
        <span
          className="mt-2 drop-shadow-[0_1px_8px_rgba(0,0,0,0.5)] flex flex-wrap justify-center"
          style={{
            fontSize: "clamp(0.6rem, 1.5vw, 0.75rem)",
            fontWeight: 900,
            letterSpacing: 1,
            textTransform: "uppercase" as const,
            fontFamily: "var(--font-bebas), system-ui, sans-serif",
            whiteSpace: "nowrap" as const,
          }}
        >
          {"first day of the rest of your life".split("").map((char, i) => (
            <span
              key={i}
              style={{
                color: char === " " ? "transparent" : monotone ? "#ffffff" : TAGLINE_PALETTE[i % TAGLINE_PALETTE.length],
                width: char === " " ? "0.35em" : undefined,
              }}
            >
              {char}
            </span>
          ))}
        </span>
      )}
      </div>
      ) : null}

      {/* Tagline only (no card wrapper) — diagonal shard word cascade */}
      {!showLetters && showTagline && (
        <div
          className="flex flex-col w-full"
          style={{ gap: isHero ? "10px" : "6px" }}
          onMouseMove={interactive ? handleMouseMove : undefined}
          onMouseLeave={interactive ? handleMouseLeave : undefined}
        >
          {TAGLINE_ROWS.map((row, rowIdx) => (
            <div
              key={rowIdx}
              className="flex"
              style={{
                gap: isHero ? "12px" : "6px",
                marginLeft: `${row.offset}%`,
              }}
            >
              {row.words.map((word, wordIdx) => {
                const globalIdx = rowIdx * 2 + wordIdx;
                const c = monotone ? "#ffffff" : TAGLINE_PALETTE[globalIdx % TAGLINE_PALETTE.length];
                const baseRotation = TAGLINE_ROTATIONS[globalIdx];
                const wordStyle: React.CSSProperties = {
                  fontFamily: "var(--font-bebas), system-ui, sans-serif",
                  fontSize: isHero ? "clamp(1.8rem, 5vw, 5rem)" : "clamp(1.3rem, 4.5vw, 2.5rem)",
                  fontWeight: 900,
                  letterSpacing: 3,
                  color: c,
                  backgroundColor: "#0a0a14",
                  border: `1px solid ${c}30`,
                  clipPath: SHARD_CLIPS_TAGLINE[globalIdx % SHARD_CLIPS_TAGLINE.length],
                  whiteSpace: "nowrap" as const,
                  transform: `rotate(${baseRotation}deg)`,
                };

                if (interactive) {
                  return (
                    <div
                      key={word + wordIdx}
                      ref={(el) => { wordWrapperRefs.current[globalIdx] = el; }}
                      className="inline-block"
                    >
                      <span
                        ref={(el) => { wordSpanRefs.current[globalIdx] = el; }}
                        className="inline-block px-4 py-1.5 md:px-8 md:py-3"
                        style={{
                          ...wordStyle,
                          willChange: "transform",
                        }}
                      >
                        {word}
                      </span>
                    </div>
                  );
                }

                return (
                  <span
                    key={word + wordIdx}
                    className="inline-block px-4 py-1.5 md:px-8 md:py-3"
                    style={wordStyle}
                  >
                    {word}
                  </span>
                );
              })}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export const FirstDayLogo = memo(FirstDayLogoInner);
