/**
 * App Store screenshots (6.9" iPhone, 1320x2868) from the iOS bundle in demo
 * mode. Serve the bundle first: npx serve ios-web -l 4721
 * Usage: node scripts/appstore-shots.mjs appstore/shots
 */
import { chromium } from "@playwright/test";
const out = process.argv[2];
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 440, height: 956 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true, colorScheme: "dark" });
const shot = async (n) => { await p.waitForTimeout(2500); await p.screenshot({ path: `${out}/${n}.png` }); };
await p.addInitScript(() => localStorage.setItem("fd_onboarding_tour_v1", "1"));
await p.goto("http://localhost:4721/", { waitUntil: "networkidle" });
await shot("01-landing");
await p.getByRole("button", { name: "Log In" }).first().click();
await p.waitForTimeout(800);
await p.getByRole("button", { name: /Try the demo/ }).click();
await shot("02-goals");
await p.getByText("Learn to play guitar", { exact: true }).click();
await shot("03-calendar");
await p.getByRole("button", { name: /Start Lesson/ }).first().click();
await shot("04-day");
console.log((await p.locator("button").allInnerTexts()).filter(Boolean).slice(0,40).join(" | "));
await b.close();
