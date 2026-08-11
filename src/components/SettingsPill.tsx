"use client";
/**
 * SettingsPill — the persistent gear in the corner of every authenticated
 * screen. Opens Settings, where sign-out and data deletion now live (so the
 * chrome stays to one control instead of a separate logout button).
 */
import { Settings as SettingsIcon } from "lucide-react";

interface SettingsPillProps {
  onOpen: () => void;
}

export function SettingsPill({ onOpen }: SettingsPillProps) {
  return (
    <button
      onClick={onOpen}
      aria-label="Settings"
      className="fixed bottom-4 right-4 z-40 inline-flex items-center gap-2 px-4 py-2.5 bg-black ring-2 ring-white/30 text-white font-bold text-sm uppercase tracking-wider hover:ring-white/70 hover:scale-105 transition-all"
      style={{ clipPath: "polygon(8% 0%, 100% 4%, 96% 100%, 0% 96%)" }}
    >
      <SettingsIcon className="w-4 h-4" />
      <span>Settings</span>
    </button>
  );
}
