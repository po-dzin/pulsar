import type { Locale, TestType } from "@/domain/psychosomatic/model";
import type { Result } from "@/domain/common/result";

export type PhysicalCategoryKey =
  | "breathing"
  | "cardio_strength"
  | "strength_endurance"
  | "flexibility"
  | "coordination_balance";

export type PhysicalTestKey =
  | "stange"
  | "genchi"
  | "ruffier"
  | "leg_swings"
  | "plank"
  | "wall_sit"
  | "forward_bend"
  | "shoulders_lock"
  | "dynamic_balance"
  | "static_balance";

export type PhysicalLevel = "excellent" | "stable" | "attention" | "critical";

export type PhysicalInputType = "number" | "scale";

export type PhysicalInputDefinition = {
  key: string;
  type: PhysicalInputType;
  title: Record<Locale, string>;
  hint: Record<Locale, string>;
  min?: number;
  max?: number;
  step?: number;
  scaleLabels?: Record<string, Record<Locale, string>>;
};

export type PhysicalTestDefinition = {
  key: PhysicalTestKey;
  category: PhysicalCategoryKey;
  title: Record<Locale, string>;
  description: Record<Locale, string>;
  protocol: Record<Locale, string[]>;
  inputs: PhysicalInputDefinition[];
};

export type PhysicalAnswers = Record<string, string>;

export type PhysicalRiskFlag =
  | "stress_ns"
  | "critical_breathing_imbalance"
  | "zone5_leg_swings"
  | "shoulder_asymmetry"
  | "dynamic_balance_asymmetry"
  | "static_balance_asymmetry";

export type PhysicalRecommendationBlock = {
  title: Record<Locale, string>;
  items: Array<Record<Locale, string>>;
};

export type PhysicalScore = {
  testKey: PhysicalTestKey;
  category: PhysicalCategoryKey;
  overallPct: number;
  perInput: Record<string, number | string>;
  level: PhysicalLevel;
  riskFlags: PhysicalRiskFlag[];
  recommendations: PhysicalRecommendationBlock[];
};

export type PhysicalCategoryScore = {
  category: PhysicalCategoryKey;
  overallPct: number;
  level: PhysicalLevel;
  tests: Array<{
    testKey: PhysicalTestKey;
    overallPct: number;
  }>;
};

export type PhysicalFullScore = {
  overallPct: number;
  level: PhysicalLevel;
  categories: PhysicalCategoryScore[];
  tests: Record<PhysicalTestKey, number>;
  perInput: Record<string, number | string>;
  riskFlags: PhysicalRiskFlag[];
  recommendations: PhysicalRecommendationBlock[];
};

export type PhysicalDomainErrorCode =
  | "UNKNOWN_TEST"
  | "MISSING_ANSWERS"
  | "INVALID_INPUT_VALUE"
  | "UNKNOWN";

export type PhysicalDomainError = {
  code: PhysicalDomainErrorCode;
  message: string;
  details?: Record<string, unknown>;
};

export type PhysicalResult<T> = Result<T, PhysicalDomainError>;

export const physicalTestType = (testKey: PhysicalTestKey): TestType => `physical_${testKey}_v1`;
export const physicalFullTestType: TestType = "physical_full_v1";
