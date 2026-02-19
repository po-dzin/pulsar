import type { AnalyticsPort } from "@/application/ports/analytics";
import type { Locale } from "@/domain/psychosomatic/model";
import type { WaitlistRepositoryPort } from "@/application/ports/repositories";

export const joinSecondTestWaitlistUseCase =
  (repo: WaitlistRepositoryPort, analytics: AnalyticsPort) =>
  async (userId: string, email: string, locale: Locale) => {
    await repo.addSecondTestWaitlist(userId, email, locale);
    await analytics.track(
      "waitlist_second_test_join",
      {
        locale,
      },
      userId
    );
  };
