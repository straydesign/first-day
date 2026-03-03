"use client";
import type { Achievement } from "@/types";

interface AchievementCardProps {
  achievement: Achievement;
}

export function AchievementCard({ achievement }: AchievementCardProps) {
  const { icon, name, description, unlocked } = achievement;

  return (
    <div
      className={`flex flex-col items-center text-center p-3 rounded-xl border transition-smooth ${
        unlocked
          ? "bg-white border-lime-300 shadow-sm"
          : "bg-gray-50 border-gray-200 opacity-50 grayscale"
      }`}
    >
      <span className="text-3xl mb-1">{icon}</span>
      <p className={`text-sm font-semibold ${unlocked ? "text-slate-800" : "text-gray-400"}`}>
        {name}
      </p>
      <p className={`text-xs mt-0.5 ${unlocked ? "text-gray-500" : "text-gray-300"}`}>
        {unlocked ? description : "???"}
      </p>
    </div>
  );
}
