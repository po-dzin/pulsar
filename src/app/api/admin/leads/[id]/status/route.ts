import { NextResponse } from "next/server";
import { updateLeadStatusUseCase } from "@/application/diagnostics/usecases/updateLeadStatus";
import { adminLeadStatusSchema } from "@/application/schemas/psychosomatic";
import { createRuntime } from "@/infrastructure/repositories/factory/createRuntime";
import { requireAdminRole, requireAuthenticatedUser } from "@/infrastructure/supabase/authz";

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const body = await request.json();
    const parsed = adminLeadStatusSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid payload", details: parsed.error.flatten() }, { status: 400 });
    }

    const runtime = await createRuntime();
    const user = await requireAuthenticatedUser(runtime.supabase);
    await requireAdminRole(runtime.supabase, user.id);

    const { id } = await context.params;
    const execute = updateLeadStatusUseCase(runtime.leadsRepo, runtime.analytics);
    await execute(id, parsed.data.status, user.id);

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
}
