"use client";
import type { Achievement } from "@/types";

interface AchievementCardProps {
  achievement: Achievement;
}

export function AchievementCard({ achievement }: AchievementCardProps) {
  const { icon, name, description, unlocked } = achievement;

  return (
    <div
      className={`relative flex flex-col items-center text-center p-3 clip-tile-c border transition-smooth overflow-hidden ${
        unlocked
          ? "mosaic-card border-[#7cff67]"
          : "bg-[#12122e] border-white/10 opacity-50 grayscale"
      }`}
    >
      {unlocked && <div className="absolute inset-0 bg-[#0a0a1e]/50 z-[1]" />}
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
