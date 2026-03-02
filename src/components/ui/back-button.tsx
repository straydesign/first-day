"use client";
import { ArrowLeft } from "lucide-react";

interface BackButtonProps {
  onClick: () => void;
  label?: string;
  disabled?: boolean;
  /** "fixed" for overlay screens (CalendarView, DayView), default for page screens */
  variant?: "fixed" | "default";
}

export function BackButton({ onClick, label = "Back", disabled, variant = "default" }: BackButtonProps) {
  const baseClasses = "flex items-center gap-2 px-4 py-2 rounded-lg border-2 border-slate-300 text-slate-600 hover:bg-slate-50 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed";

  if (variant === "fixed") {
    return (
      <button
        onClick={onClick}
        disabled={disabled}
        className={`fixed top-[16px] left-4 z-50 bg-white/90 backdrop-blur shadow-lg hover:shadow-xl ${baseClasses}`}
        aria-label={label}
      >
        <ArrowLeft className="w-5 h-5" />
        <span>{label}</span>
      </button>
    );
  }

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`mb-8 ${baseClasses}`}
      aria-label={label}
    >
      <ArrowLeft className="w-5 h-5" />
      <span>{label}</span>
    </button>
  );
}
