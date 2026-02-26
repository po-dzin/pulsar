import type { Locale } from "@/domain/psychosomatic/model";
import { createRuntime } from "@/infrastructure/repositories/factory/createRuntime";
import type { KbRepositoryPort } from "@/application/ports/repositories";
import { unstable_cache } from "next/cache";

export type KbCategoryItem = {
  id: string;
  slug: string;
  title: string;
};

const loadKbCategoriesRowsCached = unstable_cache(
  async () => {
    const runtime = await createRuntime();
    return runtime.kbRepo.listCategories();
  },
  ["kb-categories-rows-v1"],
  { revalidate: 60 }
);

export const loadKbCategories = async (locale: Locale, repo?: KbRepositoryPort): Promise<KbCategoryItem[]> => {
  try {
    const rows = repo ? await repo.listCategories() : await loadKbCategoriesRowsCached();
    return rows.map((row) => ({
      id: row.id,
      slug: row.slug,
      title: locale === "ru" ? row.titleRu : row.titleEn,
    }));
  } catch {
    return [];
  }
};
