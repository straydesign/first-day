"use client";
import { motion } from "framer-motion";
import { Target, Calendar, Settings as SettingsIcon, Palette, Globe } from "lucide-react";
import { useMonotone } from "./MonotoneContext";
import { SPRING } from "@/lib/animations";
import { getClip, SHARD_CLIPS } from "@/constants";
import { VoronoiMosaic } from "./VoronoiMosaic";

const PANEL_DARK_PALETTE = ["#0a0a14", "#10122a", "#0f0e1f", "#181a3a", "#0c0d1e"] as const;

interface BottomNavProps {
  currentView: string;
  onNavigateToGoals: () => void;
  onNavigateToCalendar?: () => void;
  onNavigateToGallery?: () => void;
  onNavigateToSettings: () => void;
}

const NAV_ITEMS = [
  { id: "goals", label: "Goals", icon: Target },
  { id: "calendar", label: "Plan", icon: Calendar },
  { id: "gallery", label: "Gallery", icon: Globe },
  { id: "settings", label: "Settings", icon: SettingsIcon },
] as const;

export function BottomNav({
  currentView,
  onNavigateToGoals,
  onNavigateToCalendar,
  onNavigateToGallery,
  onNavigateToSettings,
}: BottomNavProps) {
  const { monotone, toggleMonotone } = useMonotone();

  const handlers: Record<string, (() => void) | undefined> = {
    goals: onNavigateToGoals,
    calendar: onNavigateToCalendar,
    gallery: onNavigateToGallery,
    settings: onNavigateToSettings,
  };

  return (
    <motion.nav
      initial={{ y: 80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={SPRING.gentle}
      className="fixed bottom-0 left-0 right-0 z-40 md:hidden"
    >
      <div className="relative overflow-hidden border-t border-white/10 px-2 pb-[env(safe-area-inset-bottom,8px)]">
        <VoronoiMosaic seed={2401} tileCount={48} margin={4} gap={2} palette={PANEL_DARK_PALETTE} className="absolute inset-0 w-full h-full pointer-events-none" />
        <div className="relative z-10 flex items-center justify-around py-2">
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
