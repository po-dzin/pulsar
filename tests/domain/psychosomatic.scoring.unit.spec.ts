import { describe, expect, test } from "vitest";
import { deriveLevel } from "@/domain/psychosomatic/interpretation";
import {
  psychoQuestionKeys,
  scoreMapBase,
  type AnswerValue,
  type PsychoAnswers,
} from "@/domain/psychosomatic/model";
import { scorePsychosomatic } from "@/domain/psychosomatic/scoring";

const buildAnswers = (defaultValue: AnswerValue = "none"): PsychoAnswers => {
  return psychoQuestionKeys.reduce((acc, key) => {
    acc[key] = defaultValue;
    return acc;
  }, {} as PsychoAnswers);
};

const expectScored = (answers: PsychoAnswers) => {
  const result = scorePsychosomatic(answers);
  expect(result.ok).toBe(true);
  if (!result.ok) {
    throw new Error(result.error.message);
  }
  return result.value;
};

describe("psychosomatic scoring (unit)", () => {
  test("maps each base answer to numeric score", () => {
    const expected: Array<[AnswerValue, number]> = Object.entries(scoreMapBase) as Array<[AnswerValue, number]>;
    for (const [answer, score] of expected) {
      const input = buildAnswers("none");
      input.q1 = answer;
      const scored = expectScored(input);
      expect(scored.perQuestion.q1).toBe(score);
    }
  });

  test("maps Q11 sleep options to the same scoring map", () => {
    const input = buildAnswers("none");
    input.q11 = "often";
    const scored = expectScored(input);
    expect(scored.perQuestion.q11).toBe(25);
  });

  test("maps Q12 energy options to the same scoring map", () => {
    const input = buildAnswers("none");
    input.q12 = "rare";
    const scored = expectScored(input);
    expect(scored.perQuestion.q12).toBe(75);
  });

  test("excludes Q14 from overall percentage calculation", () => {
    const baseline = buildAnswers("none");
    const withQ14Risk = buildAnswers("none");
    withQ14Risk.q14 = "often";

    const resultA = expectScored(baseline);
    const resultB = expectScored(withQ14Risk);

    expect(resultA.overallPct).toBe(100);
    expect(resultB.overallPct).toBe(100);
  });

  test("adds trauma risk flag when Q14 is not none", () => {
    const input = buildAnswers("none");
    input.q14 = "sometimes";
    const scored = expectScored(input);
    expect(scored.riskFlags).toContain("trauma_history");
  });

  test("computes overall_pct as round(sum(Q1..Q13,Q15,Q16)/15)", () => {
    const input = buildAnswers("none");
    input.q1 = "often";
    const scored = expectScored(input);
    expect(scored.overallPct).toBe(95);
    expect(scored.includedQuestionCount).toBe(15);
  });

  test("maps overall_pct to level boundaries: 85/65/45", () => {
    expect(deriveLevel(85)).toBe("resource");
    expect(deriveLevel(84)).toBe("background_tension");
    expect(deriveLevel(65)).toBe("background_tension");
    expect(deriveLevel(64)).toBe("persistent_clamps");
    expect(deriveLevel(45)).toBe("persistent_clamps");
    expect(deriveLevel(44)).toBe("defense_mode");
  });

  test("produces deterministic recommendations for identical input", () => {
    const input = buildAnswers("sometimes");
    input.q14 = "none";

    const a = expectScored(input);
    const b = expectScored(input);

    expect(a.recommendations).toEqual(b.recommendations);
  });
});
