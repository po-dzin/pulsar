import { expect, test } from "@playwright/test";

const hasPreAuth = process.env.E2E_AUTHENTICATED === "1" && Boolean(process.env.E2E_STORAGE_STATE);

test.describe("Psychosomatic diagnostics flow", () => {
  test("guest sees auth-required gate before psychosomatic start", async ({ page }) => {
    test.skip(hasPreAuth, "Guest-specific assertion; skipped in authenticated run.");

    await page.goto("/diagnostics");
    await expect(page.getByTestId("start-psychotest-button")).toBeVisible();
    await expect(page.getByTestId("consent-checkbox")).toHaveCount(0);
    await expect(
      page.getByText(/войдите в систему, чтобы начать тест\.?|sign in to start the test\.?/i)
    ).toBeVisible();
  });

  test("consent is required before test start for authenticated user", async ({ page }) => {
    test.skip(!hasPreAuth, "Requires pre-authenticated OAuth session in test environment.");

    await page.goto("/diagnostics");
    await expect(page.getByTestId("consent-checkbox")).toBeVisible();
    await expect(page.getByTestId("start-psychotest-button")).toBeDisabled();

    await page.getByTestId("consent-checkbox").check();
    await expect(page.getByTestId("start-psychotest-button")).toBeEnabled();
  });

  test("restart button returns to pre-start state", async ({ page }) => {
    test.skip(!hasPreAuth, "Requires pre-authenticated OAuth session in test environment.");

    await page.goto("/diagnostics");

    await page.getByTestId("consent-checkbox").check();
    await page.getByTestId("start-psychotest-button").click();

    for (let i = 0; i < 16; i += 1) {
      await page.getByTestId(`answer-option-${i}-0`).click();
    }

    await page.getByTestId("question-next-button").click();
    await expect(page.getByTestId("result-card")).toBeVisible();

    // Click restart
    await page.getByTestId("restart-button").click();
    await expect(page.getByTestId("consent-checkbox")).toBeVisible();
  });

  test("authenticated user restores pending guest attempt and saves it", async ({ page }) => {
    test.skip(!hasPreAuth, "Requires pre-authenticated OAuth session in test environment.");

    await page.goto("/diagnostics?lang=en");

    await page.evaluate(() => {
      const answers = Array.from({ length: 16 }, (_, idx) => [`q${idx + 1}`, "none"] as const).reduce(
        (acc, [key, value]) => ({ ...acc, [key]: value }),
        {} as Record<string, string>
      );

      window.localStorage.setItem(
        "impulse_psychosomatic_pending_v1",
        JSON.stringify({
          sessionId: crypto.randomUUID(),
          answers,
          consentAcceptedAt: new Date().toISOString(),
          completedAt: new Date().toISOString(),
        })
      );
    });

    await page.reload();

    await expect(page.getByTestId("result-card")).toBeVisible();
    const pending = await page.evaluate(() => window.localStorage.getItem("impulse_psychosomatic_pending_v1"));
    expect(pending).toBeNull();
  });
});
