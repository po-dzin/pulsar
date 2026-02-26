import { describe, expect, test } from "vitest";
import { scorePhysicalTest } from "@/domain/physical/scoring";

describe("physical scoring (unit)", () => {
  test("stange > 90 sec returns excellent 100", () => {
    const score = scorePhysicalTest("stange", { stange_sec: "95" });
    expect(score.ok).toBe(true);
    if (!score.ok) return;
    expect(score.value.overallPct).toBe(100);
    expect(score.value.level).toBe("excellent");
  });

  test("genchi < 20 sec sets stress_ns flag", () => {
    const score = scorePhysicalTest("genchi", { genchi_sec: "18" });
    expect(score.ok).toBe(true);
    if (!score.ok) return;
    expect(score.value.riskFlags).toContain("stress_ns");
  });

  test("ruffier index is computed from p1+p2+p3", () => {
    const score = scorePhysicalTest("ruffier", {
      ruffier_p1: "60",
      ruffier_p2: "120",
      ruffier_p3: "80",
    });
    expect(score.ok).toBe(true);
    if (!score.ok) return;
    expect(score.value.perInput.ruffier_index).toBe(6);
    expect(score.value.overallPct).toBe(75);
  });

  test("fails when input is missing", () => {
    const score = scorePhysicalTest("leg_swings", { leg_swings_bpm: "160" });
    expect(score.ok).toBe(false);
    if (score.ok) return;
    expect(score.error.code).toBe("MISSING_ANSWERS");
  });
});
