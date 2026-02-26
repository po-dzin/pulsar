import { expect, test } from "@playwright/test";

const hasPreAuth = process.env.E2E_AUTHENTICATED === "1" && Boolean(process.env.E2E_STORAGE_STATE);

test.describe("Admin basic contour", () => {
  test.skip(!hasPreAuth, "Requires authenticated admin session in test environment.");

  test("admin sees leads and user progress blocks", async ({ page }) => {
    // Expected state: admin-authenticated context in test env.
    await page.goto("/admin");

    await expect(page.getByTestId("admin-users-table")).toBeVisible();
    await expect(page.getByTestId("admin-progress-table")).toBeVisible();

    await page.getByRole("button", { name: /leads/i }).click();
    await expect(page.getByTestId("admin-leads-table")).toBeVisible();

    await page.getByRole("button", { name: /content/i }).click();
    await expect(page.getByTestId("admin-kb-content-table")).toBeVisible();
  });

  test("admin can change lead status", async ({ page }) => {
    await page.goto("/admin/leads");

    await page.getByTestId("lead-status-select-0").selectOption("in_progress");
    await page.getByTestId("lead-status-save-0").click();

    await expect(page.getByTestId("lead-status-select-0")).toHaveValue("in_progress");
  });
});
