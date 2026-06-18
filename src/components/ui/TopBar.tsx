"use client";
/**
 * TopBar — the ONE menu. Replaces the per-view bespoke nav bars (every page used to
 * roll its own). Thin, blurred, sticky. Optional back chevron + title + a right slot
 * for page-specific actions (avatar, streak, links). Apple-sleek type.
 */
import { ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { FONT, BG_BASE } from "@/lib/design";

export interface TopBarProps {
  title?: React.ReactNode;
  onBack?: () => void;
  right?: React.ReactNode;
  /** Max width of the inner row — match the page content width. */
  maxWidth?: string;
  className?: string;
}

export function TopBar({ title = "First Day", onBack, right, maxWidth = "max-w-2xl", className }: TopBarProps) {
  return (
    <header
      className={cn("sticky top-0 z-30 border-b border-white/[0.06] backdrop-blur-xl", className)}
      style={{ backgroundColor: `${BG_BASE}a6` }}
    >
      <div className={cn("mx-auto flex h-14 items-center justify-between gap-4 px-6", maxWidth)}>
        <div className="flex min-w-0 items-center gap-2">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              aria-label="Back"
              className="-ml-2 grid h-9 w-9 place-items-center rounded-full text-white/70 transition hover:bg-white/5 hover:text-white"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
          )}
          <span className="truncate text-[15px] font-semibold tracking-[-0.01em] text-white" style={{ fontFamily: FONT }}>
            {title}
          </span>
        </div>
        {right && (
          <div className="flex shrink-0 items-center gap-4 text-[14px] font-medium text-white/60">{right}</div>
        )}
      </div>
    </header>
  );
}
