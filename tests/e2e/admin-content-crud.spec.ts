import { expect, test } from "@playwright/test";

const hasPreAuth = process.env.E2E_AUTHENTICATED === "1" && Boolean(process.env.E2E_STORAGE_STATE);

test.describe("Admin KB content CRUD", () => {
  test.skip(!hasPreAuth, "Requires authenticated admin session in test environment.");

  test("admin creates, previews, publishes and archives KB article", async ({ page }) => {
    const stamp = Date.now();
    const categorySlug = `e2e-kb-cat-${stamp}`;
    const articleSlug = `e2e-kb-article-${stamp}`;
    const categoryTitleRu = `E2E Категория ${stamp}`;
    const categoryTitleEn = `E2E Category ${stamp}`;
    const articleTitleRu = `E2E Статья ${stamp}`;
    const articleTitleEn = `E2E Article ${stamp}`;

    await page.goto("/admin/content?lang=en");
    await expect(page.getByTestId("admin-kb-content-table")).toBeVisible();

    await page.getByTestId("admin-kb-tab-categories").click();
    await page.getByTestId("admin-kb-category-slug-input").fill(categorySlug);
    await page.getByTestId("admin-kb-category-title-ru-input").fill(categoryTitleRu);
    await page.getByTestId("admin-kb-category-title-en-input").fill(categoryTitleEn);
    await page.getByTestId("admin-kb-category-sort-input").fill("900");
    await page.getByTestId("admin-kb-category-save-button").click();
    await expect(page.getByTestId("admin-kb-status")).toContainText("Category saved");

    await page.getByTestId("admin-kb-tab-articles").click();
    await page.getByTestId("admin-kb-new-article-button").click();
    await expect(page.getByTestId("admin-kb-editor")).toBeVisible();

    await page.getByTestId("admin-kb-article-category-select").selectOption({ label: `${categoryTitleRu} / ${categoryTitleEn}` });
    await page.getByTestId("admin-kb-article-slug-input").fill(articleSlug);
    await page.getByTestId("admin-kb-article-title-ru-input").fill(articleTitleRu);
    await page.getByTestId("admin-kb-article-title-en-input").fill(articleTitleEn);
    await page.getByTestId("admin-kb-article-excerpt-ru-input").fill("Краткое описание E2E.");
    await page.getByTestId("admin-kb-article-excerpt-en-input").fill("Short E2E excerpt.");
    await page.getByTestId("admin-kb-article-content-ru-input").fill(`# ${articleTitleRu}\n\nТестовый RU контент.`);
    await page.getByTestId("admin-kb-article-content-en-input").fill(`# ${articleTitleEn}\n\nTest EN content.`);

    await page.getByTestId("admin-kb-preview-locale-select").selectOption("en");
    await page.getByTestId("admin-kb-preview-render-button").click();
    await expect(page.getByTestId("admin-kb-preview-content")).toContainText("Test EN content");

    await page.getByTestId("admin-kb-article-publish-select").selectOption("true");
    await page.getByTestId("admin-kb-article-save-button").click();
    await expect(page.getByTestId("admin-kb-status")).toContainText("Article created");

    const row = page.locator("[data-testid^='admin-kb-article-row-']").filter({ hasText: articleTitleRu }).first();
    await expect(row).toBeVisible();
    await expect(row.getByRole("button", { name: "Published" })).toBeVisible();
    await row.getByRole("button", { name: "Edit" }).click();

    await page.getByTestId("admin-kb-article-content-en-input").fill(`# ${articleTitleEn}\n\nUpdated EN content.`);
    await page.getByTestId("admin-kb-article-save-button").click();
    await expect(page.getByTestId("admin-kb-status")).toContainText("Article updated");

    await page.goto("/knowledge?lang=en");
    await page.getByTestId(`knowledge-card-${articleSlug}`).click();
    await expect(page.getByTestId("knowledge-article-title")).toContainText(articleTitleEn);
    await expect(page.getByTestId("knowledge-article-content")).toContainText("Updated EN content");

    await page.goto("/admin/content?lang=en");
    const archivedRow = page.locator("[data-testid^='admin-kb-article-row-']").filter({ hasText: articleTitleRu }).first();
    await archivedRow.getByRole("button", { name: "Archive" }).click();
    await page.getByTestId("confirm-dialog-confirm").click();
    await expect(page.getByTestId("admin-kb-status")).toContainText("Article archived");

    await page.goto("/knowledge?lang=en");
    await expect(page.getByTestId(`knowledge-card-${articleSlug}`)).toHaveCount(0);
  });
});
