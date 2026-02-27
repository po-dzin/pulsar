"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ConfirmDialog } from "@/presentation/components/ConfirmDialog";
import { AdminArticleEditor } from "@/presentation/components/AdminArticleEditor";
import { AdminMobileCard } from "@/presentation/components/admin/AdminMobileCard";
import { AdminTable } from "@/presentation/components/admin/AdminTable";
import { fetchAdminJson } from "@/presentation/components/admin/fetchAdminJson";
import { useAdminToasts } from "@/presentation/components/admin/useAdminToasts";
import type { KbArticleInput, KbArticleRow, KbCategoryInput, KbCategoryRow } from "@/application/ports/repositories";

type Tab = "articles" | "categories";

type ConfirmState =
  | { type: "delete-article"; article: KbArticleRow }
  | { type: "delete-category"; category: KbCategoryRow }
  | null;

const getErrorMessage = (error: unknown, fallback: string) =>
  error instanceof Error && error.message ? error.message : fallback;

const ensureOk = async (response: Response, fallbackMessage: string) => {
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = typeof body?.error === "string" ? body.error : fallbackMessage;
    throw new Error(message);
  }
  return body;
};

const formatDate = (value: string | null) => (value ? new Date(value).toLocaleString() : "—");

const ArrowIcon = ({ direction }: { direction: "up" | "down" }) => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {direction === "up" ? <polyline points="18 15 12 9 6 15" /> : <polyline points="6 9 12 15 18 9" />}
  </svg>
);

export const AdminContentPanel = () => {
  const { pushToast } = useAdminToasts();

  const [tab, setTab] = useState<Tab>("articles");
  const [categories, setCategories] = useState<KbCategoryRow[]>([]);
  const [articles, setArticles] = useState<KbArticleRow[]>([]);
  const [busy, setBusy] = useState(false);
  const [articleStatusSavingById, setArticleStatusSavingById] = useState<Record<string, boolean>>({});
  const [confirmState, setConfirmState] = useState<ConfirmState>(null);

  const [editorMode, setEditorMode] = useState<"list" | "create" | "edit">("list");
  const [editingArticleId, setEditingArticleId] = useState<string | null>(null);

  const [newCategory, setNewCategory] = useState<Pick<KbCategoryInput, "slug" | "titleRu" | "titleEn">>({
    slug: "",
    titleRu: "",
    titleEn: "",
  });

  const load = useCallback(async () => {
    const [categoriesResponse, articlesResponse] = await Promise.all([
      fetch("/api/admin/content/categories"),
      fetch("/api/admin/content/articles"),
    ]);
    const categoriesData = await ensureOk(categoriesResponse, "Failed to load categories");
    const articlesData = await ensureOk(articlesResponse, "Failed to load articles");
    setCategories(categoriesData.categories ?? []);
    setArticles(articlesData.articles ?? []);
  }, []);

  useEffect(() => {
    load().catch(() => {
      setCategories([]);
      setArticles([]);
      pushToast({
        type: "error",
        title: "Content",
        message: "Failed to load content data.",
      });
    });
  }, [load, pushToast]);

  const categoryById = useMemo(() => new Map(categories.map((category) => [category.id, category])), [categories]);
  const sortedCategories = useMemo(
    () => [...categories].sort((left, right) => (left.sortOrder - right.sortOrder) || left.slug.localeCompare(right.slug)),
    [categories]
  );

  const saveCategory = async () => {
    setBusy(true);
    try {
      const maxSortOrder = categories.reduce((max, item) => Math.max(max, item.sortOrder), 0);
      const sortOrder = maxSortOrder + 10;

      const response = await fetch("/api/admin/content/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...newCategory, sortOrder }),
      });
      await ensureOk(response, "Failed to create category");
      setNewCategory({ slug: "", titleRu: "", titleEn: "" });
      await load();
      pushToast({
        type: "success",
        title: "Categories",
        message: "Category created.",
      });
    } catch (error) {
      pushToast({
        type: "error",
        title: "Categories",
        message: getErrorMessage(error, "Failed to create category."),
      });
    } finally {
      setBusy(false);
    }
  };

  const updateCategory = async (id: string, updates: Partial<KbCategoryInput>) => {
    setBusy(true);
    try {
      const response = await fetch(`/api/admin/content/categories/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      await ensureOk(response, "Failed to update category");
      await load();
      pushToast({
        type: "success",
        title: "Categories",
        message: "Category updated.",
      });
    } catch (error) {
      pushToast({
        type: "error",
        title: "Categories",
        message: getErrorMessage(error, "Failed to update category."),
      });
    } finally {
      setBusy(false);
    }
  };

  const reorderCategory = async (index: number, direction: "up" | "down") => {
    const target = sortedCategories[index];
    const swapWith = direction === "up" ? sortedCategories[index - 1] : sortedCategories[index + 1];
    if (!target || !swapWith) {
      return;
    }

    const previousCategories = categories.map((category) => ({ ...category }));
    setCategories((prev) =>
      prev.map((category) => {
        if (category.id === target.id) {
          return { ...category, sortOrder: swapWith.sortOrder };
        }
        if (category.id === swapWith.id) {
          return { ...category, sortOrder: target.sortOrder };
        }
        return category;
      })
    );

    setBusy(true);
    try {
      await fetchAdminJson<{ ok: boolean }>(
        "/api/admin/content/categories/reorder",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            categoryId: target.id,
            swapWithCategoryId: swapWith.id,
          }),
        },
        "Failed to reorder category"
      );
      pushToast({
        type: "success",
        title: "Categories",
        message: "Category order updated.",
      });
    } catch (error) {
      setCategories(previousCategories);
      pushToast({
        type: "error",
        title: "Categories",
        message: getErrorMessage(error, "Failed to reorder category."),
      });
    } finally {
      setBusy(false);
    }
  };

  const deleteCategory = async (id: string) => {
    setBusy(true);
    try {
      const response = await fetch(`/api/admin/content/categories/${id}`, { method: "DELETE" });
      await ensureOk(response, "Failed to delete category");
      await load();
      pushToast({
        type: "success",
        title: "Categories",
        message: "Category deleted.",
      });
    } catch (error) {
      pushToast({
        type: "error",
        title: "Categories",
        message: getErrorMessage(error, "Failed to delete category."),
      });
    } finally {
      setBusy(false);
    }
  };

  const saveArticle = async (payload: KbArticleInput) => {
    setBusy(true);
    try {
      const response = await fetch("/api/admin/content/articles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      await ensureOk(response, "Failed to create article");
      setEditorMode("list");
      setEditingArticleId(null);
      await load();
      pushToast({
        type: "success",
        title: "Articles",
        message: "Article created.",
      });
    } catch (error) {
      const message = getErrorMessage(error, "Failed to create article.");
      pushToast({
        type: "error",
        title: "Articles",
        message,
      });
      throw error;
    } finally {
      setBusy(false);
    }
  };

  const updateArticle = async (id: string, payload: Partial<KbArticleInput>) => {
    setBusy(true);
    try {
      const response = await fetch(`/api/admin/content/articles/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      await ensureOk(response, "Failed to update article");
      setEditorMode("list");
      setEditingArticleId(null);
      await load();
      pushToast({
        type: "success",
        title: "Articles",
        message: "Article updated.",
      });
    } catch (error) {
      const message = getErrorMessage(error, "Failed to update article.");
      pushToast({
        type: "error",
        title: "Articles",
        message,
      });
      throw error;
    } finally {
      setBusy(false);
    }
  };

  const deleteArticle = async (id: string) => {
    setBusy(true);
    try {
      const response = await fetch(`/api/admin/content/articles/${id}`, { method: "DELETE" });
      await ensureOk(response, "Failed to delete article");
      await load();
      pushToast({
        type: "success",
        title: "Articles",
        message: "Article deleted.",
      });
    } catch (error) {
      pushToast({
        type: "error",
        title: "Articles",
        message: getErrorMessage(error, "Failed to delete article."),
      });
    } finally {
      setBusy(false);
    }
  };

  const updateArticlePublished = async (id: string, isPublished: boolean) => {
    setArticleStatusSavingById((prev) => ({ ...prev, [id]: true }));
    try {
      await fetchAdminJson<{ ok: boolean }>(
        `/api/admin/content/articles/${id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ isPublished }),
        },
        "Failed to update article status"
      );
      setArticles((prev) =>
        prev.map((article) =>
          article.id === id
            ? {
                ...article,
                isPublished,
                updatedAt: new Date().toISOString(),
              }
            : article
        )
      );
      pushToast({
        type: "success",
        title: "Articles",
        message: "Article status updated.",
      });
    } catch (error) {
      pushToast({
        type: "error",
        title: "Articles",
        message: getErrorMessage(error, "Failed to update article status."),
      });
    } finally {
      setArticleStatusSavingById((prev) => ({ ...prev, [id]: false }));
    }
  };

  const editingArticle = articles.find((article) => article.id === editingArticleId) ?? null;

  if (editorMode === "create") {
    return (
      <AdminArticleEditor
        mode="create"
        categories={categories.filter((category) => !category.isArchived)}
        onSave={(payload) => saveArticle(payload as KbArticleInput)}
        onCancel={() => {
          setEditorMode("list");
          setEditingArticleId(null);
        }}
      />
    );
  }

  if (editorMode === "edit" && editingArticle) {
    return (
      <AdminArticleEditor
        mode="edit"
        categories={categories.filter((category) => !category.isArchived)}
        initialArticle={editingArticle}
        onSave={(payload) => updateArticle(editingArticle.id, payload as Partial<KbArticleInput>)}
        onCancel={() => {
          setEditorMode("list");
          setEditingArticleId(null);
        }}
      />
    );
  }

  return (
    <>
      {confirmState?.type === "delete-article" ? (
        <ConfirmDialog
          title="Delete article?"
          body={`"${confirmState.article.titleEn}" will be permanently deleted.`}
          confirmLabel="Delete"
          cancelLabel="Cancel"
          onConfirm={async () => {
            const article = confirmState.article;
            setConfirmState(null);
            await deleteArticle(article.id);
          }}
          onCancel={() => setConfirmState(null)}
        />
      ) : null}

      {confirmState?.type === "delete-category" ? (
        <ConfirmDialog
          title="Delete category?"
          body={`"${confirmState.category.titleEn}" will be permanently deleted.`}
          confirmLabel="Delete"
          cancelLabel="Cancel"
          onConfirm={async () => {
            const category = confirmState.category;
            setConfirmState(null);
            await deleteCategory(category.id);
          }}
          onCancel={() => setConfirmState(null)}
        />
      ) : null}

      <section className="card" data-testid="admin-kb-content-table">
        <div className="admin-section-head">
          <h3>Content management</h3>
          {tab === "articles" ? (
            <button
              type="button"
              className="button button-primary admin-table-action-btn"
              onClick={() => setEditorMode("create")}
              disabled={busy}
              data-testid="admin-kb-new-article-button"
            >
              New article
            </button>
          ) : null}
        </div>

        <div className="test-selector">
          <button
            type="button"
            className="test-selector-tab"
            data-active={tab === "articles" || undefined}
            onClick={() => setTab("articles")}
            data-testid="admin-kb-tab-articles"
          >
            Articles
          </button>
          <button
            type="button"
            className="test-selector-tab"
            data-active={tab === "categories" || undefined}
            onClick={() => setTab("categories")}
            data-testid="admin-kb-tab-categories"
          >
            Categories
          </button>
        </div>

        {tab === "articles" ? (
          <>
            <div className="admin-desktop-only">
              <AdminTable
                columns={[
                  { key: "name", label: "Name" },
                  { key: "slug", label: "Slug" },
                  { key: "category", label: "Category" },
                  { key: "status", label: "Status" },
                  { key: "updated", label: "Updated" },
                  { key: "actions", label: "Actions", className: "admin-col-actions" },
                ]}
                hasRows={articles.length > 0}
                emptyMessage="No articles yet."
              >
                {articles.map((article, index) => (
                  <tr key={article.id} data-testid={`admin-kb-article-row-${index}`}>
                    <td><span className="admin-cell-ellipsis">{article.titleEn || article.titleRu}</span></td>
                    <td><span className="admin-cell-ellipsis">{article.slug}</span></td>
                    <td><span className="admin-cell-ellipsis">{categoryById.get(article.categoryId)?.titleEn ?? "Unknown category"}</span></td>
                    <td>
                      <select
                        className="select admin-table-control"
                        value={article.isPublished ? "published" : "draft"}
                        onChange={(event) => void updateArticlePublished(article.id, event.target.value === "published")}
                        disabled={busy || Boolean(articleStatusSavingById[article.id])}
                        data-testid={`admin-kb-article-status-select-${index}`}
                      >
                        <option value="draft">draft</option>
                        <option value="published">published</option>
                      </select>
                    </td>
                    <td><span className="admin-cell-ellipsis">{formatDate(article.updatedAt ?? article.publishedAt)}</span></td>
                    <td>
                      <div className="admin-row-actions">
                        <button
                          type="button"
                          className="button button-muted admin-table-action-btn"
                          onClick={() => {
                            setEditorMode("edit");
                            setEditingArticleId(article.id);
                          }}
                          disabled={busy}
                          data-testid={`admin-kb-article-edit-${index}`}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          className="button button-danger admin-table-action-btn"
                          onClick={() => setConfirmState({ type: "delete-article", article })}
                          disabled={busy}
                          data-testid={`admin-kb-article-delete-${index}`}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </AdminTable>
            </div>

            <div className="admin-mobile-only">
              <div className="admin-mobile-list">
                {articles.map((article, index) => (
                  <AdminMobileCard
                    key={article.id}
                    title={article.titleEn || article.titleRu}
                    subtitle={`/${article.slug}`}
                    expanded={false}
                    onToggle={() => {}}
                    showToggle={false}
                    actions={
                      <div className="admin-mobile-inline">
                        <select
                          className="select admin-table-control"
                          value={article.isPublished ? "published" : "draft"}
                          onChange={(event) => void updateArticlePublished(article.id, event.target.value === "published")}
                          disabled={busy || Boolean(articleStatusSavingById[article.id])}
                          data-testid={`admin-kb-article-status-select-mobile-${index}`}
                        >
                          <option value="draft">draft</option>
                          <option value="published">published</option>
                        </select>
                        <button
                          type="button"
                          className="button button-muted admin-table-action-btn"
                          onClick={() => {
                            setEditorMode("edit");
                            setEditingArticleId(article.id);
                          }}
                          disabled={busy}
                          data-testid={`admin-kb-article-edit-mobile-${index}`}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          className="button button-danger admin-table-action-btn"
                          onClick={() => setConfirmState({ type: "delete-article", article })}
                          disabled={busy}
                          data-testid={`admin-kb-article-delete-mobile-${index}`}
                        >
                          Delete
                        </button>
                      </div>
                    }
                  >
                    <p className="muted">Category: {categoryById.get(article.categoryId)?.titleEn ?? "Unknown category"}</p>
                    <p className="muted">Updated: {formatDate(article.updatedAt ?? article.publishedAt)}</p>
                  </AdminMobileCard>
                ))}
              </div>
            </div>
          </>
        ) : null}

        {tab === "categories" ? (
          <>
            <div className="admin-compact-form admin-compact-form-grid">
              <input
                className="input"
                placeholder="slug"
                value={newCategory.slug}
                onChange={(e) =>
                  setNewCategory((prev) => ({ ...prev, slug: e.target.value.trim().toLowerCase().replace(/\s+/g, "-") }))
                }
                data-testid="admin-kb-category-slug-input"
              />
              <input
                className="input"
                placeholder="Title RU"
                value={newCategory.titleRu}
                onChange={(e) => setNewCategory((prev) => ({ ...prev, titleRu: e.target.value }))}
                data-testid="admin-kb-category-title-ru-input"
              />
              <input
                className="input"
                placeholder="Title EN"
                value={newCategory.titleEn}
                onChange={(e) => setNewCategory((prev) => ({ ...prev, titleEn: e.target.value }))}
                data-testid="admin-kb-category-title-en-input"
              />
              <button
                type="button"
                className="button button-primary admin-table-action-btn"
                onClick={saveCategory}
                disabled={busy || !newCategory.slug || !newCategory.titleRu || !newCategory.titleEn}
                data-testid="admin-kb-category-save-button"
              >
                Create category
              </button>
            </div>

            <div className="admin-categories-table-block">
              <div className="admin-desktop-only">
                <AdminTable
                  columns={[
                    { key: "name", label: "Name" },
                    { key: "slug", label: "Slug" },
                    { key: "order", label: "Order" },
                    { key: "actions", label: "Actions", className: "admin-col-actions" },
                  ]}
                  hasRows={sortedCategories.length > 0}
                  emptyMessage="No categories yet."
                >
                  {sortedCategories.map((category, index) => (
                    <tr key={category.id} data-testid={`admin-kb-category-row-${index}`}>
                      <td>
                        <div className="admin-inline-edit-grid">
                          <input
                            className="input"
                            value={category.titleRu}
                            onChange={(e) =>
                              setCategories((prev) =>
                                prev.map((item) => (item.id === category.id ? { ...item, titleRu: e.target.value } : item))
                              )
                            }
                            data-testid={`admin-kb-category-title-ru-${index}`}
                          />
                          <input
                            className="input"
                            value={category.titleEn}
                            onChange={(e) =>
                              setCategories((prev) =>
                                prev.map((item) => (item.id === category.id ? { ...item, titleEn: e.target.value } : item))
                              )
                            }
                            data-testid={`admin-kb-category-title-en-${index}`}
                          />
                        </div>
                      </td>
                      <td><span className="admin-cell-ellipsis">{category.slug}</span></td>
                      <td>
                        <div className="admin-row-actions admin-row-actions-order">
                          <button
                            type="button"
                            className="button button-muted admin-table-action-btn admin-order-btn"
                            onClick={() => reorderCategory(index, "up")}
                            disabled={busy || index === 0}
                            aria-label="Move category up"
                            data-testid={`admin-category-move-up-${index}`}
                          >
                            <ArrowIcon direction="up" />
                          </button>
                          <button
                            type="button"
                            className="button button-muted admin-table-action-btn admin-order-btn"
                            onClick={() => reorderCategory(index, "down")}
                            disabled={busy || index === sortedCategories.length - 1}
                            aria-label="Move category down"
                            data-testid={`admin-category-move-down-${index}`}
                          >
                            <ArrowIcon direction="down" />
                          </button>
                        </div>
                      </td>
                      <td>
                        <div className="admin-row-actions">
                          <button
                            type="button"
                            className="button button-primary admin-table-action-btn"
                            onClick={() => updateCategory(category.id, { titleRu: category.titleRu, titleEn: category.titleEn })}
                            disabled={busy}
                            data-testid={`admin-kb-category-save-${index}`}
                          >
                            Save
                          </button>
                          <button
                            type="button"
                            className="button button-danger admin-table-action-btn"
                            onClick={() => setConfirmState({ type: "delete-category", category })}
                            disabled={busy}
                            data-testid={`admin-kb-category-delete-${index}`}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </AdminTable>
              </div>

              <div className="admin-mobile-only">
                <div className="admin-mobile-list">
                  {sortedCategories.map((category, index) => (
                    <AdminMobileCard
                      key={category.id}
                      title={category.titleEn}
                      subtitle={`/${category.slug}`}
                      expanded={false}
                      onToggle={() => {}}
                      showToggle={false}
                      actions={
                        <div className="admin-mobile-inline">
                          <button
                            type="button"
                            className="button button-muted admin-table-action-btn admin-order-btn"
                            onClick={() => reorderCategory(index, "up")}
                            disabled={busy || index === 0}
                            aria-label="Move category up"
                            data-testid={`admin-category-move-up-mobile-${index}`}
                          >
                            <ArrowIcon direction="up" />
                          </button>
                          <button
                            type="button"
                            className="button button-muted admin-table-action-btn admin-order-btn"
                            onClick={() => reorderCategory(index, "down")}
                            disabled={busy || index === sortedCategories.length - 1}
                            aria-label="Move category down"
                            data-testid={`admin-category-move-down-mobile-${index}`}
                          >
                            <ArrowIcon direction="down" />
                          </button>
                          <button
                            type="button"
                            className="button button-primary admin-table-action-btn"
                            onClick={() => updateCategory(category.id, { titleRu: category.titleRu, titleEn: category.titleEn })}
                            disabled={busy}
                            data-testid={`admin-kb-category-save-mobile-${index}`}
                          >
                            Save
                          </button>
                          <button
                            type="button"
                            className="button button-danger admin-table-action-btn"
                            onClick={() => setConfirmState({ type: "delete-category", category })}
                            disabled={busy}
                            data-testid={`admin-kb-category-delete-mobile-${index}`}
                          >
                            Delete
                          </button>
                        </div>
                      }
                    >
                      <p className="muted">Order: {index + 1}</p>
                    </AdminMobileCard>
                  ))}
                </div>
              </div>
            </div>
          </>
        ) : null}
      </section>
    </>
  );
};
