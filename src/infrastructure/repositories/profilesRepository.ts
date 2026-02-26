import type {
  AdminSortDir,
  ProfilesRepositoryPort,
  UserProfile,
} from "@/application/ports/repositories";
import type { SupabaseClient } from "@supabase/supabase-js";

type ProfileDbRow = {
  id: string;
  email: string;
  full_name: string | null;
  locale: "ru" | "en";
  created_at: string;
};

const mapProfile = (row: ProfileDbRow): UserProfile => ({
  id: row.id,
  email: row.email,
  fullName: row.full_name,
  locale: row.locale,
  createdAt: row.created_at,
});

export class SupabaseProfilesRepository implements ProfilesRepositoryPort {
  constructor(private readonly supabase: SupabaseClient) {}

  async listProfiles(options?: {
    search?: string;
    sortBy?: "createdAt" | "email" | "fullName";
    sortDir?: AdminSortDir;
    offset?: number;
    limit?: number;
  }): Promise<UserProfile[]> {
    const sortBy = options?.sortBy ?? "createdAt";
    const sortDir = options?.sortDir ?? "desc";
    const dbSortColumn = sortBy === "email" ? "email" : sortBy === "fullName" ? "full_name" : "created_at";

    let query = this.supabase
      .from("profiles")
      .select("*")
      .order(dbSortColumn, { ascending: sortDir === "asc" });

    if (options?.search?.trim()) {
      const escaped = options.search.trim().replace(/[%_]/g, "");
      query = query.or(`email.ilike.%${escaped}%,full_name.ilike.%${escaped}%`);
    }

    if (typeof options?.offset === "number" && typeof options?.limit === "number") {
      query = query.range(options.offset, options.offset + options.limit - 1);
    }

    const { data, error } = await query;
    if (error) {
      throw error;
    }

    return ((data ?? []) as ProfileDbRow[]).map(mapProfile);
  }

  async countProfiles(search?: string): Promise<number> {
    let query = this.supabase
      .from("profiles")
      .select("id", { count: "exact", head: true });

    if (search?.trim()) {
      const escaped = search.trim().replace(/[%_]/g, "");
      query = query.or(`email.ilike.%${escaped}%,full_name.ilike.%${escaped}%`);
    }

    const { count, error } = await query;
    if (error) {
      throw error;
    }

    return count ?? 0;
  }

  async getProfileById(userId: string): Promise<UserProfile | null> {
    const { data, error } = await this.supabase.from("profiles").select("*").eq("id", userId).maybeSingle();
    if (error) {
      throw error;
    }

    return data ? mapProfile(data as ProfileDbRow) : null;
  }

  async getProfileByEmail(email: string): Promise<UserProfile | null> {
    const { data, error } = await this.supabase.from("profiles").select("*").eq("email", email).maybeSingle();
    if (error) {
      throw error;
    }

    return data ? mapProfile(data as ProfileDbRow) : null;
  }

  async upsertProfile(profile: Omit<UserProfile, "createdAt">): Promise<void> {
    const { error } = await this.supabase.from("profiles").upsert(
      {
        id: profile.id,
        email: profile.email,
        full_name: profile.fullName,
        locale: profile.locale,
      },
      { onConflict: "id" }
    );

    if (error) {
      throw error;
    }
  }
}
