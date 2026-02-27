import { NextResponse } from "next/server";
import { z } from "zod";
import { createRuntime } from "@/infrastructure/repositories/factory/createRuntime";
import { requireAdminRole, requireAuthenticatedUser } from "@/infrastructure/supabase/authz";
import { adminContentErrorResponse } from "@/app/api/admin/content/errors";

const reorderSchema = z.object({
  categoryId: z.string().uuid(),
  swapWithCategoryId: z.string().uuid(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = reorderSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid payload", details: parsed.error.flatten() }, { status: 400 });
    }

    if (parsed.data.categoryId === parsed.data.swapWithCategoryId) {
      return NextResponse.json({ ok: true });
    }

    const runtime = await createRuntime();
    const user = await requireAuthenticatedUser(runtime.supabase);
    await requireAdminRole(runtime.supabase, user.id);

    const [left, right] = await Promise.all([
      runtime.kbRepo.getCategoryById(parsed.data.categoryId),
      runtime.kbRepo.getCategoryById(parsed.data.swapWithCategoryId),
    ]);

    if (!left || !right) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 });
    }

    await runtime.kbRepo.swapCategorySortOrder(parsed.data.categoryId, parsed.data.swapWithCategoryId);

    return NextResponse.json({ ok: true });
  } catch (error) {
    return adminContentErrorResponse(error);
  }
}
