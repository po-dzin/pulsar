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

    const page = parseClampedInt(searchParams.get("page"), { fallback: 1, min: 1, max: 10_000 });
    const pageSize = parseClampedInt(searchParams.get("pageSize"), { fallback: 20, min: 1, max: 100 });
    const search = searchParams.get("search") ?? undefined;
    const sortByRaw = searchParams.get("sortBy");
    const sortDirRaw = searchParams.get("sortDir");
    const sortBy =
      sortByRaw === "lastActivityAt" || sortByRaw === "testsCount" || sortByRaw === "leadsCount" || sortByRaw === "createdAt"
        ? sortByRaw
        : undefined;
    const sortDir = sortDirRaw === "asc" || sortDirRaw === "desc" ? sortDirRaw : undefined;

    const data = await runtime.adminReadRepo.listUserActivity({
      page,
      pageSize,
      search,
      sortBy,
      sortDir,
    });

    return NextResponse.json({ ok: true, ...data });
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
}
