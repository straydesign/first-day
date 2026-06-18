"use client";

import { LogOut } from "lucide-react";

interface LogoutPillProps {
  onLogout: () => void | Promise<void>;
}

export function LogoutPill({ onLogout }: LogoutPillProps) {
  return (
    <button
      onClick={onLogout}
      aria-label="Log out"
      className="fixed bottom-4 right-4 z-40 inline-flex items-center gap-2 px-4 py-2.5 bg-black ring-2 ring-white/30 text-white font-bold text-sm uppercase tracking-wider hover:ring-white/70 hover:scale-105 transition-all"
      style={{ clipPath: "polygon(8% 0%, 100% 4%, 96% 100%, 0% 96%)" }}
    >
      <LogOut className="w-4 h-4" />
      <span>Logout</span>
    </button>
  );
}
