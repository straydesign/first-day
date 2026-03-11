"use client";
import type { Achievement } from "@/types";
import { VoronoiMosaic } from "./VoronoiMosaic";

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
          ? "bg-[#060B18] border-[#FFE633]"
          : "bg-[#060B18] border-white/10 opacity-50 grayscale"
      }`}
    >
      {unlocked && (
        <>
          <VoronoiMosaic seed={seed} tileCount={15} margin={3} gap={2} className="absolute inset-0 w-full h-full" />
          <div className="absolute inset-0 bg-[#060B18]/45 z-[1]" />
        </>
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
