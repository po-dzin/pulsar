import type { AnalyticsPort } from "@/application/ports/analytics";
import type { LeadStatus, LeadsRepositoryPort } from "@/application/ports/repositories";

export const updateLeadStatusUseCase =
  (repo: LeadsRepositoryPort, analytics: AnalyticsPort) =>
  async (leadId: string, status: LeadStatus, actorUserId?: string) => {
    await repo.updateLeadStatus(leadId, status);
    await analytics.track(
      "admin_lead_status_changed",
      {
        leadId,
        status,
      },
      actorUserId
    );
  };
