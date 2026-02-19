"use client";

import { useEffect, useState } from "react";

type AdminArticle = {
  id: string;
  slug: string;
  titleRu: string;
  titleEn: string;
  isPublished: boolean;
};

export const AdminContentPanel = () => {
  const [articles, setArticles] = useState<AdminArticle[]>([]);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/content/articles")
      .then((res) => res.json())
      .then((data) => setArticles(data.articles ?? []));
  }, []);

  const toggle = async (article: AdminArticle) => {
    setBusyId(article.id);
    const nextState = !article.isPublished;
    const response = await fetch(`/api/admin/content/articles/${article.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isPublished: nextState }),
    });

    if (response.ok) {
      setArticles((prev) =>
        prev.map((current) =>
          current.id === article.id
            ? {
                ...current,
                isPublished: nextState,
              }
            : current
        )
      );
    }

    setBusyId(null);
  };

  return (
    <section className="card" data-testid="admin-kb-content-table">
      <h3>Content management</h3>
      <div className="list">
        {articles.map((article, index) => (
          <div key={article.id} className="answer-option">
            <div>
              <strong>{article.titleRu}</strong>
              <p className="muted">{article.titleEn}</p>
              <p className="muted">/{article.slug}</p>
            </div>
            <button
              type="button"
              className={article.isPublished ? "button button-muted" : "button button-primary"}
              onClick={() => toggle(article)}
              disabled={busyId === article.id}
              data-testid={`admin-content-toggle-${index}`}
            >
              {article.isPublished ? "Published" : "Draft"}
            </button>
          </div>
        ))}
        {articles.length === 0 ? <p className="muted">No KB articles yet.</p> : null}
      </div>
    </section>
  );
};
