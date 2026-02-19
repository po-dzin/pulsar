import { describe, expect, test } from "vitest";
import type { AnalyticsPort } from "@/application/ports/analytics";
import type {
  ConsultationLeadInput,
  ConsultationLeadRow,
  DiagnosticsRepositoryPort,
  LeadStatus,
  LeadsRepositoryPort,
  SaveDraftPayload,
  SaveResultPayload,
  TestResultRow,
} from "@/application/ports/repositories";
import { completePsychoTestUseCase } from "@/application/diagnostics/usecases/completePsychoTest";
import { createConsultationLeadUseCase } from "@/application/diagnostics/usecases/createConsultationLead";
import { savePsychoDraftUseCase } from "@/application/diagnostics/usecases/savePsychoDraft";
import { updateLeadStatusUseCase } from "@/application/diagnostics/usecases/updateLeadStatus";
import { psychoQuestionKeys, type AnswerValue, type PsychoAnswers } from "@/domain/psychosomatic/model";

class InMemoryAnalytics implements AnalyticsPort {
  public readonly events: Array<{ name: string; payload: Record<string, unknown>; userId?: string }> = [];

  async track(eventName: string, payload: Record<string, unknown>, userId?: string): Promise<void> {
    this.events.push({ name: eventName, payload, userId });
  }
}

class InMemoryDiagnosticsRepository implements DiagnosticsRepositoryPort {
  public readonly answersBySession = new Map<string, Map<string, { answerKey: string; score: number }>>();
  public readonly results: TestResultRow[] = [];

  async ensureSession(): Promise<void> {}

  async saveDraftAnswer(payload: SaveDraftPayload): Promise<void> {
    const current = this.answersBySession.get(payload.sessionId) ?? new Map<string, { answerKey: string; score: number }>();
    current.set(payload.questionKey, { answerKey: payload.answerKey, score: payload.score });
    this.answersBySession.set(payload.sessionId, current);
  }

  async saveCompletedResult(payload: SaveResultPayload): Promise<void> {
    this.results.push({
      id: `result-${this.results.length + 1}`,
      userId: payload.userId,
      sessionId: payload.sessionId,
      testType: payload.testType,
      overallPct: payload.score.overallPct,
      level: payload.score.level,
      zones: payload.score.zones,
      riskFlags: payload.score.riskFlags,
      recommendations: payload.score.recommendations,
      createdAt: "2026-01-01T00:00:00.000Z",
    });
  }

  async listResultsByUser(userId: string): Promise<TestResultRow[]> {
    return this.results.filter((row) => row.userId === userId);
  }

  async listAllResults(): Promise<TestResultRow[]> {
    return this.results;
  }
}

class InMemoryLeadsRepository implements LeadsRepositoryPort {
  public readonly leads: ConsultationLeadRow[] = [];

  async createLead(input: ConsultationLeadInput): Promise<ConsultationLeadRow> {
    const lead: ConsultationLeadRow = {
      id: `lead-${this.leads.length + 1}`,
      userId: input.userId,
      name: input.name,
      contact: input.contact,
      message: input.message,
      status: "new",
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
    };
    this.leads.push(lead);
    return lead;
  }

  async listLeads(): Promise<ConsultationLeadRow[]> {
    return this.leads;
  }

  async updateLeadStatus(id: string, status: LeadStatus): Promise<void> {
    const current = this.leads.find((lead) => lead.id === id);
    if (!current) {
      return;
    }
    current.status = status;
    current.updatedAt = "2026-01-02T00:00:00.000Z";
  }
}

const buildAnswers = (defaultValue: AnswerValue = "none"): PsychoAnswers => {
  return psychoQuestionKeys.reduce((acc, key) => {
    acc[key] = defaultValue;
    return acc;
  }, {} as PsychoAnswers);
};

describe("application contract contour", () => {
  test("draft save is idempotent by (session, question)", async () => {
    const repo = new InMemoryDiagnosticsRepository();
    const analytics = new InMemoryAnalytics();
    const execute = savePsychoDraftUseCase(repo, analytics);

    await execute({
      userId: "user-1",
      sessionId: "session-1",
      questionKey: "q1",
      answerKey: "rare",
    });
    await execute({
      userId: "user-1",
      sessionId: "session-1",
      questionKey: "q1",
      answerKey: "often",
    });

    const answers = repo.answersBySession.get("session-1");
    expect(answers?.size).toBe(1);
    expect(answers?.get("q1")?.answerKey).toBe("often");
  });

  test("completion persists coherent result payload", async () => {
    const repo = new InMemoryDiagnosticsRepository();
    const analytics = new InMemoryAnalytics();
    const execute = completePsychoTestUseCase(repo, analytics);

    const result = await execute({
      userId: "user-2",
      sessionId: "session-2",
      answers: buildAnswers("none"),
    });

    expect(result.ok).toBe(true);
    expect(repo.results).toHaveLength(1);
    expect(repo.results[0]?.sessionId).toBe("session-2");
    expect(repo.results[0]?.overallPct).toBe(100);
  });

  test("lead status transition is applied and tracked", async () => {
    const repo = new InMemoryLeadsRepository();
    const analytics = new InMemoryAnalytics();
    const createLead = createConsultationLeadUseCase(repo, analytics);
    const updateStatus = updateLeadStatusUseCase(repo, analytics);

    const created = await createLead({
      userId: "user-3",
      name: "Alex",
      contact: "alex@example.com",
      message: "Need consultation",
    });

    await updateStatus(created.id, "in_progress", "admin-1");

    const leads = await repo.listLeads();
    expect(leads[0]?.status).toBe("in_progress");
    expect(analytics.events.some((event) => event.name === "admin_lead_status_changed")).toBe(true);
  });
});
