"use client";
import { ArrowLeft } from "lucide-react";

interface BackButtonProps {
  onClick: () => void;
  label?: string;
  disabled?: boolean;
  variant?: "fixed" | "default";
}

export function BackButton({ onClick, label = "Back", disabled, variant = "default" }: BackButtonProps) {
  const baseClasses = "flex items-center gap-2 px-6 py-2.5 bg-black text-white font-bold hover:scale-105 transition-transform disabled:opacity-50 disabled:cursor-not-allowed";

  if (variant === "fixed") {
    return (
      <button
        onClick={onClick}
        disabled={disabled}
        className={`fixed top-[84px] left-4 z-50 shadow-lg ${baseClasses}`}
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
