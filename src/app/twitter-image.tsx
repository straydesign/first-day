import { ImageResponse } from "next/og"
import { readFile } from "node:fs/promises"
import { join } from "node:path"

export const alt = "First Day — first day of the rest of your life"
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

export default async function Image() {
  const notoPath = join(
    process.cwd(),
    "node_modules/next/dist/compiled/@vercel/og/noto-sans-v27-latin-regular.ttf"
  )
  const notoFont = await readFile(notoPath)

  // Shard tiles — angled/skewed colored blocks with gaps
  const shards = [
    // top-left cluster
    { x: -30, y: -40, w: 320, h: 220, color: "#FFE633", skew: -4, rotate: -2 },
    { x: 280, y: -30, w: 280, h: 200, color: "#FF2D55", skew: 3, rotate: 1 },
    { x: 550, y: -35, w: 250, h: 210, color: "#00EAFF", skew: -2, rotate: -3 },
    { x: 790, y: -25, w: 230, h: 190, color: "#FF10F0", skew: 4, rotate: 2 },
    { x: 1010, y: -40, w: 240, h: 230, color: "#FF6B2B", skew: -3, rotate: -1 },
    // left side
    { x: -40, y: 180, w: 200, h: 280, color: "#4FC3F7", skew: 3, rotate: 2 },
    { x: 140, y: 200, w: 100, h: 240, color: "#FF4500", skew: -5, rotate: -2 },
    // right side
    { x: 980, y: 170, w: 130, h: 300, color: "#2979FF", skew: -4, rotate: 1 },
    { x: 1100, y: 190, w: 150, h: 260, color: "#FFE633", skew: 3, rotate: -3 },
    // bottom cluster
    { x: -20, y: 440, w: 260, h: 240, color: "#FF6B2B", skew: 4, rotate: -2 },
    { x: 230, y: 430, w: 240, h: 250, color: "#FF10F0", skew: -3, rotate: 3 },
    { x: 460, y: 445, w: 220, h: 230, color: "#FFE633", skew: 2, rotate: -1 },
    { x: 670, y: 435, w: 200, h: 240, color: "#FF2D55", skew: -4, rotate: 2 },
    { x: 860, y: 440, w: 180, h: 250, color: "#00EAFF", skew: 3, rotate: -3 },
    { x: 1030, y: 430, w: 220, h: 260, color: "#4FC3F7", skew: -2, rotate: 1 },
  ]

  const PALETTE = [
    "#FFE633", "#FF6B2B", "#FF2D55", "#00EAFF",
    "#FF10F0", "#FF1493", "#4FC3F7", "#FF4500",
  ]

  const topText = "FIRST DAY OF THE"
  const bottomText = "REST OF YOUR LIFE"

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          position: "relative",
          backgroundColor: "#000000",
          overflow: "hidden",
        }}
      >
        {/* Shard tiles with skew + rotate for angular look */}
        {shards.map((s, i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              left: s.x,
              top: s.y,
              width: s.w,
              height: s.h,
              backgroundColor: s.color,
              transform: `rotate(${s.rotate}deg) skewX(${s.skew}deg)`,
            }}
          />
        ))}

        {/* Center content — black bar with tagline */}
        <div
          style={{
            position: "absolute",
            left: 30,
            right: 30,
            top: 170,
            height: 290,
            backgroundColor: "#000000",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
          }}
        >
          {/* Top line: colored per-letter */}
          <div style={{ display: "flex", alignItems: "center" }}>
            {topText.split("").map((char, i) => {
              if (char === " ") {
                return (
                  <span key={i} style={{ width: 24 }}>
                    {" "}
                  </span>
                )
              }
              return (
                <span
                  key={i}
                  style={{
                    color: PALETTE[i % PALETTE.length],
                    fontSize: 90,
                    fontWeight: 900,
                    letterSpacing: -1,
                  }}
                >
                  {char}
                </span>
              )
            })}
          </div>

          {/* Bottom line: colored per-letter */}
          <div style={{ display: "flex", alignItems: "center" }}>
            {bottomText.split("").map((char, i) => {
              if (char === " ") {
                return (
                  <span key={i} style={{ width: 24 }}>
                    {" "}
                  </span>
                )
              }
              return (
                <span
                  key={i}
                  style={{
                    color: PALETTE[(i + 4) % PALETTE.length],
                    fontSize: 90,
                    fontWeight: 900,
                    letterSpacing: -1,
                  }}
                >
                  {char}
                </span>
              )
            })}
          </div>
        </div>

        {/* Bottom branding */}
        <div
          style={{
            position: "absolute",
            bottom: 16,
            left: 0,
            right: 0,
            display: "flex",
            justifyContent: "center",
          }}
        >
          <span
            style={{
              fontSize: 22,
              fontWeight: 900,
              color: "#ffffff",
              letterSpacing: 6,
              backgroundColor: "#000000",
              padding: "8px 24px",
            }}
          >
            FIRSTDAY.LIFE
          </span>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        {
          name: "Noto Sans",
          data: notoFont.buffer,
          style: "normal" as const,
          weight: 400 as const,
        },
      ],
    }
  )
}
