"use client";
import { Button } from "@/components/ui/button";
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
      <DialogContent className="bg-white max-w-md">
        <DialogTitle className="flex items-center gap-3">
          <Bell className="w-6 h-6 text-teal-600" />
          <span className="text-xl font-bold text-gray-900">Notification Settings</span>
        </DialogTitle>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <p className="font-medium text-gray-900">Daily Reminders</p>
              <p className="text-sm text-gray-600">Get reminded about your daily activities</p>
            </div>
            <Switch
              checked={notificationsEnabled}
              onCheckedChange={onToggle}
              className="data-[state=checked]:bg-teal-600"
            />
          </div>
        </div>
        <Button onClick={onClose} className="w-full mt-2 transition-smooth hover:scale-105">Done</Button>
      </DialogContent>
    </Dialog>
  );
}
