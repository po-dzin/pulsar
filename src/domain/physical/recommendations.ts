import { physicalLevelMeta } from "@/domain/physical/levelMeta";
import type {
  PhysicalCategoryScore,
  PhysicalFullScore,
  PhysicalLevel,
  PhysicalRecommendationBlock,
  PhysicalRiskFlag,
  PhysicalTestKey,
} from "@/domain/physical/model";
import {
  describeForwardBendLevel,
  interpretBreathingRatio,
  physicalCategoryFocus,
  physicalCategoryIcons,
  physicalCategoryInterpretationByLevel,
  physicalCategoryShortTitle,
  physicalFlagHints,
  physicalLevelBlocks,
  physicalOverallInterpretation,
  physicalTestFocus,
  physicalTestMark,
} from "@/domain/physical/source";

const asNumber = (value: number | string | undefined): number | null => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

export const derivePhysicalRecommendations = (
  level: PhysicalLevel,
  category: keyof typeof physicalCategoryFocus,
  testKey: PhysicalTestKey,
  flags: PhysicalRiskFlag[]
): PhysicalRecommendationBlock[] => {
  const blocks: PhysicalRecommendationBlock[] = [...physicalLevelBlocks[level]];

  blocks.push({
    title: { ru: "Фокус категории", en: "Category focus" },
    items: [physicalCategoryFocus[category]],
  });

  blocks.push({
    title: { ru: "Фокус теста", en: "Test focus" },
    items: [physicalTestFocus[testKey]],
  });

  if (flags.length > 0) {
    blocks.push({
      title: { ru: "Диагностические флаги", en: "Diagnostic flags" },
      items: flags.map((flag) => physicalFlagHints[flag]),
    });
  }

  return blocks;
};

const weakestCategoriesBlock = (categories: PhysicalCategoryScore[]): PhysicalRecommendationBlock => {
  const weakest = [...categories]
    .sort((a, b) => a.overallPct - b.overallPct)
    .slice(0, 2)
    .map((item) => physicalCategoryFocus[item.category]);

  return {
    title: { ru: "Приоритетные зоны", en: "Priority zones" },
    items: weakest.length > 0 ? weakest : [{ ru: "Слабые зоны не обнаружены", en: "No weak zones detected" }],
  };
};

const overallInterpretationBlock = (level: PhysicalLevel): PhysicalRecommendationBlock => ({
  title: { ru: "Интерпретация общего уровня", en: "Overall level interpretation" },
  items: physicalOverallInterpretation[level],
});

const categoryInterpretationBlock = (categories: PhysicalCategoryScore[]): PhysicalRecommendationBlock => {
  const sorted = [...categories].sort((a, b) => a.overallPct - b.overallPct);

  return {
    title: { ru: "Интерпретация по категориям", en: "Category interpretation" },
    items: sorted.map((category) => {
      const level = physicalLevelMeta[category.level];
      const baseText = physicalCategoryInterpretationByLevel[category.category][category.level];
      const titleRu = physicalCategoryShortTitle[category.category].ru;
      const titleEn = physicalCategoryShortTitle[category.category].en;
      const icon = physicalCategoryIcons[category.category];
      return {
        ru: `${icon} ${titleRu} — ${level.emoji} ${level.label.ru} (${category.overallPct}%): ${baseText.ru}`,
        en: `${icon} ${titleEn} — ${level.emoji} ${level.label.en} (${category.overallPct}%): ${baseText.en}`,
      };
    }),
  };
};

const perTestInterpretationBlock = (
  score: Pick<PhysicalFullScore, "tests" | "perInput">
): PhysicalRecommendationBlock => {
  const stange = asNumber(score.perInput.stange_sec) ?? 0;
  const genchi = asNumber(score.perInput.genchi_sec) ?? 0;
  const ratio = asNumber(score.perInput.breathing_balance_ratio) ?? 0;
  const ruffierIndex = asNumber(score.perInput.ruffier_index) ?? 0;
  const legSwingsPct = asNumber(score.perInput.leg_swings_pct_max_hr) ?? 0;
  const legSwingsBpm = asNumber(score.perInput.leg_swings_bpm) ?? 0;
  const ageYears = asNumber(score.perInput.age_years) ?? 0;
  const plank = asNumber(score.perInput.plank_sec) ?? 0;
  const wallSit = asNumber(score.perInput.wall_sit_sec) ?? 0;
  const forwardBendLevel = asNumber(score.perInput.forward_bend_level) ?? 0;
  const shouldersRight = asNumber(score.perInput.shoulders_right_level) ?? 0;
  const shouldersLeft = asNumber(score.perInput.shoulders_left_level) ?? 0;
  const dynamicAvg = asNumber(score.perInput.dynamic_avg_sec) ?? 0;
  const dynamicAsym = asNumber(score.perInput.dynamic_asymmetry_pct) ?? 0;
  const staticAvg = asNumber(score.perInput.static_avg_sec) ?? 0;
  const staticAsym = asNumber(score.perInput.static_asymmetry_pct) ?? 0;

  const markStange = physicalTestMark(score.tests.stange);
  const markGenchi = physicalTestMark(score.tests.genchi);
  const markRuffier = physicalTestMark(score.tests.ruffier);
  const markLegSwings = physicalTestMark(score.tests.leg_swings);
  const markPlank = physicalTestMark(score.tests.plank);
  const markWallSit = physicalTestMark(score.tests.wall_sit);
  const markForwardBend = physicalTestMark(score.tests.forward_bend);
  const markShoulders = physicalTestMark(score.tests.shoulders_lock);
  const markDynamic = physicalTestMark(score.tests.dynamic_balance);
  const markStatic = physicalTestMark(score.tests.static_balance);

  const forwardBendDesc = describeForwardBendLevel(forwardBendLevel);
  const shoulderAsymLevels = Math.abs(shouldersRight - shouldersLeft);
  const legSwingsMaxHr = ageYears > 0 ? 220 - ageYears : 0;
  const ratioText = interpretBreathingRatio(ratio);

  return {
    title: { ru: "Интерпретация по каждой метрике", en: "Per-metric interpretation" },
    items: [
      {
        ru: `🫁 Штанге: ${stange} сек → ${markStange.emoji} ${markStange.ru} (≤40 / 41-60 / 61-90 / >90).`,
        en: `🫁 Stange: ${stange}s → ${markStange.emoji} ${markStange.en} (≤40 / 41-60 / 61-90 / >90).`,
      },
      {
        ru: `🫁 Генчи: ${genchi} сек → ${markGenchi.emoji} ${markGenchi.ru} (<20 / 21-30 / 31-45 / >45).`,
        en: `🫁 Genchi: ${genchi}s → ${markGenchi.emoji} ${markGenchi.en} (<20 / 21-30 / 31-45 / >45).`,
      },
      {
        ru: `🫁 Коэффициент баланса (Штанге/Генчи): ${ratio.toFixed(2)}. ${ratioText.ru}`,
        en: `🫁 Balance coefficient (Stange/Genchi): ${ratio.toFixed(2)}. ${ratioText.en}`,
      },
      {
        ru: `💪 Индекс Руфье: ${ruffierIndex.toFixed(2)} → ${markRuffier.emoji} ${markRuffier.ru} (<3 / 3-6 / 6-10 / >10).`,
        en: `💪 Ruffier index: ${ruffierIndex.toFixed(2)} → ${markRuffier.emoji} ${markRuffier.en} (<3 / 3-6 / 6-10 / >10).`,
      },
      {
        ru: `💪 Махи ногами: ${legSwingsBpm} BPM (${legSwingsPct.toFixed(1)}% от макс. ${legSwingsMaxHr}) → ${markLegSwings.emoji} ${markLegSwings.ru}.`,
        en: `💪 Leg Swings: ${legSwingsBpm} BPM (${legSwingsPct.toFixed(1)}% of max ${legSwingsMaxHr}) → ${markLegSwings.emoji} ${markLegSwings.en}.`,
      },
      {
        ru: `🔥 Планка: ${plank} сек → ${markPlank.emoji} ${markPlank.ru} (<30 / 30-60 / 61-120 / >120).`,
        en: `🔥 Plank: ${plank}s → ${markPlank.emoji} ${markPlank.en} (<30 / 30-60 / 61-120 / >120).`,
      },
      {
        ru: `🔥 Присед у стены: ${wallSit} сек → ${markWallSit.emoji} ${markWallSit.ru} (<30 / 31-60 / 61-120 / >120).`,
        en: `🔥 Wall Sit: ${wallSit}s → ${markWallSit.emoji} ${markWallSit.en} (<30 / 31-60 / 61-120 / >120).`,
      },
      {
        ru: `🤸 Наклон вперед: уровень ${forwardBendLevel} (${forwardBendDesc.ru}) → ${markForwardBend.emoji} ${markForwardBend.ru}.`,
        en: `🤸 Forward Bend: level ${forwardBendLevel} (${forwardBendDesc.en}) → ${markForwardBend.emoji} ${markForwardBend.en}.`,
      },
      {
        ru: `🤸 Плечи-замок: право ${shouldersRight}, лево ${shouldersLeft} → ${markShoulders.emoji} ${markShoulders.ru}.${shoulderAsymLevels >= 2 ? " ⚠️ Асимметрия ≥ 2 уровней." : ""}`,
        en: `🤸 Shoulders lock: right ${shouldersRight}, left ${shouldersLeft} → ${markShoulders.emoji} ${markShoulders.en}.${shoulderAsymLevels >= 2 ? " ⚠️ Asymmetry ≥ 2 levels." : ""}`,
      },
      {
        ru: `⚖️ Динамический баланс: среднее ${dynamicAvg.toFixed(1)} сек, асимметрия ${dynamicAsym.toFixed(1)}% → ${markDynamic.emoji} ${markDynamic.ru}.`,
        en: `⚖️ Dynamic balance: avg ${dynamicAvg.toFixed(1)}s, asymmetry ${dynamicAsym.toFixed(1)}% → ${markDynamic.emoji} ${markDynamic.en}.`,
      },
      {
        ru: `⚖️ Статический баланс: среднее ${staticAvg.toFixed(1)} сек, асимметрия ${staticAsym.toFixed(1)}% → ${markStatic.emoji} ${markStatic.ru}.`,
        en: `⚖️ Static balance: avg ${staticAvg.toFixed(1)}s, asymmetry ${staticAsym.toFixed(1)}% → ${markStatic.emoji} ${markStatic.en}.`,
      },
    ],
  };
};

const retestBlock = (overallPct: number): PhysicalRecommendationBlock => {
  if (overallPct < 40) {
    return {
      title: { ru: "Ретест", en: "Retest" },
      items: [{ ru: "Повтори тест через 4 недели после мягкого восстановительного цикла.", en: "Retest in 4 weeks after a gentle recovery cycle." }],
    };
  }
  if (overallPct < 60) {
    return {
      title: { ru: "Ретест", en: "Retest" },
      items: [{ ru: "Повтори тест через 4-6 недель.", en: "Retest in 4-6 weeks." }],
    };
  }
  if (overallPct < 75) {
    return {
      title: { ru: "Ретест", en: "Retest" },
      items: [{ ru: "Повтори тест через 6-8 недель.", en: "Retest in 6-8 weeks." }],
    };
  }
  return {
    title: { ru: "Ретест", en: "Retest" },
    items: [{ ru: "Повтори тест через 8-12 недель для контроля прогресса.", en: "Retest in 8-12 weeks to track progress." }],
  };
};

export const derivePhysicalFullRecommendations = (
  score: Pick<PhysicalFullScore, "overallPct" | "level" | "categories" | "riskFlags" | "tests" | "perInput">
): PhysicalRecommendationBlock[] => {
  const blocks: PhysicalRecommendationBlock[] = [...physicalLevelBlocks[score.level]];

  blocks.unshift(overallInterpretationBlock(score.level));
  blocks.push(perTestInterpretationBlock(score));
  blocks.push(categoryInterpretationBlock(score.categories));
  blocks.push(weakestCategoriesBlock(score.categories));
  blocks.push(retestBlock(score.overallPct));

  if (score.riskFlags.length > 0) {
    blocks.push({
      title: { ru: "Диагностические флаги", en: "Diagnostic flags" },
      items: score.riskFlags.map((flag) => physicalFlagHints[flag]),
    });
  }

  return blocks;
};
