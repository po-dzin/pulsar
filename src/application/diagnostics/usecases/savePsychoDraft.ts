import type { AnalyticsPort } from "@/application/ports/analytics";
import type { DiagnosticsRepositoryPort } from "@/application/ports/repositories";
import { scoreMapBase, type PsychoQuestionKey, type TestType } from "@/domain/psychosomatic/model";

export type SavePsychoDraftInput = {
  userId: string;
  sessionId: string;
  questionKey: PsychoQuestionKey;
  answerKey: keyof typeof scoreMapBase;
  testType?: TestType;
  consentAcceptedAt?: string;
};

export const savePsychoDraftUseCase =
  (repo: DiagnosticsRepositoryPort, analytics: AnalyticsPort) =>
  async (input: SavePsychoDraftInput): Promise<void> => {
    const testType = input.testType ?? "psychosomatic_v1";
    const score = scoreMapBase[input.answerKey];

    await repo.ensureSession(input.userId, input.sessionId, testType, input.consentAcceptedAt);
    await repo.saveDraftAnswer({
      userId: input.userId,
      sessionId: input.sessionId,
      testType,
      questionKey: input.questionKey,
      answerKey: input.answerKey,
      score,
      consentAcceptedAt: input.consentAcceptedAt,
    });

    await analytics.track(
      "test_psycho_progress_saved",
      {
        sessionId: input.sessionId,
        questionKey: input.questionKey,
      },
      input.userId
    );
  };
