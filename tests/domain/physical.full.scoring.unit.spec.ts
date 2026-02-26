import { describe, expect, it } from "vitest";
import { scorePhysicalFullTest } from "@/domain/physical/scoring";
import type { PhysicalAnswers } from "@/domain/physical/model";

const baseAnswers: PhysicalAnswers = {
  stange_sec: "70",
  genchi_sec: "35",
  ruffier_p1: "70",
  ruffier_p2: "110",
  ruffier_p3: "80",
  leg_swings_bpm: "140",
  age_years: "35",
  plank_sec: "65",
  wall_sit_sec: "70",
  forward_bend_level: "3",
  shoulders_right_level: "3",
  shoulders_left_level: "3",
  dynamic_right_sec: "50",
  dynamic_left_sec: "48",
  static_right_sec: "32",
  static_left_sec: "28",
};

describe("scorePhysicalFullTest", () => {
  it("returns full score with 5 categories and overall level", () => {
    const result = scorePhysicalFullTest(baseAnswers);
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.value.categories).toHaveLength(5);
    expect(result.value.overallPct).toBeGreaterThanOrEqual(0);
    expect(result.value.overallPct).toBeLessThanOrEqual(100);
    expect(result.value.perInput.breathing_balance_ratio).toBe(2);
  });

  it("adds critical breathing imbalance flag when ratio is out of range", () => {
    const result = scorePhysicalFullTest({
      ...baseAnswers,
      stange_sec: "90",
      genchi_sec: "20",
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.value.riskFlags).toContain("critical_breathing_imbalance");
  });

  it("fails when one of required answers is missing", () => {
    const missingOne = { ...baseAnswers };
    delete missingOne.static_left_sec;
    const result = scorePhysicalFullTest(missingOne);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe("MISSING_ANSWERS");
  });
});
