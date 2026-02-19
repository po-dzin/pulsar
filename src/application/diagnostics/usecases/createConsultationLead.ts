import type { AnalyticsPort } from "@/application/ports/analytics";
import type { ConsultationLeadInput, LeadsRepositoryPort } from "@/application/ports/repositories";

export const createConsultationLeadUseCase =
  (repo: LeadsRepositoryPort, analytics: AnalyticsPort) =>
  async (input: ConsultationLeadInput) => {
    const created = await repo.createLead(input);

    await analytics.track(
      "cta_consult_submit",
      {
        leadId: created.id,
        status: created.status,
      },
      input.userId
    );

    return created;
  };
