import type {
  KbArticleRow,
  KbCategoryRow,
  KbRepositoryPort,
} from "@/application/ports/repositories";
import type { SupabaseClient } from "@supabase/supabase-js";

type KbCategoryDbRow = {
  id: string;
  slug: string;
  title_ru: string;
  title_en: string;
  sort_order: number;
};

type KbArticleDbRow = {
  id: string;
  category_id: string;
  slug: string;
  title_ru: string;
  title_en: string;
  excerpt_ru: string;
  excerpt_en: string;
  md_path_ru: string;
  md_path_en: string;
  is_published: boolean;
  published_at: string | null;
};

const mapCategory = (row: KbCategoryDbRow): KbCategoryRow => ({
  id: row.id,
  slug: row.slug,
  titleRu: row.title_ru,
  titleEn: row.title_en,
  sortOrder: row.sort_order,
});

const mapArticle = (row: KbArticleDbRow): KbArticleRow => ({
  id: row.id,
  categoryId: row.category_id,
  slug: row.slug,
  titleRu: row.title_ru,
  titleEn: row.title_en,
  excerptRu: row.excerpt_ru,
  excerptEn: row.excerpt_en,
  mdPathRu: row.md_path_ru,
  mdPathEn: row.md_path_en,
  isPublished: row.is_published,
  publishedAt: row.published_at,
});

export class SupabaseKbRepository implements KbRepositoryPort {
  constructor(private readonly supabase: SupabaseClient) {}

  async listCategories(): Promise<KbCategoryRow[]> {
    const { data, error } = await this.supabase.from("kb_categories").select("*").order("sort_order", { ascending: true });
    if (error) {
      throw error;
    }

    return ((data ?? []) as KbCategoryDbRow[]).map(mapCategory);
  }

  async listArticles(): Promise<KbArticleRow[]> {
    const { data, error } = await this.supabase
      .from("kb_articles")
      .select("*")
      .eq("is_published", true)
      .order("published_at", { ascending: false });

    if (error) {
      throw error;
    }

    return ((data ?? []) as KbArticleDbRow[]).map(mapArticle);
  }

  async listAllArticles(): Promise<KbArticleRow[]> {
    const { data, error } = await this.supabase.from("kb_articles").select("*").order("published_at", { ascending: false });

    if (error) {
      throw error;
    }

    return ((data ?? []) as KbArticleDbRow[]).map(mapArticle);
  }

  async getArticleBySlug(slug: string): Promise<KbArticleRow | null> {
    const { data, error } = await this.supabase
      .from("kb_articles")
      .select("*")
      .eq("slug", slug)
      .eq("is_published", true)
      .maybeSingle();

    if (error) {
      throw error;
    }

    return data ? mapArticle(data as KbArticleDbRow) : null;
  }

  async upsertArticleMeta(article: KbArticleRow): Promise<void> {
    const { error } = await this.supabase.from("kb_articles").upsert(
      {
        id: article.id,
        category_id: article.categoryId,
        slug: article.slug,
        title_ru: article.titleRu,
        title_en: article.titleEn,
        excerpt_ru: article.excerptRu,
        excerpt_en: article.excerptEn,
        md_path_ru: article.mdPathRu,
        md_path_en: article.mdPathEn,
        is_published: article.isPublished,
        published_at: article.publishedAt,
      },
      { onConflict: "id" }
    );

    if (error) {
      throw error;
    }
  }

  async setArticlePublishState(id: string, isPublished: boolean): Promise<void> {
    const publishedAt = isPublished ? new Date().toISOString() : null;
    const { error } = await this.supabase
      .from("kb_articles")
      .update({ is_published: isPublished, published_at: publishedAt })
      .eq("id", id);

    if (error) {
      throw error;
    }
  }
}
