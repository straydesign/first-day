import { test, expect } from "@playwright/test";

test.describe("Auth UI — Login/Signup Modal", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector("text=How It Works", { timeout: 15_000 });
  });

  test("clicking 'Get Started' opens auth modal with form fields", async ({
    page,
  }) => {
    const getStarted = page
      .locator("button", { hasText: "Get Started" })
      .first();
    await getStarted.click();

    // Modal is fullscreen — scroll to form fields which are below the logo
    const emailInput = page.locator("#email");
    await emailInput.waitFor({ state: "attached", timeout: 5_000 });
    await emailInput.scrollIntoViewIfNeeded();
    await expect(emailInput).toBeVisible();

    // Password field present
    const passwordInput = page.locator("#password");
    await expect(passwordInput).toBeAttached();

    // Submit button exists
    const submitButton = page.locator("button[type=submit]");
    await submitButton.scrollIntoViewIfNeeded();
    await expect(submitButton).toBeVisible();

    // Can switch to signup mode and see signup-specific fields
    const toggleButton = page.locator("button", {
      hasText: /sign up/i,
    });
    await toggleButton.scrollIntoViewIfNeeded();
    await toggleButton.click();

    // Name field appears in signup mode
    const nameInput = page.locator("#name");
    await expect(nameInput).toBeAttached();

    // Confirm password field appears in signup mode
    const confirmPasswordInput = page.locator("#confirmPassword");
    await expect(confirmPasswordInput).toBeAttached();

    // Terms checkbox appears in signup mode
    const termsCheckbox = page.locator("[role=checkbox]");
    await expect(termsCheckbox).toBeAttached();
  });

  test("clicking 'Log In' opens login modal", async ({ page }) => {
    const loginBtn = page.locator("button", { hasText: "Log In" }).first();
    await loginBtn.click();

    // Modal is fullscreen — scroll to form area
    const emailInput = page.locator("#email");
    await emailInput.waitFor({ state: "attached", timeout: 5_000 });
    await emailInput.scrollIntoViewIfNeeded();
    await expect(emailInput).toBeVisible();

    const passwordInput = page.locator("#password");
    await expect(passwordInput).toBeVisible();

    // Name field should NOT exist in login mode
    const nameInput = page.locator("#name");
    await expect(nameInput).not.toBeAttached();

    // Confirm password should NOT exist in login mode
    const confirmPasswordInput = page.locator("#confirmPassword");
    await expect(confirmPasswordInput).not.toBeAttached();
  });

  test("login modal has 'Forgot?' link", async ({ page }) => {
    const loginBtn = page.locator("button", { hasText: "Log In" }).first();
    await loginBtn.click();

    const emailInput = page.locator("#email");
    await emailInput.waitFor({ state: "attached", timeout: 5_000 });
    await emailInput.scrollIntoViewIfNeeded();

    const forgotLink = page.locator("button", { hasText: "Forgot?" });
    await expect(forgotLink).toBeVisible();
  });

  test("'Forgot?' opens forgot password dialog", async ({ page }) => {
    const loginBtn = page.locator("button", { hasText: "Log In" }).first();
    await loginBtn.click();

    const emailInput = page.locator("#email");
    await emailInput.waitFor({ state: "attached", timeout: 5_000 });
    await emailInput.scrollIntoViewIfNeeded();

    const forgotLink = page.locator("button", { hasText: "Forgot?" });
    await forgotLink.click();

    // Forgot password modal appears
    const resetTitle = page.locator("text=Reset Password");
    await expect(resetTitle).toBeVisible({ timeout: 5_000 });

    // Has email input for reset
    const resetEmailInput = page.locator("#reset-email");
    await expect(resetEmailInput).toBeVisible();

    // Has submit button
    const sendResetButton = page.locator("button", {
      hasText: "Send Reset Link",
    });
    await expect(sendResetButton).toBeVisible();
  });

  test("can toggle between login and signup modes", async ({ page }) => {
    // Open login modal
    const loginBtn = page.locator("button", { hasText: "Log In" }).first();
    await loginBtn.click();
    await page.locator("#email").waitFor({ state: "attached", timeout: 5_000 });

    // Name field not in DOM in login mode
    await expect(page.locator("#name")).not.toBeAttached();

    // Toggle to signup — scroll to toggle button first
    const toggleButton = page.locator("button", {
      hasText: "Don't have an account? Sign up",
    });
    await toggleButton.scrollIntoViewIfNeeded();
    await expect(toggleButton).toBeVisible();
    await toggleButton.click();

    // Now name field should appear in DOM
    await expect(page.locator("#name")).toBeAttached();

    // Toggle back to login
    const toggleBack = page.locator("button", {
      hasText: "Already have an account? Log in",
    });
    await toggleBack.scrollIntoViewIfNeeded();
    await expect(toggleBack).toBeVisible();
    await toggleBack.click();

    // Name field removed from DOM again
    await expect(page.locator("#name")).not.toBeAttached();
  });

  test("'Try the Demo' button is visible in auth modal", async ({ page }) => {
    const loginBtn = page.locator("button", { hasText: "Log In" }).first();
    await loginBtn.click();

    const demoButton = page.locator("button", { hasText: "Try the Demo" });
    await demoButton.waitFor({ state: "attached", timeout: 5_000 });
    await demoButton.scrollIntoViewIfNeeded();
    await expect(demoButton).toBeVisible();
  });

  test("signup mode shows 'View terms and conditions' link", async ({
    page,
  }) => {
    // Open auth modal
    const getStarted = page
      .locator("button", { hasText: "Get Started" })
      .first();
    await getStarted.click();

    // Wait for modal form to load
    const emailInput = page.locator("#email");
    await emailInput.waitFor({ state: "attached", timeout: 5_000 });

    // Toggle to signup mode (modal may open in login mode)
    const toggleToSignup = page.locator("button", { hasText: /sign up/i });
    await toggleToSignup.scrollIntoViewIfNeeded();
    await toggleToSignup.click();

    // Now the "View terms" link should appear in signup mode
    const viewTerms = page.locator("button", {
      hasText: "View terms and conditions",
    });
    await viewTerms.waitFor({ state: "attached", timeout: 5_000 });
    await viewTerms.scrollIntoViewIfNeeded();
    await expect(viewTerms).toBeVisible();
  });

  test.skip("submit login with empty fields shows toast error", async () => {
    // Skipped: requires intercepting Supabase auth calls or mocking toast.
    // The form validation calls toast.error which relies on runtime state.
    // TODO: Add with mock service worker or route interception.
  });

  test.skip("submit signup with empty fields shows toast error", async () => {
    // Skipped: same as above — toast-based validation requires runtime mocking.
    // TODO: Add with mock service worker or route interception.
  });

  test.skip("successful login redirects to authenticated app", async () => {
    // Skipped: requires real Supabase credentials or auth mocking.
    // Auth-dependent — cannot test without hitting real Supabase.
  });

  test.skip("successful signup creates account and logs in", async () => {
    // Skipped: requires real Supabase credentials or auth mocking.
    // Auth-dependent — cannot test without hitting real Supabase.
  });
});
