import type { Result } from "@/domain/common/result";

export type Locale = "ru" | "en";
export type TestType = "psychosomatic_v1";

export type AnswerValue = "none" | "rare" | "sometimes" | "often";

export const psychoQuestionKeys = [
  "q1",
  "q2",
  "q3",
  "q4",
  "q5",
  "q6",
  "q7",
  "q8",
  "q9",
  "q10",
  "q11",
  "q12",
  "q13",
  "q14",
  "q15",
  "q16",
] as const;

export type PsychoQuestionKey = (typeof psychoQuestionKeys)[number];

export type PsychoAnswers = Record<PsychoQuestionKey, AnswerValue>;

export type PsychoLevel = "resource" | "background_tension" | "persistent_clamps" | "defense_mode";

export type RiskFlag = "trauma_history" | "sleep_disruption" | "chronic_tension_pattern";

export type ZoneKey =
  | "head_control"
  | "neck_upper"
  | "back_support"
  | "breathing_abdomen"
  | "sleep_recovery"
  | "pelvis_safety"
  | "emotional_marker";

export type ZoneScore = {
  zone: ZoneKey;
  score: number;
};

export type TranslatedString = Record<Locale, string>;

export type RecommendationBlock = {
  title: TranslatedString;
  items: TranslatedString[];
};

export type PsychoScore = {
  overallPct: number;
  includedQuestionCount: number;
  perQuestion: Record<PsychoQuestionKey, number>;
  level: PsychoLevel;
  zones: ZoneScore[];
  zonesStrong: ZoneScore[];
  zonesGrowth: ZoneScore[];
  riskFlags: RiskFlag[];
  recommendations: RecommendationBlock[];
};

export type DomainErrorCode =
  | "INVALID_PAYLOAD"
  | "MISSING_ANSWERS"
  | "INVALID_ANSWER_VALUE"
  | "UNKNOWN";

export type DomainError = {
  code: DomainErrorCode;
  message: string;
  details?: Record<string, unknown>;
};

export type DomainResult<T> = Result<T, DomainError>;

export const includedInOverall: PsychoQuestionKey[] = [
  "q1",
  "q2",
  "q3",
  "q4",
  "q5",
  "q6",
  "q7",
  "q8",
  "q9",
  "q10",
  "q11",
  "q12",
  "q13",
  "q15",
  "q16",
];

export const scoreMapBase: Record<AnswerValue, number> = {
  none: 100,
  rare: 75,
  sometimes: 50,
  often: 25,
};

export const zoneQuestionMap: Record<ZoneKey, PsychoQuestionKey[]> = {
  head_control: ["q1", "q2"],
  neck_upper: ["q3", "q4", "q5"],
  back_support: ["q6", "q7"],
  breathing_abdomen: ["q8", "q9"],
  sleep_recovery: ["q10", "q11", "q12"],
  pelvis_safety: ["q13", "q14"],
  emotional_marker: ["q15", "q16"],
};
