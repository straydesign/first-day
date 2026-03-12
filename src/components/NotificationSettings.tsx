"use client";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Bell } from "lucide-react";

interface NotificationSettingsProps {
  notificationsEnabled: boolean;
  onToggle: (enabled: boolean) => void;
  onClose: () => void;
}

export function NotificationSettings({ notificationsEnabled, onToggle, onClose }: NotificationSettingsProps) {
  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="bg-black border border-white/10 max-w-md">
        <DialogTitle className="flex items-center gap-3">
          <Bell className="w-6 h-6 text-white" />
          <span className="text-xl font-bold text-white">Notification Settings</span>
        </DialogTitle>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-black clip-tile-c border border-white/10">
            <div>
              <p className="font-medium text-white">Daily Reminders</p>
              <p className="text-sm text-white/80">Get reminded about your daily activities</p>
            </div>
            <Switch
              checked={notificationsEnabled}
              onCheckedChange={onToggle}
              className="data-[state=checked]:bg-[#FFE633]"
            />
          </div>
        </div>
        <button onClick={onClose} className="w-full mt-2 py-3 font-black text-black uppercase tracking-wide hover:scale-105 transition-transform" style={{ backgroundColor: "#fcd02a", clipPath: "polygon(1% 0%, 100% 3%, 99% 97%, 0% 100%)" }}>Done</button>
      </DialogContent>
    </Dialog>
  );
}
