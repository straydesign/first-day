"use client";
/**
 * FirstDayLogo — sleek monochrome wordmark (Apple-style). Replaces the old
 * multicolor Bebas shard-tile logo. Keeps the original prop surface so every
 * caller still compiles; extra/legacy props are accepted and ignored.
 */
import { memo } from "react";
import { cn } from "@/lib/utils";
import { FONT } from "@/lib/design";

/* Legacy export kept for any stray importer — no longer drives anything. */
export interface EffectConfig {
  strength: number;
  radius: number;
  rotateStrength: number;
  pushTransition: string;
  returnTransition: string;
}
export const DEFAULT_EFFECT_CONFIG: EffectConfig = {
  strength: 36,
  radius: 500,
  rotateStrength: 3,
  pushTransition: "transform 0.5s cubic-bezier(0.22, 0.8, 0.36, 1)",
  returnTransition: "transform 1.5s cubic-bezier(0.25, 2.5, 0.5, 1)",
};

interface FirstDayLogoProps {
  className?: string;
  showTagline?: boolean;
  showLetters?: boolean;
  size?: "default" | "hero";
  compact?: boolean;
  /* legacy — accepted & ignored */
  interactive?: boolean;
  width?: number;
  height?: number;
  layout?: "horizontal" | "vertical";
  effectConfig?: EffectConfig;
}

const TAGLINE = "First day of the rest of your life";

function FirstDayLogoInner({
  className = "",
  showTagline = true,
  showLetters = true,
  size = "default",
  compact = false,
}: FirstDayLogoProps) {
  if (compact) {
    return (
      <span
        className={cn("font-semibold tracking-[-0.01em] text-white", className)}
        style={{ fontFamily: FONT, fontSize: "clamp(1.05rem, 2.4vw, 1.35rem)" }}
      >
        First Day
      </span>
    );
  }

  const isHero = size === "hero";
  return (
    <div className={cn("flex flex-col items-center text-center", className)} style={{ fontFamily: FONT }}>
      {showLetters && (
        <div
          className="font-semibold tracking-[-0.03em] text-white leading-[0.95]"
          style={{ fontSize: isHero ? "clamp(3rem, 9vw, 6rem)" : "clamp(1.6rem, 4vw, 2.4rem)" }}
        >
          First Day
        </div>
      )}
      {showTagline && (
        <div
          className={cn("font-medium tracking-[-0.01em] text-white/45", showLetters && "mt-3")}
          style={{ fontSize: isHero ? "clamp(1.05rem, 2.6vw, 1.6rem)" : "clamp(0.8rem, 1.6vw, 1rem)" }}
        >
          {TAGLINE}
        </div>
      )}
    </div>
  );
}

export const FirstDayLogo = memo(FirstDayLogoInner);
