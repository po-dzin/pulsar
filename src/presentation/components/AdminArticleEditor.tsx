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

type LocaleTab = "ru" | "en";

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
  const [localeTab, setLocaleTab] = useState<LocaleTab>("ru");
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

  const activeContent = localeTab === "ru" ? data.contentRu : data.contentEn;

  const handlePreview = async () => {
    setPreviewBusy(true);
    setPreviewError(null);
    if (activeContent.trim().length < 1) {
      setPreviewBusy(false);
      setPreviewError("Content is empty for selected locale.");
      return;
    }

    try {
      const response = await fetch("/api/admin/content/articles/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: activeContent }),
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

      <form onSubmit={handleSubmit} className="admin-editor-form">
        <div className="admin-editor-base-grid">
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
              {categories.length === 0 ? <option value="">No categories available</option> : null}
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

          <label className="field">
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

        <div className="test-selector" style={{ marginTop: 0 }}>
          <button
            type="button"
            className="test-selector-tab"
            data-active={localeTab === "ru" || undefined}
            onClick={() => setLocaleTab("ru")}
            data-testid="admin-kb-editor-locale-ru"
          >
            RU
          </button>
          <button
            type="button"
            className="test-selector-tab"
            data-active={localeTab === "en" || undefined}
            onClick={() => setLocaleTab("en")}
            data-testid="admin-kb-editor-locale-en"
          >
            EN
          </button>
        </div>

        {localeTab === "ru" ? (
          <div className="admin-editor-locale-grid">
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
              <span>Excerpt (RU)</span>
              <textarea
                className="textarea"
                value={data.excerptRu}
                onChange={(e) => setData((prev) => ({ ...prev, excerptRu: e.target.value }))}
                disabled={busy}
                data-testid="admin-kb-article-excerpt-ru-input"
                required
              />
            </label>
            <label className="field admin-editor-content-field">
              <span>Content Markdown (RU)</span>
              <textarea
                className="textarea admin-editor-content"
                value={data.contentRu}
                onChange={(e) => setData((prev) => ({ ...prev, contentRu: e.target.value }))}
                disabled={busy}
                data-testid="admin-kb-article-content-ru-input"
                required
              />
            </label>
          </div>
        ) : (
          <div className="admin-editor-locale-grid">
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
              <span>Excerpt (EN)</span>
              <textarea
                className="textarea"
                value={data.excerptEn}
                onChange={(e) => setData((prev) => ({ ...prev, excerptEn: e.target.value }))}
                disabled={busy}
                data-testid="admin-kb-article-excerpt-en-input"
                required
              />
            </label>
            <label className="field admin-editor-content-field">
              <span>Content Markdown (EN)</span>
              <textarea
                className="textarea admin-editor-content"
                value={data.contentEn}
                onChange={(e) => setData((prev) => ({ ...prev, contentEn: e.target.value }))}
                disabled={busy}
                data-testid="admin-kb-article-content-en-input"
                required
              />
            </label>
          </div>
        )}

        <section className="card admin-editor-preview-card">
          <div className="admin-editor-preview-head">
            <strong>Preview ({localeTab.toUpperCase()})</strong>
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
          {previewError ? <p className="muted">{previewError}</p> : null}
        </section>

        <div className="admin-editor-actions">
          <button type="button" className="button button-muted" onClick={onCancel} disabled={busy} data-testid="admin-kb-article-cancel-button">
            Cancel
          </button>
          <button type="submit" className="button button-primary" disabled={busy} data-testid="admin-kb-article-save-button">
            {busy ? "Saving..." : mode === "create" ? "Create article" : "Save changes"}
          </button>
        </div>

        {saveError ? <p className="muted">{saveError}</p> : null}
      </form>
    </section>
  );
};
