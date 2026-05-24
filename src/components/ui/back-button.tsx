"use client";
import { ArrowLeft } from "lucide-react";
import { VoronoiMosaic } from "@/components/VoronoiMosaic";

const PANEL_DARK_PALETTE = ["#0a0a14", "#10122a", "#0f0e1f", "#181a3a", "#0c0d1e"] as const;

interface BackButtonProps {
  onClick: () => void;
  label?: string;
  disabled?: boolean;
  variant?: "fixed" | "default";
}

export function BackButton({ onClick, label = "Back", disabled, variant = "default" }: BackButtonProps) {
  const baseClasses = "relative overflow-hidden flex items-center gap-2 px-6 py-2.5 text-white font-bold hover:scale-105 transition-transform disabled:opacity-50 disabled:cursor-not-allowed";

  const inner = (
    <>
      <VoronoiMosaic seed={3801} tileCount={20} margin={3} gap={2} palette={PANEL_DARK_PALETTE} className="absolute inset-0 w-full h-full pointer-events-none" />
      <ArrowLeft className="relative z-10 w-5 h-5" />
      <span className="relative z-10">{label}</span>
    </>
  );

  if (variant === "fixed") {
    return (
      <button
        onClick={onClick}
        disabled={disabled}
        className={`fixed top-[84px] left-4 z-50 shadow-lg ${baseClasses}`}
        aria-label={label}
      >
        {inner}
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
      {inner}
    </button>
  );
}
