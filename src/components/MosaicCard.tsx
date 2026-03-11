"use client";
import { memo } from "react";
import { VoronoiMosaic } from "./VoronoiMosaic";
import { MosaicBackground, type SafeZone } from "./MosaicBackground";
import { cn } from "@/lib/utils";

const TILE_VARIANTS = ["a", "b", "c", "d"] as const;
type TileVariant = (typeof TILE_VARIANTS)[number];

interface MosaicCardProps {
  children: React.ReactNode;
  tileVariant?: TileVariant;
  mosaicOpacity?: number;
  mosaicDensity?: number;
  seed?: number;
  showMosaic?: boolean;
  colorSubset?: string[];
  safeZone?: SafeZone | null;
  className?: string;
}

const DEFAULT_SAFE_ZONE: SafeZone = {
  yStart: 0.20,
  yEnd: 0.80,
  bleedProbability: 0.15,
};

function MosaicCardInner({
  children,
  tileVariant,
  mosaicDensity = 12,
  seed = 0,
  showMosaic = false,
  colorSubset,
  mosaicOpacity = 0.85,
  safeZone,
  className,
}: MosaicCardProps) {
  const variant = tileVariant ?? TILE_VARIANTS[seed % 4];
  const resolvedSafeZone = safeZone === null ? null : (safeZone ?? DEFAULT_SAFE_ZONE);

  return (
    <div
      className={cn(
        `clip-tile-${variant}`,
        "relative overflow-hidden border border-white/15 bg-[#0a0a1e] focus-geo",
        className
      )}
    >
      {/* Voronoi mosaic background */}
      <VoronoiMosaic
        seed={seed}
        tileCount={55}
        margin={8}
        gap={3}
        className="absolute inset-0 w-full h-full"
      />
      {/* Dark scrim for text readability */}
      <div className="absolute inset-0 bg-[#0a0a1e]/45 z-[1]" />
      {showMosaic && (
        <MosaicBackground
          density={mosaicDensity}
          opacity={mosaicOpacity}
          seed={seed}
          colorSubset={colorSubset}
          safeZone={resolvedSafeZone}
        />
      )}
      <div className="relative z-10 flex flex-col justify-center">{children}</div>
    </div>
  );
}

export const MosaicCard = memo(MosaicCardInner);
