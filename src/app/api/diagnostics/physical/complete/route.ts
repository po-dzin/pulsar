import { NextResponse } from "next/server";
import { createRuntime } from "@/infrastructure/repositories/factory/createRuntime";
import { requireAuthenticatedUser } from "@/infrastructure/supabase/authz";
import { completePhysicalTestUseCase } from "@/application/diagnostics/usecases/completePhysicalTest";
import { physicalCompleteSchema } from "@/application/schemas/physical";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = physicalCompleteSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid payload", details: parsed.error.flatten() }, { status: 400 });
    }

    const runtime = await createRuntime();
    const user = await requireAuthenticatedUser(runtime.supabase);

    const execute = completePhysicalTestUseCase(runtime.diagnosticsRepo, runtime.analytics);
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
    return NextResponse.json({ error: "Failed to complete physical test" }, { status: 500 });
  }
}
