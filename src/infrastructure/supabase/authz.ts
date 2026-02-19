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
    .in("role", ["admin", "editor"])
    .maybeSingle();

  if (error || !data) {
    throw new Error("Forbidden");
  }

  return data.role as "admin" | "editor";
};
