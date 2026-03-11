import { ImageResponse } from "next/og"
import { readFile } from "node:fs/promises"
import { join } from "node:path"

export const alt = "First Day — first day of the rest of your life"
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

export default async function Image() {
  const iconPath = join(process.cwd(), "public", "app-icon.png")
  const iconData = await readFile(iconPath)
  const iconBase64 = `data:image/png;base64,${iconData.toString("base64")}`

  // Load the bundled Noto Sans from @vercel/og as guaranteed fallback
  const notoPath = join(
    process.cwd(),
    "node_modules/next/dist/compiled/@vercel/og/noto-sans-v27-latin-regular.ttf"
  )
  const notoFont = await readFile(notoPath)

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
          backgroundColor: "#000000",
        }}
      >
        <img
          src={iconBase64}
          width="140"
          height="140"
          style={{ borderRadius: 32, marginBottom: 32 }}
        />

        <div
          style={{
            display: "flex",
            fontWeight: 900,
            fontSize: 48,
            letterSpacing: 2,
          }}
        >
          <span style={{ color: "#FFE633" }}>F</span>
          <span style={{ color: "#FF6B2B" }}>I</span>
          <span style={{ color: "#FF2D55" }}>R</span>
          <span style={{ color: "#00EAFF" }}>S</span>
          <span style={{ color: "#FF10F0" }}>T</span>
          <span style={{ width: "0.4em" }}>{" "}</span>
          <span style={{ color: "#FF1493" }}>D</span>
          <span style={{ color: "#4FC3F7" }}>A</span>
          <span style={{ color: "#FF4500" }}>Y</span>
          <span style={{ width: "0.4em" }}>{" "}</span>
          <span style={{ color: "#FFE633" }}>O</span>
          <span style={{ color: "#FF6B2B" }}>F</span>
          <span style={{ width: "0.4em" }}>{" "}</span>
          <span style={{ color: "#FF2D55" }}>T</span>
          <span style={{ color: "#00EAFF" }}>H</span>
          <span style={{ color: "#FF10F0" }}>E</span>
        </div>

        <div
          style={{
            display: "flex",
            fontWeight: 900,
            fontSize: 48,
            letterSpacing: 2,
            marginTop: 4,
          }}
        >
          <span style={{ color: "#FF1493" }}>R</span>
          <span style={{ color: "#4FC3F7" }}>E</span>
          <span style={{ color: "#FF4500" }}>S</span>
          <span style={{ color: "#FFE633" }}>T</span>
          <span style={{ width: "0.4em" }}>{" "}</span>
          <span style={{ color: "#FF6B2B" }}>O</span>
          <span style={{ color: "#FF2D55" }}>F</span>
          <span style={{ width: "0.4em" }}>{" "}</span>
          <span style={{ color: "#00EAFF" }}>Y</span>
          <span style={{ color: "#FF10F0" }}>O</span>
          <span style={{ color: "#FF1493" }}>U</span>
          <span style={{ color: "#4FC3F7" }}>R</span>
          <span style={{ width: "0.4em" }}>{" "}</span>
          <span style={{ color: "#FF4500" }}>L</span>
          <span style={{ color: "#FFE633" }}>I</span>
          <span style={{ color: "#FF6B2B" }}>F</span>
          <span style={{ color: "#FF2D55" }}>E</span>
        </div>

        <div
          style={{
            fontSize: 22,
            fontWeight: 900,
            color: "#FFE633",
            marginTop: 40,
            letterSpacing: 3,
          }}
        >
          FIRSTDAY.LIFE
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
