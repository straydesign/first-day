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
  palette?: string[];
  className?: string;
}

function MosaicCardInner({
  children,
  tileVariant,
  seed = 0,
  palette,
  className,
}: MosaicCardProps) {
  const variant = tileVariant ?? TILE_VARIANTS[seed % 4];

  return (
    <div
      className={cn(
        `clip-tile-${variant}`,
        "relative overflow-hidden border border-white/15 focus-geo",
        className
      )}
    >
      {/* Voronoi mosaic background */}
      <VoronoiMosaic
        seed={seed}
        tileCount={55}
        margin={8}
        gap={3}
        palette={palette}
        className="absolute inset-0 w-full h-full"
      />
      {/* No scrim — full brightness mosaic */}
      <div className="relative z-10 flex flex-col justify-center">{children}</div>
    </div>
  );
}

export const MosaicCard = memo(MosaicCardInner);
