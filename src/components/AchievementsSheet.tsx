"use client";
import type { Achievement } from "@/types";
import { AchievementCard } from "./AchievementCard";
import { Sheet, SheetContent, SheetTitle, SheetDescription, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Trophy } from "lucide-react";

interface AchievementsSheetProps {
  achievements: Achievement[];
  children?: React.ReactNode;
}

export function AchievementsSheet({ achievements, children }: AchievementsSheetProps) {
  const unlockedCount = achievements.filter((a) => a.unlocked).length;

  return (
    <Sheet>
      <SheetTrigger asChild>
        {children ?? (
          <Button
            variant="outline"
            size="sm"
            className="border-2 border-yellow-500 text-yellow-400 hover:bg-white/10"
          >
            <Trophy className="w-4 h-4 mr-1" />
            {unlockedCount}/{achievements.length}
          </Button>
        )}
      </SheetTrigger>
      <SheetContent side="bottom" className="max-h-[70vh] overflow-y-auto bg-[#12122e] rounded-t-none border-t border-white/10">
        <SheetTitle className="text-xl font-bold text-white mb-1 pt-2">
          Achievements
        </SheetTitle>
        <SheetDescription className="text-sm text-white/50 mb-4">
          {unlockedCount} of {achievements.length} unlocked
        </SheetDescription>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pb-6">
          {achievements.map((a) => (
            <AchievementCard key={a.id} achievement={a} />
          ))}
        </div>
      </SheetContent>
    </Sheet>
  );
}
