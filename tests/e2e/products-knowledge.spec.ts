import { expect, test } from "@playwright/test";

const hasPreAuth = process.env.E2E_AUTHENTICATED === "1" && Boolean(process.env.E2E_STORAGE_STATE);

test.describe("Products and knowledge base", () => {
  test("products page renders and guest submit shows friendly error", async ({ page }) => {
    test.skip(hasPreAuth, "Guest-specific assertion; skipped in authenticated run.");

    await page.goto("/products?lang=en");

    await expect(page.getByRole("heading", { name: /products and consultation/i })).toBeVisible();
    await expect(page.locator(".grid.cols-3 .card")).toHaveCount(3);

    await page.getByTestId("consultation-name-input").fill("Test User");
    await page.getByTestId("consultation-contact-input").fill("test@example.com");
    await page.getByTestId("consultation-message-input").fill("Need consultation");
    await page.getByTestId("consultation-form-submit").click();

    await expect(page.getByTestId("consultation-error")).toBeVisible();
  });

  test("authenticated user can submit consultation request", async ({ page }) => {
    test.skip(!hasPreAuth, "Requires pre-authenticated OAuth session in test environment.");

    await page.goto("/products?lang=en");

    await page.getByTestId("consultation-name-input").fill("Auth User");
    await page.getByTestId("consultation-contact-input").fill("auth@example.com");
    await page.getByTestId("consultation-message-input").fill(`E2E consultation ${Date.now()}`);
    await page.getByTestId("consultation-form-submit").click();

    await expect(page.getByTestId("consultation-success")).toBeVisible();
  });

  test("knowledge page opens article without runtime failure", async ({ page }) => {
    await page.goto("/knowledge?lang=en");
    const cards = page.locator("[data-testid^='knowledge-card-']");
    await expect(cards.first()).toBeVisible();

    const firstHref = await cards.first().getAttribute("href");
    expect(firstHref).toBeTruthy();
    await page.goto(firstHref!, { waitUntil: "domcontentloaded" });
    await expect(page.getByTestId("knowledge-article")).toBeVisible();
    await expect(page.getByTestId("knowledge-article-title")).toBeVisible();
    await expect(page.getByTestId("knowledge-article-content")).toBeVisible();
  });
});
