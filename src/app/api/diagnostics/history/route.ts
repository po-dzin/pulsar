import { NextResponse } from "next/server";
import { getPsychoHistoryUseCase } from "@/application/diagnostics/usecases/getPsychoHistory";
import { createRuntime } from "@/infrastructure/repositories/factory/createRuntime";
import { requireAuthenticatedUser } from "@/infrastructure/supabase/authz";

export async function GET() {
  try {
    const runtime = await createRuntime();
    const user = await requireAuthenticatedUser(runtime.supabase);

    const execute = getPsychoHistoryUseCase(runtime.diagnosticsRepo);
    const history = await execute(user.id);

    return NextResponse.json({ ok: true, history });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Failed to load history" }, { status: 500 });
  }
}
