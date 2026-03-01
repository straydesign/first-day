import { ImageResponse } from "next/og"

export const size = { width: 32, height: 32 }
export const contentType = "image/png"

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #0ea5e9 0%, #0369a1 100%)",
          borderRadius: 6,
        }}
      >
        <svg width="28" height="28" viewBox="0 0 32 32">
          {/* Sun */}
          <circle cx="16" cy="7" r="4" fill="#FBBF24" />
          {/* Mountains */}
          <path
            d="M 2 27 L 10 12 L 16 21 L 22 12 L 30 27 Z"
            fill="white"
          />
          {/* Snow caps */}
          <path
            d="M 10 12 L 7 17 L 9 18 L 10 16 L 11 18 L 13 17 Z"
            fill="rgba(255,255,255,0.5)"
          />
          <path
            d="M 22 12 L 19 17 L 21 18 L 22 16 L 23 18 L 25 17 Z"
            fill="rgba(255,255,255,0.5)"
          />
        </svg>
      </div>
    ),
    { ...size }
  )
}
