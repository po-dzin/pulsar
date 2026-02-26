import type { SupabaseClient } from "@supabase/supabase-js";

export const requireAuthenticatedUser = async (supabase: SupabaseClient) => {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) {
    throw new Error("Unauthorized");
  }

  return data.user;
};

export const requireAdminRole = async (supabase: SupabaseClient, userId: string) => {
  const { data, error } = await supabase
    .from("admin_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "admin")
    .limit(1);

  if (error || !data || data.length === 0) {
    throw new Error("Forbidden");
  }

  return "admin" as const;
};
