import type { PsychoLevel, RecommendationBlock, RiskFlag, ZoneScore } from "@/domain/psychosomatic/model";

const levelPlans: Record<PsychoLevel, RecommendationBlock[]> = {
  resource: [
    {
      title: { en: "Daily rhythm (10-15 min)", ru: "Дневной ритм (10-15 мин)" },
      items: [
        { en: "Morning body scan", ru: "Утреннее сканирование тела" },
        { en: "Conscious breathing 5-10 min", ru: "Осознанное дыхание 5-10 мин" },
        { en: "Light mobility or yoga", ru: "Легкая разминка или йога" },
        { en: "Outdoor walk", ru: "Прогулка на свежем воздухе" },
      ],
    },
    {
      title: { en: "Focus", ru: "Фокус" },
      items: [{ en: "Keep resource stable and improve subtle body awareness", ru: "Поддержание ресурса и улучшение восприятия тела" }],
    },
  ],
  background_tension: [
    {
      title: { en: "Daily regulation (15-20 min)", ru: "Ежедневная регуляция (15-20 мин)" },
      items: [
        { en: "Diaphragmatic breathing with longer exhale", ru: "Диафрагмальное дыхание с удлиненным выдохом" },
        { en: "Self-release for neck, shoulders, jaw", ru: "Самомассаж шеи, плеч и челюсти" },
        { en: "Track stress triggers in short notes", ru: "Отслеживание триггеров стресса (короткие заметки)" },
      ],
    },
    {
      title: { en: "Focus", ru: "Фокус" },
      items: [{ en: "Reduce chronic background tension and restore relaxation response", ru: "Снижение хронического фонового напряжения" }],
    },
  ],
  persistent_clamps: [
    {
      title: { en: "Priority: nervous system regulation", ru: "Приоритет: регуляция нервной системы" },
      items: [
        { en: "Box or 4-7-8 breathing", ru: "Дыхание по квадрату или 4-7-8" },
        { en: "Grounding exercises", ru: "Практики заземления" },
        { en: "Slow decompression for key body zones", ru: "Медленная декомпрессия ключевых зон" },
      ],
    },
    {
      title: { en: "Focus", ru: "Фокус" },
      items: [{ en: "Shift from survival activation to recoverable baseline", ru: "Переход из режима выживания к базовому спокойствию" }],
    },
  ],
  defense_mode: [
    {
      title: { en: "Priority: safety and stabilization", ru: "Приоритет: безопасность и стабилизация" },
      items: [
        { en: "Start with 5-10 min gentle grounding", ru: "Начните с 5-10 мин мягкого заземления" },
        { en: "Non-forcing breath observation", ru: "Мягкое наблюдение за дыханием" },
        { en: "Reduce high-intensity stressors", ru: "Снижение интенсивных стресс-факторов" },
      ],
    },
    {
      title: { en: "Focus", ru: "Фокус" },
      items: [{ en: "Restore basic felt-safety before performance goals", ru: "Восстановление базового чувства безопасности" }],
    },
  ],
};

const zoneTips: Record<string, { en: string; ru: string }> = {
  head_control: { en: "Reduce cognitive overload and jaw/head tension with short release cycles", ru: "Снижение когнитивной перегрузки, расслабление челюсти и мышц головы" },
  neck_upper: { en: "Unload neck/shoulders and rebalance responsibility load", ru: "Разгрузка шеи и плеч, переоценка уровня ответственности" },
  back_support: { en: "Support spinal endurance and perceived safety/opora", ru: "Поддержка выносливости спины и базового чувства опоры" },
  breathing_abdomen: { en: "Improve breathing depth and reduce abdominal holding", ru: "Углубление дыхания и снижение напряжения в зоне живота" },
  sleep_recovery: { en: "Rebuild sleep window and nightly downregulation", ru: "Восстановление режима сна и вечернего торможения нервной системы" },
  pelvis_safety: { en: "Work with grounding, pelvis mobility, and safety perception", ru: "Работа с заземлением, подвижностью таза и чувством безопасности" },
  emotional_marker: { en: "Decrease emotional suppression and increase safe expression", ru: "Снижение эмоционального подавления и развитие безопасного самовыражения" },
};

export const deriveRecommendations = (
  level: PsychoLevel,
  zonesGrowth: ZoneScore[],
  riskFlags: RiskFlag[]
): RecommendationBlock[] => {
  const base = levelPlans[level];
  const growth = zonesGrowth.slice(0, 2).map((zone) => zoneTips[zone.zone] ?? { en: zone.zone, ru: zone.zone });

  const riskNotes: { en: string; ru: string }[] = [];
  if (riskFlags.includes("trauma_history")) {
    riskNotes.push({ en: "Trauma history flag present: keep progression gradual and safety-oriented", ru: "Травма в анамнезе: рекомендован очень плавный прогресс" });
  }
  if (riskFlags.includes("sleep_disruption")) {
    riskNotes.push({ en: "Sleep disruption flag present: prioritize sleep rhythm before load increase", ru: "Нарушение сна: сначала нормализуйте режим сна, потом повышайте нагрузку" });
  }
  if (riskFlags.includes("chronic_tension_pattern")) {
    riskNotes.push({ en: "Chronic tension pattern detected: avoid sharp intensity spikes", ru: "Выявлен паттерн хронического напряжения: избегайте резкого повышения интенсивности" });
  }

  const dynamicBlocks: RecommendationBlock[] = [];
  if (growth.length > 0) {
    dynamicBlocks.push({
      title: { en: "Priority growth zones", ru: "Приоритетные зоны развития" },
      items: growth,
    });
  }

  if (riskNotes.length > 0) {
    dynamicBlocks.push({
      title: { en: "Risk-aware notes", ru: "Обратите внимание" },
      items: riskNotes,
    });
  }

  return [...base, ...dynamicBlocks];
};
