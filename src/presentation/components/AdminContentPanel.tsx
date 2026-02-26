"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ConfirmDialog } from "@/presentation/components/ConfirmDialog";
import { AdminArticleEditor } from "@/presentation/components/AdminArticleEditor";
import { AdminMobileCard } from "@/presentation/components/admin/AdminMobileCard";
import { AdminStatusBadge } from "@/presentation/components/admin/AdminStatusBadge";
import { AdminTable } from "@/presentation/components/admin/AdminTable";
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

export const AdminContentPanel = () => {
  const [tab, setTab] = useState<Tab>("articles");
  const [categories, setCategories] = useState<KbCategoryRow[]>([]);
  const [articles, setArticles] = useState<KbArticleRow[]>([]);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [confirmState, setConfirmState] = useState<ConfirmState>(null);

  const [editorMode, setEditorMode] = useState<"list" | "create" | "edit">("list");
  const [editingArticleId, setEditingArticleId] = useState<string | null>(null);

  const [newCategory, setNewCategory] = useState<KbCategoryInput>({
    slug: "",
    titleRu: "",
    titleEn: "",
    sortOrder: 100,
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
      setStatus("Failed to load content data.");
    });
  }, [load]);

  const categoryById = useMemo(() => new Map(categories.map((category) => [category.id, category])), [categories]);

  const saveCategory = async () => {
    setBusy(true);
    setStatus(null);
    try {
      const response = await fetch("/api/admin/content/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newCategory),
      });
      await ensureOk(response, "Failed to create category");
      setNewCategory({ slug: "", titleRu: "", titleEn: "", sortOrder: 100 });
      await load();
      setStatus("Category created.");
    } catch (error) {
      setStatus(getErrorMessage(error, "Failed to create category."));
    } finally {
      setBusy(false);
    }
  };

  const updateCategory = async (id: string, updates: Partial<KbCategoryInput>) => {
    setBusy(true);
    setStatus(null);
    try {
      const response = await fetch(`/api/admin/content/categories/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      await ensureOk(response, "Failed to update category");
      await load();
      setStatus("Category updated.");
    } catch (error) {
      setStatus(getErrorMessage(error, "Failed to update category."));
    } finally {
      setBusy(false);
    }
  };

  const deleteCategory = async (id: string) => {
    setBusy(true);
    setStatus(null);
    try {
      const response = await fetch(`/api/admin/content/categories/${id}`, { method: "DELETE" });
      await ensureOk(response, "Failed to delete category");
      await load();
      setStatus("Category deleted.");
    } catch (error) {
      setStatus(getErrorMessage(error, "Failed to delete category."));
    } finally {
      setBusy(false);
    }
  };

  const saveArticle = async (payload: KbArticleInput) => {
    setBusy(true);
    setStatus(null);
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
      setStatus("Article created.");
    } catch (error) {
      const message = getErrorMessage(error, "Failed to create article.");
      setStatus(message);
      throw error;
    } finally {
      setBusy(false);
    }
  };

  const updateArticle = async (id: string, payload: Partial<KbArticleInput>) => {
    setBusy(true);
    setStatus(null);
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
      setStatus("Article updated.");
    } catch (error) {
      const message = getErrorMessage(error, "Failed to update article.");
      setStatus(message);
      throw error;
    } finally {
      setBusy(false);
    }
  };

  const deleteArticle = async (id: string) => {
    setBusy(true);
    setStatus(null);
    try {
      const response = await fetch(`/api/admin/content/articles/${id}`, { method: "DELETE" });
      await ensureOk(response, "Failed to delete article");
      await load();
      setStatus("Article deleted.");
    } catch (error) {
      setStatus(getErrorMessage(error, "Failed to delete article."));
    } finally {
      setBusy(false);
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
              className="button button-primary"
              onClick={() => setEditorMode("create")}
              disabled={busy}
              data-testid="admin-kb-new-article-button"
            >
              New article
            </button>
          ) : null}
        </div>
        {status ? <p className="muted" data-testid="admin-kb-status">{status}</p> : null}

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
                    <td>{article.titleEn || article.titleRu}</td>
                    <td>{article.slug}</td>
                    <td>{categoryById.get(article.categoryId)?.titleEn ?? "Unknown category"}</td>
                    <td>
                      <AdminStatusBadge label={article.isPublished ? "published" : "draft"} tone={article.isPublished ? "success" : "neutral"} />
                    </td>
                    <td>{formatDate(article.updatedAt ?? article.publishedAt)}</td>
                    <td>
                      <div className="admin-row-actions">
                        <button
                          type="button"
                          className="button button-muted"
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
                          className="button button-danger"
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
                        <AdminStatusBadge label={article.isPublished ? "published" : "draft"} tone={article.isPublished ? "success" : "neutral"} />
                        <button
                          type="button"
                          className="button button-muted"
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
                          className="button button-danger"
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
              <input
                className="input"
                type="number"
                placeholder="Sort"
                value={newCategory.sortOrder}
                onChange={(e) => setNewCategory((prev) => ({ ...prev, sortOrder: Number(e.target.value) }))}
                data-testid="admin-kb-category-sort-input"
              />
              <button
                type="button"
                className="button button-primary"
                onClick={saveCategory}
                disabled={busy || !newCategory.slug || !newCategory.titleRu || !newCategory.titleEn}
                data-testid="admin-kb-category-save-button"
              >
                Create category
              </button>
            </div>

            <div className="admin-desktop-only">
              <AdminTable
                columns={[
                  { key: "name", label: "Name" },
                  { key: "slug", label: "Slug" },
                  { key: "sort", label: "Sort" },
                  { key: "actions", label: "Actions", className: "admin-col-actions" },
                ]}
                hasRows={categories.length > 0}
                emptyMessage="No categories yet."
              >
                {categories.map((category, index) => (
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
                    <td>{category.slug}</td>
                    <td>{category.sortOrder}</td>
                    <td>
                      <div className="admin-row-actions">
                        <button
                          type="button"
                          className="button button-primary"
                          onClick={() => updateCategory(category.id, { titleRu: category.titleRu, titleEn: category.titleEn, sortOrder: category.sortOrder })}
                          disabled={busy}
                          data-testid={`admin-kb-category-save-${index}`}
                        >
                          Save
                        </button>
                        <button
                          type="button"
                          className="button button-danger"
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
                {categories.map((category, index) => (
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
                          className="button button-primary"
                          onClick={() => updateCategory(category.id, { titleRu: category.titleRu, titleEn: category.titleEn, sortOrder: category.sortOrder })}
                          disabled={busy}
                          data-testid={`admin-kb-category-save-mobile-${index}`}
                        >
                          Save
                        </button>
                        <button
                          type="button"
                          className="button button-danger"
                          onClick={() => setConfirmState({ type: "delete-category", category })}
                          disabled={busy}
                          data-testid={`admin-kb-category-delete-mobile-${index}`}
                        >
                          Delete
                        </button>
                      </div>
                    }
                  >
                    <p className="muted">Sort: {category.sortOrder}</p>
                  </AdminMobileCard>
                ))}
              </div>
            </div>
          </>
        ) : null}
      </section>
    </>
  );
};
