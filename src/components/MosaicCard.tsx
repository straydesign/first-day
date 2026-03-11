"use client";
import { memo } from "react";
import { MosaicBackground } from "./MosaicBackground";
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
  className?: string;
}

function MosaicCardInner({
  children,
  tileVariant,
  mosaicOpacity = 0.18,
  mosaicDensity = 12,
  seed = 0,
  showMosaic = true,
  colorSubset,
  className,
}: MosaicCardProps) {
  const variant = tileVariant ?? TILE_VARIANTS[seed % 4];

  return (
    <div
      className={cn(
        `clip-tile-${variant}`,
        "relative overflow-hidden border border-white/10 bg-card focus-geo",
        className
      )}
    >
      {showMosaic && (
        <MosaicBackground
          density={mosaicDensity}
          opacity={mosaicOpacity}
          seed={seed}
          colorSubset={colorSubset}
        />
      )}
      <div className="relative z-10">{children}</div>
    </div>
  );
}

export const MosaicCard = memo(MosaicCardInner);
