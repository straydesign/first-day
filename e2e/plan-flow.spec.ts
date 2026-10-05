/**
 * Plan flow in demo mode at iPhone width (390px): create a goal with the skill
 * slider, finish a full sprint marking days Too easy / Too hard, watch the next
 * sprint's level move, delete a goal, and check Settings only shows on Home.
 *
 * Demo mode builds plans from the local template (no model call, no sign-in),
 * so this proves the UI flow and the level bookkeeping, not plan quality —
 * scripts/plan-eval.ts covers the model.
 *
 * Screenshots land in appstore/flow-shots/.
 *   npx playwright test e2e/plan-flow.spec.ts
 */
import { expect, test, type Page } from "@playwright/test";

const SHOTS = "appstore/flow-shots";

test.use({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, hasTouch: true });
test.describe.configure({ mode: "serial" });

async function shot(page: Page, name: string): Promise<void> {
  await page.waitForTimeout(400);
  await page.screenshot({ path: `${SHOTS}/${name}.png` });
}

/** Visible buttons/links/inputs on screen that overlap each other, plus any sideways page scroll. */
async function findOverlaps(page: Page): Promise<string[]> {
  return page.evaluate(() => {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const problems: string[] = [];
    if (document.documentElement.scrollWidth > vw + 1) {
      problems.push(`page scrolls sideways: ${document.documentElement.scrollWidth}px > ${vw}px`);
    }
    const name = (e: Element) =>
      ((e.getAttribute("aria-label") || (e as HTMLElement).innerText || e.tagName) ?? "").trim().replace(/\s+/g, " ").slice(0, 40);
    // Clipped by an overflow-hidden ancestor (the scrolling suggestion rows) = not really on screen.
    const clipsX = (p: Element) => getComputedStyle(p).overflowX !== "visible";
    const inClippingRow = (e: Element) => {
      for (let p = e.parentElement; p && p !== document.body; p = p.parentElement) if (clipsX(p)) return true;
      return false;
    };
    const clippedOut = (e: Element, r: DOMRect) => {
      for (let p = e.parentElement; p && p !== document.body; p = p.parentElement) {
        if (clipsX(p)) {
          const pr = p.getBoundingClientRect();
          if (r.right <= pr.left + 1 || r.left >= pr.right - 1) return true;
        }
      }
      return false;
    };
    // A floating (fixed) button or sticky bar passing over content mid-scroll is expected;
    // it is checked at the end of the page instead, where nothing may sit under it.
    const atBottom = window.scrollY + vh >= document.documentElement.scrollHeight - 2;
    const isFixed = (e: Element) => {
      for (let p: Element | null = e; p; p = p.parentElement) if (["fixed", "sticky"].includes(getComputedStyle(p).position)) return true;
      return false;
    };
    const els = Array.from(document.querySelectorAll("button, a[href], input, [role=button], [role=radio], [role=checkbox], [data-overlap-check]"))
      .filter((e) => !e.closest("nextjs-portal"))
      .map((e) => ({ e, r: e.getBoundingClientRect() }))
      .filter(({ e, r }) => {
        if (r.width < 2 || r.height < 2) return false;
        if (r.bottom <= 0 || r.top >= vh || r.right <= 0 || r.left >= vw) return false;
        const s = getComputedStyle(e);
        if (s.visibility === "hidden" || Number(s.opacity) === 0) return false;
        return !clippedOut(e, r);
      });
    for (const { e, r } of els) {
      if ((r.left < -1 || r.right > vw + 1) && !inClippingRow(e)) problems.push(`"${name(e)}" runs off screen (${Math.round(r.left)}-${Math.round(r.right)})`);
    }
    for (let i = 0; i < els.length; i++) {
      for (let j = i + 1; j < els.length; j++) {
        const a = els[i];
        const b = els[j];
        if (a.e.contains(b.e) || b.e.contains(a.e)) continue;
        if (!atBottom && (isFixed(a.e) || isFixed(b.e))) continue;
        const w = Math.min(a.r.right, b.r.right) - Math.max(a.r.left, b.r.left);
        const h = Math.min(a.r.bottom, b.r.bottom) - Math.max(a.r.top, b.r.top);
        if (w > 2 && h > 2) problems.push(`"${name(a.e)}" overlaps "${name(b.e)}"`);
      }
    }
    return problems;
  });
}

/** Scroll through the page checking overlaps at each screenful. */
async function overlapsWhileScrolling(page: Page): Promise<string[]> {
  const found = new Set<string>();
  const height = await page.evaluate(() => document.documentElement.scrollHeight);
  for (let y = 0; y < height; y += 700) {
    await page.evaluate((top) => window.scrollTo(0, top), y);
    await page.waitForTimeout(150);
    for (const p of await findOverlaps(page)) found.add(p);
  }
  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
  await page.waitForTimeout(150);
  for (const p of await findOverlaps(page)) found.add(p);
  await page.evaluate(() => window.scrollTo(0, 0));
  return [...found];
}

async function enterDemo(page: Page): Promise<void> {
  await page.goto("/");
  await page.getByText("Try the demo").click();
  await expect(page.getByText("Add new goal")).toBeVisible();
}

/** The first-run tour opens a moment after the plan appears; close it if it does. */
async function skipTourIfShown(page: Page): Promise<void> {
  const skip = page.getByRole("button", { name: "Skip tour" });
  try {
    await skip.waitFor({ state: "visible", timeout: 3_000 });
    await skip.click();
    await skip.waitFor({ state: "hidden" });
  } catch {
    // no tour this time
  }
}

test("create a goal with the skill slider; the plan shows the level", async ({ page }) => {
  await enterDemo(page);
  await expect(page.getByRole("button", { name: "Settings" })).toBeVisible();
  expect(await overlapsWhileScrolling(page), "Home at 390px").toEqual([]);
  await shot(page, "01-home");

  await page.getByText("Add new goal").click();
  await page.locator("#goal-input").fill("Run a 5K");
  const slider = page.locator("#skillLevel-input");
  await slider.scrollIntoViewIfNeeded();

  // Every band shows its own label and example line.
  const bands: Array<[string, string, string]> = [
    ["10", "10 · Starting out", "Never tried it"],
    ["34", "34 · Beginner", "Tried it a few times"],
    ["55", "55 · Intermediate", "I do it now and then"],
    ["72", "72 · Advanced", "I do it a lot"],
    ["95", "95 · Expert", "I could teach it"],
  ];
  for (const [v, label, example] of bands) {
    await slider.fill(v);
    await expect(page.getByTestId("skill-level-label")).toHaveText(label);
    await expect(page.getByTestId("skill-level-example")).toHaveText(example);
  }
  // Keyboard works too.
  await slider.fill("33");
  await slider.focus();
  await page.keyboard.press("ArrowRight");
  await expect(page.getByTestId("skill-level-label")).toHaveText("34 · Beginner");
  await slider.evaluate((el) => el.scrollIntoView({ block: "center" }));
  await shot(page, "02-create-slider");
  expect(await overlapsWhileScrolling(page), "Create screen at 390px").toEqual([]);
  await expect(page.getByRole("button", { name: "Settings" })).toHaveCount(0);

  await page.getByRole("button", { name: "Generate My Plan" }).click();
  await skipTourIfShown(page);
  await expect(page.getByTestId("sprint-level-1")).toHaveText("Written for level 34");
  await expect(page.getByRole("button", { name: "Settings" })).toHaveCount(0);
  await shot(page, "03-plan");
  expect(await overlapsWhileScrolling(page), "Plan screen at 390px").toEqual([]);
});

test("finish a sprint marking days too easy / too hard; the next level moves", async ({ page }) => {
  test.setTimeout(240_000);
  const errors: string[] = [];
  page.on("console", (m) => { if (m.type() === "error") errors.push(m.text().slice(0, 300)); });
  page.on("pageerror", (e) => errors.push(`pageerror: ${e.message.slice(0, 300)}`));
  await enterDemo(page);
  await page.getByText("Add new goal").click();
  await page.locator("#goal-input").fill("Learn to juggle");
  await page.locator("#skillLevel-input").fill("40");
  await page.getByRole("button", { name: "Generate My Plan" }).click();
  await skipTourIfShown(page);
  await expect(page.getByTestId("sprint-level-1")).toHaveText("Written for level 40");

  // 5 days too easy, 1 too hard, 1 unmarked → 40 + 6 + 10 - 2 = 54.
  const marks: Array<"Too easy" | "Too hard" | null> = ["Too easy", "Too hard", "Too easy", "Too easy", null, "Too easy", "Too easy"];
  for (let day = 1; day <= 7; day++) {
    await page.getByRole("button", { name: new RegExp(`^Start lesson ${day}:`) }).click();
    const boxes = page.getByRole("checkbox");
    await expect(boxes.first()).toBeVisible();
    // The unchecked boxes pulse forever, so Playwright never sees them "stable".
    for (const box of await boxes.all()) {
      await box.click({ force: true });
      await expect(box).toHaveAttribute("aria-checked", "true");
    }
    const mark = marks[day - 1];
    if (mark) {
      const btn = page.getByRole("radio", { name: mark });
      await btn.scrollIntoViewIfNeeded();
      await btn.click();
      await expect(btn).toHaveAttribute("aria-checked", "true");
    }
    if (day <= 2) {
      await page.getByRole("radio", { name: "Too easy" }).scrollIntoViewIfNeeded();
      await shot(page, `04-day-${day}`);
      expect(await overlapsWhileScrolling(page), `Day ${day} at 390px`).toEqual([]);
      await expect(page.getByRole("button", { name: "Settings" })).toHaveCount(0);
    }
    await page.getByRole("button", { name: "Complete Day" }).click();

    if (day < 7) {
      await expect(page.getByRole("heading", { name: `Day ${day} Complete!` })).toBeVisible({ timeout: 10_000 });
      if (day === 1) await shot(page, "05-congrats");
      // The Beast Mode splash plays first.
      await page.getByRole("button", { name: "View Calendar" }).click({ timeout: 20_000 });
      await skipTourIfShown(page);
    }
  }

  // Sprint boundary: the recap builds sprint 2.
  const start = page.getByRole("button", { name: /start sprint 2|build/i }).first();
  await expect(start).toBeVisible({ timeout: 15_000 });
  await page.getByText("Beast", { exact: true }).waitFor({ state: "hidden", timeout: 15_000 }).catch(() => undefined);
  await page.waitForTimeout(1_000);
  await shot(page, "06-recap");
  await start.click();
  const startSprint = page.getByRole("button", { name: /start sprint 2/i });
  if (await startSprint.isVisible().catch(() => false)) await startSprint.click();
  await skipTourIfShown(page);
  await expect(page.getByTestId("sprint-level-2")).toHaveText("Written for level 54");
  await expect(page.getByTestId("sprint-level-1")).toHaveText("Written for level 40");
  // Let the achievement toast and the view transition finish before looking.
  const closeToast = page.getByRole("button", { name: /dismiss|close/i }).first();
  if (await closeToast.isVisible().catch(() => false)) await closeToast.click();
  await page.waitForTimeout(2_500);
  await page.getByTestId("sprint-level-2").scrollIntoViewIfNeeded();
  await shot(page, "07-sprint-2-level");
  expect(await overlapsWhileScrolling(page), "Plan after sprint 1 at 390px").toEqual([]);
  // Headless Chromium has no GPU, so the 3D shard scene can't get a WebGL
  // context here. That is the test machine, not the app; anything else fails.
  expect(errors.filter((e) => !/WebGL/i.test(e)), "console errors during the sprint").toEqual([]);
});

test("delete in demo mode asks to sign up and keeps the goal", async ({ page }) => {
  // Demo goals can't be deleted (GoalsManagement shows a sign-up toast). A real
  // delete needs a signed-in account, so it is checked on TestFlight.
  await enterDemo(page);
  const before = await page.getByRole("button", { name: "Delete goal" }).count();
  let dialogs = 0;
  page.on("dialog", (d) => { dialogs++; void d.dismiss(); });
  await page.getByRole("button", { name: "Delete goal" }).last().click();
  await expect(page.getByText("Sign up to manage goals!")).toBeVisible();
  await shot(page, "08-demo-delete");
  await expect(page.getByRole("button", { name: "Delete goal" })).toHaveCount(before);
  expect(dialogs).toBe(0);
});
