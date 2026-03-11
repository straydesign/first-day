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

  // Mosaic tile layout — irregularly placed colored blocks with black gaps
  const tiles = [
    // top row
    { x: -10, y: -20, w: 300, h: 240, color: "#db2b85", r: -2 },
    { x: 300, y: -25, w: 260, h: 230, color: "#3075e1", r: 3 },
    { x: 570, y: -15, w: 280, h: 250, color: "#f9334d", r: -1 },
    { x: 860, y: -20, w: 180, h: 220, color: "#fb7025", r: 2 },
    { x: 1040, y: -25, w: 200, h: 260, color: "#4e35b8", r: -3 },
    // middle sides (peeking out from behind text bar)
    { x: -20, y: 220, w: 250, h: 200, color: "#fa4835", r: 2 },
    { x: 980, y: 210, w: 260, h: 220, color: "#fcd02a", r: -2 },
    // bottom row
    { x: -15, y: 420, w: 280, h: 260, color: "#3075e1", r: -3 },
    { x: 270, y: 410, w: 260, h: 270, color: "#cf1b61", r: 2 },
    { x: 540, y: 425, w: 250, h: 250, color: "#db2b85", r: -1 },
    { x: 800, y: 410, w: 220, h: 270, color: "#fcd02a", r: 3 },
    { x: 1020, y: 420, w: 230, h: 260, color: "#fa4835", r: -2 },
  ]

  const PALETTE = [
    "#FFE633", "#FF6B2B", "#FF2D55", "#00EAFF",
    "#FF10F0", "#FF1493", "#4FC3F7", "#FF4500",
  ]

  const letters = "ADD NEW GOAL".split("")
  let colorIdx = 0

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
        {/* Mosaic tiles */}
        {tiles.map((t, i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              left: t.x,
              top: t.y,
              width: t.w,
              height: t.h,
              backgroundColor: t.color,
              transform: `rotate(${t.r}deg)`,
            }}
          />
        ))}

        {/* Black bar with colored text */}
        <div
          style={{
            position: "absolute",
            left: 40,
            right: 40,
            top: 210,
            height: 210,
            backgroundColor: "#000000",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {/* Plus sign */}
          <span
            style={{
              color: "#ffffff",
              fontSize: 130,
              fontWeight: 900,
              marginRight: 16,
            }}
          >
            +
          </span>
          {/* Colored letters */}
          <div style={{ display: "flex", alignItems: "center" }}>
            {letters.map((char, i) => {
              if (char === " ") {
                return (
                  <span key={i} style={{ width: 30 }}>
                    {" "}
                  </span>
                )
              }
              const color = PALETTE[colorIdx % PALETTE.length]
              colorIdx++
              return (
                <span
                  key={i}
                  style={{
                    color,
                    fontSize: 130,
                    fontWeight: 900,
                    letterSpacing: -2,
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
            bottom: 20,
            left: 0,
            right: 0,
            display: "flex",
            justifyContent: "center",
          }}
        >
          <span
            style={{
              fontSize: 20,
              fontWeight: 900,
              color: "#ffffff",
              letterSpacing: 4,
              backgroundColor: "#000000",
              padding: "6px 20px",
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
