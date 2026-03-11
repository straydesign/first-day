"use client";
import { Flame } from "lucide-react";

interface StreakBadgeProps {
  streak: number;
  isAtRisk: boolean;
  size?: "sm" | "md";
}

export function StreakBadge({ streak, isAtRisk, size = "md" }: StreakBadgeProps) {
  if (streak === 0 && !isAtRisk) return null;

  const isSm = size === "sm";

  return (
    <div
      className={`inline-flex items-center gap-1 clip-badge-a font-bold ${
        isAtRisk
          ? "bg-coral-500/20 text-coral-400 animate-pulse"
          : "bg-lime-500/20 text-lime-400"
      } ${isSm ? "px-2 py-0.5 text-xs" : "px-3 py-1 text-sm"}`}
    >
      <Flame className={isSm ? "w-3 h-3" : "w-4 h-4"} />
      <span>{streak}</span>
    </div>
  );
}
