import type { AnalyticsPort } from "@/application/ports/analytics";
import type { SupabaseClient } from "@supabase/supabase-js";

export class SupabaseAnalyticsRepository implements AnalyticsPort {
  constructor(private readonly supabase: SupabaseClient) {}

  async track(eventName: string, payload: Record<string, unknown>, userId?: string): Promise<void> {
    await this.supabase.from("event_log").insert({
      user_id: userId ?? null,
      event_name: eventName,
      payload_json: payload,
    });
  }
}
