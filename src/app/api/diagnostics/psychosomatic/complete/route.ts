import { NextResponse } from "next/server";
import { completePsychoTestUseCase } from "@/application/diagnostics/usecases/completePsychoTest";
import { psychoCompleteSchema } from "@/application/schemas/psychosomatic";
import { createRuntime } from "@/infrastructure/repositories/factory/createRuntime";
import { requireAuthenticatedUser } from "@/infrastructure/supabase/authz";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = psychoCompleteSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid payload", details: parsed.error.flatten() }, { status: 400 });
    }

    const runtime = await createRuntime();
    const user = await requireAuthenticatedUser(runtime.supabase);

    const execute = completePsychoTestUseCase(runtime.diagnosticsRepo, runtime.analytics);
    const result = await execute({
      userId: user.id,
      ...parsed.data,
    });

    if (!result.ok) {
      return NextResponse.json({ error: result.error.message, code: result.error.code }, { status: 400 });
    }

    return NextResponse.json({ ok: true, result: result.value });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Failed to complete test" }, { status: 500 });
  }
}
