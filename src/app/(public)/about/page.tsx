import { getViewContext } from "@/presentation/i18n/getViewContext";
import { PageScaffold } from "@/presentation/components/PageScaffold";

export default async function AboutPage({
  searchParams,
}: {
  searchParams: Promise<{ lang?: string }>;
}) {
  const params = await searchParams;
  const context = await getViewContext("/about", params.lang);

  return (
    <PageScaffold
      locale={context.locale}
      dictionary={context.dictionary}
      pathname={context.pathname}
      isAuthenticated={Boolean(context.userId)}
    >
      <h1 className="page-title">{context.dictionary.about.title}</h1>
      <div className="grid">
        <section className="card">
          <h2>{context.dictionary.about.methodTitle}</h2>
          <p className="muted" style={{ marginTop: "1rem", lineHeight: 1.6 }}>
            {context.dictionary.about.methodBody}
          </p>
        </section>

        <section className="card">
          <h2>{context.dictionary.about.roleTitle}</h2>
          <ul style={{ marginTop: "1rem", display: "flex", flexDirection: "column", gap: "0.75rem", paddingLeft: "1.25rem" }} className="muted">
            <li>{context.dictionary.about.roleBody1}</li>
            <li>{context.dictionary.about.roleBody2}</li>
            <li>{context.dictionary.about.roleBody3}</li>
            <li>{context.dictionary.about.roleBody4}</li>
          </ul>
        </section>
      </div>
    </PageScaffold>
  );
}
