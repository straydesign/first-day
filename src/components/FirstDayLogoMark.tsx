"use client";

import Image from "next/image";

interface FirstDayLogoMarkProps {
  size?: number;
  className?: string;
}

export function FirstDayLogoMark({
  size = 120,
  className = "",
}: FirstDayLogoMarkProps) {
  return (
    <Image
      src="/logo-mark.png"
      alt="First Day — sunrise between mountains over water"
      width={size}
      height={size}
      className={`rounded-none ${className}`}
      priority
    />
  );
}
