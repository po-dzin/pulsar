import { expect, test } from "@playwright/test";
import { expectNoCriticalA11yViolations } from "./utils/a11y";

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

    await expect(page.getByTestId("admin-pagination-prev")).toBeVisible();
    await expect(page.getByTestId("admin-pagination-next")).toBeVisible();
  });

  test("admin can change lead status", async ({ page }) => {
    await page.goto("/admin/leads");

    await page.getByTestId("lead-row-expand-chevron-0").click();
    await expect(page.locator("tr.admin-row-details").first()).toBeVisible();

    await page.getByTestId("lead-status-select-0").selectOption("in_progress");
    const toast = page.getByTestId("admin-toast").filter({ hasText: "Lead status updated" });
    await expect(toast).toBeVisible();
    await expect(page.getByTestId("lead-status-select-0")).toHaveValue("in_progress");

    const toastClose = page.locator("[data-testid^='admin-toast-close-']").first();
    await toastClose.click();
    await expect(toast).toHaveCount(0);

    await page.getByTestId("lead-status-select-0").selectOption("done");
    const autoDismissToast = page.getByTestId("admin-toast").filter({ hasText: "Lead status updated" });
    await expect(autoDismissToast).toBeVisible();
    await expect(autoDismissToast).toHaveCount(0, { timeout: 12_000 });
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

  test("admin has no critical a11y violations in key panels", async ({ page }) => {
    await page.goto("/admin");
    await expectNoCriticalA11yViolations(page, [".admin-page-inner"]);

    await page.goto("/admin/content?lang=en");
    await expectNoCriticalA11yViolations(page, ["[data-testid='admin-kb-content-table']"]);
  });
});
