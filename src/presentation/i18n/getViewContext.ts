import { headers } from "next/headers";
import type { Locale } from "@/domain/psychosomatic/model";
import { getSupabaseServerClient } from "@/infrastructure/supabase/server";
import { getDictionary, resolveLocale } from "@/presentation/i18n/dictionaries";

const browserLocaleFallback = async (): Promise<Locale> => {
  const headerStore = await headers();
  const acceptLanguage = headerStore.get("accept-language")?.toLowerCase() ?? "";
  return acceptLanguage.includes("en") ? "en" : "ru";
};

export const getViewContext = async (
  pathname: string,
  langParam?: string
): Promise<{
  locale: "ru" | "en";
  dictionary: ReturnType<typeof getDictionary>;
  pathname: string;
  userId: string | null;
  avatarUrl: string | null;
  displayName: string | null;
}> => {
  const browserLocale = await browserLocaleFallback();
  const locale = resolveLocale(langParam ?? browserLocale);
  let userId: string | null = null;
  let avatarUrl: string | null = null;
  let displayName: string | null = null;

  try {
    const supabase = await getSupabaseServerClient();
    // Fast path for UI context: read session from cookies without forcing
    // a network roundtrip on every public page render.
    const {
      data: { session },
    } = await supabase.auth.getSession();
    const user = session?.user ?? null;

    if (user) {
      userId = user.id;
      avatarUrl = user.user_metadata?.avatar_url ?? null;
      displayName = user.user_metadata?.full_name ?? user.user_metadata?.name ?? user.email ?? null;
    }
  } catch {
    // Fallback to non-auth mode when env/session is unavailable.
    userId = null;
  }

  return {
    locale,
    dictionary: getDictionary(locale),
    pathname,
    userId,
    avatarUrl,
    displayName,
  };
};
