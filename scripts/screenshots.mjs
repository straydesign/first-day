import { chromium } from "playwright";
import { fileURLToPath } from "url";
import path from "path";
import fs from "fs";

const BASE = "http://localhost:4720/preview";
const WIDTH = 375;
const HEIGHT = 812;
const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const OUTPUT_DIR = path.resolve(SCRIPT_DIR, "../public/screenshots");
const PORTFOLIO_DIR = path.resolve(SCRIPT_DIR, "../../../portfolio/public/images/firstday");

const screens = [
  { index: 0, name: "goal-creation", waitMs: 2000 },
  { index: 1, name: "loading-screen", waitMs: 3000 },
  { index: 2, name: "calendar-view", waitMs: 2500 },
  { index: 3, name: "day-view", waitMs: 2500 },
  { index: 4, name: "congrats-view", waitMs: 3500 },
];

// Ensure output directories exist
fs.mkdirSync(OUTPUT_DIR, { recursive: true });
fs.mkdirSync(PORTFOLIO_DIR, { recursive: true });

async function run() {
  const browser = await chromium.launch();

  for (const screen of screens) {
    console.log(`Capturing ${screen.name}...`);
    const context = await browser.newContext({
      viewport: { width: WIDTH, height: HEIGHT },
      deviceScaleFactor: 2,
    });
    const page = await context.newPage();
    await page.goto(`${BASE}?screen=${screen.index}`, { waitUntil: "networkidle" });

    // Wait for animations to settle
    await page.waitForTimeout(screen.waitMs);

    const filePath = path.join(OUTPUT_DIR, `${screen.name}.png`);
    await page.screenshot({ path: filePath });
    console.log(`  Saved: ${filePath}`);

    // Copy to portfolio
    const portfolioPath = path.join(PORTFOLIO_DIR, `${screen.name}.png`);
    fs.copyFileSync(filePath, portfolioPath);
    console.log(`  Copied: ${portfolioPath}`);

    await context.close();
  }

  await browser.close();
  console.log("\nAll screenshots captured!");
}

run().catch(console.error);
