"use client";

import Image from "next/image";

interface FirstDayLogoProps {
  className?: string;
  width?: number;
  height?: number;
  showTagline?: boolean;
  layout?: "horizontal" | "vertical";
}

export function FirstDayLogo({
  className = "",
  width = 300,
  height = 150,
  showTagline = true,
  layout = "horizontal",
}: FirstDayLogoProps) {
  const isVertical = layout === "vertical";
  const iconSize = isVertical ? Math.min(width, height) * 0.5 : Math.min(width * 0.2, 40);
  const fontSize = isVertical ? Math.max(width * 0.12, 22) : Math.max(width * 0.14, 24);
  const taglineSize = isVertical ? Math.max(width * 0.055, 12) : Math.max(width * 0.06, 13);

  return (
    <div
      className={`flex items-center ${isVertical ? "flex-col gap-3" : "gap-3"} ${className}`}
    >
      <Image
        src="/app-icon.png"
        alt="First Day"
        width={iconSize}
        height={iconSize}
        className="rounded-full drop-shadow-md"
        priority
      />
      <div className={`flex flex-col ${isVertical ? "items-center gap-1" : "gap-0"}`}>
        <span
          style={{
            fontSize,
            fontWeight: 900,
            letterSpacing: -1,
            lineHeight: 1.1,
            background: "linear-gradient(135deg, #7cff67, #00c7fc, #5227FF, #ff6b6b)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}
        >
          FIRST DAY
        </span>
        {showTagline && (
          <span
            style={{
              fontSize: taglineSize,
              fontWeight: 500,
              color: isVertical ? "#94a3b8" : "#64748b",
              letterSpacing: 0.5,
              textTransform: "uppercase" as const,
            }}
          >
            of the rest of your life
          </span>
        )}
      </div>
    </div>
  );
}
