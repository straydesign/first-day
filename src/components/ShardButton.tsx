"use client";

import { cn } from "@/lib/utils";

/**
 * ShardButton — kept for its API surface, but now a plain Apple-sleek
 * rounded-full button (greyscale). `variant="primary"` = white fill / black text;
 * `variant="secondary"` = ghost pill with a hairline border. Legacy props
 * (shardCount, seed) are accepted and ignored so callers still compile.
 */
const SIZE_CLASSES = {
  sm: "py-2 px-5 text-sm",
  default: "py-3 px-6 text-[15px]",
  lg: "py-3.5 px-8 text-base",
} as const;

interface ShardButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: "primary" | "secondary";
  size?: "sm" | "default" | "lg";
  /* legacy — accepted & ignored */
  shardCount?: 3 | 4;
  seed?: number;
}

export function ShardButton({
  children,
  className,
  variant = "primary",
  size = "default",
  shardCount: _shardCount,
  seed: _seed,
  ...props
}: ShardButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center rounded-full font-semibold transition-transform hover:scale-[1.01] active:scale-[0.99] outline-none disabled:pointer-events-none disabled:opacity-50",
        SIZE_CLASSES[size],
        variant === "primary"
          ? "bg-white text-black"
          : "border border-white/15 text-white/80 hover:bg-white/5",
        className
      )}
      {...props}
    >
      <span className="flex items-center gap-2">{children}</span>
    </button>
  );
}
