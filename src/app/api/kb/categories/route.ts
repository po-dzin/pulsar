import { NextResponse } from "next/server";
import { createRuntime } from "@/infrastructure/repositories/factory/createRuntime";

export async function GET() {
  try {
    const runtime = await createRuntime();
    const categories = await runtime.kbRepo.listCategories();
    return NextResponse.json({ ok: true, categories });
  } catch {
    return NextResponse.json({ ok: true, categories: [] });
  }
}
