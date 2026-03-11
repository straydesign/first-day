"use client";

import Image from "next/image";

interface FirstDayLogoProps {
  className?: string;
  width?: number;
  height?: number;
  showTagline?: boolean;
  layout?: "horizontal" | "vertical";
  size?: "default" | "hero";
}

// Aurora + badge palette
const COLORS = {
  green: "#7cff67",
  cyan: "#00c7fc",
  purple: "#5227FF",
  coral: "#ff6b6b",
};

export function FirstDayLogo({
  className = "",
  width = 300,
  height = 150,
  showTagline = true,
  layout = "horizontal",
  size = "default",
}: FirstDayLogoProps) {
  const isVertical = layout === "vertical";
  const isHero = size === "hero";

  // Hero: massive wordmark, icon as accent
  if (isHero) {
    return (
      <div className={`flex flex-col items-center ${className}`}>
        {/* Icon with colored ring */}
        <div
          className="rounded-full p-1 mb-4 drop-shadow-lg"
          style={{
            background: `linear-gradient(135deg, ${COLORS.green}, ${COLORS.cyan}, ${COLORS.purple})`,
          }}
        >
          <Image
            src="/app-icon.png"
            alt="First Day"
            width={64}
            height={64}
            className="rounded-full"
            priority
          />
        </div>

        {/* Giant wordmark — each word its own color */}
        <div className="flex items-baseline gap-3 md:gap-5">
          <span
            style={{
              fontSize: "clamp(3.5rem, 10vw, 7rem)",
              fontWeight: 900,
              letterSpacing: -3,
              lineHeight: 1,
              color: COLORS.cyan,
            }}
          >
            FIRST
          </span>
          <span
            style={{
              fontSize: "clamp(3.5rem, 10vw, 7rem)",
              fontWeight: 900,
              letterSpacing: -3,
              lineHeight: 1,
              color: COLORS.purple,
            }}
          >
            DAY
          </span>
        </div>

        {/* Tagline */}
        {showTagline && (
          <span
            className="mt-2"
            style={{
              fontSize: "clamp(0.85rem, 2vw, 1.15rem)",
              fontWeight: 600,
              color: COLORS.green,
              letterSpacing: 3,
              textTransform: "uppercase" as const,
            }}
          >
            of the rest of your life
          </span>
        )}
      </div>
    );
  }

  // Default sizes
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
        <div style={{ lineHeight: 1.1 }}>
          <span
            style={{
              fontSize,
              fontWeight: 900,
              letterSpacing: -1,
              color: COLORS.cyan,
            }}
          >
            FIRST{" "}
          </span>
          <span
            style={{
              fontSize,
              fontWeight: 900,
              letterSpacing: -1,
              color: COLORS.purple,
            }}
          >
            DAY
          </span>
        </div>
        {showTagline && (
          <span
            style={{
              fontSize: taglineSize,
              fontWeight: 500,
              color: COLORS.green,
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
