import { expect, test } from "@playwright/test";

const hasPreAuth = process.env.E2E_AUTHENTICATED === "1" && Boolean(process.env.E2E_STORAGE_STATE);

test.describe("Admin KB content CRUD", () => {
  test.skip(!hasPreAuth, "Requires authenticated admin session in test environment.");

  test("admin creates, previews, publishes and deletes KB article", async ({ page }) => {
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
    await page.getByTestId("admin-kb-category-save-button").click();
    await expect(page.getByTestId("admin-toast").filter({ hasText: "Category created" })).toBeVisible();

    const extraCategorySlug = `e2e-kb-cat-alt-${stamp}`;
    await page.getByTestId("admin-kb-category-slug-input").fill(extraCategorySlug);
    await page.getByTestId("admin-kb-category-title-ru-input").fill(`${categoryTitleRu} Alt`);
    await page.getByTestId("admin-kb-category-title-en-input").fill(`${categoryTitleEn} Alt`);
    await page.getByTestId("admin-kb-category-save-button").click();
    await expect(page.getByTestId("admin-toast").filter({ hasText: "Category created" })).toBeVisible();

    const createdCategoryRow = page.locator("[data-testid^='admin-kb-category-row-']").filter({ hasText: categorySlug }).first();
    await createdCategoryRow.getByRole("button", { name: "Move category up" }).click();
    await expect(page.getByTestId("admin-toast").filter({ hasText: "Category order updated" })).toBeVisible();
    await createdCategoryRow.getByRole("button", { name: "Move category down" }).click();
    await expect(page.getByTestId("admin-toast").filter({ hasText: "Category order updated" })).toBeVisible();

    await page.getByTestId("admin-kb-tab-articles").click();
    await page.getByTestId("admin-kb-new-article-button").click();
    await expect(page.getByTestId("admin-kb-editor")).toBeVisible();

    await page.getByTestId("admin-kb-article-category-select").selectOption({ label: `${categoryTitleRu} / ${categoryTitleEn}` });
    await page.getByTestId("admin-kb-article-slug-input").fill(articleSlug);
    await page.getByTestId("admin-kb-article-title-ru-input").fill(articleTitleRu);
    await page.getByTestId("admin-kb-article-excerpt-ru-input").fill("Краткое описание E2E.");
    await page.getByTestId("admin-kb-article-content-ru-input").fill(`# ${articleTitleRu}\n\nТестовый RU контент.`);

    await page.getByTestId("admin-kb-editor-locale-en").click();
    await page.getByTestId("admin-kb-article-title-en-input").fill(articleTitleEn);
    await page.getByTestId("admin-kb-article-excerpt-en-input").fill("Short E2E excerpt.");
    await page.getByTestId("admin-kb-article-content-en-input").fill(`# ${articleTitleEn}\n\nTest EN content.`);

    await page.getByTestId("admin-kb-preview-render-button").click();
    await expect(page.getByTestId("admin-kb-preview-content")).toContainText("Test EN content");

    await page.getByTestId("admin-kb-article-publish-select").selectOption("true");
    await page.getByTestId("admin-kb-article-save-button").click();
    await expect(page.getByTestId("admin-toast").filter({ hasText: "Article created" })).toBeVisible();

    const row = page.locator("[data-testid^='admin-kb-article-row-']").filter({ hasText: articleTitleEn }).first();
    await expect(row).toBeVisible();
    await row.getByRole("button", { name: "Edit" }).click();

    await page.getByTestId("admin-kb-editor-locale-en").click();
    await page.getByTestId("admin-kb-article-content-en-input").fill(`# ${articleTitleEn}\n\nUpdated EN content.`);
    await page.getByTestId("admin-kb-article-save-button").click();
    await expect(page.getByTestId("admin-toast").filter({ hasText: "Article updated" })).toBeVisible();

    await page.goto("/knowledge?lang=en");
    await page.getByTestId(`knowledge-card-${articleSlug}`).click();
    await expect(page.getByTestId("knowledge-article-title")).toContainText(articleTitleEn);
    await expect(page.getByTestId("knowledge-article-content")).toContainText("Updated EN content");

    await page.goto("/admin/content?lang=en");
    const articleStatusSelect = page.getByTestId("admin-kb-article-status-select-0");
    await articleStatusSelect.selectOption("published");
    await expect(page.getByTestId("admin-toast").filter({ hasText: "Article status updated" })).toBeVisible();

    const deletedRow = page.locator("[data-testid^='admin-kb-article-row-']").filter({ hasText: articleTitleEn }).first();
    await deletedRow.getByRole("button", { name: "Delete" }).click();
    await page.getByTestId("confirm-dialog-confirm").click();
    await expect(page.getByTestId("admin-toast").filter({ hasText: "Article deleted" })).toBeVisible();

    await page.goto("/knowledge?lang=en");
    await expect(page.getByTestId(`knowledge-card-${articleSlug}`)).toHaveCount(0);
  });
});
