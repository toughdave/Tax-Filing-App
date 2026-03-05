import { test, expect } from "@playwright/test";

test.describe("Smoke tests — public pages", () => {
  test("landing page loads with hero and CTA", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/Canada Tax Filing/i);
    await expect(page.locator("text=Start Filing")).toBeVisible();
  });

  test("landing page has stats bar", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("text=13")).toBeVisible();
    await expect(page.locator("text=AES-256-GCM")).toBeVisible();
  });

  test("sign-in page loads", async ({ page }) => {
    await page.goto("/sign-in");
    await expect(page.locator("h1")).toBeVisible();
  });

  test("privacy page loads", async ({ page }) => {
    await page.goto("/privacy");
    await expect(page.locator("h1")).toBeVisible();
  });

  test("terms page loads", async ({ page }) => {
    await page.goto("/terms");
    await expect(page.locator("h1")).toBeVisible();
  });

  test("health endpoint returns 200", async ({ request }) => {
    const res = await request.get("/api/health");
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.status).toBe("ok");
  });

  test("language toggle switches to French", async ({ page }) => {
    await page.goto("/");
    const frLink = page.locator("a.btn-secondary:has-text('FR')");
    await frLink.click();
    await expect(page).toHaveURL(/lang=fr/);
    await expect(page.locator("text=Commencer")).toBeVisible();
  });
});

test.describe("Smoke tests — auth-gated pages redirect", () => {
  test("dashboard redirects or shows sign-in prompt when unauthenticated", async ({ page }) => {
    await page.goto("/dashboard");
    const signInVisible = await page.locator("text=Sign in").or(page.locator("text=Se connecter")).isVisible();
    expect(signInVisible).toBe(true);
  });

  test("new return page loads form", async ({ page }) => {
    await page.goto("/returns/new");
    // Should either show form or sign-in prompt
    const formOrSignIn = await page
      .locator("h1, h2")
      .first()
      .isVisible();
    expect(formOrSignIn).toBe(true);
  });
});

test.describe("Dark mode", () => {
  test("theme toggle switches to dark mode", async ({ page }) => {
    await page.goto("/");
    const toggle = page.locator("button[aria-label='Toggle dark mode']");
    await expect(toggle).toBeVisible();
    await toggle.click();
    const theme = await page.locator("html").getAttribute("data-theme");
    expect(theme).toBe("dark");
  });

  test("theme persists across navigation", async ({ page }) => {
    await page.goto("/");
    await page.locator("button[aria-label='Toggle dark mode']").click();
    await page.goto("/sign-in");
    const theme = await page.locator("html").getAttribute("data-theme");
    expect(theme).toBe("dark");
  });
});

test.describe("Mobile responsiveness", () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test("mobile nav is visible on small screens", async ({ page }) => {
    await page.goto("/");
    const mobileNav = page.locator("nav.mobile-nav");
    await expect(mobileNav).toBeVisible();
  });

  test("buttons have adequate touch targets", async ({ page }) => {
    await page.goto("/");
    const buttons = page.locator(".btn");
    const count = await buttons.count();
    for (let i = 0; i < Math.min(count, 5); i++) {
      const box = await buttons.nth(i).boundingBox();
      if (box) {
        expect(box.height).toBeGreaterThanOrEqual(40);
      }
    }
  });
});

test.describe("API smoke tests", () => {
  test("documents API returns 401 without auth", async ({ request }) => {
    const res = await request.get("/api/documents");
    expect(res.status()).toBe(401);
  });

  test("returns API returns 401 without auth", async ({ request }) => {
    const res = await request.get("/api/returns");
    expect(res.status()).toBe(401);
  });

  test("consent API returns 401 without auth", async ({ request }) => {
    const res = await request.get("/api/consent");
    expect(res.status()).toBe(401);
  });
});
