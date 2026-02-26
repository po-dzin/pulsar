import type { AnalyticsPort } from "@/application/ports/analytics";
import type { DiagnosticsRepositoryPort } from "@/application/ports/repositories";
import { scorePsychosomatic } from "@/domain/psychosomatic/scoring";
import type { DomainError, PsychoAnswers, PsychoScore } from "@/domain/psychosomatic/model";

export type CompletePsychoInput = {
  userId: string;
  sessionId: string;
  answers: PsychoAnswers;
  consentAcceptedAt?: string;
};

export type CompletePsychoOutput =
  | { ok: true; value: PsychoScore }
  | { ok: false; error: DomainError };

export const completePsychoTestUseCase =
  (repo: DiagnosticsRepositoryPort, analytics: AnalyticsPort) =>
  async (input: CompletePsychoInput): Promise<CompletePsychoOutput> => {
    const scoreResult = scorePsychosomatic(input.answers);

    if (!scoreResult.ok) {
      return scoreResult;
    }

    const score = scoreResult.value;

    await repo.ensureSession(
      input.userId,
      input.sessionId,
      "psychosomatic_v1",
      input.consentAcceptedAt
    );

    await repo.saveCompletedResult({
      userId: input.userId,
      sessionId: input.sessionId,
      testType: "psychosomatic_v1",
      answers: input.answers,
      score,
    });

    await analytics.track(
      "test_psycho_complete",
      {
        sessionId: input.sessionId,
        overallPct: score.overallPct,
        level: score.level,
      },
      input.userId
    );

    return { ok: true, value: score };
  };
