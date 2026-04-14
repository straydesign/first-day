"use client";
import { motion } from "framer-motion";
import { Target, Calendar, Settings as SettingsIcon, Palette } from "lucide-react";
import { useMonotone } from "./MonotoneContext";
import { SPRING } from "@/lib/animations";
import { getClip, SHARD_CLIPS } from "@/constants";

interface BottomNavProps {
  currentView: string;
  onNavigateToGoals: () => void;
  onNavigateToCalendar?: () => void;
  onNavigateToSettings: () => void;
}

const NAV_ITEMS = [
  { id: "goals", label: "Goals", icon: Target },
  { id: "calendar", label: "Plan", icon: Calendar },
  { id: "settings", label: "Settings", icon: SettingsIcon },
] as const;

export function BottomNav({
  currentView,
  onNavigateToGoals,
  onNavigateToCalendar,
  onNavigateToSettings,
}: BottomNavProps) {
  const { monotone, toggleMonotone } = useMonotone();

  const handlers: Record<string, (() => void) | undefined> = {
    goals: onNavigateToGoals,
    calendar: onNavigateToCalendar,
    settings: onNavigateToSettings,
  };

  return (
    <motion.nav
      initial={{ y: 80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={SPRING.gentle}
      className="fixed bottom-0 left-0 right-0 z-40 md:hidden"
    >
      {/* Gradient fade above nav */}
      <div className="h-6 bg-gradient-to-t from-black to-transparent pointer-events-none" />
      <div className="bg-black/95 backdrop-blur-sm border-t border-white/10 px-2 pb-[env(safe-area-inset-bottom,8px)]">
        <div className="flex items-center justify-around py-2">
          {NAV_ITEMS.map((item, i) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            const handler = handlers[item.id];
            return (
              <button
                key={item.id}
                onClick={handler}
                disabled={!handler}
                className={`flex flex-col items-center gap-1 px-4 py-2 transition-all ${
                  isActive
                    ? "text-white scale-110"
                    : "text-white/40 hover:text-white/70"
                } ${!handler ? "opacity-30" : ""}`}
                style={{ clipPath: getClip(SHARD_CLIPS, i) }}
              >
                <Icon className="w-5 h-5" />
                <span className="text-[10px] font-bold uppercase tracking-wider">
                  {item.label}
                </span>
                {isActive && (
                  <motion.div
                    layoutId="bottomNavIndicator"
                    className="absolute -bottom-0.5 w-8 h-0.5 bg-white"
                    transition={SPRING.snappy}
                  />
                )}
              </button>
            );
          })}
          {/* Monotone toggle */}
          <button
            onClick={toggleMonotone}
            className="flex flex-col items-center gap-1 px-4 py-2 text-white/40 hover:text-white/70 transition-all"
          >
            <Palette className="w-5 h-5" />
            <span className="text-[10px] font-bold uppercase tracking-wider">
              {monotone ? "Color" : "Mono"}
            </span>
          </button>
        </div>
      </div>
    </motion.nav>
  );
}
