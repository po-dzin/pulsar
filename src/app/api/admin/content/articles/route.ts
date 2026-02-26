import { NextResponse } from "next/server";
import { createRuntime } from "@/infrastructure/repositories/factory/createRuntime";
import { requireAdminRole, requireAuthenticatedUser } from "@/infrastructure/supabase/authz";
import { z } from "zod";
import { adminContentErrorResponse } from "@/app/api/admin/content/errors";

const createArticleSchema = z.object({
  categoryId: z.string().uuid(),
  slug: z.string().min(2).max(140),
  titleRu: z.string().min(2).max(300),
  titleEn: z.string().min(2).max(300),
  excerptRu: z.string().min(2).max(1000),
  excerptEn: z.string().min(2).max(1000),
  contentRu: z.string().min(2),
  contentEn: z.string().min(2),
  isPublished: z.boolean().optional(),
});

export async function GET() {
  try {
    const runtime = await createRuntime();
    const user = await requireAuthenticatedUser(runtime.supabase);
    await requireAdminRole(runtime.supabase, user.id);

    const articles = await runtime.kbRepo.listAllArticles();
    return NextResponse.json({ ok: true, articles });
  } catch (error) {
    return adminContentErrorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = createArticleSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid payload", details: parsed.error.flatten() }, { status: 400 });
    }

    const runtime = await createRuntime();
    const user = await requireAuthenticatedUser(runtime.supabase);
    await requireAdminRole(runtime.supabase, user.id);

    const article = await runtime.kbRepo.createArticle(parsed.data, user.id);
    return NextResponse.json({ ok: true, article });
  } catch (error) {
    return adminContentErrorResponse(error);
  }
}
