import type {
  DiagnosticsRepositoryPort,
  SaveDraftPayload,
  SaveResultPayload,
  TestResultRow,
} from "@/application/ports/repositories";
import type { SupabaseClient } from "@supabase/supabase-js";

type DiagnosticsResultDbRow = {
  id: string;
  user_id: string;
  session_id: string;
  test_type: "psychosomatic_v1";
  overall_pct: number;
  level: string;
  zones_json: unknown;
  flags_json: unknown;
  recommendations_json: unknown;
  created_at: string;
};

const mapResult = (row: DiagnosticsResultDbRow): TestResultRow => ({
  id: row.id,
  userId: row.user_id,
  sessionId: row.session_id,
  testType: row.test_type,
  overallPct: row.overall_pct,
  level: row.level,
  zones: row.zones_json,
  riskFlags: row.flags_json,
  recommendations: row.recommendations_json,
  createdAt: row.created_at,
});

export class SupabaseDiagnosticsRepository implements DiagnosticsRepositoryPort {
  constructor(private readonly supabase: SupabaseClient) {}

  async ensureSession(userId: string, sessionId: string, testType: string, consentAcceptedAt?: string): Promise<void> {
    await this.supabase.from("test_sessions").upsert(
      {
        id: sessionId,
        user_id: userId,
        test_type: testType,
        status: "in_progress",
        consent_accepted_at: consentAcceptedAt ?? null,
      },
      { onConflict: "id" }
    );
  }

  async saveDraftAnswer(payload: SaveDraftPayload): Promise<void> {
    await this.supabase.from("test_answers").upsert(
      {
        session_id: payload.sessionId,
        question_key: payload.questionKey,
        answer_key: payload.answerKey,
        score: payload.score,
        meta: {},
      },
      { onConflict: "session_id,question_key" }
    );
  }

  async saveCompletedResult(payload: SaveResultPayload): Promise<void> {
    const score = payload.score;

    await this.supabase.from("test_results").insert({
      session_id: payload.sessionId,
      user_id: payload.userId,
      test_type: payload.testType,
      overall_pct: score.overallPct,
      level: score.level,
      zones_json: score.zones,
      flags_json: score.riskFlags,
      recommendations_json: score.recommendations,
    });

    await this.supabase
      .from("test_sessions")
      .update({ status: "completed", completed_at: new Date().toISOString() })
      .eq("id", payload.sessionId)
      .eq("user_id", payload.userId);
  }

  async listResultsByUser(userId: string, testType: string): Promise<TestResultRow[]> {
    const { data, error } = await this.supabase
      .from("test_results")
      .select("*")
      .eq("user_id", userId)
      .eq("test_type", testType)
      .order("created_at", { ascending: false });

    if (error) {
      throw error;
    }

    return ((data ?? []) as DiagnosticsResultDbRow[]).map(mapResult);
  }

  async listAllResults(): Promise<TestResultRow[]> {
    const { data, error } = await this.supabase.from("test_results").select("*").order("created_at", { ascending: false });

    if (error) {
      throw error;
    }

    return ((data ?? []) as DiagnosticsResultDbRow[]).map(mapResult);
  }
}
