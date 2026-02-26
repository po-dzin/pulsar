import type { DiagnosticsRepositoryPort } from "@/application/ports/repositories";
import type { PhysicalTestKey } from "@/domain/physical/model";
import { physicalTestType } from "@/domain/physical/model";

export const getPhysicalHistoryUseCase = (repo: DiagnosticsRepositoryPort) => {
  return async (userId: string, testKey?: PhysicalTestKey) => {
    if (!testKey) {
      return repo.listResultsByUser(userId);
    }
    return repo.listResultsByUser(userId, physicalTestType(testKey));
  };
};
