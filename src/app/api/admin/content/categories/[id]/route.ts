import { NextResponse } from "next/server";
import { z } from "zod";
import { createRuntime } from "@/infrastructure/repositories/factory/createRuntime";
import { requireAdminRole, requireAuthenticatedUser } from "@/infrastructure/supabase/authz";
import { adminContentErrorResponse } from "@/app/api/admin/content/errors";

const updateCategorySchema = z.object({
  slug: z.string().min(2).max(140).optional(),
  titleRu: z.string().min(2).max(200).optional(),
  titleEn: z.string().min(2).max(200).optional(),
  sortOrder: z.number().int().optional(),
  isArchived: z.boolean().optional(),
});

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const body = await request.json();
    const parsed = updateCategorySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid payload", details: parsed.error.flatten() }, { status: 400 });
    }

    const runtime = await createRuntime();
    const user = await requireAuthenticatedUser(runtime.supabase);
    await requireAdminRole(runtime.supabase, user.id);
    const { id } = await context.params;

    const existing = await runtime.kbRepo.getCategoryById(id);
    if (!existing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const category = await runtime.kbRepo.updateCategory(id, parsed.data);
    return NextResponse.json({ ok: true, category });
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

    await runtime.kbRepo.archiveCategory(id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return adminContentErrorResponse(error);
  }
}
