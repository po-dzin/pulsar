import { describe, expect, test } from "vitest";
import { psychosomaticQuestions } from "@/domain/psychosomatic/questions";
import { physicalCategoryTitles, physicalTests } from "@/domain/physical/catalog";
import { derivePhysicalRecommendations } from "@/domain/physical/recommendations";
import type { Locale } from "@/domain/psychosomatic/model";
import type { PhysicalLevel, PhysicalRiskFlag } from "@/domain/physical/model";

const locales: Locale[] = ["ru", "en"];
const levels: PhysicalLevel[] = ["excellent", "stable", "attention", "critical"];
const flags: PhysicalRiskFlag[] = [
  "stress_ns",
  "critical_breathing_imbalance",
  "zone5_leg_swings",
  "shoulder_asymmetry",
  "dynamic_balance_asymmetry",
  "static_balance_asymmetry",
];

const expectLocalized = (value: Record<Locale, string>, path: string) => {
  for (const locale of locales) {
    expect(typeof value[locale], `${path}.${locale} should be string`).toBe("string");
    expect(value[locale]?.trim().length, `${path}.${locale} should not be empty`).toBeGreaterThan(0);
  }
};

describe("spec completeness", () => {
  test("psychosomatic test has exactly 16 questions", () => {
    expect(psychosomaticQuestions).toHaveLength(16);
    expect(new Set(psychosomaticQuestions.map((q) => q.key)).size).toBe(16);
  });

  test("physical catalog has exactly 10 tests across 5 categories", () => {
    expect(physicalTests).toHaveLength(10);
    expect(Object.keys(physicalCategoryTitles)).toHaveLength(5);
    expect(new Set(physicalTests.map((t) => t.key)).size).toBe(10);
    expect(new Set(physicalTests.map((t) => t.category)).size).toBe(5);
  });

  test("physical tests have non-empty RU/EN titles, descriptions, protocols and inputs", () => {
    for (const physicalTest of physicalTests) {
      expectLocalized(physicalTest.title, `${physicalTest.key}.title`);
      expectLocalized(physicalTest.description, `${physicalTest.key}.description`);

      for (const locale of locales) {
        expect(Array.isArray(physicalTest.protocol[locale]), `${physicalTest.key}.protocol.${locale} should be array`).toBe(true);
        expect(physicalTest.protocol[locale].length, `${physicalTest.key}.protocol.${locale} should have steps`).toBeGreaterThan(0);
        for (const [idx, step] of physicalTest.protocol[locale].entries()) {
          expect(step.trim().length, `${physicalTest.key}.protocol.${locale}[${idx}] should not be empty`).toBeGreaterThan(0);
        }
      }

      expect(physicalTest.inputs.length, `${physicalTest.key}.inputs should not be empty`).toBeGreaterThan(0);
      for (const input of physicalTest.inputs) {
        expectLocalized(input.title, `${physicalTest.key}.${input.key}.title`);
        expectLocalized(input.hint, `${physicalTest.key}.${input.key}.hint`);

        if (input.type === "scale") {
          expect(input.scaleLabels, `${physicalTest.key}.${input.key}.scaleLabels should exist`).toBeDefined();
          for (const [scaleValue, labels] of Object.entries(input.scaleLabels ?? {})) {
            expectLocalized(labels, `${physicalTest.key}.${input.key}.scaleLabels.${scaleValue}`);
          }
        }
      }
    }
  });

  test("physical recommendation blocks are localized for each level and test", () => {
    for (const physicalTest of physicalTests) {
      for (const level of levels) {
        const recommendationBlocks = derivePhysicalRecommendations(level, physicalTest.category, physicalTest.key, flags);
        expect(recommendationBlocks.length, `${physicalTest.key}.${level} should return blocks`).toBeGreaterThan(0);

        for (const [blockIndex, block] of recommendationBlocks.entries()) {
          expectLocalized(block.title, `${physicalTest.key}.${level}.block[${blockIndex}].title`);
          expect(block.items.length, `${physicalTest.key}.${level}.block[${blockIndex}] items`).toBeGreaterThan(0);
          for (const [itemIndex, item] of block.items.entries()) {
            expectLocalized(item, `${physicalTest.key}.${level}.block[${blockIndex}].item[${itemIndex}]`);
          }
        }
      }
    }
  });
});
