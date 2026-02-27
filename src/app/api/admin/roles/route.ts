import { NextResponse } from "next/server";
import { adminRoleAssignSchema, adminRoleRemoveSchema } from "@/application/schemas/admin";
import { createRuntime } from "@/infrastructure/repositories/factory/createRuntime";
import { requireAdminRole, requireAuthenticatedUser } from "@/infrastructure/supabase/authz";
import { parseClampedInt } from "@/app/api/admin/_utils/query";

const forbidden = () => NextResponse.json({ error: "Forbidden" }, { status: 403 });

export async function GET(request: Request) {
  try {
    const runtime = await createRuntime();
    const user = await requireAuthenticatedUser(runtime.supabase);
    await requireAdminRole(runtime.supabase, user.id);

    const { searchParams } = new URL(request.url);
    const sortByRaw = searchParams.get("sortBy");
    const sortBy =
      sortByRaw === "fullName" || sortByRaw === "email" || sortByRaw === "role" || sortByRaw === "assignedAt" || sortByRaw === "createdAt"
        ? sortByRaw
        : undefined;
    const sortDirRaw = searchParams.get("sortDir");
    const sortDir = sortDirRaw === "asc" || sortDirRaw === "desc" ? sortDirRaw : undefined;

    const data = await runtime.adminReadRepo.listRoles({
      page: parseClampedInt(searchParams.get("page"), { fallback: 1, min: 1, max: 10_000 }),
      pageSize: parseClampedInt(searchParams.get("pageSize"), { fallback: 20, min: 1, max: 100 }),
      search: searchParams.get("search") ?? undefined,
      sortBy,
      sortDir,
    });
    return NextResponse.json({ ok: true, rows: data.rows, meta: data.meta, roles: data.rows });
  } catch {
    return forbidden();
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const parsed = adminRoleAssignSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid payload", details: parsed.error.flatten() }, { status: 400 });
    }

    const runtime = await createRuntime();
    const user = await requireAuthenticatedUser(runtime.supabase);
    await requireAdminRole(runtime.supabase, user.id);

    let targetUserId = parsed.data.userId ?? null;
    if (!targetUserId && parsed.data.email) {
      const profile = await runtime.profilesRepo.getProfileByEmail(parsed.data.email);
      targetUserId = profile?.id ?? null;
    }

    if (!targetUserId) {
      return NextResponse.json({ error: "Target user not found in profiles" }, { status: 404 });
    }

    await runtime.adminRolesRepo.upsertRole(targetUserId, parsed.data.role);
    return NextResponse.json({ ok: true });
  } catch {
    return forbidden();
  }
}

export async function DELETE(request: Request) {
  try {
    const body = await request.json();
    const parsed = adminRoleRemoveSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid payload", details: parsed.error.flatten() }, { status: 400 });
    }

    const runtime = await createRuntime();
    const user = await requireAuthenticatedUser(runtime.supabase);
    await requireAdminRole(runtime.supabase, user.id);

    await runtime.adminRolesRepo.removeRole(parsed.data.userId, parsed.data.role);
    return NextResponse.json({ ok: true });
  } catch {
    return forbidden();
  }
}
