import type { DiagnosticsRepositoryPort } from "@/application/ports/repositories";

export const getPsychoHistoryUseCase = (repo: DiagnosticsRepositoryPort) => {
  return async (userId: string) => repo.listResultsByUser(userId, "psychosomatic_v1");
};
