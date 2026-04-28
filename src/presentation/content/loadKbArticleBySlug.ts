import type { Locale } from "@/domain/psychosomatic/model";
import { createRuntime } from "@/infrastructure/repositories/factory/createRuntime";
import { localKbArticleFallback } from "@/presentation/content/defaultData";
import type { KbRepositoryPort } from "@/application/ports/repositories";

export type LoadedKbArticle = {
  title: string;
  content: string;
};

const resolveArticleBody = (value: string, locale: Locale): string => {
  const normalized = value.trim();
  if (!normalized) {
    return getEmptyArticleBody(locale);
  }
  if (/^src\/content\/kb\/.+\.md$/i.test(normalized)) {
    return getEmptyArticleBody(locale);
  }
  return normalized;
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
      const fallbackTitle = locale === "ru" ? row.titleEn : row.titleRu;
      const localizedContent = locale === "ru" ? row.contentRu : row.contentEn;
      const fallbackContent = locale === "ru" ? row.contentEn : row.contentRu;
      const title = localizedTitle.trim() || fallbackTitle.trim() || slug;
      const content = resolveArticleBody(localizedContent || fallbackContent, locale);
      return { title, content };
    }
  } catch {
    // Fallback to local in-memory content if DB is unavailable.
  }

  const fallback = localKbArticleFallback[slug];
  if (!fallback) {
    return null;
  }

  return {
    title: fallback.title[locale],
    content: fallback.content[locale] || getEmptyArticleBody(locale),
  };
};
