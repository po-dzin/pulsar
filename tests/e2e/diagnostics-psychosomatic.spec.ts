import { expect, test } from "@playwright/test";

const hasPreAuth = process.env.E2E_AUTHENTICATED === "1";

test.describe("Psychosomatic diagnostics flow", () => {
  test.skip(!hasPreAuth, "Requires pre-authenticated OAuth session in test environment.");

  test("consent is required before test start", async ({ page }) => {
    await page.goto("/diagnostics");

    // Expected state: user already authenticated in test env.
    await expect(page.getByTestId("consent-checkbox")).toBeVisible();
    await expect(page.getByTestId("start-psychotest-button")).toBeDisabled();

    await page.getByTestId("consent-checkbox").check();
    await expect(page.getByTestId("start-psychotest-button")).toBeEnabled();
  });

  test("user can complete test and see inline result", async ({ page }) => {
    await page.goto("/diagnostics");

    await page.getByTestId("consent-checkbox").check();
    await page.getByTestId("start-psychotest-button").click();

    // TODO: replace with deterministic answer strategy once UI is ready.
    for (let i = 0; i < 16; i += 1) {
      await page.getByTestId(`answer-option-${i}-0`).click();
      await page.getByTestId("question-next-button").click();
    }

    await expect(page.getByTestId("result-overall-pct")).toBeVisible();
    await expect(page.getByTestId("result-level")).toBeVisible();
    await expect(page.getByTestId("result-recommendations")).toBeVisible();
    await expect(page.getByTestId("cta-go-products")).toBeVisible();
  });
});
