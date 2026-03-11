"use client";
import { memo } from "react";
import { VoronoiMosaic } from "./VoronoiMosaic";
import { cn } from "@/lib/utils";

const TILE_VARIANTS = ["a", "b", "c", "d"] as const;
type TileVariant = (typeof TILE_VARIANTS)[number];

interface MosaicCardProps {
  children: React.ReactNode;
  tileVariant?: TileVariant;
  seed?: number;
  className?: string;
}

function MosaicCardInner({
  children,
  tileVariant,
  seed = 0,
  className,
}: MosaicCardProps) {
  const variant = tileVariant ?? TILE_VARIANTS[seed % 4];

  return (
    <div
      className={cn(
        `clip-tile-${variant}`,
        "relative overflow-hidden border border-white/15 bg-[#0B132B] focus-geo",
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
      <div className="absolute inset-0 bg-[#0B132B]/45 z-[1]" />
      <div className="relative z-10 flex flex-col justify-center">{children}</div>
    </div>
  );
}

export const MosaicCard = memo(MosaicCardInner);
