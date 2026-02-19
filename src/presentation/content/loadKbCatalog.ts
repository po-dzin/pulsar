import { localKbArticleFallback } from "@/presentation/content/defaultData";
import type { Locale } from "@/domain/psychosomatic/model";
import { createRuntime } from "@/infrastructure/repositories/factory/createRuntime";

export type KbCatalogItem = {
  slug: string;
  title: string;
  excerpt: string;
};

export const loadKbCatalog = async (locale: Locale): Promise<KbCatalogItem[]> => {
  try {
    const runtime = await createRuntime();
    const rows = await runtime.kbRepo.listArticles();
    if (rows.length > 0) {
      return rows.map((row) => ({
        slug: row.slug,
        title: locale === "ru" ? row.titleRu : row.titleEn,
        excerpt: locale === "ru" ? row.excerptRu : row.excerptEn,
      }));
    }
  } catch {
    // fallback to local markdown metadata
  }

  return Object.entries(localKbArticleFallback).map(([slug, value]) => ({
    slug,
    title: value.title[locale],
    excerpt: value.excerpt[locale],
  }));
};
