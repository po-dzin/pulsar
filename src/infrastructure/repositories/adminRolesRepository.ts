import type {
  AdminRole,
  AdminRoleRow,
  AdminRolesRepositoryPort,
} from "@/application/ports/repositories";
import type { SupabaseClient } from "@supabase/supabase-js";

type AdminRoleDbRow = {
  user_id: string;
  role: string;
  created_at: string;
};

const mapRole = (row: AdminRoleDbRow): AdminRoleRow | null => {
  if (row.role !== "admin") {
    return null;
  }
  return {
  userId: row.user_id,
  role: "admin",
  createdAt: row.created_at,
  };
};

export class SupabaseAdminRolesRepository implements AdminRolesRepositoryPort {
  constructor(private readonly supabase: SupabaseClient) {}

  async listRoles(): Promise<AdminRoleRow[]> {
    const { data, error } = await this.supabase.from("admin_roles").select("*").order("created_at", { ascending: false });
    if (error) {
      throw error;
    }

    return ((data ?? []) as AdminRoleDbRow[]).map(mapRole).filter((row): row is AdminRoleRow => row !== null);
  }

  async upsertRole(userId: string, role: AdminRole): Promise<void> {
    const { error } = await this.supabase.from("admin_roles").upsert(
      {
        user_id: userId,
        role,
      },
      { onConflict: "user_id,role" }
    );
    if (error) {
      throw error;
    }
  }

  async removeRole(userId: string, role?: AdminRole): Promise<void> {
    let query = this.supabase.from("admin_roles").delete().eq("user_id", userId);
    if (role) {
      query = query.eq("role", role);
    }

    const { error } = await query;
    if (error) {
      throw error;
    }
  }
}
