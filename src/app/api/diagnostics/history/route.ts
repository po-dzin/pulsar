import { NextResponse } from "next/server";
import { createRuntime } from "@/infrastructure/repositories/factory/createRuntime";
import { requireAuthenticatedUser } from "@/infrastructure/supabase/authz";
import type { TestType } from "@/domain/psychosomatic/model";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const testTypeParam = url.searchParams.get("testType");
    const testType = testTypeParam ? (testTypeParam as TestType) : undefined;

    const runtime = await createRuntime();
    const user = await requireAuthenticatedUser(runtime.supabase);
    const history = await runtime.diagnosticsRepo.listResultsByUser(user.id, testType);

    return NextResponse.json({ ok: true, history });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Failed to load history" }, { status: 500 });
  }
}
