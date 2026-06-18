"use client";
/**
 * MosaicCard — kept as the canonical card name, but now a thin wrapper over Panel
 * (the faceted-frosted "Voronoi corners + Apple radii" surface). Every existing call
 * site upgrades to the new design language for free. Legacy props (seed/density/
 * palette/ring/tileVariant) are accepted-and-ignored so nothing breaks; only `tone`
 * still means anything: tone="accent" → opaque white emphasis surface.
 *
 * New code should import { Panel } from "@/components/ui/Panel" directly.
 */
import { memo } from "react";
import { Panel } from "@/components/ui/Panel";

const TILE_VARIANTS = ["a", "b", "c", "d"] as const;
type TileVariant = (typeof TILE_VARIANTS)[number];
type Density = "sm" | "md" | "lg" | "xl";

interface MosaicCardProps {
  children: React.ReactNode;
  /** dark = frosted glass (default) · accent = opaque white emphasis surface · mosaic = treated as dark */
  tone?: "dark" | "accent" | "mosaic";
  /** legacy — ignored */
  accentColor?: string;
  /** legacy — ignored */
  tileVariant?: TileVariant;
  /** legacy — ignored */
  seed?: number;
  /** legacy — ignored */
  density?: Density;
  /** legacy — ignored */
  palette?: readonly string[];
  /** legacy — ignored */
  ring?: string;
  className?: string;
  /** Classes for the inner content wrapper (padding, layout). */
  contentClassName?: string;
}

function MosaicCardInner({ children, tone = "dark", className, contentClassName }: MosaicCardProps) {
  return (
    <Panel solid={tone === "accent"} className={className} contentClassName={contentClassName}>
      {children}
    </Panel>
  );
}

export const MosaicCard = memo(MosaicCardInner);
