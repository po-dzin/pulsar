import type {
  KbArticleInput,
  KbArticleRow,
  KbArticleUpdate,
  KbCategoryInput,
  KbCategoryRow,
  KbCategoryUpdate,
  KbRepositoryPort,
} from "@/application/ports/repositories";
import type { SupabaseClient } from "@supabase/supabase-js";

type KbCategoryDbRow = {
  id: string;
  slug: string;
  title_ru: string;
  title_en: string;
  sort_order: number;
  is_archived?: boolean | null;
  updated_at?: string | null;
};

type KbArticleDbRow = {
  id: string;
  category_id: string;
  slug: string;
  title_ru?: string | null;
  title_en?: string | null;
  excerpt_ru?: string | null;
  excerpt_en?: string | null;
  content_ru?: string | null;
  content_en?: string | null;
  md_path_ru?: string | null;
  md_path_en?: string | null;
  is_published: boolean;
  published_at: string | null;
  is_archived?: boolean | null;
  updated_at?: string | null;
  created_by?: string | null;
  updated_by?: string | null;
};

const mapCategory = (row: KbCategoryDbRow): KbCategoryRow => ({
  id: row.id,
  slug: row.slug,
  titleRu: row.title_ru,
  titleEn: row.title_en,
  sortOrder: row.sort_order,
  isArchived: row.is_archived ?? false,
  updatedAt: row.updated_at ?? null,
});

const mapArticle = (row: KbArticleDbRow): KbArticleRow => ({
  id: row.id,
  categoryId: row.category_id,
  slug: row.slug,
  titleRu: row.title_ru ?? "",
  titleEn: row.title_en ?? "",
  excerptRu: row.excerpt_ru ?? "",
  excerptEn: row.excerpt_en ?? "",
  contentRu: row.content_ru ?? row.md_path_ru ?? "",
  contentEn: row.content_en ?? row.md_path_en ?? "",
  isPublished: row.is_published,
  publishedAt: row.published_at,
  isArchived: row.is_archived ?? false,
  updatedAt: row.updated_at ?? null,
  createdBy: row.created_by ?? null,
  updatedBy: row.updated_by ?? null,
});

const maybeMissingArchiveColumn = (error: unknown): boolean => {
  if (!error || typeof error !== "object") {
    return false;
  }
  const message = String((error as { message?: unknown }).message ?? "").toLowerCase();
  return message.includes("is_archived") || message.includes("updated_at");
};

const includesAnyColumn = (error: unknown, columns: string[]): boolean => {
  if (!error || typeof error !== "object") {
    return false;
  }
  const message = String((error as { message?: unknown }).message ?? "").toLowerCase();
  return columns.some((column) => message.includes(column.toLowerCase()));
};

const maybeLegacyArticleWriteColumn = (error: unknown): boolean =>
  includesAnyColumn(error, ["content_ru", "content_en", "created_by", "updated_by", "is_archived", "updated_at"]);

export class SupabaseKbRepository implements KbRepositoryPort {
  constructor(private readonly supabase: SupabaseClient) {}

  async listCategories(includeArchived = false): Promise<KbCategoryRow[]> {
    let query = this.supabase.from("kb_categories").select("*").order("sort_order", { ascending: true });
    if (!includeArchived) {
      query = query.eq("is_archived", false);
    }

    let { data, error } = await query;
    if (error && !includeArchived && maybeMissingArchiveColumn(error)) {
      ({ data, error } = await this.supabase.from("kb_categories").select("*").order("sort_order", { ascending: true }));
    }

    if (error) {
      throw error;
    }

    return ((data ?? []) as KbCategoryDbRow[]).map(mapCategory);
  }

  async getCategoryById(id: string): Promise<KbCategoryRow | null> {
    const { data, error } = await this.supabase.from("kb_categories").select("*").eq("id", id).maybeSingle();
    if (error) {
      throw error;
    }

    return data ? mapCategory(data as KbCategoryDbRow) : null;
  }

  async createCategory(input: KbCategoryInput): Promise<KbCategoryRow> {
    const { data, error } = await this.supabase
      .from("kb_categories")
      .insert({
        slug: input.slug,
        title_ru: input.titleRu,
        title_en: input.titleEn,
        sort_order: input.sortOrder ?? 100,
      })
      .select("*")
      .single();

    if (error || !data) {
      throw error ?? new Error("Failed to create category");
    }

    return mapCategory(data as KbCategoryDbRow);
  }

  async updateCategory(id: string, updates: KbCategoryUpdate): Promise<KbCategoryRow> {
    const payload: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (updates.slug !== undefined) payload.slug = updates.slug;
    if (updates.titleRu !== undefined) payload.title_ru = updates.titleRu;
    if (updates.titleEn !== undefined) payload.title_en = updates.titleEn;
    if (updates.sortOrder !== undefined) payload.sort_order = updates.sortOrder;
    if (updates.isArchived !== undefined) payload.is_archived = updates.isArchived;

    let { data, error } = await this.supabase.from("kb_categories").update(payload).eq("id", id).select("*").single();
    if (error && maybeMissingArchiveColumn(error)) {
      const legacyPayload: Record<string, unknown> = { ...payload };
      delete legacyPayload.updated_at;
      delete legacyPayload.is_archived;
      ({ data, error } = await this.supabase.from("kb_categories").update(legacyPayload).eq("id", id).select("*").single());
    }

    if (error || !data) {
      throw error ?? new Error("Failed to update category");
    }

    return mapCategory(data as KbCategoryDbRow);
  }

  async archiveCategory(id: string): Promise<void> {
    const { error } = await this.supabase
      .from("kb_categories")
      .update({ is_archived: true, updated_at: new Date().toISOString() })
      .eq("id", id);

    if (error && maybeMissingArchiveColumn(error)) {
      // Legacy schema has no archive flag; keep backward-compatibility without hard-failing.
      return;
    }

    if (error) {
      throw error;
    }
  }

  async listArticles(options?: { includeArchived?: boolean; includeDrafts?: boolean; categoryId?: string }): Promise<KbArticleRow[]> {
    const includeArchived = options?.includeArchived ?? false;
    const includeDrafts = options?.includeDrafts ?? false;

    let query = this.supabase.from("kb_articles").select("*");

    if (options?.categoryId) {
      query = query.eq("category_id", options.categoryId);
    }

    if (!includeDrafts) {
      query = query.eq("is_published", true);
    }

    if (!includeArchived) {
      query = query.eq("is_archived", false);
    }

    query = query.order("published_at", { ascending: false, nullsFirst: false });

    let { data, error } = await query;
    if (error && !includeArchived && maybeMissingArchiveColumn(error)) {
      let fallback = this.supabase.from("kb_articles").select("*");
      if (options?.categoryId) {
        fallback = fallback.eq("category_id", options.categoryId);
      }
      if (!includeDrafts) {
        fallback = fallback.eq("is_published", true);
      }
      ({ data, error } = await fallback.order("published_at", { ascending: false, nullsFirst: false }));
    }

    if (error) {
      throw error;
    }

    return ((data ?? []) as KbArticleDbRow[]).map(mapArticle);
  }

  async listAllArticles(): Promise<KbArticleRow[]> {
    return this.listArticles({ includeArchived: true, includeDrafts: true });
  }

  async getArticleById(id: string): Promise<KbArticleRow | null> {
    const { data, error } = await this.supabase.from("kb_articles").select("*").eq("id", id).maybeSingle();

    if (error) {
      throw error;
    }

    return data ? mapArticle(data as KbArticleDbRow) : null;
  }

  async getArticleBySlug(slug: string): Promise<KbArticleRow | null> {
    let { data, error } = await this.supabase
      .from("kb_articles")
      .select("*")
      .eq("slug", slug)
      .eq("is_published", true)
      .eq("is_archived", false)
      .maybeSingle();

    if (error && maybeMissingArchiveColumn(error)) {
      ({ data, error } = await this.supabase
        .from("kb_articles")
        .select("*")
        .eq("slug", slug)
        .eq("is_published", true)
        .maybeSingle());
    }

    if (error) {
      throw error;
    }

    return data ? mapArticle(data as KbArticleDbRow) : null;
  }

  async createArticle(input: KbArticleInput, actorUserId: string): Promise<KbArticleRow> {
    const publishedAt = input.isPublished ? new Date().toISOString() : null;
    const basePayload = {
      category_id: input.categoryId,
      slug: input.slug,
      title_ru: input.titleRu,
      title_en: input.titleEn,
      excerpt_ru: input.excerptRu,
      excerpt_en: input.excerptEn,
      content_ru: input.contentRu,
      content_en: input.contentEn,
      is_published: input.isPublished ?? false,
      published_at: publishedAt,
      is_archived: false,
      created_by: actorUserId,
      updated_by: actorUserId,
    };

    let { data, error } = await this.supabase.from("kb_articles").insert(basePayload).select("*").single();
    if (error && maybeLegacyArticleWriteColumn(error)) {
      ({ data, error } = await this.supabase
        .from("kb_articles")
        .insert({
          category_id: input.categoryId,
          slug: input.slug,
          title_ru: input.titleRu,
          title_en: input.titleEn,
          excerpt_ru: input.excerptRu,
          excerpt_en: input.excerptEn,
          md_path_ru: input.contentRu,
          md_path_en: input.contentEn,
          is_published: input.isPublished ?? false,
          published_at: publishedAt,
        })
        .select("*")
        .single());
    }

    if (error || !data) {
      throw error ?? new Error("Failed to create article");
    }

    return mapArticle(data as KbArticleDbRow);
  }

  async updateArticle(id: string, updates: KbArticleUpdate, actorUserId: string): Promise<KbArticleRow> {
    const payload: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
      updated_by: actorUserId,
    };

    if (updates.categoryId !== undefined) payload.category_id = updates.categoryId;
    if (updates.slug !== undefined) payload.slug = updates.slug;
    if (updates.titleRu !== undefined) payload.title_ru = updates.titleRu;
    if (updates.titleEn !== undefined) payload.title_en = updates.titleEn;
    if (updates.excerptRu !== undefined) payload.excerpt_ru = updates.excerptRu;
    if (updates.excerptEn !== undefined) payload.excerpt_en = updates.excerptEn;
    if (updates.contentRu !== undefined) payload.content_ru = updates.contentRu;
    if (updates.contentEn !== undefined) payload.content_en = updates.contentEn;
    if (updates.isArchived !== undefined) payload.is_archived = updates.isArchived;

    if (updates.isPublished !== undefined) {
      payload.is_published = updates.isPublished;
      payload.published_at = updates.isPublished ? new Date().toISOString() : null;
    }

    let { data, error } = await this.supabase.from("kb_articles").update(payload).eq("id", id).select("*").single();
    if (error && maybeLegacyArticleWriteColumn(error)) {
      const legacyPayload: Record<string, unknown> = { ...payload };
      if ("content_ru" in legacyPayload) {
        legacyPayload.md_path_ru = legacyPayload.content_ru;
        delete legacyPayload.content_ru;
      }
      if ("content_en" in legacyPayload) {
        legacyPayload.md_path_en = legacyPayload.content_en;
        delete legacyPayload.content_en;
      }
      delete legacyPayload.updated_at;
      delete legacyPayload.updated_by;
      delete legacyPayload.is_archived;

      ({ data, error } = await this.supabase.from("kb_articles").update(legacyPayload).eq("id", id).select("*").single());
    }

    if (error || !data) {
      throw error ?? new Error("Failed to update article");
    }

    return mapArticle(data as KbArticleDbRow);
  }

  async archiveArticle(id: string, actorUserId: string): Promise<void> {
    let { error } = await this.supabase
      .from("kb_articles")
      .update({
        is_archived: true,
        updated_at: new Date().toISOString(),
        updated_by: actorUserId,
      })
      .eq("id", id);

    if (error && maybeMissingArchiveColumn(error)) {
      ({ error } = await this.supabase.from("kb_articles").update({ is_published: false, published_at: null }).eq("id", id));
    }

    if (error) {
      throw error;
    }
  }
}
