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
}> => {
  const browserLocale = await browserLocaleFallback();
  let locale = resolveLocale(langParam ?? browserLocale);
  let userId: string | null = null;

  try {
    const supabase = await getSupabaseServerClient();
    const { data } = await supabase.auth.getUser();
    const user = data.user;

    if (user) {
      userId = user.id;

      const { data: profile } = await supabase.from("profiles").select("locale").eq("id", user.id).maybeSingle();
      const profileLocale = resolveLocale(profile?.locale ?? browserLocale);
      const effectiveLocale = resolveLocale(langParam ?? profileLocale);

      locale = effectiveLocale;

      if (!profile || profile.locale !== effectiveLocale) {
        await supabase.from("profiles").upsert(
          {
            id: user.id,
            email: user.email ?? "",
            full_name: user.user_metadata?.full_name ?? user.user_metadata?.name ?? null,
            locale: effectiveLocale,
          },
          { onConflict: "id" }
        );
      }
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
  };
};
