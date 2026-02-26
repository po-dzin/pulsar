import fc from "fast-check";
import { describe, expect, test } from "vitest";
import { deriveLevel } from "@/domain/psychosomatic/interpretation";
import { type AnswerValue, type PsychoAnswers, type PsychoQuestionKey } from "@/domain/psychosomatic/model";
import { scorePsychosomatic } from "@/domain/psychosomatic/scoring";

const answerArb = fc.constantFrom<AnswerValue>("none", "rare", "sometimes", "often");
const keyArb = fc.constantFrom<PsychoQuestionKey>(
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
  "q16"
);
const answersArb: fc.Arbitrary<PsychoAnswers> = fc.record({
  q1: answerArb,
  q2: answerArb,
  q3: answerArb,
  q4: answerArb,
  q5: answerArb,
  q6: answerArb,
  q7: answerArb,
  q8: answerArb,
  q9: answerArb,
  q10: answerArb,
  q11: answerArb,
  q12: answerArb,
  q13: answerArb,
  q14: answerArb,
  q15: answerArb,
  q16: answerArb,
});

const severity: Record<AnswerValue, number> = {
  none: 0,
  rare: 1,
  sometimes: 2,
  often: 3,
};

const worsenByOne = (value: AnswerValue): AnswerValue => {
  if (value === "none") return "rare";
  if (value === "rare") return "sometimes";
  if (value === "sometimes") return "often";
  return "often";
};

const expectScored = (answers: PsychoAnswers) => {
  const result = scorePsychosomatic(answers);
  expect(result.ok).toBe(true);
  if (!result.ok) {
    throw new Error(result.error.message);
  }
  return result.value;
};

describe("psychosomatic scoring (property)", () => {
  test("overall_pct is always within 0..100 for any valid answer set", () => {
    fc.assert(
      fc.property(answersArb, (answers) => {
        const scored = expectScored(answers);
        return scored.overallPct >= 0 && scored.overallPct <= 100;
      })
    );
  });

  test("determinism: same answers always produce the same result payload", () => {
    fc.assert(
      fc.property(answersArb, (answers) => {
        const a = expectScored(answers);
        const b = expectScored(answers);
        return JSON.stringify(a) === JSON.stringify(b);
      })
    );
  });

  test("monotonicity: worsening an answer cannot increase overall_pct", () => {
    fc.assert(
      fc.property(answersArb, keyArb, (answers, key) => {
        if (key === "q14") {
          return true;
        }

        const before = expectScored(answers);
        const worsened = { ...answers, [key]: worsenByOne(answers[key]) };
        if (severity[worsened[key]] < severity[answers[key]]) {
          return true;
        }

        const after = expectScored(worsened);
        return after.overallPct <= before.overallPct;
      })
    );
  });

  test("Q14 value changes risk flags but does not change overall_pct", () => {
    fc.assert(
      fc.property(answersArb, (answers) => {
        const withNone = expectScored({ ...answers, q14: "none" });
        const withOften = expectScored({ ...answers, q14: "often" });
        return withNone.overallPct === withOften.overallPct && withOften.riskFlags.includes("trauma_history");
      })
    );
  });

  test("level mapping is total: every overall_pct has exactly one level", () => {
    const allowed = new Set(["resource", "background_tension", "persistent_clamps", "defense_mode"]);
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 100 }), (value) => {
        return allowed.has(deriveLevel(value));
      })
    );
  });
});
