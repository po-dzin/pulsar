import { err, ok } from "@/domain/common/result";
import { physicalTestByKey, physicalTests } from "@/domain/physical/catalog";
import { derivePhysicalLevel } from "@/domain/physical/interpretation";
import { derivePhysicalFullRecommendations, derivePhysicalRecommendations } from "@/domain/physical/recommendations";
import type {
  PhysicalAnswers,
  PhysicalCategoryKey,
  PhysicalCategoryScore,
  PhysicalFullScore,
  PhysicalRiskFlag,
  PhysicalResult,
  PhysicalScore,
  PhysicalTestDefinition,
  PhysicalTestKey,
} from "@/domain/physical/model";

const clampRound = (value: number): number => Math.max(0, Math.min(100, Math.round(value)));

const parseNumberInput = (
  answers: PhysicalAnswers,
  test: PhysicalTestDefinition,
  key: string
): PhysicalResult<number> => {
  const raw = answers[key];
  if (raw === undefined || raw === null || String(raw).trim() === "") {
    return err({
      code: "MISSING_ANSWERS",
      message: `Missing answer for ${key}`,
    });
  }

  const value = Number(raw);
  if (!Number.isFinite(value)) {
    return err({
      code: "INVALID_INPUT_VALUE",
      message: `Invalid numeric value for ${key}`,
      details: { key, raw },
    });
  }

  const definition = test.inputs.find((input) => input.key === key);
  if (!definition) {
    return err({ code: "UNKNOWN", message: `Unknown input ${key}` });
  }

  if ((definition.min !== undefined && value < definition.min) || (definition.max !== undefined && value > definition.max)) {
    return err({
      code: "INVALID_INPUT_VALUE",
      message: `Out of range value for ${key}`,
      details: { key, value, min: definition.min, max: definition.max },
    });
  }

  return ok(value);
};

const parseScaleInput = (
  answers: PhysicalAnswers,
  test: PhysicalTestDefinition,
  key: string
): PhysicalResult<number> => {
  const parsed = parseNumberInput(answers, test, key);
  if (!parsed.ok) return parsed;

  const value = Math.trunc(parsed.value);
  if (![1, 2, 3, 4].includes(value)) {
    return err({
      code: "INVALID_INPUT_VALUE",
      message: `Scale value for ${key} must be between 1 and 4`,
      details: { key, value },
    });
  }

  return ok(value);
};

const scoreStange = (seconds: number): number => {
  if (seconds > 90) return 100;
  if (seconds >= 61) return 75;
  if (seconds >= 41) return 50;
  return 25;
};

const scoreGenchi = (seconds: number): number => {
  if (seconds > 45) return 100;
  if (seconds > 30) return 75;
  if (seconds >= 20) return 50;
  return 25;
};

const scoreRuffier = (index: number): number => {
  if (index < 3) return 100;
  if (index <= 6) return 75;
  if (index <= 10) return 50;
  return 25;
};

const scoreLegSwingsPct = (pct: number): number => {
  if (pct < 70) return 100;
  if (pct < 80) return 75;
  if (pct < 90) return 50;
  return 25;
};

const scorePlankOrWallSit = (seconds: number): number => {
  if (seconds > 120) return 100;
  if (seconds >= 61) return 75;
  if (seconds >= 30) return 50;
  return 25;
};

const scoreScale14 = (value: number): number => {
  if (value >= 4) return 100;
  if (value >= 3) return 75;
  if (value >= 2) return 50;
  return 25;
};

const scoreDynamicBalance = (seconds: number): number => {
  if (seconds > 60) return 100;
  if (seconds >= 46) return 75;
  if (seconds >= 31) return 50;
  return 25;
};

const scoreStaticBalance = (seconds: number): number => {
  if (seconds > 40) return 100;
  if (seconds > 20) return 75;
  if (seconds >= 10) return 50;
  return 25;
};

const scoreBreathingBalance = (ratio: number): number => {
  if (ratio < 1.0) return 25;
  if (ratio < 1.4) return 50;
  if (ratio <= 2.2) return 100;
  if (ratio <= 2.8) return 75;
  return 50;
};

const asymmetryPct = (a: number, b: number): number => {
  const maxValue = Math.max(a, b);
  if (maxValue <= 0) return 0;
  return Math.abs(a - b) / maxValue * 100;
};

type ComputedScore = {
  score: number;
  perInput: Record<string, number | string>;
  riskFlags: PhysicalRiskFlag[];
};

const computeScore = (test: PhysicalTestDefinition, answers: PhysicalAnswers): PhysicalResult<ComputedScore> => {
  switch (test.key) {
    case "stange": {
      const sec = parseNumberInput(answers, test, "stange_sec");
      if (!sec.ok) return sec;
      return ok({ score: scoreStange(sec.value), perInput: { stange_sec: sec.value }, riskFlags: [] });
    }

    case "genchi": {
      const sec = parseNumberInput(answers, test, "genchi_sec");
      if (!sec.ok) return sec;
      const flags: PhysicalRiskFlag[] = sec.value < 20 ? ["stress_ns"] : [];
      return ok({ score: scoreGenchi(sec.value), perInput: { genchi_sec: sec.value }, riskFlags: flags });
    }

    case "ruffier": {
      const p1 = parseNumberInput(answers, test, "ruffier_p1");
      if (!p1.ok) return p1;
      const p2 = parseNumberInput(answers, test, "ruffier_p2");
      if (!p2.ok) return p2;
      const p3 = parseNumberInput(answers, test, "ruffier_p3");
      if (!p3.ok) return p3;

      const index = (p1.value + p2.value + p3.value - 200) / 10;
      return ok({
        score: scoreRuffier(index),
        perInput: {
          ruffier_p1: p1.value,
          ruffier_p2: p2.value,
          ruffier_p3: p3.value,
          ruffier_index: Number(index.toFixed(2)),
        },
        riskFlags: [],
      });
    }

    case "leg_swings": {
      const bpm = parseNumberInput(answers, test, "leg_swings_bpm");
      if (!bpm.ok) return bpm;
      const age = parseNumberInput(answers, test, "age_years");
      if (!age.ok) return age;

      const maxHr = 220 - age.value;
      if (maxHr <= 0) {
        return err({
          code: "INVALID_INPUT_VALUE",
          message: "Age produces invalid max HR",
          details: { age: age.value },
        });
      }

      const pct = bpm.value / maxHr * 100;
      const flags: PhysicalRiskFlag[] = pct >= 90 ? ["zone5_leg_swings"] : [];
      return ok({
        score: scoreLegSwingsPct(pct),
        perInput: {
          leg_swings_bpm: bpm.value,
          age_years: age.value,
          leg_swings_pct_max_hr: Number(pct.toFixed(2)),
        },
        riskFlags: flags,
      });
    }

    case "plank": {
      const sec = parseNumberInput(answers, test, "plank_sec");
      if (!sec.ok) return sec;
      return ok({ score: scorePlankOrWallSit(sec.value), perInput: { plank_sec: sec.value }, riskFlags: [] });
    }

    case "wall_sit": {
      const sec = parseNumberInput(answers, test, "wall_sit_sec");
      if (!sec.ok) return sec;
      return ok({ score: scorePlankOrWallSit(sec.value), perInput: { wall_sit_sec: sec.value }, riskFlags: [] });
    }

    case "forward_bend": {
      const level = parseScaleInput(answers, test, "forward_bend_level");
      if (!level.ok) return level;
      return ok({ score: scoreScale14(level.value), perInput: { forward_bend_level: level.value }, riskFlags: [] });
    }

    case "shoulders_lock": {
      const right = parseScaleInput(answers, test, "shoulders_right_level");
      if (!right.ok) return right;
      const left = parseScaleInput(answers, test, "shoulders_left_level");
      if (!left.ok) return left;

      const rightPct = scoreScale14(right.value);
      const leftPct = scoreScale14(left.value);
      const avgPct = clampRound((rightPct + leftPct) / 2);
      const flags: PhysicalRiskFlag[] = Math.abs(rightPct - leftPct) >= 25 ? ["shoulder_asymmetry"] : [];

      return ok({
        score: avgPct,
        perInput: {
          shoulders_right_level: right.value,
          shoulders_left_level: left.value,
          shoulders_right_pct: rightPct,
          shoulders_left_pct: leftPct,
          shoulders_avg_pct: avgPct,
        },
        riskFlags: flags,
      });
    }

    case "dynamic_balance": {
      const right = parseNumberInput(answers, test, "dynamic_right_sec");
      if (!right.ok) return right;
      const left = parseNumberInput(answers, test, "dynamic_left_sec");
      if (!left.ok) return left;

      const avg = (right.value + left.value) / 2;
      const flags: PhysicalRiskFlag[] = asymmetryPct(right.value, left.value) >= 15 ? ["dynamic_balance_asymmetry"] : [];

      return ok({
        score: scoreDynamicBalance(avg),
        perInput: {
          dynamic_right_sec: right.value,
          dynamic_left_sec: left.value,
          dynamic_avg_sec: Number(avg.toFixed(2)),
          dynamic_asymmetry_pct: Number(asymmetryPct(right.value, left.value).toFixed(2)),
        },
        riskFlags: flags,
      });
    }

    case "static_balance": {
      const right = parseNumberInput(answers, test, "static_right_sec");
      if (!right.ok) return right;
      const left = parseNumberInput(answers, test, "static_left_sec");
      if (!left.ok) return left;

      const avg = (right.value + left.value) / 2;
      const flags: PhysicalRiskFlag[] = asymmetryPct(right.value, left.value) >= 15 ? ["static_balance_asymmetry"] : [];

      return ok({
        score: scoreStaticBalance(avg),
        perInput: {
          static_right_sec: right.value,
          static_left_sec: left.value,
          static_avg_sec: Number(avg.toFixed(2)),
          static_asymmetry_pct: Number(asymmetryPct(right.value, left.value).toFixed(2)),
        },
        riskFlags: flags,
      });
    }

    default:
      return err({ code: "UNKNOWN_TEST", message: `Unknown physical test: ${test.key}` });
  }
};

export const scorePhysicalTest = (testKey: PhysicalTestKey, answers: PhysicalAnswers): PhysicalResult<PhysicalScore> => {
  const test = physicalTestByKey[testKey];
  if (!test) {
    return err({
      code: "UNKNOWN_TEST",
      message: `Unknown physical test: ${testKey}`,
    });
  }

  const computed = computeScore(test, answers);
  if (!computed.ok) {
    return computed;
  }

  const overallPct = clampRound(computed.value.score);
  const level = derivePhysicalLevel(overallPct);
  const recommendations = derivePhysicalRecommendations(level, test.category, test.key, computed.value.riskFlags);

  return ok({
    testKey,
    category: test.category,
    overallPct,
    perInput: computed.value.perInput,
    level,
    riskFlags: computed.value.riskFlags,
    recommendations,
  });
};

const average = (values: number[]): number => values.reduce((sum, value) => sum + value, 0) / values.length;

const categoryFromScores = (
  category: PhysicalCategoryKey,
  testScores: Record<PhysicalTestKey, number>,
  extra?: number
): PhysicalCategoryScore => {
  const tests = physicalTests.filter((test) => test.category === category);
  const scores = tests.map((test) => testScores[test.key]);
  if (extra !== undefined) {
    scores.push(extra);
  }

  const overallPct = clampRound(average(scores));
  return {
    category,
    overallPct,
    level: derivePhysicalLevel(overallPct),
    tests: tests.map((test) => ({ testKey: test.key, overallPct: testScores[test.key] })),
  };
};

export const scorePhysicalFullTest = (answers: PhysicalAnswers): PhysicalResult<PhysicalFullScore> => {
  const testScores = {} as Record<PhysicalTestKey, number>;
  const perInput: Record<string, number | string> = {};
  const flags = new Set<PhysicalRiskFlag>();

  for (const test of physicalTests) {
    const computed = computeScore(test, answers);
    if (!computed.ok) {
      return computed;
    }

    testScores[test.key] = clampRound(computed.value.score);
    Object.assign(perInput, computed.value.perInput);
    computed.value.riskFlags.forEach((flag) => flags.add(flag));
  }

  const stangeSec = Number(perInput.stange_sec);
  const genchiSec = Number(perInput.genchi_sec);
  if (!Number.isFinite(stangeSec) || !Number.isFinite(genchiSec) || genchiSec <= 0) {
    return err({
      code: "INVALID_INPUT_VALUE",
      message: "Invalid breathing inputs for balance coefficient",
      details: { stangeSec, genchiSec },
    });
  }

  const breathingBalanceRatio = stangeSec / genchiSec;
  const breathingBalanceScore = scoreBreathingBalance(breathingBalanceRatio);
  perInput.breathing_balance_ratio = Number(breathingBalanceRatio.toFixed(2));
  perInput.breathing_balance_pct = breathingBalanceScore;

  if (breathingBalanceRatio < 1.0 || breathingBalanceRatio > 2.8) {
    flags.add("critical_breathing_imbalance");
  }

  const categories: PhysicalCategoryScore[] = [
    categoryFromScores("breathing", testScores, breathingBalanceScore),
    categoryFromScores("cardio_strength", testScores),
    categoryFromScores("strength_endurance", testScores),
    categoryFromScores("flexibility", testScores),
    categoryFromScores("coordination_balance", testScores),
  ];

  const overallPct = clampRound(average(categories.map((item) => item.overallPct)));
  const level = derivePhysicalLevel(overallPct);
  const riskFlags = Array.from(flags);
  const recommendations = derivePhysicalFullRecommendations({
    overallPct,
    level,
    categories,
    tests: testScores,
    perInput,
    riskFlags,
  });

  return ok({
    overallPct,
    level,
    categories,
    tests: testScores,
    perInput,
    riskFlags,
    recommendations,
  });
};
