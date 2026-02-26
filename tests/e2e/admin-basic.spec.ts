import { expect, test } from "@playwright/test";

const hasPreAuth = process.env.E2E_AUTHENTICATED === "1" && Boolean(process.env.E2E_STORAGE_STATE);

test.describe("Admin basic contour", () => {
  test.skip(!hasPreAuth, "Requires authenticated admin session in test environment.");

  test("admin sees leads and unified user activity blocks", async ({ page }) => {
    // Expected state: admin-authenticated context in test env.
    await page.goto("/admin");

    await expect(page.getByTestId("admin-user-activity-table")).toBeVisible();

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

  test("admin mobile user cards can be expanded", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/admin");

    const list = page.getByTestId("admin-user-activity-mobile-list");
    await expect(list).toBeVisible();

    const firstCard = list.locator(".admin-mobile-card").first();
    await expect(firstCard).toBeVisible();
    await firstCard.getByRole("button", { name: /details/i }).click();
    await expect(firstCard.getByText(/latest tests/i)).toBeVisible();
  });
});
