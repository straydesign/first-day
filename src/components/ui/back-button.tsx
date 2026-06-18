"use client";
import { ArrowLeft } from "lucide-react";

interface BackButtonProps {
  onClick: () => void;
  label?: string;
  disabled?: boolean;
  variant?: "fixed" | "default";
}

export function BackButton({ onClick, label = "Back", disabled, variant = "default" }: BackButtonProps) {
  const baseClasses =
    "inline-flex items-center gap-2 rounded-full px-4 py-2 text-[14px] font-medium text-white/70 transition hover:bg-white/5 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed";

  const inner = (
    <>
      <ArrowLeft className="h-4 w-4" />
      <span>{label}</span>
    </>
  );

  if (variant === "fixed") {
    return (
      <button
        onClick={onClick}
        disabled={disabled}
        className={`fixed left-4 top-[84px] z-50 ${baseClasses}`}
        aria-label={label}
      >
        {inner}
      </button>
    );
  }

  return (
    <button onClick={onClick} disabled={disabled} className={`mb-8 -ml-2 ${baseClasses}`} aria-label={label}>
      {inner}
    </button>
  );
}
