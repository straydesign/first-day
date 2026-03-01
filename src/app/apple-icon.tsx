import { ImageResponse } from "next/og"

export const size = { width: 180, height: 180 }
export const contentType = "image/png"

export default function AppleIcon() {
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
          borderRadius: 36,
        }}
      >
        <svg width="140" height="140" viewBox="0 0 140 140">
          {/* Sun */}
          <circle cx="70" cy="32" r="18" fill="#FBBF24" />
          {/* Mountains */}
          <path
            d="M 10 118 L 42 52 L 70 95 L 98 52 L 130 118 Z"
            fill="white"
          />
          {/* Snow caps */}
          <path
            d="M 42 52 L 30 74 L 35 78 L 39 73 L 42 78 L 45 73 L 49 78 L 54 74 Z"
            fill="rgba(255,255,255,0.5)"
          />
          <path
            d="M 98 52 L 86 74 L 91 78 L 95 73 L 98 78 L 101 73 L 105 78 L 110 74 Z"
            fill="rgba(255,255,255,0.5)"
          />
        </svg>
      </div>
    ),
    { ...size }
  )
}
