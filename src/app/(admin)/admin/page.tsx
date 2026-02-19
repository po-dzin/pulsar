import { getViewContext } from "@/presentation/i18n/getViewContext";
import { PageScaffold } from "@/presentation/components/PageScaffold";
import { createRuntime } from "@/infrastructure/repositories/factory/createRuntime";
import { requireAdminRole } from "@/infrastructure/supabase/authz";
import { AdminUsersPanel } from "@/presentation/components/AdminUsersPanel";
import { AdminProgressPanel } from "@/presentation/components/AdminProgressPanel";
import { AdminLeadsPanel } from "@/presentation/components/AdminLeadsPanel";
import { AdminContentPanel } from "@/presentation/components/AdminContentPanel";
import { AdminRolesPanel } from "@/presentation/components/AdminRolesPanel";

export const dynamic = "force-dynamic";

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ lang?: string }>;
}) {
  const params = await searchParams;
  const context = await getViewContext("/admin", params.lang);

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
      <h1 className="page-title">Admin</h1>
      {!allowed ? (
        <section className="card">
          <p className="muted">Admin role is required.</p>
        </section>
      ) : (
        <div className="grid cols-2">
          <AdminRolesPanel />
          <AdminUsersPanel />
          <AdminProgressPanel />
          <AdminLeadsPanel />
          <AdminContentPanel />
        </div>
      )}
    </PageScaffold>
  );
}
