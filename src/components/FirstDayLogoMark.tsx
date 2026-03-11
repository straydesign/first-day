"use client";

interface FirstDayLogoMarkProps {
  size?: number;
  className?: string;
}

// Darker versions of the brand badge colors
const MARK_COLORS = {
  orange: "#cc5533", // sun — darker coral
  purple: "#3d1cc0", // mountains — darker indigo
  blue: "#009acc", // snow caps & water — darker cyan
};

export function FirstDayLogoMark({
  size = 120,
  className = "",
}: FirstDayLogoMarkProps) {
  const height = size * 0.75;

  return (
    <svg
      width={size}
      height={height}
      viewBox="0 0 200 150"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="First Day logo — sunrise between mountains over water"
    >
      <defs>
        {/* Water gradient — fades downward */}
        <linearGradient
          id="fd-water"
          x1="100"
          y1="108"
          x2="100"
          y2="150"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor={MARK_COLORS.blue} stopOpacity="0.22" />
          <stop offset="1" stopColor={MARK_COLORS.blue} stopOpacity="0.06" />
        </linearGradient>

        {/* Sun reflection in water */}
        <linearGradient
          id="fd-reflect"
          x1="100"
          y1="110"
          x2="100"
          y2="146"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor={MARK_COLORS.orange} stopOpacity="0.28" />
          <stop offset="1" stopColor={MARK_COLORS.orange} stopOpacity="0" />
        </linearGradient>

        {/* Left mountain gradient — darkens toward base */}
        <linearGradient
          id="fd-mtn-l"
          x1="48"
          y1="12"
          x2="48"
          y2="108"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor={MARK_COLORS.purple} />
          <stop offset="1" stopColor="#2d1590" />
        </linearGradient>

        {/* Right mountain gradient */}
        <linearGradient
          id="fd-mtn-r"
          x1="148"
          y1="18"
          x2="148"
          y2="108"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor={MARK_COLORS.purple} stopOpacity="0.78" />
          <stop offset="1" stopColor="#2d1590" stopOpacity="0.78" />
        </linearGradient>
      </defs>

      {/* ── Sun glow halo ── */}
      <circle cx="100" cy="65" r="36" fill={MARK_COLORS.orange} opacity="0.08" />

      {/* ── Sun rays (drawn first, mountains cover lower ones) ── */}
      <g opacity="0.32">
        {/* Up — tallest ray */}
        <polygon points="97,44 103,44 100,14" fill={MARK_COLORS.orange} />
        {/* Upper-right */}
        <polygon points="114,50 118,55 142,26" fill={MARK_COLORS.orange} />
        {/* Right */}
        <polygon points="121,62 121,68 150,65" fill={MARK_COLORS.orange} />
        {/* Lower-right (partially behind mountain) */}
        <polygon points="117,79 114,83 138,102" fill={MARK_COLORS.orange} />
        {/* Down (behind mountains) */}
        <polygon points="103,86 97,86 100,116" fill={MARK_COLORS.orange} />
        {/* Lower-left (partially behind mountain) */}
        <polygon points="83,83 86,79 62,102" fill={MARK_COLORS.orange} />
        {/* Left */}
        <polygon points="79,68 79,62 50,65" fill={MARK_COLORS.orange} />
        {/* Upper-left */}
        <polygon points="86,55 82,50 58,26" fill={MARK_COLORS.orange} />
      </g>

      {/* ── Sun disk ── */}
      <circle cx="100" cy="65" r="20" fill={MARK_COLORS.orange} />

      {/* ── Right mountain (behind, slightly shorter for depth) ── */}
      <path d="M75,108 L148,18 L225,108 Z" fill="url(#fd-mtn-r)" />

      {/* ── Left mountain (in front, taller) ── */}
      <path d="M-15,108 L48,12 L125,108 Z" fill="url(#fd-mtn-l)" />

      {/* ── Snow cap — left peak (curved bottom edge) ── */}
      <path
        d="M48,12 L35,36 Q48,40 61,36 Z"
        fill={MARK_COLORS.blue}
      />

      {/* ── Snow cap — right peak (curved bottom edge) ── */}
      <path
        d="M148,18 L135,40 Q148,44 161,40 Z"
        fill={MARK_COLORS.blue}
      />

      {/* ── Water ── */}
      <rect x="0" y="108" width="200" height="42" fill="url(#fd-water)" />

      {/* ── Sun reflection in water ── */}
      <ellipse cx="100" cy="128" rx="9" ry="19" fill="url(#fd-reflect)" />

      {/* ── Water ripple lines (varying spacing for organic feel) ── */}
      <path
        d="M12,118 Q34,115 56,118 T100,118 T144,118 T188,118"
        stroke={MARK_COLORS.blue}
        strokeWidth="0.9"
        opacity="0.2"
        fill="none"
      />
      <path
        d="M6,127 Q28,124 50,127 T94,127 T138,127 T182,127"
        stroke={MARK_COLORS.blue}
        strokeWidth="0.7"
        opacity="0.14"
        fill="none"
      />
      <path
        d="M18,137 Q40,134 62,137 T106,137 T150,137 T194,137"
        stroke={MARK_COLORS.blue}
        strokeWidth="0.5"
        opacity="0.09"
        fill="none"
      />
    </svg>
  );
}
