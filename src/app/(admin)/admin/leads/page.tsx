import { getViewContext } from "@/presentation/i18n/getViewContext";
import { PageScaffold } from "@/presentation/components/PageScaffold";
import { createRuntime } from "@/infrastructure/repositories/factory/createRuntime";
import { requireAdminRole } from "@/infrastructure/supabase/authz";
import { AdminLeadsPanel } from "@/presentation/components/AdminLeadsPanel";

export const dynamic = "force-dynamic";

export default async function AdminLeadsPage({
  searchParams,
}: {
  searchParams: Promise<{ lang?: string }>;
}) {
  const params = await searchParams;
  const context = await getViewContext("/admin/leads", params.lang);

  let allowed = false;
  if (context.userId) {
    try {
      const runtime = await createRuntime();
      await requireAdminRole(runtime.supabase, context.userId);
      allowed = true;
    } catch {
      allowed = false;
    }
  }

  return (
    <PageScaffold
      locale={context.locale}
      dictionary={context.dictionary}
      pathname={context.pathname}
      isAuthenticated={Boolean(context.userId)}
    >
      <h1 className="page-title">Admin leads</h1>
      {allowed ? <AdminLeadsPanel /> : <p className="muted">Admin role is required.</p>}
    </PageScaffold>
  );
}
