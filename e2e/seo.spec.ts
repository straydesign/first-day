import { test, expect } from "@playwright/test";

test.describe("SEO — Meta Tags, OG, JSON-LD, robots, sitemap", () => {
  test("page has correct meta title", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/First Day/i);
  });

  test("page has meta description", async ({ page }) => {
    await page.goto("/");
    const description = page.locator('meta[name="description"]');
    await expect(description).toHaveAttribute(
      "content",
      /goal|plan|achieve/i
    );
  });

  test("page has Open Graph tags", async ({ page }) => {
    await page.goto("/");

    const ogTitle = page.locator('meta[property="og:title"]');
    await expect(ogTitle).toHaveAttribute("content", /First Day/i);

    const ogDescription = page.locator('meta[property="og:description"]');
    await expect(ogDescription).toHaveAttribute("content", /.+/);

    const ogType = page.locator('meta[property="og:type"]');
    await expect(ogType).toHaveAttribute("content", "website");

    const ogUrl = page.locator('meta[property="og:url"]');
    await expect(ogUrl).toHaveAttribute("content", /firstday\.life/);

    const ogImage = page.locator('meta[property="og:image"]');
    await expect(ogImage).toHaveAttribute("content", /.+/);
  });

  test("page has Twitter card meta tags", async ({ page }) => {
    await page.goto("/");

    const twitterCard = page.locator('meta[name="twitter:card"]');
    await expect(twitterCard).toHaveAttribute("content", "summary_large_image");

    const twitterTitle = page.locator('meta[name="twitter:title"]');
    await expect(twitterTitle).toHaveAttribute("content", /First Day/i);

    const twitterImage = page.locator('meta[name="twitter:image"]');
    await expect(twitterImage).toHaveAttribute("content", /.+/);
  });

  test("page has JSON-LD structured data", async ({ page }) => {
    await page.goto("/");

    const jsonLdScript = page.locator('script[type="application/ld+json"]').first();
    await expect(jsonLdScript).toBeAttached();

    const jsonLdText = await jsonLdScript.textContent();
    expect(jsonLdText).toBeTruthy();

    const jsonLd = JSON.parse(jsonLdText!);
    expect(jsonLd["@context"]).toBe("https://schema.org");
    expect(jsonLd["@type"]).toBe("WebApplication");
    expect(jsonLd.name).toBe("First Day");
    expect(jsonLd.url).toBe("https://firstday.life");
    expect(jsonLd.applicationCategory).toBe("LifestyleApplication");
    expect(jsonLd.offers).toBeDefined();
    expect(jsonLd.offers.price).toBe("0");
    expect(jsonLd.featureList).toBeInstanceOf(Array);
    expect(jsonLd.featureList.length).toBeGreaterThan(0);
  });

  test("robots.txt is accessible and allows crawling", async ({ request }) => {
    const response = await request.get("/robots.txt");
    expect(response.status()).toBe(200);

    const body = await response.text();
    expect(body).toContain("User-Agent: *");
    expect(body).toContain("Allow: /");
    expect(body).toContain("Sitemap:");
  });

  test("sitemap.xml is accessible and contains expected URLs", async ({
    request,
  }) => {
    const response = await request.get("/sitemap.xml");
    expect(response.status()).toBe(200);

    const body = await response.text();
    // Sitemap should contain the homepage and policy pages
    expect(body).toContain("<loc>");
    expect(body).toContain("/privacy");
    expect(body).toContain("/terms");
  });

  test("page has canonical-compatible meta base", async ({ page }) => {
    await page.goto("/");

    // Next.js renders the metadataBase as the base for OG URLs
    const ogUrl = page.locator('meta[property="og:url"]');
    const ogUrlContent = await ogUrl.getAttribute("content");
    expect(ogUrlContent).toContain("firstday.life");
  });

  test("page has proper lang attribute", async ({ page }) => {
    await page.goto("/");
    const lang = await page.locator("html").getAttribute("lang");
    expect(lang).toBe("en");
  });

  test("robots meta tag allows indexing", async ({ page }) => {
    await page.goto("/");

    // Check that there's no noindex directive
    const robotsMeta = page.locator('meta[name="robots"]');
    if (await robotsMeta.isVisible().catch(() => false)) {
      const content = await robotsMeta.getAttribute("content");
      expect(content).not.toContain("noindex");
    }
    // If no robots meta tag exists, that's fine — defaults to index,follow
  });
});
