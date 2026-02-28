"use client";
import { Button } from "@/components/ui/button";
import { Bell, X } from "lucide-react";

interface NotificationSettingsProps {
  notificationsEnabled: boolean;
  onToggle: (enabled: boolean) => void;
  onClose: () => void;
}

export function NotificationSettings({ notificationsEnabled, onToggle, onClose }: NotificationSettingsProps) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 animate-scaleIn">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Bell className="w-6 h-6 text-teal-600" />
            <h2 className="text-xl font-bold text-gray-900">Notification Settings</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <p className="font-medium text-gray-900">Daily Reminders</p>
              <p className="text-sm text-gray-600">Get reminded about your daily activities</p>
            </div>
            <button
              onClick={() => onToggle(!notificationsEnabled)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${notificationsEnabled ? 'bg-teal-600' : 'bg-gray-300'}`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${notificationsEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
          </div>
        </div>
        <Button onClick={onClose} className="w-full mt-6 bg-teal-600 hover:bg-teal-700 text-white">Done</Button>
      </div>
    </div>
  );
}
