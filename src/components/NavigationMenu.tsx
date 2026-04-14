"use client";
import { LogOut, Target, Calendar, Settings as SettingsIcon } from "lucide-react";
import { getClip, SHARD_CLIPS } from "@/constants";

interface NavigationMenuProps {
  currentView: string;
  onNavigateToGoals: () => void;
  onNavigateToSettings: () => void;
  onNavigateToCalendar?: () => void;
  onShowNotifications?: () => void;
  onLogout: () => void;
}

const NAV_ITEMS = [
  { id: "goals", label: "Goals", icon: Target },
  { id: "calendar", label: "Plan", icon: Calendar },
  { id: "settings", label: "Settings", icon: SettingsIcon },
] as const;

export function NavigationMenu({
  currentView,
  onNavigateToGoals,
  onNavigateToSettings,
  onNavigateToCalendar,
  onLogout,
}: NavigationMenuProps) {
  const handlers: Record<string, (() => void) | undefined> = {
    goals: onNavigateToGoals,
    calendar: onNavigateToCalendar,
    settings: onNavigateToSettings,
  };

  return (
    <div className="hidden md:flex items-center gap-2 w-full">
      <nav className="flex items-center gap-2">
        {NAV_ITEMS.map((item, i) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          const handler = handlers[item.id];
          return (
            <button
              key={item.id}
              onClick={handler}
              disabled={!handler}
              className={`flex items-center gap-2 px-5 py-2.5 text-sm font-bold uppercase tracking-wider transition-all hover:scale-105 ${
                isActive
                  ? "bg-white text-black"
                  : "bg-black/80 text-white/80 hover:text-white hover:bg-black"
              } ${!handler ? "opacity-30 cursor-not-allowed" : ""}`}
              style={{ clipPath: getClip(SHARD_CLIPS, i) }}
            >
              <Icon className="w-4 h-4" />
              {item.label}
            </button>
          );
        })}
      </nav>
      <div className="flex-1" />
      <button
        onClick={onLogout}
        className="flex items-center gap-2 px-4 py-2 text-sm font-bold uppercase tracking-wider bg-black/60 text-white/50 hover:text-white hover:bg-black/80 transition-all hover:scale-105"
        style={{ clipPath: getClip(SHARD_CLIPS, 3) }}
      >
        <LogOut className="w-4 h-4" />
        Logout
      </button>
    </div>
  );
}
