import { NextResponse } from "next/server";
import { z } from "zod";
import { createRuntime } from "@/infrastructure/repositories/factory/createRuntime";
import { requireAdminRole, requireAuthenticatedUser } from "@/infrastructure/supabase/authz";
import { renderSafeMarkdown } from "@/presentation/markdown/renderSafeMarkdown";
import { adminContentErrorResponse } from "@/app/api/admin/content/errors";

const previewSchema = z.object({
  content: z.string().min(1),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = previewSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid payload", details: parsed.error.flatten() }, { status: 400 });
    }

    const runtime = await createRuntime();
    const user = await requireAuthenticatedUser(runtime.supabase);
    await requireAdminRole(runtime.supabase, user.id);

    return NextResponse.json({ ok: true, html: renderSafeMarkdown(parsed.data.content) });
  } catch (error) {
    return adminContentErrorResponse(error);
  }
}
