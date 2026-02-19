import { NextResponse } from "next/server";
import { adminRoleAssignSchema, adminRoleRemoveSchema } from "@/application/schemas/admin";
import { createRuntime } from "@/infrastructure/repositories/factory/createRuntime";
import { requireAdminRole, requireAuthenticatedUser } from "@/infrastructure/supabase/authz";

const forbidden = () => NextResponse.json({ error: "Forbidden" }, { status: 403 });

export async function GET() {
  try {
    const runtime = await createRuntime();
    const user = await requireAuthenticatedUser(runtime.supabase);
    await requireAdminRole(runtime.supabase, user.id);

    const [roles, profiles] = await Promise.all([
      runtime.adminRolesRepo.listRoles(),
      runtime.profilesRepo.listProfiles(),
    ]);

    const profileMap = new Map(profiles.map((profile) => [profile.id, profile]));
    const items = roles.map((role) => {
      const profile = profileMap.get(role.userId);
      return {
        userId: role.userId,
        role: role.role,
        createdAt: role.createdAt,
        email: profile?.email ?? null,
        fullName: profile?.fullName ?? null,
      };
    });

    return NextResponse.json({ ok: true, roles: items });
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
