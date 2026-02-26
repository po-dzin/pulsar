import { expect, test } from "@playwright/test";

test.describe("Physical diagnostics flow", () => {
  test("progress updates only after Next test click", async ({ page }) => {
    await page.goto("/diagnostics?lang=en");

    await page.getByTestId("flow-tab-physical").click();
    await page.getByTestId("physical-consent-checkbox").check();
    await page.getByTestId("physical-start-button").click();

    await expect(page.getByTestId("physical-progress-label")).toHaveText("0%");
    await page.getByTestId("physical-input-stange_sec").fill("70");
    await expect(page.getByTestId("physical-progress-label")).toHaveText("0%");

    await page.getByTestId("physical-next-test-button").click();
    await expect(page.getByTestId("physical-progress-label")).toHaveText("10%");
  });

  test("full physical flow completes for guest and shows summary", async ({ page }) => {
    await page.goto("/diagnostics?lang=en");

    await page.getByTestId("flow-tab-physical").click();
    await expect(page.getByTestId("physical-full-intro")).toBeVisible();
    await page.getByTestId("physical-consent-checkbox").check();
    await page.getByTestId("physical-start-button").click();

    await page.getByTestId("physical-input-stange_sec").fill("70");
    await page.getByTestId("physical-next-test-button").click();
    await page.getByTestId("physical-input-genchi_sec").fill("35");
    await page.getByTestId("physical-next-test-button").click();
    await page.getByTestId("physical-input-ruffier_p1").fill("70");
    await page.getByTestId("physical-input-ruffier_p2").fill("110");
    await page.getByTestId("physical-input-ruffier_p3").fill("80");
    await page.getByTestId("physical-next-test-button").click();
    await page.getByTestId("physical-input-leg_swings_bpm").fill("140");
    await page.getByTestId("physical-input-age_years").fill("35");
    await page.getByTestId("physical-next-test-button").click();
    await page.getByTestId("physical-input-plank_sec").fill("65");
    await page.getByTestId("physical-next-test-button").click();
    await page.getByTestId("physical-input-wall_sit_sec").fill("70");
    await page.getByTestId("physical-next-test-button").click();
    await page.getByTestId("physical-scale-forward_bend_level-3").click();
    await page.getByTestId("physical-next-test-button").click();
    await page.getByTestId("physical-scale-shoulders_right_level-3").click();
    await page.getByTestId("physical-scale-shoulders_left_level-3").click();
    await page.getByTestId("physical-next-test-button").click();
    await page.getByTestId("physical-input-dynamic_right_sec").fill("50");
    await page.getByTestId("physical-input-dynamic_left_sec").fill("48");
    await page.getByTestId("physical-next-test-button").click();
    await page.getByTestId("physical-input-static_right_sec").fill("32");
    await page.getByTestId("physical-input-static_left_sec").fill("28");
    await page.getByTestId("physical-complete-button").click();

    await expect(page.getByTestId("physical-result-card")).toBeVisible();
    await expect(page.getByText(/Overall result:|Общий результат:/)).toBeVisible();
    await expect(page.getByTestId("physical-signin-button")).toBeVisible();
  });

  test("EN locale shows translated full test intro", async ({ page }) => {
    await page.goto("/diagnostics?lang=en");
    await page.getByTestId("flow-tab-physical").click();

    await expect(page.getByTestId("physical-full-intro")).toContainText("Single full test with 10 protocols across 5 categories");
    await expect(page.getByTestId("physical-start-button")).toContainText("Start full test");
  });
});
