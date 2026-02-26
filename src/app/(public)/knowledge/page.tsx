import Link from "next/link";
import { getViewContext } from "@/presentation/i18n/getViewContext";
import { PageScaffold } from "@/presentation/components/PageScaffold";
import { loadKbCatalog } from "@/presentation/content/loadKbCatalog";
import { loadKbCategories } from "@/presentation/content/loadKbCategories";
import { withLang } from "@/presentation/components/LocaleLinks";
import { createRuntime } from "@/infrastructure/repositories/factory/createRuntime";

export default async function KnowledgePage({
  searchParams,
}: {
  searchParams: Promise<{ lang?: string; category?: string }>;
}) {
  const params = await searchParams;
  const context = await getViewContext("/knowledge", params.lang);
  const runtime = await createRuntime().catch(() => null);
  const [articles, categories] = await Promise.all([
    loadKbCatalog(context.locale, runtime?.kbRepo),
    loadKbCategories(context.locale, runtime?.kbRepo),
  ]);
  const selectedCategory = params.category ?? "all";
  const filteredArticles =
    selectedCategory === "all"
      ? articles
      : articles.filter((article) => article.categoryId && categories.find((category) => category.slug === selectedCategory)?.id === article.categoryId);

  return (
    <PageScaffold
      locale={context.locale}
      dictionary={context.dictionary}
      pathname={context.pathname}
      isAuthenticated={Boolean(context.userId)}
      avatarUrl={context.avatarUrl}
      displayName={context.displayName}
    >
      <h1 className="page-title">{context.dictionary.knowledge.title}</h1>
      <p className="page-subtitle">{context.dictionary.knowledge.subtitle}</p>

      <div className="test-selector knowledge-category-tabs" style={{ marginTop: "var(--space-4)" }}>
        <Link
          href={withLang("/knowledge?category=all", context.locale)}
          className="test-selector-tab"
          data-active={selectedCategory === "all" || undefined}
          data-testid="knowledge-category-all"
        >
          {context.locale === "ru" ? "Все категории" : "All categories"}
        </Link>
        {categories.map((category) => (
          <Link
            key={category.id}
            href={withLang(`/knowledge?category=${category.slug}`, context.locale)}
            className="test-selector-tab"
            data-active={selectedCategory === category.slug || undefined}
            data-testid={`knowledge-category-${category.slug}`}
          >
            {category.title}
          </Link>
        ))}
      </div>

      <div className="grid cols-2">
        {filteredArticles.map((article) => (
          <Link
            href={withLang(`/knowledge/${article.slug}`, context.locale)}
            key={article.slug}
            className="card card-interactive"
            data-testid={`knowledge-card-${article.slug}`}
          >
            <article>
              <h3>{article.title}</h3>
              <p className="muted">{article.excerpt}</p>
              <span className="button button-primary" style={{ display: 'inline-flex', marginTop: '16px' }}>
                {context.dictionary.knowledge.open}
              </span>
            </article>
          </Link>
        ))}
        {filteredArticles.length === 0 ? <p className="muted">{context.locale === "ru" ? "Материалов пока нет." : "No articles yet."}</p> : null}
      </div>
    </PageScaffold>
  );
}
