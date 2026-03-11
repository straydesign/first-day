"use client";
import type { EngagementState } from "@/types";
import { Flame, Zap, TrendingUp, Target } from "lucide-react";

interface StatsCardProps {
  engagement: EngagementState;
}

export function StatsCard({ engagement }: StatsCardProps) {
  const { completionRate, currentStreak, totalXP, level, levelProgress } = engagement;

  return (
    <div className="grid grid-cols-2 gap-3">
      <div className="mosaic-card relative backdrop-blur-sm clip-tile-a p-3 border border-white/15 overflow-hidden">
        <div className="absolute inset-0 bg-[#0a0a1e]/50 z-[1]" />
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-1">
            <Target className="w-4 h-4 text-white" />
            <span className="text-xs text-white/70 font-medium">Completion</span>
          </div>
          <p className="text-3xl font-bold text-white">{completionRate}%</p>
        </div>
      </div>

      <div className="mosaic-card relative backdrop-blur-sm clip-tile-b p-3 border border-white/15 overflow-hidden">
        <div className="absolute inset-0 bg-[#0a0a1e]/50 z-[1]" />
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-1">
            <Flame className="w-4 h-4 text-coral-500" />
            <span className="text-xs text-white/70 font-medium">Streak</span>
          </div>
          <p className="text-3xl font-bold text-white">{currentStreak} days</p>
        </div>
      </div>

      <div className="mosaic-card relative backdrop-blur-sm clip-tile-c p-3 border border-white/15 overflow-hidden">
        <div className="absolute inset-0 bg-[#0a0a1e]/50 z-[1]" />
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-1">
            <Zap className="w-4 h-4 text-yellow-500" />
            <span className="text-xs text-white/70 font-medium">Total XP</span>
          </div>
          <p className="text-3xl font-bold text-white">{totalXP.toLocaleString()}</p>
        </div>
      </div>

      <div className="mosaic-card relative backdrop-blur-sm clip-tile-d p-3 border border-white/15 overflow-hidden">
        <div className="absolute inset-0 bg-[#0a0a1e]/50 z-[1]" />
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="w-4 h-4 text-indigo-500" />
            <span className="text-xs text-white/70 font-medium">Level</span>
          </div>
          <p className="text-lg font-bold text-white">{level.name}</p>
          {level.nextThreshold && (
            <div className="mt-1">
              <div className="w-full h-1.5 bg-white/10 clip-progress overflow-hidden">
                <div
                  className="h-full bg-indigo-500 clip-progress transition-all duration-500"
                  style={{ width: `${levelProgress * 100}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
