import { NextResponse } from "next/server";
import { createConsultationLeadUseCase } from "@/application/diagnostics/usecases/createConsultationLead";
import { consultationLeadSchema } from "@/application/schemas/psychosomatic";
import { createRuntime } from "@/infrastructure/repositories/factory/createRuntime";
import { requireAuthenticatedUser } from "@/infrastructure/supabase/authz";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = consultationLeadSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid payload", details: parsed.error.flatten() }, { status: 400 });
    }

    const runtime = await createRuntime();
    const user = await requireAuthenticatedUser(runtime.supabase);
    await runtime.profilesRepo.upsertProfile({
      id: user.id,
      email: user.email ?? "",
      fullName: user.user_metadata?.full_name ?? user.user_metadata?.name ?? null,
      locale: user.user_metadata?.locale === "en" ? "en" : "ru",
    });

    const execute = createConsultationLeadUseCase(runtime.leadsRepo, runtime.analytics);
    const lead = await execute({
      userId: user.id,
      ...parsed.data,
    });

    return NextResponse.json({ ok: true, lead });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Failed to create lead" }, { status: 500 });
  }
}
