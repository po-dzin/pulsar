import { err, ok } from "@/domain/common/result";
import { deriveLevel } from "@/domain/psychosomatic/interpretation";
import {
  includedInOverall,
  psychoQuestionKeys,
  scoreMapBase,
  type DomainResult,
  type PsychoAnswers,
  type PsychoQuestionKey,
  type PsychoScore,
  type RiskFlag,
  type ZoneScore,
  zoneQuestionMap,
} from "@/domain/psychosomatic/model";
import { deriveRecommendations } from "@/domain/psychosomatic/recommendations";

const safeRound = (value: number): number => Math.max(0, Math.min(100, Math.round(value)));

const computeQuestionScores = (
  answers: PsychoAnswers
): DomainResult<Record<PsychoQuestionKey, number>> => {
  const scores = {} as Record<PsychoQuestionKey, number>;

  for (const key of psychoQuestionKeys) {
    const answer = answers[key];
    if (!(answer in scoreMapBase)) {
      return err({
        code: "INVALID_ANSWER_VALUE",
        message: `Invalid answer for ${key}`,
        details: { key, answer },
      });
    }

    scores[key] = scoreMapBase[answer];
  }

  return ok(scores);
};

const computeZoneScores = (questionScores: Record<PsychoQuestionKey, number>): ZoneScore[] => {
  return Object.entries(zoneQuestionMap).map(([zone, keys]) => {
    const sum = keys.reduce((acc, key) => acc + questionScores[key], 0);
    return {
      zone: zone as ZoneScore["zone"],
      score: safeRound(sum / keys.length),
    };
  });
};

const deriveRiskFlags = (
  answers: PsychoAnswers,
  questionScores: Record<PsychoQuestionKey, number>
): RiskFlag[] => {
  const flags = new Set<RiskFlag>();

  if (answers.q14 !== "none") {
    flags.add("trauma_history");
  }

  if (answers.q10 === "often" || answers.q11 === "sometimes" || answers.q11 === "often" || answers.q12 !== "none") {
    flags.add("sleep_disruption");
  }

  const lowScoreCount = psychoQuestionKeys.filter((q) => questionScores[q] <= 50).length;
  if (lowScoreCount >= 6) {
    flags.add("chronic_tension_pattern");
  }

  return [...flags];
};

export const scorePsychosomatic = (answers: PsychoAnswers): DomainResult<PsychoScore> => {
  const scored = computeQuestionScores(answers);
  if (!scored.ok) {
    return scored;
  }

  const perQuestion = scored.value;
  const includedSum = includedInOverall.reduce((sum, key) => sum + perQuestion[key], 0);
  const overallPct = safeRound(includedSum / includedInOverall.length);

  const level = deriveLevel(overallPct);
  const zones = computeZoneScores(perQuestion);
  const zonesStrong = [...zones].filter((z) => z.score >= 75).sort((a, b) => b.score - a.score);
  const zonesGrowth = [...zones].filter((z) => z.score <= 64).sort((a, b) => a.score - b.score);
  const riskFlags = deriveRiskFlags(answers, perQuestion);
  const recommendations = deriveRecommendations(level, zonesGrowth, riskFlags);

  return ok({
    overallPct,
    includedQuestionCount: includedInOverall.length,
    perQuestion,
    level,
    zones,
    zonesStrong,
    zonesGrowth,
    riskFlags,
    recommendations,
  });
};
