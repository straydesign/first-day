"use client";
import { Button } from "@/components/ui/button";
import { LogOut, Bell, Settings as SettingsIcon, Target, Calendar } from "lucide-react";

interface NavigationMenuProps {
  currentView: string;
  onNavigateToGoals: () => void;
  onNavigateToSettings: () => void;
  onNavigateToCalendar?: () => void;
  onShowNotifications?: () => void;
  onLogout: () => void;
  showCalendarOption?: boolean;
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
    <div className="hidden md:flex justify-between items-center w-full">
      <div className="flex gap-2">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          return (
            <Button
              key={item.id}
              onClick={item.onClick}
              variant={isActive ? "default" : "outline"}
              size="sm"
              className={`transition-smooth hover:scale-105 ${isActive ? "bg-teal-600 hover:bg-teal-700 text-white border-teal-600" : "bg-transparent border-2 border-coral-600 text-coral-600 hover:bg-coral-50"}`}
            >
              <Icon className="w-4 h-4 mr-2" />
              {item.label}
            </Button>
          );
        })}
      </div>
      <Button onClick={onLogout} variant="outline" size="sm" className="bg-transparent border-2 border-coral-600 text-coral-600 hover:bg-coral-50 transition-smooth hover:scale-105">
        <LogOut className="w-4 h-4 mr-2" />
        Logout
      </Button>
    </div>
  );
}
