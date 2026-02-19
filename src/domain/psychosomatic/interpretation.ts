import type { PsychoLevel } from "@/domain/psychosomatic/model";

export const deriveLevel = (overallPct: number): PsychoLevel => {
  if (overallPct >= 85) return "resource";
  if (overallPct >= 65) return "background_tension";
  if (overallPct >= 45) return "persistent_clamps";
  return "defense_mode";
};
