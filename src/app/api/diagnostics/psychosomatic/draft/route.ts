import { NextResponse } from "next/server";
import { savePsychoDraftUseCase } from "@/application/diagnostics/usecases/savePsychoDraft";
import { psychoDraftSchema } from "@/application/schemas/psychosomatic";
import { createRuntime } from "@/infrastructure/repositories/factory/createRuntime";
import { requireAuthenticatedUser } from "@/infrastructure/supabase/authz";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = psychoDraftSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid payload", details: parsed.error.flatten() }, { status: 400 });
    }

    const runtime = await createRuntime();
    const user = await requireAuthenticatedUser(runtime.supabase);

    const execute = savePsychoDraftUseCase(runtime.diagnosticsRepo, runtime.analytics);
    await execute({
      userId: user.id,
      ...parsed.data,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Failed to save draft" }, { status: 500 });
  }
}
