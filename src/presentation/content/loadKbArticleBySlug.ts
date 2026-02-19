import type { Locale } from "@/domain/psychosomatic/model";
import { createRuntime } from "@/infrastructure/repositories/factory/createRuntime";
import { localKbArticleFallback } from "@/presentation/content/defaultData";
import { loadArticleContent } from "@/presentation/markdown/loadArticleContent";

export type LoadedKbArticle = {
  title: string;
  content: string;
};

export const loadKbArticleBySlug = async (slug: string, locale: Locale): Promise<LoadedKbArticle | null> => {
  try {
    const runtime = await createRuntime();
    const row = await runtime.kbRepo.getArticleBySlug(slug);
    if (row) {
      const path = locale === "ru" ? row.mdPathRu : row.mdPathEn;
      const parsed = await loadArticleContent(path);
      const title = locale === "ru" ? row.titleRu : row.titleEn;
      return { title, content: parsed.content };
    }
  } catch {
    // fallback to local markdown files
  }

  const fallback = localKbArticleFallback[slug];
  if (!fallback) {
    return null;
  }

  const parsed = await loadArticleContent(fallback.path[locale]);
  return {
    title: fallback.title[locale],
    content: parsed.content,
  };
};
