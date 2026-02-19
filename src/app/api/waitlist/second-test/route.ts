import { NextResponse } from "next/server";
import { joinSecondTestWaitlistUseCase } from "@/application/diagnostics/usecases/joinSecondTestWaitlist";
import { waitlistSchema } from "@/application/schemas/psychosomatic";
import { createRuntime } from "@/infrastructure/repositories/factory/createRuntime";
import { requireAuthenticatedUser } from "@/infrastructure/supabase/authz";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = waitlistSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid payload", details: parsed.error.flatten() }, { status: 400 });
    }

    const runtime = await createRuntime();
    const user = await requireAuthenticatedUser(runtime.supabase);

    const execute = joinSecondTestWaitlistUseCase(runtime.waitlistRepo, runtime.analytics);
    await execute(user.id, parsed.data.email, parsed.data.locale);

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Failed to join waitlist" }, { status: 500 });
  }
}
