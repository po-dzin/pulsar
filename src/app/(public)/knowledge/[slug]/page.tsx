import { notFound } from "next/navigation";
import { getViewContext } from "@/presentation/i18n/getViewContext";
import { PageScaffold } from "@/presentation/components/PageScaffold";
import { loadKbArticleBySlug } from "@/presentation/content/loadKbArticleBySlug";
import { renderSafeMarkdown } from "@/presentation/markdown/renderSafeMarkdown";

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
  const article = await loadKbArticleBySlug(route.slug, context.locale);

  if (!article) {
    notFound();
  }

  const html = renderSafeMarkdown(article.content);

  return (
    <PageScaffold
      locale={context.locale}
      dictionary={context.dictionary}
      pathname={context.pathname}
      isAuthenticated={Boolean(context.userId)}
    >
      <article className="card prose">
        <h1>{article.title}</h1>
        <div dangerouslySetInnerHTML={{ __html: html }} />
      </article>
    </PageScaffold>
  );
}
