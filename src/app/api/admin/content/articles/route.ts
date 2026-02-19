import { NextResponse } from "next/server";
import { createRuntime } from "@/infrastructure/repositories/factory/createRuntime";
import { requireAdminRole, requireAuthenticatedUser } from "@/infrastructure/supabase/authz";

export async function GET() {
  try {
    const runtime = await createRuntime();
    const user = await requireAuthenticatedUser(runtime.supabase);
    await requireAdminRole(runtime.supabase, user.id);

    const articles = await runtime.kbRepo.listAllArticles();
    return NextResponse.json({ ok: true, articles });
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
}
