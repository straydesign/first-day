"use client";

import Image from "next/image";

interface FirstDayLogoProps {
  className?: string;
  width?: number;
  height?: number;
  showTagline?: boolean;
}

export function FirstDayLogo({ className = "", width = 300, height = 150, showTagline = true }: FirstDayLogoProps) {
  const iconSize = Math.min(width, height) * 0.7;

  return (
    <div className={`flex flex-col items-center gap-3 ${className}`}>
      <Image
        src="/app-icon.png"
        alt="First Day"
        width={iconSize}
        height={iconSize}
        className="rounded-[22%] drop-shadow-lg"
        priority
      />
      <div className="flex flex-col items-center gap-1">
        <span
          style={{ fontSize: Math.max(width * 0.14, 24), fontWeight: 900, letterSpacing: -1, color: "#0369a1" }}
        >
          FIRST DAY
        </span>
        {showTagline && (
          <span
            style={{ fontSize: Math.max(width * 0.07, 14), fontWeight: 600, color: "#475569", letterSpacing: -0.5 }}
          >
            of the rest of your life
          </span>
        )}
      </div>
    </div>
  );
}
