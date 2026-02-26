import type { PhysicalLevel } from "@/domain/physical/model";

export const derivePhysicalLevel = (overallPct: number): PhysicalLevel => {
  if (overallPct >= 75) return "excellent";
  if (overallPct >= 60) return "stable";
  if (overallPct >= 40) return "attention";
  return "critical";
};
