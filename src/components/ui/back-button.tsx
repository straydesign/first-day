"use client";
import { ArrowLeft } from "lucide-react";

interface BackButtonProps {
  onClick: () => void;
  label?: string;
  disabled?: boolean;
  variant?: "fixed" | "default";
}

export function BackButton({ onClick, label = "Back", disabled, variant = "default" }: BackButtonProps) {
  const baseClasses = "clip-btn-b flex items-center gap-2 px-6 py-2 rounded-none border-2 border-white/10 text-white hover-geo transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed focus-geo";

  if (variant === "fixed") {
    return (
      <button
        onClick={onClick}
        disabled={disabled}
        className={`fixed top-[16px] left-4 z-50 bg-[#0F1B3A]/90 backdrop-blur shadow-lg hover:shadow-xl ${baseClasses}`}
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
