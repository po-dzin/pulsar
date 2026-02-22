import { getViewContext } from "@/presentation/i18n/getViewContext";
import { PageScaffold } from "@/presentation/components/PageScaffold";
import { DiagnosticsFlow } from "@/presentation/components/DiagnosticsFlow";
import { withLang } from "@/presentation/components/LocaleLinks";
import { getPsychoHistoryUseCase } from "@/application/diagnostics/usecases/getPsychoHistory";
import { createRuntime } from "@/infrastructure/repositories/factory/createRuntime";

export const dynamic = "force-dynamic";

export default async function DiagnosticsPage({
  searchParams,
}: {
  searchParams: Promise<{ lang?: string }>;
}) {
  const params = await searchParams;
  const context = await getViewContext("/diagnostics", params.lang);

  let history: Array<{ id: string; overallPct: number; level: string; createdAt: string }> = [];
  if (context.userId) {
    try {
      const runtime = await createRuntime();
      const execute = getPsychoHistoryUseCase(runtime.diagnosticsRepo);
      const rows = await execute(context.userId);
      history = rows.map((row) => ({
        id: row.id,
        overallPct: row.overallPct,
        level: row.level,
        createdAt: row.createdAt,
      }));
    } catch {
      history = [];
    }
  }

  return (
    <PageScaffold
      locale={context.locale}
      dictionary={context.dictionary}
      pathname={context.pathname}
      isAuthenticated={Boolean(context.userId)}
      avatarUrl={context.avatarUrl}
      displayName={context.displayName}
    >
      <h1 className="page-title">{context.dictionary.diagnostics.title}</h1>
      <p className="page-subtitle">{context.dictionary.diagnostics.subtitle}</p>

      <DiagnosticsFlow
        isAuthenticated={Boolean(context.userId)}
        locale={context.locale}
        labels={{
          description: context.dictionary.diagnostics.description,
          consent: context.dictionary.diagnostics.consent,
          start: context.dictionary.diagnostics.start,
          next: context.dictionary.diagnostics.next,
          finish: context.dictionary.diagnostics.finish,
          restart: context.dictionary.diagnostics.restart,
          resultTitle: context.dictionary.result.title,
          overallLabel: context.dictionary.result.overall,
          levelLabel: context.dictionary.result.level,
          strongLabel: context.dictionary.result.strong,
          growthLabel: context.dictionary.result.growth,
          recommendationsLabel: context.dictionary.result.recommendations,
          toProducts: context.dictionary.result.toProducts,
          toKnowledge: context.dictionary.result.toKnowledge,
          historyTitle: context.dictionary.diagnostics.history,
          guestModeNotice: context.dictionary.diagnostics.guestModeNotice,
          historyGuestEmpty: context.dictionary.diagnostics.historyGuestEmpty,
          savePrompt: context.dictionary.diagnostics.savePrompt,
          testSelectorPsychosomatic: context.dictionary.diagnostics.testSelector.psychosomatic,
          testSelectorPhysical: context.dictionary.diagnostics.testSelector.physical,
        }}
        productsHref={withLang("/products", context.locale)}
        knowledgeHref={withLang("/knowledge", context.locale)}
        initialHistory={history}
      />
    </PageScaffold>
  );
}
