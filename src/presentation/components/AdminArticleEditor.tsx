"use client";

import { useMemo, useState } from "react";
import type { KbArticleInput, KbArticleRow, KbArticleUpdate, KbCategoryRow } from "@/application/ports/repositories";

type AdminArticleEditorProps = {
  mode: "create" | "edit";
  categories: KbCategoryRow[];
  initialArticle?: KbArticleRow;
  onSave: (updated: KbArticleInput | KbArticleUpdate) => Promise<void>;
  onCancel: () => void;
};

type PreviewLocale = "ru" | "en";

export const AdminArticleEditor = ({ mode, categories, initialArticle, onSave, onCancel }: AdminArticleEditorProps) => {
  const [data, setData] = useState({
    categoryId: initialArticle?.categoryId ?? categories[0]?.id ?? "",
    slug: initialArticle?.slug ?? "",
    titleRu: initialArticle?.titleRu ?? "",
    titleEn: initialArticle?.titleEn ?? "",
    excerptRu: initialArticle?.excerptRu ?? "",
    excerptEn: initialArticle?.excerptEn ?? "",
    contentRu: initialArticle?.contentRu ?? "",
    contentEn: initialArticle?.contentEn ?? "",
    isPublished: initialArticle?.isPublished ?? false,
  });
  const [busy, setBusy] = useState(false);
  const [previewLocale, setPreviewLocale] = useState<PreviewLocale>("ru");
  const [previewHtml, setPreviewHtml] = useState<string>("");
  const [previewBusy, setPreviewBusy] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);

  const title = useMemo(() => {
    if (mode === "create") {
      return "Create article";
    }
    return `Editing: ${initialArticle?.slug ?? "article"}`;
  }, [mode, initialArticle?.slug]);

  const handlePreview = async () => {
    setPreviewBusy(true);
    setPreviewError(null);
    const content = previewLocale === "ru" ? data.contentRu : data.contentEn;
    if (content.trim().length < 1) {
      setPreviewBusy(false);
      setPreviewError("Content is empty for selected locale.");
      return;
    }

    try {
      const response = await fetch("/api/admin/content/articles/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      const result = await response.json();
      if (response.ok) {
        setPreviewHtml(result.html ?? "");
      } else {
        setPreviewError(typeof result?.error === "string" ? result.error : "Failed to render preview.");
      }
    } catch {
      setPreviewError("Failed to render preview.");
    } finally {
      setPreviewBusy(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveError(null);
    if (!data.categoryId) {
      setSaveError("Category is required.");
      return;
    }
    setBusy(true);
    try {
      await onSave(data);
    } catch (error) {
      setSaveError(error instanceof Error && error.message ? error.message : "Failed to save article.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="card" data-testid="admin-kb-editor">
      <h3>{title}</h3>
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "24px", marginTop: "24px" }}>
        <div style={{ display: "grid", gap: "12px", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
          <label className="field">
            <span>Category</span>
            <select
              className="select"
              value={data.categoryId}
              onChange={(e) => setData((prev) => ({ ...prev, categoryId: e.target.value }))}
              disabled={busy}
              data-testid="admin-kb-article-category-select"
              required
            >
              {categories.length === 0 ? (
                <option value="">No categories available</option>
              ) : null}
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.titleRu} / {category.titleEn}
                </option>
              ))}
            </select>
          </label>

          <label className="field">
            <span>Slug</span>
            <input
              type="text"
              className="input"
              value={data.slug}
              onChange={(e) => setData((prev) => ({ ...prev, slug: e.target.value.trim().toLowerCase().replace(/\s+/g, "-") }))}
              disabled={busy}
              data-testid="admin-kb-article-slug-input"
              required
            />
          </label>

          <label className="field" style={{ alignSelf: "end" }}>
            <span>Publish state</span>
            <select
              className="select"
              value={String(data.isPublished)}
              onChange={(e) => setData((prev) => ({ ...prev, isPublished: e.target.value === "true" }))}
              disabled={busy}
              data-testid="admin-kb-article-publish-select"
            >
              <option value="false">Draft</option>
              <option value="true">Published</option>
            </select>
          </label>
        </div>

        <div style={{ display: "grid", gap: "16px", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))" }}>
          <label className="field">
            <span>Title (RU)</span>
            <input
              type="text"
              className="input"
              value={data.titleRu}
              onChange={(e) => setData((prev) => ({ ...prev, titleRu: e.target.value }))}
              disabled={busy}
              data-testid="admin-kb-article-title-ru-input"
              required
            />
          </label>
          <label className="field">
            <span>Title (EN)</span>
            <input
              type="text"
              className="input"
              value={data.titleEn}
              onChange={(e) => setData((prev) => ({ ...prev, titleEn: e.target.value }))}
              disabled={busy}
              data-testid="admin-kb-article-title-en-input"
              required
            />
          </label>
          <label className="field">
            <span>Excerpt (RU)</span>
            <textarea
              className="textarea"
              value={data.excerptRu}
              onChange={(e) => setData((prev) => ({ ...prev, excerptRu: e.target.value }))}
              style={{ minHeight: "96px" }}
              disabled={busy}
              data-testid="admin-kb-article-excerpt-ru-input"
              required
            />
          </label>
          <label className="field">
            <span>Excerpt (EN)</span>
            <textarea
              className="textarea"
              value={data.excerptEn}
              onChange={(e) => setData((prev) => ({ ...prev, excerptEn: e.target.value }))}
              style={{ minHeight: "96px" }}
              disabled={busy}
              data-testid="admin-kb-article-excerpt-en-input"
              required
            />
          </label>
        </div>

        <div style={{ display: "grid", gap: "16px", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))" }}>
          <label className="field">
            <span>Content Markdown (RU)</span>
            <textarea
              className="textarea"
              value={data.contentRu}
              onChange={(e) => setData((prev) => ({ ...prev, contentRu: e.target.value }))}
              style={{ minHeight: "320px", fontFamily: "monospace" }}
              disabled={busy}
              data-testid="admin-kb-article-content-ru-input"
              required
            />
          </label>
          <label className="field">
            <span>Content Markdown (EN)</span>
            <textarea
              className="textarea"
              value={data.contentEn}
              onChange={(e) => setData((prev) => ({ ...prev, contentEn: e.target.value }))}
              style={{ minHeight: "320px", fontFamily: "monospace" }}
              disabled={busy}
              data-testid="admin-kb-article-content-en-input"
              required
            />
          </label>
        </div>

        <section className="card" style={{ padding: "20px" }}>
          <div style={{ display: "flex", gap: "10px", alignItems: "center", marginBottom: "12px" }}>
            <strong>Preview</strong>
            <select
              className="select"
              value={previewLocale}
              onChange={(e) => setPreviewLocale(e.target.value as PreviewLocale)}
              style={{ maxWidth: "130px" }}
              disabled={previewBusy}
              data-testid="admin-kb-preview-locale-select"
            >
              <option value="ru">RU</option>
              <option value="en">EN</option>
            </select>
            <button
              type="button"
              className="button button-muted"
              onClick={handlePreview}
              disabled={previewBusy}
              data-testid="admin-kb-preview-render-button"
            >
              {previewBusy ? "Rendering..." : "Render preview"}
            </button>
          </div>

          <article className="prose" dangerouslySetInnerHTML={{ __html: previewHtml }} data-testid="admin-kb-preview-content" />
          {previewError ? <p className="muted" style={{ marginTop: "10px" }}>{previewError}</p> : null}
        </section>

        <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
          <button type="button" className="button button-muted" onClick={onCancel} disabled={busy} data-testid="admin-kb-article-cancel-button">
            Cancel
          </button>
          <button type="submit" className="button button-primary" disabled={busy} data-testid="admin-kb-article-save-button">
            {busy ? "Saving..." : mode === "create" ? "Create article" : "Save changes"}
          </button>
        </div>
        {saveError ? <p className="muted" style={{ margin: 0 }}>{saveError}</p> : null}
      </form>
    </section>
  );
};
