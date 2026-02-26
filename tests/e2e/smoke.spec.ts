import { expect, test } from "@playwright/test";

const publicRoutes = ["/", "/diagnostics", "/products", "/knowledge", "/about"];

test.describe("Public smoke", () => {
  for (const route of publicRoutes) {
    test(`route ${route} is reachable`, async ({ page }) => {
      await page.goto(route, {
        waitUntil: "domcontentloaded",
        timeout: route === "/diagnostics" ? 120_000 : 60_000,
      });
      await expect(page).toHaveURL(new RegExp(`${route === "/" ? "/$" : route}$`));
    });
  }

  test("footer has medical disclaimer", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText(/не (является )?медицин|not a medical diagnosis/i)).toBeVisible();
  });

  test("diagnostics is accessible without auth; sign-in is optional for saving", async ({ page }) => {
    await page.goto("/diagnostics");
    await expect(page.getByTestId("consent-checkbox")).toBeVisible();
    await expect(page.getByTestId("start-psychotest-button")).toBeDisabled();
    await page.getByTestId("consent-checkbox").check();
    await expect(page.getByTestId("start-psychotest-button")).toBeEnabled();
  });

  test("each key screen has primary CTA in the first viewport", async ({ page }) => {
    await page.goto("/?lang=en");
    await expect(page.locator(".button.button-primary").first()).toBeVisible();

    await page.goto("/diagnostics?lang=en");
    await expect(page.getByTestId("start-psychotest-button")).toBeVisible();

    await page.goto("/products?lang=en");
    await expect(page.getByTestId("products-signin-button")).toBeVisible();
  });

  test("critical controls have accessible focus flow", async ({ page }) => {
    await page.goto("/products?lang=en");
    await expect(page.getByTestId("products-signin-button")).toBeVisible();

    await page.keyboard.press("Tab");
    const focusedTag = await page.evaluate(() => document.activeElement?.tagName ?? "");
    expect(focusedTag).not.toBe("BODY");
  });

  test("products guest state explains next step", async ({ page }) => {
    await page.goto("/products?lang=en");
    await expect(page.getByText(/sign in to submit a consultation request/i)).toBeVisible();
    await expect(page.getByTestId("products-signin-button")).toBeVisible();
  });
});
