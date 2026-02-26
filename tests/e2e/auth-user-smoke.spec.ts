import { expect, test } from "@playwright/test";

const hasPreAuth = process.env.E2E_AUTHENTICATED === "1" && Boolean(process.env.E2E_STORAGE_STATE);

test.describe("Authenticated user smoke", () => {
  test.skip(!hasPreAuth, "Requires pre-authenticated OAuth session in test environment.");

  test("profile page is accessible and shows history controls", async ({ page }) => {
    await page.goto("/profile?lang=en");

    await expect(page.getByTestId("profile-filter-all")).toBeVisible();
    await expect(page.getByTestId("profile-filter-psychosomatic")).toBeVisible();
    await expect(page.getByTestId("profile-filter-physical")).toBeVisible();
  });
});
