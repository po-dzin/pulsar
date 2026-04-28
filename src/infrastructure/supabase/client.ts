"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getClientEnv } from "@/infrastructure/supabase/env";

let browserClient: SupabaseClient | null = null;

export const getSupabaseBrowserClient = (): SupabaseClient => {
  if (browserClient) {
    return browserClient;
  }

  const env = getClientEnv();
  browserClient = createBrowserClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  return browserClient;
};

export const isSupabaseBrowserConfigured = (): boolean => {
  try {
    getClientEnv();
    return true;
  } catch {
    return false;
  }
};

const reportMissingClientEnv = () => {
  if (typeof window !== "undefined") {
    window.alert("Authentication is unavailable: missing Supabase public environment variables.");
  }
};

export const signInWithGoogle = async (redirectTo: string): Promise<boolean> => {
  if (!isSupabaseBrowserConfigured()) {
    reportMissingClientEnv();
    return false;
  }

  const supabase = getSupabaseBrowserClient();
  await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo, queryParams: { prompt: "select_account" } },
  });
  return true;
};

export const signOutBrowserUser = async (): Promise<boolean> => {
  if (!isSupabaseBrowserConfigured()) {
    reportMissingClientEnv();
    return false;
  }

  const supabase = getSupabaseBrowserClient();
  await supabase.auth.signOut();
  return true;
};
