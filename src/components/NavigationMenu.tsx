"use client";
import { Button } from "@/components/ui/button";
import { LogOut, Bell, Settings as SettingsIcon, Target, Calendar } from "lucide-react";
import { VoronoiMosaic } from "./VoronoiMosaic";
import { VORONOI_PALETTE } from "@/constants";

interface NavigationMenuProps {
  currentView: string;
  onNavigateToGoals: () => void;
  onNavigateToSettings: () => void;
  onNavigateToCalendar?: () => void;
  onShowNotifications?: () => void;
  onLogout: () => void;
}

export function NavigationMenu({
  currentView,
  onNavigateToGoals,
  onNavigateToSettings,
  onNavigateToCalendar,
  onShowNotifications,
  onLogout,
}: NavigationMenuProps) {
  const menuItems = [
    { id: "goals", label: "My Goals", icon: Target, onClick: onNavigateToGoals },
    { id: "calendar", label: "Calendar", icon: Calendar, onClick: onNavigateToCalendar || (() => {}) },
    { id: "notifications", label: "Reminders", icon: Bell, onClick: onShowNotifications || (() => {}) },
    { id: "settings", label: "Settings", icon: SettingsIcon, onClick: onNavigateToSettings },
  ];

  return (
    <div className="hidden md:flex justify-between items-center w-full relative overflow-visible">
      {/* Mosaic background with organic jagged edges */}
      <VoronoiMosaic
        seed={42}
        width={1200}
        height={80}
        tileCount={40}
        margin={10}
        gap={3}
        palette={VORONOI_PALETTE}
        hideEdgeTiles
        className="absolute -inset-2 w-[calc(100%+16px)] h-[calc(100%+16px)] opacity-30"
      />
      <div className="relative z-10 flex gap-2">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          return (
            <Button
              key={item.id}
              onClick={item.onClick}
              variant={isActive ? "default" : "outline"}
              size="sm"
              className={`transition-smooth hover:scale-105 ${isActive ? "" : "bg-transparent border-2 border-white font-bold text-white hover:bg-white/10"}`}
            >
              <Icon className="w-4 h-4 mr-2" />
              {item.label}
            </Button>
          );
        })}
      </div>
      <Button onClick={onLogout} variant="outline" size="sm" className="relative z-10 bg-transparent border-2 border-white/10 text-white/80 hover:bg-white/10 transition-smooth hover:scale-105">
        <LogOut className="w-4 h-4 mr-2" />
        Logout
      </Button>
    </div>
  );
}
