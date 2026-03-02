"use client";

interface DayOneLogoProps {
  className?: string;
  width?: number;
  height?: number;
  showTagline?: boolean;
}

export function DayOneLogo({ className = "", width = 300, height = 150, showTagline = true }: DayOneLogoProps) {
  return (
    <div className={`flex flex-col items-center gap-2 ${className}`}>
      <svg width={width} height={height} viewBox="0 0 400 200" fill="none" xmlns="http://www.w3.org/2000/svg" className="drop-shadow-lg" data-logo="day-one" role="img" aria-label="First Day of the rest of your life">
        <g transform="translate(200, 80)">
          <circle cx="0" cy="-15" r="22" fill="url(#gradient2)" />
          <path d="M -105 40 L -87 10 L -70 40 L -35 -10 L 0 40 L 35 -10 L 70 40 L 87 10 L 105 40 Z" fill="url(#mountainGradient)" stroke="#0369a1" strokeWidth="2" strokeLinejoin="miter" />
          <path d="M -35 -10 L -20 10 L 0 40 L -35 -10 Z" fill="url(#highlightGradient)" opacity="0.3" />
          <path d="M 35 -10 L 20 10 L 0 40 L 35 -10 Z" fill="url(#highlightGradient)" opacity="0.3" />
          <path d="M 0 40 L -15 20 L -35 -10 L 0 40 Z" fill="url(#highlightGradient)" opacity="0.2" />
          <path d="M 0 40 L 15 20 L 35 -10 L 0 40 Z" fill="url(#highlightGradient)" opacity="0.2" />
          <path d="M -35 -10 L -45 5 L -41 9 L -37 5 L -35 9 L -33 5 L -29 9 L -25 5 Z" fill="white" opacity="0.95" />
          <path d="M 35 -10 L 25 5 L 29 9 L 33 5 L 35 9 L 37 5 L 41 9 L 45 5 Z" fill="white" opacity="0.95" />
          <path d="M -87 10 L -93 20 L -90 23 L -88 21 L -87 23 L -86 21 L -84 23 L -81 20 Z" fill="white" opacity="0.9" />
          <path d="M 87 10 L 81 20 L 84 23 L 86 21 L 87 23 L 88 21 L 90 23 L 93 20 Z" fill="white" opacity="0.9" />
        </g>
        <text x="200" y="155" fontSize="42" fontWeight="900" textAnchor="middle" fill="#0369a1" letterSpacing="-1">FIRST DAY</text>
        {showTagline && (
          <text x="200" y="180" fontSize="21" fontWeight="600" textAnchor="middle" fill="#475569" letterSpacing="-0.5">of the rest of your life</text>
        )}
        <defs>
          <linearGradient id="gradient2" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FCD34D" />
            <stop offset="50%" stopColor="#FBBF24" />
            <stop offset="100%" stopColor="#F59E0B" />
          </linearGradient>
          <linearGradient id="mountainGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#0ea5e9" />
            <stop offset="100%" stopColor="#0369a1" />
          </linearGradient>
          <linearGradient id="highlightGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="100%" stopColor="#E0F2FE" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}
