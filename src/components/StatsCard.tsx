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
      <div className="bg-white/80 backdrop-blur-sm rounded-xl p-3 border border-gray-200 shadow-sm">
        <div className="flex items-center gap-2 mb-1">
          <Target className="w-4 h-4 text-teal-600" />
          <span className="text-xs text-gray-500 font-medium">Completion</span>
        </div>
        <p className="text-2xl font-bold text-slate-800">{completionRate}%</p>
      </div>

      <div className="bg-white/80 backdrop-blur-sm rounded-xl p-3 border border-gray-200 shadow-sm">
        <div className="flex items-center gap-2 mb-1">
          <Flame className="w-4 h-4 text-coral-500" />
          <span className="text-xs text-gray-500 font-medium">Streak</span>
        </div>
        <p className="text-2xl font-bold text-slate-800">{currentStreak} days</p>
      </div>

      <div className="bg-white/80 backdrop-blur-sm rounded-xl p-3 border border-gray-200 shadow-sm">
        <div className="flex items-center gap-2 mb-1">
          <Zap className="w-4 h-4 text-yellow-500" />
          <span className="text-xs text-gray-500 font-medium">Total XP</span>
        </div>
        <p className="text-2xl font-bold text-slate-800">{totalXP.toLocaleString()}</p>
      </div>

      <div className="bg-white/80 backdrop-blur-sm rounded-xl p-3 border border-gray-200 shadow-sm">
        <div className="flex items-center gap-2 mb-1">
          <TrendingUp className="w-4 h-4 text-indigo-500" />
          <span className="text-xs text-gray-500 font-medium">Level</span>
        </div>
        <p className="text-lg font-bold text-slate-800">{level.name}</p>
        {level.nextThreshold && (
          <div className="mt-1">
            <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-indigo-500 rounded-full transition-all duration-500"
                style={{ width: `${levelProgress * 100}%` }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
