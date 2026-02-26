import { SupabaseAnalyticsRepository } from "@/infrastructure/repositories/analyticsRepository";
import { SupabaseAdminReadRepository } from "@/infrastructure/repositories/adminReadRepository";
import { SupabaseAdminRolesRepository } from "@/infrastructure/repositories/adminRolesRepository";
import { SupabaseDiagnosticsRepository } from "@/infrastructure/repositories/diagnosticsRepository";
import { SupabaseKbRepository } from "@/infrastructure/repositories/kbRepository";
import { SupabaseLeadsRepository } from "@/infrastructure/repositories/leadsRepository";
import { SupabaseProfilesRepository } from "@/infrastructure/repositories/profilesRepository";
import { SupabaseWaitlistRepository } from "@/infrastructure/repositories/waitlistRepository";
import { getSupabaseServerClient } from "@/infrastructure/supabase/server";

export const createRuntime = async () => {
  const supabase = await getSupabaseServerClient();
  const adminRolesRepo = new SupabaseAdminRolesRepository(supabase);
  const diagnosticsRepo = new SupabaseDiagnosticsRepository(supabase);
  const leadsRepo = new SupabaseLeadsRepository(supabase);
  const kbRepo = new SupabaseKbRepository(supabase);
  const profilesRepo = new SupabaseProfilesRepository(supabase);
  const waitlistRepo = new SupabaseWaitlistRepository(supabase);
  const adminReadRepo = new SupabaseAdminReadRepository(supabase, profilesRepo, leadsRepo, adminRolesRepo);

  return {
    supabase,
    analytics: new SupabaseAnalyticsRepository(supabase),
    adminReadRepo,
    adminRolesRepo,
    diagnosticsRepo,
    leadsRepo,
    kbRepo,
    profilesRepo,
    waitlistRepo,
  };
};
