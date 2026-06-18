"use client";
import type { EngagementState } from "@/types";
import { Flame, Zap, TrendingUp, Target } from "lucide-react";
import { Panel } from "@/components/ui/Panel";

interface StatsCardProps {
  engagement: EngagementState;
}

export function StatsCard({ engagement }: StatsCardProps) {
  const { completionRate, currentStreak, totalXP, level, levelProgress } = engagement;

  return (
    <div className="grid grid-cols-2 gap-3">
      <Panel contentClassName="p-3">
        <div className="flex items-center gap-2 mb-1">
          <Target className="w-4 h-4 text-white/60" />
          <span className="text-[12px] font-medium uppercase tracking-[0.08em] text-white/40">Completion</span>
        </div>
        <p className="text-[28px] font-semibold tracking-[-0.02em] text-white tabular-nums leading-none">{completionRate}%</p>
      </Panel>

      <Panel contentClassName="p-3">
        <div className="flex items-center gap-2 mb-1">
          <Flame className="w-4 h-4 text-white/60" />
          <span className="text-[12px] font-medium uppercase tracking-[0.08em] text-white/40">Streak</span>
        </div>
        <p className="text-[28px] font-semibold tracking-[-0.02em] text-white tabular-nums leading-none">{currentStreak} <span className="text-[16px] font-medium text-white/55">days</span></p>
      </Panel>

      <Panel contentClassName="p-3">
        <div className="flex items-center gap-2 mb-1">
          <Zap className="w-4 h-4 text-white/60" />
          <span className="text-[12px] font-medium uppercase tracking-[0.08em] text-white/40">Total XP</span>
        </div>
        <p className="text-[28px] font-semibold tracking-[-0.02em] text-white tabular-nums leading-none">{totalXP.toLocaleString()}</p>
      </Panel>

      <Panel contentClassName="p-3">
        <div className="flex items-center gap-2 mb-1">
          <TrendingUp className="w-4 h-4 text-white/60" />
          <span className="text-[12px] font-medium uppercase tracking-[0.08em] text-white/40">Level</span>
        </div>
        <p className="text-[18px] font-semibold tracking-[-0.01em] text-white leading-tight">{level.name}</p>
        {level.nextThreshold && (
          <div className="mt-2">
            <div className="h-1 w-full rounded-full bg-white/10 overflow-hidden">
              <div
                className="h-full rounded-full bg-white/85 transition-all duration-500"
                style={{ width: `${levelProgress * 100}%` }}
              />
            </div>
          </div>
        )}
      </Panel>
    </div>
  );
}
