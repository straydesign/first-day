"use client";
import type { Achievement } from "@/types";
import { BRIGHT_COLORS } from "@/constants";
import { VoronoiMosaic } from "./VoronoiMosaic";

const PANEL_DARK_PALETTE = ["#0a0a14", "#10122a", "#0f0e1f", "#181a3a", "#0c0d1e"] as const;

interface AchievementCardProps {
  achievement: Achievement;
}

export function AchievementCard({ achievement }: AchievementCardProps) {
  const { icon, name, description, unlocked, id } = achievement;

  // Use achievement id hash as seed for unique mosaic per badge
  const seed = id.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);

  return (
    <div
      className={`relative flex flex-col items-center text-center p-3 clip-tile-c border transition-smooth overflow-hidden ${
        unlocked
          ? ""
          : "border-white/10 opacity-50 grayscale"
      }`}
      style={unlocked ? { borderColor: BRIGHT_COLORS[0] } : undefined}
    >
      {unlocked ? (
        <VoronoiMosaic seed={seed} tileCount={15} margin={3} gap={2} className="absolute inset-0 w-full h-full pointer-events-none" />
      ) : (
        <VoronoiMosaic seed={seed} tileCount={15} margin={3} gap={2} palette={PANEL_DARK_PALETTE} className="absolute inset-0 w-full h-full pointer-events-none" />
      )}
      <div className="relative z-10">
        <span className="text-3xl mb-1 block">{icon}</span>
        <p className={`text-sm font-semibold ${unlocked ? "text-white" : "text-white/50"}`}>
          {name}
        </p>
        <p className={`text-xs mt-0.5 ${unlocked ? "text-white/70" : "text-white/30"}`}>
          {unlocked ? description : "???"}
        </p>
      </div>
    </div>
  );
}
