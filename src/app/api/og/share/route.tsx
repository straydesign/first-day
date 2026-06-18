import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { NextRequest } from "next/server";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const goal = (searchParams.get("g") || "").slice(0, 60);
  const parsedDays = parseInt(searchParams.get("d") || "28", 10);
  const days = Number.isFinite(parsedDays) ? parsedDays : 28;
  const streak = parseInt(searchParams.get("s") || "0", 10);
  const xp = parseInt(searchParams.get("x") || "0", 10);
  const level = (searchParams.get("l") || "Master").slice(0, 16);
  const achievements = parseInt(searchParams.get("a") || "0", 10);

  const notoPath = join(
    process.cwd(),
    "node_modules/next/dist/compiled/@vercel/og/noto-sans-v27-latin-regular.ttf",
  );
  const notoFont = await readFile(notoPath);

  const PALETTE = ["#FFE633", "#FF6B2B", "#FF2D55", "#00EAFF", "#FF10F0", "#4FC3F7"];

  const shards = [
    { x: -30, y: -40, w: 320, h: 220, color: "#FFE633", skew: -4, rotate: -2 },
    { x: 280, y: -30, w: 280, h: 200, color: "#FF2D55", skew: 3, rotate: 1 },
    { x: 550, y: -35, w: 250, h: 210, color: "#00EAFF", skew: -2, rotate: -3 },
    { x: 790, y: -25, w: 230, h: 190, color: "#FF10F0", skew: 4, rotate: 2 },
    { x: 1010, y: -40, w: 240, h: 230, color: "#FF6B2B", skew: -3, rotate: -1 },
    { x: -20, y: 540, w: 320, h: 160, color: "#FF6B2B", skew: 4, rotate: -2 },
    { x: 280, y: 530, w: 260, h: 170, color: "#FF10F0", skew: -3, rotate: 3 },
    { x: 520, y: 545, w: 230, h: 160, color: "#FFE633", skew: 2, rotate: -1 },
    { x: 730, y: 535, w: 240, h: 170, color: "#FF2D55", skew: -4, rotate: 2 },
    { x: 950, y: 540, w: 260, h: 160, color: "#00EAFF", skew: 3, rotate: -3 },
  ];

  const stats: Array<[string, string, string]> = [
    [`${days}/${days}`, "DAYS", "#fcd02a"],
    [`${streak}d`, "STREAK", "#fb7025"],
    [xp >= 1000 ? `${(xp / 1000).toFixed(1)}k` : `${xp}`, "XP", "#f31b5e"],
    [String(achievements), "BADGES", "#3075e1"],
  ];

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

        <div
          style={{
            position: "absolute",
            left: 30,
            right: 30,
            top: 195,
            bottom: 195,
            backgroundColor: "#000000",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: 30,
          }}
        >
          <div style={{ display: "flex", alignItems: "center" }}>
            {"GOAL CRUSHED".split("").map((char, i) => {
              if (char === " ") return <span key={i} style={{ width: 22 }} />;
              return (
                <span
                  key={i}
                  style={{
                    color: PALETTE[i % PALETTE.length],
                    fontSize: 96,
                    fontWeight: 900,
                    letterSpacing: -1,
                  }}
                >
                  {char}
                </span>
              );
            })}
          </div>

          {goal && (
            <div
              style={{
                display: "flex",
                backgroundColor: "#ffffff",
                padding: "10px 28px",
                marginTop: 14,
                marginBottom: 14,
                maxWidth: "85%",
              }}
            >
              <span
                style={{
                  color: "#000000",
                  fontSize: 32,
                  fontWeight: 900,
                  letterSpacing: 2,
                  textTransform: "uppercase",
                }}
              >
                {goal}
              </span>
            </div>
          )}

          <div style={{ display: "flex", gap: 32, marginTop: 14 }}>
            {stats.map(([value, label, color]) => (
              <div
                key={label}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  minWidth: 130,
                }}
              >
                <span style={{ color: "#ffffff", fontSize: 56, fontWeight: 900, letterSpacing: -1, lineHeight: 1 }}>
                  {value}
                </span>
                <span style={{ color, fontSize: 18, fontWeight: 900, letterSpacing: 4, marginTop: 6 }}>
                  {label}
                </span>
              </div>
            ))}
          </div>

          <div style={{ display: "flex", marginTop: 22 }}>
            <span style={{ color: "#ffffff", fontSize: 24, fontWeight: 900, letterSpacing: 5 }}>
              {level.toUpperCase()} LEVEL · YOUR TURN
            </span>
          </div>
        </div>

        <div
          style={{
            position: "absolute",
            bottom: 22,
            left: 0,
            right: 0,
            display: "flex",
            justifyContent: "center",
          }}
        >
          <span
            style={{
              fontSize: 26,
              fontWeight: 900,
              color: "#ffffff",
              letterSpacing: 8,
              backgroundColor: "#000000",
              padding: "10px 28px",
            }}
          >
            FIRSTDAY.LIFE
          </span>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
      fonts: [
        {
          name: "Noto Sans",
          data: notoFont.buffer,
          style: "normal" as const,
          weight: 400 as const,
        },
      ],
    },
  );
}
