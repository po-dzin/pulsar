import { NextResponse } from "next/server";
import { createRuntime } from "@/infrastructure/repositories/factory/createRuntime";

export async function GET(_: Request, context: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await context.params;
    const runtime = await createRuntime();
    const article = await runtime.kbRepo.getArticleBySlug(slug);
    if (!article) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json({ ok: true, article });
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}
