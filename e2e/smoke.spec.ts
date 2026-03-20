import { test, expect } from "@playwright/test";

test.describe("Landing Page — Smoke Tests", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    // Wait for hydration — the landing page renders client-side
    await page.waitForSelector("text=How It Works", { timeout: 15_000 });
  });

  test("page loads and has correct title", async ({ page }) => {
    await expect(page).toHaveTitle(/First Day/i);
  });

  test("hero section is visible with Log In and Get Started CTAs", async ({
    page,
  }) => {
    // Top-left Log In button
    const loginButton = page.locator("button", { hasText: "Log In" }).first();
    await expect(loginButton).toBeVisible();

    // Top-right Get Started button
    const getStartedButton = page
      .locator("button", { hasText: "Get Started" })
      .first();
    await expect(getStartedButton).toBeVisible();
  });

  test("scrolling goal pills section is visible", async ({ page }) => {
    const goalPillsHeading = page.locator(
      "text=Goals you can start this week"
    );
    await expect(goalPillsHeading).toBeVisible();
  });

  test('"How It Works" section is visible with 3 steps', async ({ page }) => {
    const howItWorks = page.locator("h2", { hasText: "How It Works" });
    await expect(howItWorks).toBeVisible();

    // Verify the 3 steps are present
    await expect(page.locator("text=Set Your Goal")).toBeVisible();
    await expect(page.locator("text=Get Your Plan")).toBeVisible();
    await expect(page.locator("text=Show Up Daily")).toBeVisible();
  });

  test('"Stay Motivated" features section is visible', async ({ page }) => {
    const stayMotivated = page.locator("h2", { hasText: "Stay Motivated" });
    await expect(stayMotivated).toBeVisible();

    // Feature cards
    await expect(page.locator("h3", { hasText: "Daily Streaks" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Earn XP", exact: true })).toBeVisible();
    await expect(page.locator("h3", { hasText: "Unlock Badges" })).toBeVisible();
  });

  test('"What Your Plan Looks Like" section is visible', async ({ page }) => {
    const planSection = page.locator("h2", {
      hasText: "What Your Plan Looks Like",
    });
    await expect(planSection).toBeVisible();

    // Plan feature cards
    await expect(
      page.locator("h3", { hasText: "Your Weekly Sprint" })
    ).toBeVisible();
    await expect(
      page.locator("h3", { hasText: "Daily Activities" })
    ).toBeVisible();
    await expect(
      page.locator("h3", { hasText: "Earn XP & Level Up" })
    ).toBeVisible();
    await expect(
      page.locator("h3", { hasText: "Complete Your Goal" })
    ).toBeVisible();
  });

  test('"Create Your Plan" CTA is visible', async ({ page }) => {
    const createPlanCTA = page.locator("button", {
      hasText: "Create Your Plan",
    });
    await expect(createPlanCTA).toBeVisible();
  });

  test("footer is visible with expected links", async ({ page }) => {
    const footer = page.locator("footer");
    await expect(footer).toBeVisible();

    // Footer items
    await expect(
      footer.locator("text=Privacy Policy")
    ).toBeVisible();
    await expect(
      footer.locator("text=Terms of Service")
    ).toBeVisible();
    await expect(footer.locator("text=First Day")).toBeVisible();
    await expect(
      footer.locator("text=support@firstday.life")
    ).toBeVisible();
    await expect(
      footer.locator("text=Built by Stray Web Design")
    ).toBeVisible();
  });

  test("no console errors on page load", async ({ page }) => {
    const errors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") {
        errors.push(msg.text());
      }
    });

    await page.goto("/");
    await page.waitForSelector("text=How It Works", { timeout: 15_000 });

    // Filter out known non-critical errors (e.g. favicon, analytics)
    const criticalErrors = errors.filter(
      (e) =>
        !e.includes("favicon") &&
        !e.includes("404") &&
        !e.includes("Failed to load resource")
    );
    expect(criticalErrors).toHaveLength(0);
  });
});
