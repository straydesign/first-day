import { ImageResponse } from "next/og"
import { readFile } from "node:fs/promises"
import { join } from "node:path"

export const alt = "First Day - Achieve any goal in 30 days"
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

export default async function Image() {
  // Load the app icon as base64 for embedding in ImageResponse
  const iconPath = join(process.cwd(), "public", "app-icon.png")
  const iconData = await readFile(iconPath)
  const iconBase64 = `data:image/png;base64,${iconData.toString("base64")}`

  // Fetch Plus Jakarta Sans ExtraBold from Google Fonts
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
        {/* App Icon */}
        <img
          src={iconBase64}
          width="200"
          height="200"
          style={{ borderRadius: 44, marginBottom: 24 }}
        />

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
