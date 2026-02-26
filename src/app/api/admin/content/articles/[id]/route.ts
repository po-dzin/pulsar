import { z } from "zod";
import { NextResponse } from "next/server";
import { createRuntime } from "@/infrastructure/repositories/factory/createRuntime";
import { requireAdminRole, requireAuthenticatedUser } from "@/infrastructure/supabase/authz";
import { adminContentErrorResponse } from "@/app/api/admin/content/errors";

const updateArticleSchema = z.object({
  categoryId: z.string().uuid().optional(),
  slug: z.string().min(2).max(140).optional(),
  titleRu: z.string().min(2).max(300).optional(),
  titleEn: z.string().min(2).max(300).optional(),
  excerptRu: z.string().min(2).max(1000).optional(),
  excerptEn: z.string().min(2).max(1000).optional(),
  contentRu: z.string().min(2).optional(),
  contentEn: z.string().min(2).optional(),
  isPublished: z.boolean().optional(),
  isArchived: z.boolean().optional(),
});

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const body = await request.json();
    const parsed = updateArticleSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid payload", details: parsed.error.flatten() }, { status: 400 });
    }

    const runtime = await createRuntime();
    const user = await requireAuthenticatedUser(runtime.supabase);
    await requireAdminRole(runtime.supabase, user.id);
    const { id } = await context.params;
    const existing = await runtime.kbRepo.getArticleById(id);
    if (!existing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    const article = await runtime.kbRepo.updateArticle(id, parsed.data, user.id);
    return NextResponse.json({ ok: true, article });
  } catch (error) {
    return adminContentErrorResponse(error);
  }
}

export async function DELETE(_: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const runtime = await createRuntime();
    const user = await requireAuthenticatedUser(runtime.supabase);
    await requireAdminRole(runtime.supabase, user.id);
    const { id } = await context.params;
    const existing = await runtime.kbRepo.getArticleById(id);
    if (!existing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    await runtime.kbRepo.deleteArticle(id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return adminContentErrorResponse(error);
  }
}
