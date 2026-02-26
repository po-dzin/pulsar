import { NextResponse } from "next/server";
import { createRuntime } from "@/infrastructure/repositories/factory/createRuntime";
import { requireAuthenticatedUser } from "@/infrastructure/supabase/authz";
import { savePhysicalDraftUseCase } from "@/application/diagnostics/usecases/savePhysicalDraft";
import { physicalDraftSchema } from "@/application/schemas/physical";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = physicalDraftSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid payload", details: parsed.error.flatten() }, { status: 400 });
    }

    const runtime = await createRuntime();
    const user = await requireAuthenticatedUser(runtime.supabase);

    const execute = savePhysicalDraftUseCase(runtime.diagnosticsRepo, runtime.analytics);
    await execute({
      userId: user.id,
      sessionId: parsed.data.sessionId,
      questionKey: parsed.data.questionKey,
      answerValue: parsed.data.answerValue,
      consentAcceptedAt: parsed.data.consentAcceptedAt,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Failed to save physical draft" }, { status: 500 });
  }
}
