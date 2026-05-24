"use client";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Bell } from "lucide-react";
import { VoronoiMosaic } from "./VoronoiMosaic";

const PANEL_DARK_PALETTE = ["#0a0a14", "#10122a", "#0f0e1f", "#181a3a", "#0c0d1e"] as const;

interface NotificationSettingsProps {
  notificationsEnabled: boolean;
  onToggle: (enabled: boolean) => void;
  onClose: () => void;
}

export function NotificationSettings({ notificationsEnabled, onToggle, onClose }: NotificationSettingsProps) {
  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="border border-white/10 max-w-md">
        <DialogTitle className="flex items-center gap-3">
          <Bell className="w-6 h-6 text-white" />
          <span className="text-xl font-bold text-white">Notification Settings</span>
        </DialogTitle>
        <DialogDescription className="sr-only">Configure your daily reminder notifications</DialogDescription>
        <div className="space-y-4">
          <div className="relative overflow-hidden flex items-center justify-between p-4 clip-tile-c border border-white/10">
            <VoronoiMosaic seed={3401} tileCount={32} margin={3} gap={2} palette={PANEL_DARK_PALETTE} className="absolute inset-0 w-full h-full pointer-events-none" />
            <div className="relative z-10">
              <p className="font-medium text-white">Daily Reminders</p>
              <p className="text-sm text-white/80">Get reminded about your daily activities</p>
            </div>
            <Switch
              id="daily-reminders-toggle"
              checked={notificationsEnabled}
              onCheckedChange={onToggle}
              aria-label="Toggle daily reminders"
              className="relative z-10 data-[state=checked]:bg-[#FFE633]"
            />
          </div>
        </div>
        <button onClick={onClose} className="w-full mt-2 py-3 font-black text-black uppercase tracking-wide hover:scale-105 transition-transform btn-shake" style={{ backgroundColor: "#fcd02a", clipPath: "polygon(1% 0%, 100% 3%, 99% 97%, 0% 100%)" }}>Done</button>
      </DialogContent>
    </Dialog>
  );
}
