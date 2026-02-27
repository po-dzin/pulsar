import { getViewContext } from "@/presentation/i18n/getViewContext";
import { createRuntime } from "@/infrastructure/repositories/factory/createRuntime";
import { requireAdminRole } from "@/infrastructure/supabase/authz";
import { AdminDashboard } from "@/presentation/components/AdminDashboard";

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
    <div className="admin-page-inner">
      <h1 className="page-title admin-page-title">Admin</h1>
      {!allowed ? (
        <section className="card admin-access-card">
          <p className="muted">Admin role is required to access this panel.</p>
        </section>
      ) : (
        <AdminDashboard />
      )}
    </div>
  );
}
