import { NextResponse } from "next/server";
import { createRuntime } from "@/infrastructure/repositories/factory/createRuntime";
import { requireAdminRole, requireAuthenticatedUser } from "@/infrastructure/supabase/authz";

const parseNumber = (raw: string | null, fallback: number): number => {
  if (!raw) return fallback;
  const value = Number(raw);
  if (!Number.isFinite(value)) return fallback;
  return value;
};

export async function GET(request: Request, context: { params: Promise<{ userId: string }> }) {
  try {
    const runtime = await createRuntime();
    const user = await requireAuthenticatedUser(runtime.supabase);
    await requireAdminRole(runtime.supabase, user.id);

    const { userId } = await context.params;
    const { searchParams } = new URL(request.url);
    const testsLimit = parseNumber(searchParams.get("testsLimit"), 5);
    const leadsLimit = parseNumber(searchParams.get("leadsLimit"), 5);

    const details = await runtime.adminReadRepo.getUserActivityDetails(userId, { testsLimit, leadsLimit });
    return NextResponse.json({ ok: true, ...details });
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
}
