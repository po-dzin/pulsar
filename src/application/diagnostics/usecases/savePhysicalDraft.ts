import type { AnalyticsPort } from "@/application/ports/analytics";
import type { DiagnosticsRepositoryPort } from "@/application/ports/repositories";
import { physicalTests } from "@/domain/physical/catalog";
import { physicalFullTestType, type PhysicalTestKey } from "@/domain/physical/model";

const inputToTestKey: Record<string, PhysicalTestKey> = physicalTests.reduce((acc, test) => {
  for (const input of test.inputs) {
    acc[input.key] = test.key;
  }
  return acc;
}, {} as Record<string, PhysicalTestKey>);

export type SavePhysicalDraftInput = {
  userId: string;
  sessionId: string;
  questionKey: string;
  answerValue: string;
  consentAcceptedAt?: string;
};

export const savePhysicalDraftUseCase =
  (repo: DiagnosticsRepositoryPort, analytics: AnalyticsPort) =>
  async (input: SavePhysicalDraftInput): Promise<void> => {
    const testType = physicalFullTestType;
    const testKey = inputToTestKey[input.questionKey];
    const numericScore = Number(input.answerValue);
    const score = Number.isFinite(numericScore) ? numericScore : 0;

    await repo.ensureSession(input.userId, input.sessionId, testType, input.consentAcceptedAt);
    await repo.saveDraftAnswer({
      userId: input.userId,
      sessionId: input.sessionId,
      testType,
      questionKey: input.questionKey,
      answerKey: input.answerValue,
      score,
      consentAcceptedAt: input.consentAcceptedAt,
    });

    await analytics.track(
      "test_physical_progress_saved",
      {
        sessionId: input.sessionId,
        testKey: testKey ?? "unknown",
        questionKey: input.questionKey,
      },
      input.userId
    );
  };
