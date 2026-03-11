"use client";
import { cn } from "@/lib/utils";

interface MosaicButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  size?: "default" | "sm" | "lg";
}

export function MosaicButton({
  children,
  className,
  size = "default",
  ...props
}: MosaicButtonProps) {
  const sizeClasses = {
    sm: "h-10 px-8 text-sm",
    default: "h-12 px-10 text-base",
    lg: "h-14 px-12 text-lg",
  };

  const btnClass = size === "sm" ? "mosaic-btn-sm" : "mosaic-btn";

  return (
    <button
      className={cn(
        btnClass,
        "relative inline-flex items-center justify-center gap-2 whitespace-nowrap font-bold text-white transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none",
        sizeClasses[size],
        className
      )}
      {...props}
    >
      <span className="relative z-10 flex items-center gap-2 drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]">
        {children}
      </span>
    </button>
  );
}
