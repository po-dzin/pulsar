import type { AnalyticsPort } from "@/application/ports/analytics";
import type { DiagnosticsRepositoryPort } from "@/application/ports/repositories";
import { scorePhysicalFullTest } from "@/domain/physical/scoring";
import type { PhysicalAnswers, PhysicalDomainError, PhysicalFullScore } from "@/domain/physical/model";
import { physicalFullTestType } from "@/domain/physical/model";

export type CompletePhysicalInput = {
  userId: string;
  sessionId: string;
  answers: PhysicalAnswers;
  consentAcceptedAt?: string;
};

export type CompletePhysicalOutput =
  | { ok: true; value: PhysicalFullScore }
  | { ok: false; error: PhysicalDomainError };

export const completePhysicalTestUseCase =
  (repo: DiagnosticsRepositoryPort, analytics: AnalyticsPort) =>
  async (input: CompletePhysicalInput): Promise<CompletePhysicalOutput> => {
    const scoreResult = scorePhysicalFullTest(input.answers);
    if (!scoreResult.ok) {
      return scoreResult;
    }

    const score = scoreResult.value;
    const testType = physicalFullTestType;

    await repo.ensureSession(input.userId, input.sessionId, testType, input.consentAcceptedAt);
    await repo.saveCompletedResult({
      userId: input.userId,
      sessionId: input.sessionId,
      testType,
      answers: input.answers,
      score: {
        overallPct: score.overallPct,
        level: score.level,
        zones: score.categories.map((item) => ({ zone: item.category, score: item.overallPct })),
        riskFlags: score.riskFlags,
        recommendations: score.recommendations,
      },
    });

    await analytics.track(
      "test_physical_complete",
      {
        sessionId: input.sessionId,
        overallPct: score.overallPct,
        level: score.level,
        categories: score.categories.map((item) => ({ category: item.category, score: item.overallPct })),
      },
      input.userId
    );

    return { ok: true, value: score };
  };
