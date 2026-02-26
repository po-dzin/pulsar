"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ConfirmDialog } from "@/presentation/components/ConfirmDialog";
import { AdminArticleEditor } from "@/presentation/components/AdminArticleEditor";
import type { KbArticleInput, KbArticleRow, KbCategoryInput, KbCategoryRow } from "@/application/ports/repositories";

type Tab = "articles" | "categories";

type ConfirmState =
  | { type: "archive-article"; article: KbArticleRow }
  | { type: "archive-category"; category: KbCategoryRow }
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
      setStatus("Category saved.");
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

  const reorderCategory = async (index: number, direction: "up" | "down") => {
    const target = categories[index];
    const swapWith = direction === "up" ? categories[index - 1] : categories[index + 1];
    if (!target || !swapWith) return;

    setBusy(true);
    setStatus(null);
    try {
      const [targetResponse, swapResponse] = await Promise.all([
        fetch(`/api/admin/content/categories/${target.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sortOrder: swapWith.sortOrder }),
        }),
        fetch(`/api/admin/content/categories/${swapWith.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sortOrder: target.sortOrder }),
        }),
      ]);
      await Promise.all([
        ensureOk(targetResponse, "Failed to reorder category"),
        ensureOk(swapResponse, "Failed to reorder category"),
      ]);
      await load();
      setStatus("Category order updated.");
    } catch (error) {
      setStatus(getErrorMessage(error, "Failed to reorder category."));
    } finally {
      setBusy(false);
    }
  };

  const archiveCategory = async (id: string) => {
    setBusy(true);
    setStatus(null);
    try {
      const response = await fetch(`/api/admin/content/categories/${id}`, { method: "DELETE" });
      await ensureOk(response, "Failed to archive category");
      await load();
      setStatus("Category archived.");
    } catch (error) {
      setStatus(getErrorMessage(error, "Failed to archive category."));
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

  const setArticlePublished = async (id: string, isPublished: boolean) => {
    try {
      await updateArticle(id, { isPublished });
    } catch {
      // Status is already set inside updateArticle.
    }
  };

  const archiveArticle = async (id: string) => {
    setBusy(true);
    setStatus(null);
    try {
      const response = await fetch(`/api/admin/content/articles/${id}`, { method: "DELETE" });
      await ensureOk(response, "Failed to archive article");
      await load();
      setStatus("Article archived.");
    } catch (error) {
      setStatus(getErrorMessage(error, "Failed to archive article."));
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
      {confirmState?.type === "archive-article" ? (
        <ConfirmDialog
          title="Archive article?"
          body={`"${confirmState.article.titleEn}" will be hidden from public knowledge base.`}
          confirmLabel="Archive"
          cancelLabel="Cancel"
          onConfirm={async () => {
            const article = confirmState.article;
            setConfirmState(null);
            await archiveArticle(article.id);
          }}
          onCancel={() => setConfirmState(null)}
        />
      ) : null}

      {confirmState?.type === "archive-category" ? (
        <ConfirmDialog
          title="Archive category?"
          body={`"${confirmState.category.titleEn}" will be hidden from category list.`}
          confirmLabel="Archive"
          cancelLabel="Cancel"
          onConfirm={async () => {
            const category = confirmState.category;
            setConfirmState(null);
            await archiveCategory(category.id);
          }}
          onCancel={() => setConfirmState(null)}
        />
      ) : null}

      <section className="card" data-testid="admin-kb-content-table">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "18px" }}>
          <h3 style={{ margin: 0 }}>Content management</h3>
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
        {status ? <p className="muted" style={{ marginTop: 0 }} data-testid="admin-kb-status">{status}</p> : null}

        <div className="test-selector" style={{ marginTop: 0 }}>
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
          <div className="list" style={{ marginTop: "12px" }}>
            {articles.map((article, index) => (
              <div
                key={article.id}
                className="answer-option"
                style={{ justifyContent: "space-between", alignItems: "center" }}
                data-testid={`admin-kb-article-row-${index}`}
              >
                <div>
                  <strong>{article.titleRu}</strong>
                  <p className="muted" style={{ margin: "6px 0" }}>/ {article.slug}</p>
                  <p className="muted" style={{ margin: 0 }}>
                    {categoryById.get(article.categoryId)?.titleRu ?? "Unknown category"}
                  </p>
                </div>
                <div className="inline-row" style={{ justifyContent: "flex-end" }}>
                  <button
                    type="button"
                    className={article.isPublished ? "button button-muted" : "button button-primary"}
                    onClick={() => setArticlePublished(article.id, !article.isPublished)}
                    disabled={busy}
                    data-testid={`admin-content-toggle-${index}`}
                  >
                    {article.isPublished ? "Published" : "Draft"}
                  </button>
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
                    onClick={() => setConfirmState({ type: "archive-article", article })}
                    disabled={busy}
                    data-testid={`admin-kb-article-archive-${index}`}
                  >
                    Archive
                  </button>
                </div>
              </div>
            ))}
            {articles.length === 0 ? <p className="muted">No articles yet.</p> : null}
          </div>
        ) : null}

        {tab === "categories" ? (
          <div className="list" style={{ marginTop: "12px" }}>
            <div className="card" style={{ padding: "16px" }}>
              <h4 style={{ marginTop: 0 }}>Create category</h4>
              <div style={{ display: "grid", gap: "10px", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))" }}>
                <input
                  className="input"
                  placeholder="slug"
                  value={newCategory.slug}
                  onChange={(e) => setNewCategory((prev) => ({ ...prev, slug: e.target.value.trim().toLowerCase().replace(/\s+/g, "-") }))}
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
              </div>
              <div style={{ marginTop: "10px" }}>
                <button
                  type="button"
                  className="button button-primary"
                  onClick={saveCategory}
                  disabled={busy || !newCategory.slug || !newCategory.titleRu || !newCategory.titleEn}
                  data-testid="admin-kb-category-save-button"
                >
                  Save category
                </button>
              </div>
            </div>

            {categories.map((category, index) => (
              <div
                key={category.id}
                className="answer-option"
                style={{ justifyContent: "space-between", alignItems: "center" }}
                data-testid={`admin-kb-category-row-${index}`}
              >
                <div style={{ display: "grid", gap: "8px", width: "100%", maxWidth: "560px" }}>
                  <strong>{category.slug}</strong>
                  <div style={{ display: "grid", gap: "8px", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))" }}>
                    <input
                      className="input"
                      value={category.titleRu}
                      onChange={(e) => setCategories((prev) => prev.map((item) => item.id === category.id ? { ...item, titleRu: e.target.value } : item))}
                      data-testid={`admin-kb-category-title-ru-${index}`}
                    />
                    <input
                      className="input"
                      value={category.titleEn}
                      onChange={(e) => setCategories((prev) => prev.map((item) => item.id === category.id ? { ...item, titleEn: e.target.value } : item))}
                      data-testid={`admin-kb-category-title-en-${index}`}
                    />
                  </div>
                </div>

                <div className="inline-row" style={{ justifyContent: "flex-end" }}>
                  <button
                    type="button"
                    className="button button-muted"
                    onClick={() => reorderCategory(index, "up")}
                    disabled={busy || index === 0}
                    data-testid={`admin-kb-category-up-${index}`}
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    className="button button-muted"
                    onClick={() => reorderCategory(index, "down")}
                    disabled={busy || index === categories.length - 1}
                    data-testid={`admin-kb-category-down-${index}`}
                  >
                    ↓
                  </button>
                  <button
                    type="button"
                    className="button button-primary"
                    onClick={() => updateCategory(category.id, { titleRu: category.titleRu, titleEn: category.titleEn })}
                    disabled={busy}
                    data-testid={`admin-kb-category-save-${index}`}
                  >
                    Save
                  </button>
                  <button
                    type="button"
                    className="button button-danger"
                    onClick={() => setConfirmState({ type: "archive-category", category })}
                    disabled={busy}
                    data-testid={`admin-kb-category-archive-${index}`}
                  >
                    Archive
                  </button>
                </div>
              </div>
            ))}
            {categories.length === 0 ? <p className="muted">No categories yet.</p> : null}
          </div>
        ) : null}
      </section>
    </>
  );
};
