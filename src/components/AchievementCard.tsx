"use client";
import type { Achievement } from "@/types";
import { Panel } from "@/components/ui/Panel";

interface AchievementCardProps {
  achievement: Achievement;
}

export function AchievementCard({ achievement }: AchievementCardProps) {
  const { icon, name, description, unlocked } = achievement;

  return (
    <Panel
      className={`transition-opacity ${unlocked ? "" : "opacity-50 grayscale"}`}
      contentClassName="p-3 flex flex-col items-center text-center"
    >
      <span className="text-3xl mb-1 block">{icon}</span>
      <p className={`text-[13px] font-semibold leading-tight ${unlocked ? "text-white" : "text-white/50"}`}>
        {name}
      </p>
      <p className={`text-[12px] mt-0.5 leading-snug ${unlocked ? "text-white/70" : "text-white/30"}`}>
        {unlocked ? description : "???"}
      </p>
    </Panel>
  );
}
