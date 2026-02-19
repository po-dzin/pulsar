import { expect, test } from "@playwright/test";

const publicRoutes = ["/", "/diagnostics", "/products", "/knowledge", "/about"];

test.describe("MVP public smoke", () => {
  for (const route of publicRoutes) {
    test(`route ${route} is reachable`, async ({ page }) => {
      await page.goto(route);
      await expect(page).toHaveURL(new RegExp(`${route === "/" ? "/$" : route}$`));
    });
  }

  test("footer has medical disclaimer", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText(/не медицинск|not a medical diagnosis/i)).toBeVisible();
  });

  test("diagnostics is accessible without auth; sign-in is optional for saving", async ({ page }) => {
    await page.goto("/diagnostics");
    await expect(page.getByTestId("consent-checkbox")).toBeVisible();
    await expect(page.getByTestId("google-auth-button")).toBeVisible();
  });

  test.skip("each key screen has one primary CTA in the first viewport", async () => {});
  test.skip("critical forms have accessible labels and visible focus states", async () => {});
  test.skip("error messages explain next step, not just failure state", async () => {});
});
