import type {
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

  async listProfiles(): Promise<UserProfile[]> {
    const { data, error } = await this.supabase.from("profiles").select("*").order("created_at", { ascending: false });
    if (error) {
      throw error;
    }

    return ((data ?? []) as ProfileDbRow[]).map(mapProfile);
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
