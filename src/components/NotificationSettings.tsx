"use client";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Bell } from "lucide-react";
import { MosaicButton } from "./MosaicButton";

interface NotificationSettingsProps {
  notificationsEnabled: boolean;
  onToggle: (enabled: boolean) => void;
  onClose: () => void;
}

export function NotificationSettings({ notificationsEnabled, onToggle, onClose }: NotificationSettingsProps) {
  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="bg-[#060B18] border border-white/10 max-w-md">
        <DialogTitle className="flex items-center gap-3">
          <Bell className="w-6 h-6 text-white" />
          <span className="text-xl font-bold text-white">Notification Settings</span>
        </DialogTitle>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-[#060B18] clip-tile-c border border-white/10">
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
        <MosaicButton onClick={onClose} className="w-full mt-2 transition-smooth hover:scale-105">Done</MosaicButton>
      </DialogContent>
    </Dialog>
  );
}
