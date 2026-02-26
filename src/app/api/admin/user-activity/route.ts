import { NextResponse } from "next/server";
import { createRuntime } from "@/infrastructure/repositories/factory/createRuntime";
import { requireAdminRole, requireAuthenticatedUser } from "@/infrastructure/supabase/authz";

const parseNumber = (raw: string | null, fallback: number): number => {
  if (!raw) return fallback;
  const value = Number(raw);
  if (!Number.isFinite(value)) return fallback;
  return value;
};

export async function GET(request: Request) {
  try {
    const runtime = await createRuntime();
    const user = await requireAuthenticatedUser(runtime.supabase);
    await requireAdminRole(runtime.supabase, user.id);

    const { searchParams } = new URL(request.url);

    const page = parseNumber(searchParams.get("page"), 1);
    const pageSize = parseNumber(searchParams.get("pageSize"), 20);
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
