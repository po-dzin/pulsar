import type { Locale } from "@/domain/psychosomatic/model";
import { createRuntime } from "@/infrastructure/repositories/factory/createRuntime";
import { localKbArticleFallback } from "@/presentation/content/defaultData";
import { loadArticleContent } from "@/presentation/markdown/loadArticleContent";
import type { KbRepositoryPort } from "@/application/ports/repositories";

export type LoadedKbArticle = {
  title: string;
  content: string;
};

const getEmptyArticleBody = (locale: Locale): string =>
  locale === "ru"
    ? "## Материал обновляется\n\nКонтент для этой статьи скоро появится."
    : "## Content is being updated\n\nThis article will be available soon.";

export const loadKbArticleBySlug = async (slug: string, locale: Locale, repo?: KbRepositoryPort): Promise<LoadedKbArticle | null> => {
  try {
    const kbRepo = repo ?? (await createRuntime()).kbRepo;
    const row = await kbRepo.getArticleBySlug(slug);
    if (row) {
      const localizedTitle = locale === "ru" ? row.titleRu : row.titleEn;
      const localizedContent = locale === "ru" ? row.contentRu : row.contentEn;
      const fallbackTitle = locale === "ru" ? row.titleEn : row.titleRu;
      const title = localizedTitle.trim() || fallbackTitle.trim() || slug;
      const content = localizedContent.trim() || getEmptyArticleBody(locale);
      return { title, content };
    }
  } catch {
    // Fallback to local markdown if DB is unavailable.
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
