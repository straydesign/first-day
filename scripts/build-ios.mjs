#!/usr/bin/env node
/**
 * Builds the static web bundle the iOS shell ships, into ./ios-web.
 *
 * A static export can't contain server routes, so this builds from a scratch
 * copy of the repo with them removed. The working tree is never touched — a
 * crash mid-build can't leave files missing here. The app calls the live
 * site's /api/generate-plan instead (NEXT_PUBLIC_API_BASE), and /share stays a
 * web page that the app opens in Safari.
 */
import { cpSync, mkdtempSync, rmSync, symlinkSync, existsSync } from "node:fs";
import { execSync } from "node:child_process";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

const ROOT = resolve(import.meta.dirname, "..");
const OUT = join(ROOT, "ios-web");
const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "https://firstday.life";

/**
 * Server routes, plus web-only metadata (link previews, crawler files) the app
 * never serves. Everything else in src/app exports as static files.
 */
const WEB_ONLY = [
  "src/app/api",
  "src/app/share",
  "src/app/opengraph-image.tsx",
  "src/app/twitter-image.tsx",
  "src/app/robots.ts",
  "src/app/sitemap.ts",
  "src/app/read",
  "public/llms.txt",
];

/** Never copied into the scratch build. */
const SKIP = new Set(["node_modules", ".next", ".next-ios", "ios", "ios-web", ".git", "test-results", "playwright-report"]);

const work = mkdtempSync(join(tmpdir(), "firstday-ios-"));
try {
  cpSync(ROOT, work, {
    recursive: true,
    filter: (src) => !SKIP.has(src.slice(ROOT.length + 1).split("/")[0]),
  });
  symlinkSync(join(ROOT, "node_modules"), join(work, "node_modules"), "dir");
  for (const p of WEB_ONLY) rmSync(join(work, p), { recursive: true, force: true });

  // Webpack, not Turbopack: Turbopack rejects a node_modules symlink that
  // points outside the scratch root.
  execSync("npx next build --webpack", {
    cwd: work,
    stdio: "inherit",
    env: { ...process.env, IOS_EXPORT: "1", NEXT_PUBLIC_API_BASE: API_BASE },
  });

  if (!existsSync(join(work, "out", "index.html"))) {
    throw new Error("Export finished without out/index.html");
  }
  rmSync(OUT, { recursive: true, force: true });
  cpSync(join(work, "out"), OUT, { recursive: true });
  console.log(`iOS bundle → ${OUT} (API: ${API_BASE})`);
} finally {
  rmSync(work, { recursive: true, force: true });
}
