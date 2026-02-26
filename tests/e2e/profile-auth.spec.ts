import { expect, test } from "@playwright/test";

const hasPreAuth = process.env.E2E_AUTHENTICATED === "1" && Boolean(process.env.E2E_STORAGE_STATE);

test.describe("Authenticated profile flow", () => {
  test.skip(!hasPreAuth, "Requires pre-authenticated OAuth session in test environment.");

  test("user opens profile from menu and sees history filters", async ({ page }) => {
    await page.goto("/?lang=en");

    if (test.info().project.name.includes("mobile")) {
      await page.getByTestId("burger-toggle").click();
      await page.getByRole("link", { name: /profile/i }).first().click();
    } else {
      await page.locator("[data-testid='user-avatar-button']:visible").first().click();
      await page.getByRole("menuitem", { name: /profile/i }).click();
    }
    await expect(page).toHaveURL(/\/profile\?lang=en$/);

    await expect(page.getByTestId("profile-filter-all")).toBeVisible();
    await expect(page.getByTestId("profile-filter-psychosomatic")).toBeVisible();
    await expect(page.getByTestId("profile-filter-physical")).toBeVisible();
  });

  test("pending guest psychosomatic attempt is restored and can be viewed in profile", async ({ page }) => {
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

    await page.goto("/profile?lang=en");
    await expect(page.locator("[data-testid^='profile-history-card-']").first()).toBeVisible();
  });

  test("profile can display both test types and download result PDF", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name.includes("mobile"), "PDF download assertion is desktop-only.");

    await page.goto("/diagnostics?lang=en");

    const seed = await page.evaluate(async () => {
      const psychoAnswers = Array.from({ length: 16 }, (_, idx) => [`q${idx + 1}`, "none"] as const).reduce(
        (acc, [key, value]) => ({ ...acc, [key]: value }),
        {} as Record<string, string>
      );

      const psychoRes = await fetch("/api/diagnostics/psychosomatic/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: crypto.randomUUID(),
          answers: psychoAnswers,
          consentAcceptedAt: new Date().toISOString(),
        }),
      });

      const physicalRes = await fetch("/api/diagnostics/physical/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: crypto.randomUUID(),
          answers: {
            stange_sec: "70",
            genchi_sec: "35",
            ruffier_p1: "70",
            ruffier_p2: "110",
            ruffier_p3: "80",
            leg_swings_bpm: "140",
            age_years: "35",
            plank_sec: "65",
            wall_sit_sec: "70",
            forward_bend_level: "3",
            shoulders_right_level: "3",
            shoulders_left_level: "3",
            dynamic_right_sec: "50",
            dynamic_left_sec: "48",
            static_right_sec: "32",
            static_left_sec: "28",
          },
          consentAcceptedAt: new Date().toISOString(),
        }),
      });

      return {
        psychoStatus: psychoRes.status,
        physicalStatus: physicalRes.status,
      };
    });

    expect(seed.psychoStatus).toBe(200);
    expect(seed.physicalStatus).toBe(200);

    await page.goto("/profile?lang=en");

    await page.getByTestId("profile-filter-physical").click();
    await expect(page.locator("[data-testid^='profile-history-card-']").first()).toBeVisible();

    await page.getByTestId("profile-filter-all").click();
    await page.getByTestId("profile-history-toggle-0").click();

    await page.getByTestId("profile-download-0").click();
    await expect(page.getByTestId("profile-download-0")).toBeDisabled();
    await expect(page.getByTestId("profile-download-0")).toBeEnabled({ timeout: 30_000 });
  });
});
