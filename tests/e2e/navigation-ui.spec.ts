import { expect, test } from "@playwright/test";

test.describe("Navigation and UI controls", () => {
  test("language switch changes locale and URL", async ({ page }) => {
    await page.goto("/diagnostics?lang=ru");

    await expect(page.getByRole("heading", { name: "Диагностика" })).toBeVisible();
    if (test.info().project.name.includes("mobile")) {
      await page.getByTestId("burger-toggle").click();
      await expect(page.getByTestId("mobile-menu-overlay")).toHaveAttribute("data-open", "true");
    }

    await page.locator("[data-testid='locale-switcher']:visible").first().click();
    await expect(page).toHaveURL(/lang=en/);
    await expect(page.getByRole("heading", { name: "Diagnostics" })).toBeVisible();
  });

  test("theme toggle switches and persists theme", async ({ page }) => {
    await page.goto("/?lang=en");
    if (test.info().project.name.includes("mobile")) {
      await page.getByTestId("burger-toggle").click();
      await expect(page.getByTestId("mobile-menu-overlay")).toHaveAttribute("data-open", "true");
    }
    const toggle = page.locator("[data-testid='theme-toggle']:visible").first();

    const before = await page.evaluate(() => document.documentElement.getAttribute("data-theme"));
    await toggle.click();
    const after = await page.evaluate(() => document.documentElement.getAttribute("data-theme"));

    expect(after).toMatch(/light|dark/);
    expect(after).not.toBe(before);

    await page.reload();
    const persisted = await page.evaluate(() => document.documentElement.getAttribute("data-theme"));
    expect(persisted).toBe(after);
  });

  test("mobile burger opens and closes; clicking current route closes overlay", async ({ page }, testInfo) => {
    test.skip(!testInfo.project.name.includes("mobile"), "Mobile-only behavior");

    await page.goto("/diagnostics?lang=en");
    const burger = page.getByTestId("burger-toggle");
    const overlay = page.getByTestId("mobile-menu-overlay");

    await burger.click();
    await expect(burger).toHaveAttribute("aria-expanded", "true");
    await expect(overlay).toHaveAttribute("data-open", "true");

    await page.getByTestId("mobile-nav-diagnostics").click();
    await expect(burger).toHaveAttribute("aria-expanded", "false");
    await expect(overlay).not.toHaveAttribute("data-open", "true");
  });
});
