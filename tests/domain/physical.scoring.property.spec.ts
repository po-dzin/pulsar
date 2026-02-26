import { describe, expect, test } from "vitest";
import fc from "fast-check";
import { scorePhysicalTest } from "@/domain/physical/scoring";

describe("physical scoring (property)", () => {
  test("overall_pct is always in 0..100 for plank", () => {
    fc.assert(
      fc.property(fc.integer({ min: 1, max: 600 }), (seconds) => {
        const score = scorePhysicalTest("plank", { plank_sec: String(seconds) });
        expect(score.ok).toBe(true);
        if (!score.ok) return;
        expect(score.value.overallPct).toBeGreaterThanOrEqual(0);
        expect(score.value.overallPct).toBeLessThanOrEqual(100);
      })
    );
  });

  test("deterministic for identical input", () => {
    fc.assert(
      fc.property(fc.integer({ min: 1, max: 180 }), fc.integer({ min: 12, max: 90 }), (bpm, age) => {
        const a = scorePhysicalTest("leg_swings", { leg_swings_bpm: String(bpm), age_years: String(age) });
        const b = scorePhysicalTest("leg_swings", { leg_swings_bpm: String(bpm), age_years: String(age) });
        expect(a).toEqual(b);
      })
    );
  });

  test("stange score is monotonic on increasing seconds", () => {
    fc.assert(
      fc.property(fc.integer({ min: 1, max: 239 }), (sec) => {
        const low = scorePhysicalTest("stange", { stange_sec: String(sec) });
        const high = scorePhysicalTest("stange", { stange_sec: String(sec + 1) });
        expect(low.ok).toBe(true);
        expect(high.ok).toBe(true);
        if (!low.ok || !high.ok) return;
        expect(high.value.overallPct).toBeGreaterThanOrEqual(low.value.overallPct);
      })
    );
  });
});
