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
    await expect(page.getByTestId("products-primary-cta")).toBeVisible();

    await page.goto("/knowledge?lang=en");
    await expect(page.getByTestId("knowledge-primary-cta")).toBeVisible();

    await page.goto("/about?lang=en");
    await expect(page.getByRole("link", { name: /start diagnostics/i })).toBeVisible();
  });

  test("critical forms have accessible labels and focus flow", async ({ page }) => {
    await page.goto("/products?lang=en");

    await expect(page.getByLabel(/name/i)).toBeVisible();
    await expect(page.getByLabel(/contact/i)).toBeVisible();
    await expect(page.getByLabel(/help/i)).toBeVisible();

    await page.keyboard.press("Tab");
    const focusedTag = await page.evaluate(() => document.activeElement?.tagName ?? "");
    expect(focusedTag).not.toBe("BODY");
  });

  test("error messages explain next step", async ({ page }) => {
    await page.goto("/products?lang=en");

    await page.getByTestId("consultation-name-input").fill("User");
    await page.getByTestId("consultation-contact-input").fill("user@example.com");
    await page.getByTestId("consultation-message-input").fill("Need consultation");
    await page.getByTestId("consultation-form-submit").click();

    const error = page.getByTestId("consultation-error");
    await expect(error).toBeVisible();
    await expect(error).toContainText(/sign in|try again/i);
  });
});
