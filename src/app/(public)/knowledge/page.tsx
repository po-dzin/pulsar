import Link from "next/link";
import { getViewContext } from "@/presentation/i18n/getViewContext";
import { PageScaffold } from "@/presentation/components/PageScaffold";
import { loadKbCatalog } from "@/presentation/content/loadKbCatalog";
import { withLang } from "@/presentation/components/LocaleLinks";

export default async function KnowledgePage({
  searchParams,
}: {
  searchParams: Promise<{ lang?: string }>;
}) {
  const params = await searchParams;
  const context = await getViewContext("/knowledge", params.lang);
  const articles = await loadKbCatalog(context.locale);

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

      <div className="grid cols-2">
        {articles.map((article) => (
          <Link
            href={withLang(`/knowledge/${article.slug}`, context.locale)}
            key={article.slug}
            className="card card-interactive"
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
      </div>
    </PageScaffold>
  );
}
