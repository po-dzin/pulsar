import Link from "next/link";
import { getViewContext } from "@/presentation/i18n/getViewContext";
import { PageScaffold } from "@/presentation/components/PageScaffold";
import { withLang } from "@/presentation/components/LocaleLinks";

import { LandingBentoWrapper } from "@/presentation/components/LandingBentoWrapper";

export default async function MissionPage({
  searchParams,
}: {
  searchParams: Promise<{ lang?: string }>;
}) {
  const params = await searchParams;
  const context = await getViewContext("/", params.lang);
  const { dictionary: d, locale } = context;

  return (
    <PageScaffold
      locale={locale}
      dictionary={d}
      pathname={context.pathname}
      isAuthenticated={Boolean(context.userId)}
      avatarUrl={context.avatarUrl}
      displayName={context.displayName}
    >
      <LandingBentoWrapper>
        {/* ── HERO ── full-viewport opening screen */}
        <section className="landing-section landing-hero" data-bento-area="hero">
          <div className="landing-section-inner">
            <p className="landing-eyebrow">{d.home.eyebrow}</p>
            <h1 className="landing-headline">{d.home.title}</h1>
            <p className="landing-sub">{d.home.subtitle}</p>
            <div className="landing-cta-row">
              <Link href={withLang("/diagnostics", locale)} className="button button-primary button-lg">
                {d.home.heroCta}
              </Link>
            </div>
          </div>
        </section>

        {/* ── DIAGNOSTICS screen */}
        <section className="landing-section landing-diagnostics" data-bento-area="diagnostics">
          <div className="landing-section-inner">
            <p className="landing-eyebrow">{d.nav.diagnostics}</p>
            <h2 className="landing-headline">{d.home.sections.approachTitle}</h2>
            <p className="landing-sub">{d.home.sections.diagnosticsBody}</p>
            <div className="landing-cta-row">
              <Link href={withLang("/diagnostics", locale)} className="button button-primary button-lg">
                {d.common.primaryCta}
              </Link>
            </div>
          </div>
        </section>

        {/* ── PRODUCTS screen */}
        <section className="landing-section landing-products" data-bento-area="products">
          <div className="landing-section-inner">
            <p className="landing-eyebrow">{d.nav.products}</p>
            <h2 className="landing-headline">{d.products.title}</h2>
            <p className="landing-sub">{d.products.subtitle}</p>
            <div className="landing-cta-row">
              <Link href={withLang("/products", locale)} className="button button-primary button-lg">
                {d.products.consultSubmit}
              </Link>
            </div>
          </div>
        </section>

        {/* ── KNOWLEDGE screen */}
        <section className="landing-section landing-knowledge" data-bento-area="knowledge">
          <div className="landing-section-inner">
            <p className="landing-eyebrow">{d.nav.knowledge}</p>
            <h2 className="landing-headline">{d.knowledge.title}</h2>
            <p className="landing-sub">{d.knowledge.subtitle}</p>
            <div className="landing-cta-row">
              <Link href={withLang("/knowledge", locale)} className="button button-primary button-lg">
                {d.knowledge.open}
              </Link>
            </div>
          </div>
        </section>

        {/* ── ABOUT screen */}
        <section className="landing-section landing-about" data-bento-area="about">
          <div className="landing-section-inner">
            <p className="landing-eyebrow">{d.nav.about}</p>
            <h2 className="landing-headline">{d.about.title}</h2>
            <p className="landing-sub">{d.about.methodBody}</p>
            <div className="landing-cta-row">
              <Link href={withLang("/about", locale)} className="button button-primary button-lg">
                {d.nav.about}
              </Link>
              <Link href={withLang("/diagnostics", locale)} className="button button-muted button-lg">
                {d.common.primaryCta}
              </Link>
            </div>
          </div>
        </section>
      </LandingBentoWrapper>
    </PageScaffold>
  );
}
