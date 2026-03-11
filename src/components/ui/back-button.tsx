"use client";
import { useMemo } from "react";
import { ArrowLeft } from "lucide-react";
import { useMonotone } from "@/components/MonotoneContext";

const BACK_COLORS = ["#FFE633", "#FF6B2B", "#FF2D55", "#00EAFF"];

interface BackButtonProps {
  onClick: () => void;
  label?: string;
  disabled?: boolean;
  variant?: "fixed" | "default";
}

export function BackButton({ onClick, label = "Back", disabled, variant = "default" }: BackButtonProps) {
  const { monotone } = useMonotone();
  const colorIndex = useMemo(() => Math.floor(Math.random() * BACK_COLORS.length), []);
  const color = monotone ? "#444444" : BACK_COLORS[colorIndex];

  const baseClasses = "flex items-center gap-2 px-6 py-2 text-black font-bold hover:scale-105 transition-transform disabled:opacity-50 disabled:cursor-not-allowed";

  if (variant === "fixed") {
    return (
      <button
        onClick={onClick}
        disabled={disabled}
        className={`fixed top-[16px] left-4 z-50 shadow-lg ${baseClasses}`}
        style={{ backgroundColor: color, clipPath: "polygon(0% 5%, 92% 0%, 98% 92%, 3% 95%)" }}
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
      style={{ backgroundColor: color, clipPath: "polygon(0% 5%, 92% 0%, 98% 92%, 3% 95%)" }}
      aria-label={label}
    >
      <ArrowLeft className="w-5 h-5" />
      <span>{label}</span>
    </button>
  );
}
