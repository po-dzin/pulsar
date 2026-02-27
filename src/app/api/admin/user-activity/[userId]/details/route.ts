import { NextResponse } from "next/server";
import { createRuntime } from "@/infrastructure/repositories/factory/createRuntime";
import { requireAdminRole, requireAuthenticatedUser } from "@/infrastructure/supabase/authz";
import { parseClampedInt } from "@/app/api/admin/_utils/query";

export async function GET(request: Request, context: { params: Promise<{ userId: string }> }) {
  try {
    const runtime = await createRuntime();
    const user = await requireAuthenticatedUser(runtime.supabase);
    await requireAdminRole(runtime.supabase, user.id);

    const { userId } = await context.params;
    const { searchParams } = new URL(request.url);
    const testsLimit = parseClampedInt(searchParams.get("testsLimit"), { fallback: 5, min: 1, max: 50 });
    const leadsLimit = parseClampedInt(searchParams.get("leadsLimit"), { fallback: 5, min: 1, max: 50 });

    const details = await runtime.adminReadRepo.getUserActivityDetails(userId, { testsLimit, leadsLimit });
    return NextResponse.json({ ok: true, ...details });
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
}
