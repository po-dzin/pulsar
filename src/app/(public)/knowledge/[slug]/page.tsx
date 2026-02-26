import { notFound } from "next/navigation";
import { getViewContext } from "@/presentation/i18n/getViewContext";
import { PageScaffold } from "@/presentation/components/PageScaffold";
import { loadKbArticleBySlug } from "@/presentation/content/loadKbArticleBySlug";
import { renderSafeMarkdown } from "@/presentation/markdown/renderSafeMarkdown";
import Link from "next/link";
import { withLang } from "@/presentation/components/LocaleLinks";
import { createRuntime } from "@/infrastructure/repositories/factory/createRuntime";

export default async function KnowledgeArticlePage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ lang?: string }>;
}) {
  const route = await params;
  const query = await searchParams;
  const context = await getViewContext(`/knowledge/${route.slug}`, query.lang);
  const runtime = await createRuntime().catch(() => null);
  const article = await loadKbArticleBySlug(route.slug, context.locale, runtime?.kbRepo);

  if (!article) {
    notFound();
  }

  const html = renderSafeMarkdown(article.content ?? "");

  return (
    <PageScaffold
      locale={context.locale}
      dictionary={context.dictionary}
      pathname={context.pathname}
      isAuthenticated={Boolean(context.userId)}
    >
      <article className="card prose" data-testid="knowledge-article">
        <Link
          href={withLang("/knowledge", context.locale)}
          className="kb-back-btn"
          title="Назад в базу знаний"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12"></line>
            <polyline points="12 19 5 12 12 5"></polyline>
          </svg>
        </Link>
        <h1 data-testid="knowledge-article-title">{article.title}</h1>
        <div data-testid="knowledge-article-content" dangerouslySetInnerHTML={{ __html: html }} />
      </article>
    </PageScaffold>
  );
}
