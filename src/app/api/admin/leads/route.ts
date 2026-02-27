import { NextResponse } from "next/server";
import { createRuntime } from "@/infrastructure/repositories/factory/createRuntime";
import { requireAdminRole, requireAuthenticatedUser } from "@/infrastructure/supabase/authz";
import { parseClampedInt } from "@/app/api/admin/_utils/query";

export async function GET(request: Request) {
  try {
    const runtime = await createRuntime();
    const user = await requireAuthenticatedUser(runtime.supabase);
    await requireAdminRole(runtime.supabase, user.id);

    const { searchParams } = new URL(request.url);
    const sortByRaw = searchParams.get("sortBy");
    const sortBy =
      sortByRaw === "createdAt" || sortByRaw === "updatedAt" || sortByRaw === "name" || sortByRaw === "status"
        ? sortByRaw
        : undefined;
    const sortDirRaw = searchParams.get("sortDir");
    const sortDir = sortDirRaw === "asc" || sortDirRaw === "desc" ? sortDirRaw : undefined;
    const statusRaw = searchParams.get("status");
    const status =
      statusRaw === "new" || statusRaw === "in_progress" || statusRaw === "done" || statusRaw === "archived" || statusRaw === "all"
        ? statusRaw
        : undefined;

    const data = await runtime.adminReadRepo.listLeads({
      page: parseClampedInt(searchParams.get("page"), { fallback: 1, min: 1, max: 10_000 }),
      pageSize: parseClampedInt(searchParams.get("pageSize"), { fallback: 20, min: 1, max: 100 }),
      search: searchParams.get("search") ?? undefined,
      status,
      sortBy,
      sortDir,
    });

    return NextResponse.json({ ok: true, rows: data.rows, meta: data.meta, leads: data.rows });
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
}
