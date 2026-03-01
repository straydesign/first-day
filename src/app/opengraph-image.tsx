import { ImageResponse } from "next/og"

export const alt = "First Day - Achieve any goal in 30 days"
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

export default async function Image() {
  // Fetch Plus Jakarta Sans ExtraBold from Google Fonts (old UA to get TTF format)
  const fontCssResponse = await fetch(
    "https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@800",
    { headers: { "User-Agent": "Mozilla/4.0" } }
  )
  const fontCss = await fontCssResponse.text()
  const fontUrl = fontCss.match(/url\(([^)]+)\)/)?.[1]
  const fontData = fontUrl
    ? await fetch(fontUrl).then((res) => res.arrayBuffer())
    : null

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#080d1a",
          backgroundImage:
            "radial-gradient(ellipse at 25% 80%, rgba(124, 255, 103, 0.1) 0%, transparent 50%), radial-gradient(ellipse at 75% 20%, rgba(0, 199, 252, 0.1) 0%, transparent 50%), radial-gradient(ellipse at 50% 50%, rgba(82, 39, 255, 0.07) 0%, transparent 60%)",
        }}
      >
        {/* Mountain + Sun Logo */}
        <svg
          width="280"
          height="140"
          viewBox="60 20 280 140"
          style={{ marginBottom: "20px" }}
        >
          <defs>
            <linearGradient id="mtn" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#0ea5e9" />
              <stop offset="100%" stopColor="#0369a1" />
            </linearGradient>
          </defs>
          {/* Sun */}
          <circle cx="200" cy="50" r="30" fill="#FBBF24" />
          {/* Mountains */}
          <path
            d="M 80 135 L 113 90 L 140 135 L 165 70 L 200 135 L 235 70 L 260 135 L 287 90 L 320 135 Z"
            fill="url(#mtn)"
            stroke="#0369a1"
            strokeWidth="2"
          />
          {/* Snow caps */}
          <path
            d="M 165 70 L 153 88 L 158 92 L 162 87 L 165 92 L 168 87 L 172 92 L 177 88 Z"
            fill="white"
            opacity="0.9"
          />
          <path
            d="M 235 70 L 223 88 L 228 92 L 232 87 L 235 92 L 238 87 L 242 92 L 247 88 Z"
            fill="white"
            opacity="0.9"
          />
          <path
            d="M 113 90 L 106 102 L 109 105 L 112 102 L 113 105 L 114 102 L 117 105 L 120 102 Z"
            fill="white"
            opacity="0.85"
          />
          <path
            d="M 287 90 L 280 102 L 283 105 L 286 102 L 287 105 L 288 102 L 291 105 L 294 102 Z"
            fill="white"
            opacity="0.85"
          />
        </svg>

        {/* Title */}
        <div
          style={{
            fontSize: 80,
            fontFamily: fontData ? "Plus Jakarta Sans" : "sans-serif",
            fontWeight: 800,
            color: "white",
            letterSpacing: -3,
            lineHeight: 1,
          }}
        >
          FIRST DAY
        </div>

        {/* Subtitle */}
        <div
          style={{
            fontSize: 32,
            fontFamily: fontData ? "Plus Jakarta Sans" : "sans-serif",
            fontWeight: 800,
            color: "#94a3b8",
            marginTop: 20,
          }}
        >
          Achieve any goal in 30 days
        </div>

        {/* Description */}
        <div
          style={{
            fontSize: 22,
            fontFamily: fontData ? "Plus Jakarta Sans" : "sans-serif",
            fontWeight: 800,
            color: "#64748b",
            marginTop: 12,
          }}
        >
          AI-powered personalized daily plans
        </div>

        {/* URL */}
        <div
          style={{
            fontSize: 20,
            fontFamily: fontData ? "Plus Jakarta Sans" : "sans-serif",
            fontWeight: 800,
            color: "#0ea5e9",
            marginTop: 36,
            letterSpacing: 2,
          }}
        >
          firstday.life
        </div>
      </div>
    ),
    {
      ...size,
      fonts: fontData
        ? [
            {
              name: "Plus Jakarta Sans",
              data: fontData,
              style: "normal" as const,
              weight: 800 as const,
            },
          ]
        : [],
    }
  )
}
