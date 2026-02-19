import { SupabaseAnalyticsRepository } from "@/infrastructure/repositories/analyticsRepository";
import { SupabaseDiagnosticsRepository } from "@/infrastructure/repositories/diagnosticsRepository";
import { SupabaseKbRepository } from "@/infrastructure/repositories/kbRepository";
import { SupabaseLeadsRepository } from "@/infrastructure/repositories/leadsRepository";
import { SupabaseProfilesRepository } from "@/infrastructure/repositories/profilesRepository";
import { SupabaseWaitlistRepository } from "@/infrastructure/repositories/waitlistRepository";
import { getSupabaseServerClient } from "@/infrastructure/supabase/server";

export const createRuntime = async () => {
  const supabase = await getSupabaseServerClient();

  return {
    supabase,
    analytics: new SupabaseAnalyticsRepository(supabase),
    diagnosticsRepo: new SupabaseDiagnosticsRepository(supabase),
    leadsRepo: new SupabaseLeadsRepository(supabase),
    kbRepo: new SupabaseKbRepository(supabase),
    profilesRepo: new SupabaseProfilesRepository(supabase),
    waitlistRepo: new SupabaseWaitlistRepository(supabase),
  };
};
