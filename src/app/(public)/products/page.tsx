import { getViewContext } from "@/presentation/i18n/getViewContext";
import { PageScaffold } from "@/presentation/components/PageScaffold";
import { defaultProducts } from "@/presentation/content/defaultData";
import { ConsultationForm } from "@/presentation/components/ConsultationForm";

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ lang?: string }>;
}) {
  const params = await searchParams;
  const context = await getViewContext("/products", params.lang);

  return (
    <PageScaffold
      locale={context.locale}
      dictionary={context.dictionary}
      pathname={context.pathname}
      isAuthenticated={Boolean(context.userId)}
    >
      <h1 className="page-title">{context.dictionary.products.title}</h1>
      <p className="page-subtitle">{context.dictionary.products.subtitle}</p>

      <div className="grid cols-3">
        {defaultProducts.map((product) => (
          <article className="card" key={product.id}>
            <h3>{product.title[context.locale]}</h3>
            <p className="muted">{product.description[context.locale]}</p>
          </article>
        ))}
      </div>

      <div style={{ marginTop: 'var(--space-4)' }}>
        <ConsultationForm
          labels={{
            title: context.dictionary.products.consultTitle,
            name: context.dictionary.products.consultName,
            contact: context.dictionary.products.consultContact,
            message: context.dictionary.products.consultMessage,
            submit: context.dictionary.products.consultSubmit,
            success: context.dictionary.products.consultSuccess,
          }}
        />
      </div>
    </PageScaffold>
  );
}
