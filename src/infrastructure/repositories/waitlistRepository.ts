import type { WaitlistRepositoryPort } from "@/application/ports/repositories";
import type { Locale } from "@/domain/psychosomatic/model";
import type { SupabaseClient } from "@supabase/supabase-js";

export class SupabaseWaitlistRepository implements WaitlistRepositoryPort {
  constructor(private readonly supabase: SupabaseClient) {}

  async addSecondTestWaitlist(userId: string, email: string, locale: Locale): Promise<void> {
    const { error } = await this.supabase.from("waitlist_second_test").insert({
      user_id: userId,
      email,
      locale,
    });

    if (error) {
      throw error;
    }
  }
}
