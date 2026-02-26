import { localKbArticleFallback } from "@/presentation/content/defaultData";
import type { Locale } from "@/domain/psychosomatic/model";
import { createRuntime } from "@/infrastructure/repositories/factory/createRuntime";
import type { KbRepositoryPort } from "@/application/ports/repositories";
import { unstable_cache } from "next/cache";

export type KbCatalogItem = {
  slug: string;
  categoryId?: string;
  title: string;
  excerpt: string;
};

const loadKbRowsCached = unstable_cache(
  async () => {
    const runtime = await createRuntime();
    return runtime.kbRepo.listArticles();
  },
  ["kb-catalog-rows-v1"],
  { revalidate: 60 }
);

export const loadKbCatalog = async (locale: Locale, repo?: KbRepositoryPort): Promise<KbCatalogItem[]> => {
  try {
    const rows = repo ? await repo.listArticles() : await loadKbRowsCached();
    if (rows.length > 0) {
      return rows.map((row) => ({
        slug: row.slug,
        categoryId: row.categoryId,
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
