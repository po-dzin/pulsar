import { NextResponse } from "next/server";
import { z } from "zod";
import { createRuntime } from "@/infrastructure/repositories/factory/createRuntime";
import { requireAdminRole, requireAuthenticatedUser } from "@/infrastructure/supabase/authz";
import { adminContentErrorResponse } from "@/app/api/admin/content/errors";

const createCategorySchema = z.object({
  slug: z.string().min(2).max(140),
  titleRu: z.string().min(2).max(200),
  titleEn: z.string().min(2).max(200),
  sortOrder: z.number().int().optional(),
});

export async function GET() {
  try {
    const runtime = await createRuntime();
    const user = await requireAuthenticatedUser(runtime.supabase);
    await requireAdminRole(runtime.supabase, user.id);

    const categories = await runtime.kbRepo.listCategories(true);
    return NextResponse.json({ ok: true, categories });
  } catch (error) {
    return adminContentErrorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = createCategorySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid payload", details: parsed.error.flatten() }, { status: 400 });
    }

    const runtime = await createRuntime();
    const user = await requireAuthenticatedUser(runtime.supabase);
    await requireAdminRole(runtime.supabase, user.id);

    const category = await runtime.kbRepo.createCategory(parsed.data);
    return NextResponse.json({ ok: true, category });
  } catch (error) {
    return adminContentErrorResponse(error);
  }
}
