import Link from "next/link";
import { getViewContext } from "@/presentation/i18n/getViewContext";
import { PageScaffold } from "@/presentation/components/PageScaffold";
import { withLang } from "@/presentation/components/LocaleLinks";

export default async function MissionPage({
  searchParams,
}: {
  searchParams: Promise<{ lang?: string }>;
}) {
  const params = await searchParams;
  const context = await getViewContext("/", params.lang);

  return (
    <PageScaffold
      locale={context.locale}
      dictionary={context.dictionary}
      pathname={context.pathname}
      isAuthenticated={Boolean(context.userId)}
    >
      <h1 className="page-title">{context.dictionary.home.title}</h1>
      <p className="page-subtitle">{context.dictionary.home.subtitle}</p>

      <div className="grid cols-2">
        <section className="card">
          <h2>{context.dictionary.home.sections.approachTitle}</h2>
          <p className="muted">{context.dictionary.home.sections.approachBody}</p>
        </section>
        <section className="card">
          <h2>{context.dictionary.home.sections.loopTitle}</h2>
          <p className="muted">{context.dictionary.home.sections.loopBody}</p>
        </section>
      </div>

      <div className="inline-row" style={{ marginTop: 16 }}>
        <Link href={withLang("/diagnostics", context.locale)} className="button button-primary">
          {context.dictionary.common.primaryCta}
        </Link>
      </div>
    </PageScaffold>
  );
}
