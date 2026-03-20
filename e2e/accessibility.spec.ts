import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test.describe("Accessibility — Landing Page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector("text=How It Works", { timeout: 15_000 });
  });

  test("landing page passes axe accessibility scan", async ({ page }) => {
    const results = await new AxeBuilder({ page })
      // Exclude canvas/WebGL elements which axe can't meaningfully scan
      .exclude("canvas")
      // Disable color-contrast — custom clip-path shapes cause false positives
      // Disable page-has-heading-one — landing page uses a brand logo mark, not a text h1
      .disableRules(["color-contrast", "page-has-heading-one"])
      .analyze();

    // Log violations for debugging
    if (results.violations.length > 0) {
      const summary = results.violations.map((v) => ({
        id: v.id,
        impact: v.impact,
        description: v.description,
        nodes: v.nodes.length,
      }));
      console.log("Axe violations:", JSON.stringify(summary, null, 2));
    }

    expect(results.violations).toHaveLength(0);
  });

  test("page has proper heading hierarchy", async ({ page }) => {
    // There should be h2 headings for main sections
    const h2s = page.locator("h2");
    const h2Count = await h2s.count();
    expect(h2Count).toBeGreaterThanOrEqual(3);

    // Expected section headings
    const headingTexts = await h2s.allTextContents();
    const expectedHeadings = ["How It Works", "Stay Motivated", "What Your Plan Looks Like"];
    for (const expected of expectedHeadings) {
      expect(headingTexts.some((t) => t.includes(expected))).toBe(true);
    }

    // h3 headings exist under feature sections
    const h3s = page.locator("h3");
    const h3Count = await h3s.count();
    expect(h3Count).toBeGreaterThanOrEqual(3);
  });

  test("skip-to-content link exists and targets #main-content", async ({
    page,
  }) => {
    // The skip link is the first focusable element
    const skipLink = page.locator("a.skip-to-content");
    await expect(skipLink).toBeAttached();

    const href = await skipLink.getAttribute("href");
    expect(href).toBe("#main-content");

    // The target element exists
    const mainContent = page.locator("#main-content");
    await expect(mainContent).toBeAttached();
  });

  test("all images have alt text", async ({ page }) => {
    const images = page.locator("img");
    const count = await images.count();

    for (let i = 0; i < count; i++) {
      const img = images.nth(i);
      const alt = await img.getAttribute("alt");
      const role = await img.getAttribute("role");

      // Images must have alt text or be decorative (role="presentation")
      const hasAlt = alt !== null && alt !== undefined;
      const isDecorative = role === "presentation" || alt === "";
      expect(
        hasAlt || isDecorative,
        `Image ${i} at ${await img.getAttribute("src")} missing alt text`
      ).toBe(true);
    }
  });

  test("interactive elements are keyboard accessible", async ({ page }) => {
    // Tab to the first interactive element (skip link, then CTAs)
    await page.keyboard.press("Tab");

    // The skip-to-content link should receive focus first
    const skipLink = page.locator("a.skip-to-content");
    await expect(skipLink).toBeFocused();

    // Continue tabbing to reach CTA buttons
    await page.keyboard.press("Tab");
    const focusedElement = page.locator(":focus");
    const tagName = await focusedElement.evaluate((el) =>
      el.tagName.toLowerCase()
    );

    // Should focus on a button or link
    expect(["button", "a", "input"]).toContain(tagName);
  });

  test("page has proper landmark structure", async ({ page }) => {
    // Should have a main element
    const main = page.locator("main");
    await expect(main).toBeAttached();

    // Should have a footer
    const footer = page.locator("footer");
    await expect(footer).toBeAttached();
  });

  test("form inputs in auth modal have associated labels", async ({
    page,
  }) => {
    // Open the login modal
    const loginBtn = page.locator("button", { hasText: "Log In" }).first();
    await loginBtn.click();
    await page.waitForSelector("#email", { timeout: 5_000 });

    // Check email input has a label
    const emailLabel = page.locator('label[for="email"]');
    await expect(emailLabel).toBeAttached();

    // Check password input has a label
    const passwordLabel = page.locator('label[for="password"]');
    await expect(passwordLabel).toBeAttached();

    // Toggle to signup and check additional fields
    const toggleButton = page.locator("button", {
      hasText: "Don't have an account? Sign up",
    });
    await toggleButton.click();

    const nameLabel = page.locator('label[for="name"]');
    await expect(nameLabel).toBeAttached();

    const confirmLabel = page.locator('label[for="confirmPassword"]');
    await expect(confirmLabel).toBeAttached();
  });

  test("auth modal dialog has accessible name", async ({ page }) => {
    const loginBtn = page.locator("button", { hasText: "Log In" }).first();
    await loginBtn.click();
    await page.waitForSelector("#email", { timeout: 5_000 });

    // Dialog should have role="dialog"
    const dialog = page.locator("[role=dialog]");
    await expect(dialog).toBeVisible();

    // Dialog should have aria-labelledby or aria-label (via DialogTitle)
    const hasLabel =
      (await dialog.getAttribute("aria-labelledby")) !== null ||
      (await dialog.getAttribute("aria-label")) !== null;
    expect(hasLabel).toBe(true);
  });
});
