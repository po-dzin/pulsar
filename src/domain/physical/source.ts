import type { Locale } from "@/domain/psychosomatic/model";
import type {
  PhysicalCategoryKey,
  PhysicalLevel,
  PhysicalRecommendationBlock,
  PhysicalRiskFlag,
  PhysicalTestKey,
} from "@/domain/physical/model";

export const physicalCategoryShortTitle: Record<PhysicalCategoryKey, Record<Locale, string>> = {
  breathing: { ru: "Дыхание", en: "Breathing" },
  cardio_strength: { ru: "Кардио-сила", en: "Cardio-endurance" },
  strength_endurance: { ru: "Силовая выносливость", en: "Strength endurance" },
  flexibility: { ru: "Гибкость", en: "Flexibility" },
  coordination_balance: { ru: "Координация и баланс", en: "Coordination and balance" },
};

export const physicalCategoryIcons: Record<PhysicalCategoryKey, string> = {
  breathing: "🫁",
  cardio_strength: "💪",
  strength_endurance: "🔥",
  flexibility: "🤸",
  coordination_balance: "⚖️",
};

export const physicalLevelBlocks: Record<PhysicalLevel, PhysicalRecommendationBlock[]> = {
  excellent: [
    {
      title: { ru: "Поддержание уровня", en: "Maintain level" },
      items: [
        { ru: "Сохраняй 3-4 тренировки в неделю", en: "Keep 3-4 sessions per week" },
        { ru: "Повторяй тест раз в 8-12 недель", en: "Retest every 8-12 weeks" },
      ],
    },
  ],
  stable: [
    {
      title: { ru: "Рост без перегруза", en: "Progress without overload" },
      items: [
        { ru: "Добавь 2 акцентные сессии на слабые зоны", en: "Add 2 focused sessions for weak zones" },
        { ru: "Соблюдай сон 7-8 часов", en: "Keep 7-8 hours sleep" },
      ],
    },
  ],
  attention: [
    {
      title: { ru: "Восстановительный режим", en: "Recovery mode" },
      items: [
        { ru: "Снизь интенсивность на 2-4 недели", en: "Reduce intensity for 2-4 weeks" },
        { ru: "Сделай упор на дыхание, МФР и базовую аэробику", en: "Focus on breathwork, release and base aerobic" },
      ],
    },
  ],
  critical: [
    {
      title: { ru: "Безопасный перезапуск", en: "Safe restart" },
      items: [
        { ru: "Начни с низкоинтенсивных нагрузок 10-20 минут", en: "Start with low intensity 10-20 minutes" },
        { ru: "При стойком ухудшении обратись к врачу", en: "Consult a doctor if low results persist" },
      ],
    },
  ],
};

export const physicalOverallInterpretation: Record<PhysicalLevel, Array<Record<Locale, string>>> = {
  excellent: [
    {
      ru: "🟣 Высокий уровень общей физической адаптации: система работает стабильно и эффективно.",
      en: "🟣 High overall physical adaptation: your system is stable and efficient.",
    },
    {
      ru: "Сохраняй режим, добавляй прогрессию дозированно и контролируй динамику ретестом.",
      en: "Maintain routine, add progressive load carefully, and track with retests.",
    },
  ],
  stable: [
    {
      ru: "🟢 Хорошая функциональная база с потенциалом роста без резких нагрузок.",
      en: "🟢 Good functional base with room for progress without sharp overload.",
    },
    {
      ru: "Главная стратегия: улучшать слабые зоны, не ломая восстановление.",
      en: "Main strategy: improve weak zones without breaking recovery.",
    },
  ],
  attention: [
    {
      ru: "🟡 Средний уровень: есть ограничения в ряде систем, нужен восстановительный акцент.",
      en: "🟡 Average level: several systems are limited and need recovery focus.",
    },
    {
      ru: "Сначала база (сон, аэробика, дыхание, мобильность), затем рост интенсивности.",
      en: "Start with basics (sleep, aerobic work, breathwork, mobility), then increase intensity.",
    },
  ],
  critical: [
    {
      ru: "🔴 Низкий уровень адаптации: высокий риск перегруза даже на умеренных нагрузках.",
      en: "🔴 Low adaptation: high overload risk even under moderate loads.",
    },
    {
      ru: "Приоритет: мягкий перезапуск, контроль состояния и медицинская консультация при стойком провале.",
      en: "Priority: gentle reset, state control, and medical consult if low state persists.",
    },
  ],
};

export const physicalCategoryFocus: Record<PhysicalCategoryKey, Record<Locale, string>> = {
  breathing: {
    ru: "Фокус: дыхательные практики, работа с CO2-толерантностью и расслабление диафрагмы.",
    en: "Focus: breathwork, CO2 tolerance and diaphragm release.",
  },
  cardio_strength: {
    ru: "Фокус: кардио-база в пульсовых зонах и контроль восстановления.",
    en: "Focus: cardio base in heart-rate zones and recovery control.",
  },
  strength_endurance: {
    ru: "Фокус: базовая силовая выносливость кора и ног с постепенной прогрессией.",
    en: "Focus: core and leg endurance with progressive overload.",
  },
  flexibility: {
    ru: "Фокус: регулярная мобильность и симметрия плечевого пояса.",
    en: "Focus: regular mobility and shoulder symmetry.",
  },
  coordination_balance: {
    ru: "Фокус: баланс правой/левой стороны и нейромышечный контроль.",
    en: "Focus: right/left balance and neuromuscular control.",
  },
};

export const physicalCategoryInterpretationByLevel: Record<
  PhysicalCategoryKey,
  Record<PhysicalLevel, Record<Locale, string>>
> = {
  breathing: {
    excellent: {
      ru: "Дыхательная система устойчива к гипоксии и CO₂, паттерн близок к гармоничному.",
      en: "Breathing system shows strong hypoxia and CO₂ tolerance with balanced pattern.",
    },
    stable: {
      ru: "Дыхание в рабочей зоне, но есть резерв в качестве выдоха и балансе коэффициента.",
      en: "Breathing is in a workable range with reserve in exhale quality and ratio balance.",
    },
    attention: {
      ru: "Средняя дыхательная устойчивость: НС и паттерн дыхания требуют регулярной практики.",
      en: "Average breathing resilience: nervous system and breathing pattern need regular practice.",
    },
    critical: {
      ru: "Низкая дыхательная устойчивость: вероятен стрессовый паттерн и гипервентиляция.",
      en: "Low breathing resilience: stress pattern and hyperventilation are likely.",
    },
  },
  cardio_strength: {
    excellent: {
      ru: "Сердечно-сосудистая система экономична, восстановление пульса быстрое.",
      en: "Cardiovascular response is efficient with fast pulse recovery.",
    },
    stable: {
      ru: "Кардио-база хорошая, но при росте нагрузки важен контроль пульсовых зон.",
      en: "Cardio base is good, but heart-rate zone control remains important under load.",
    },
    attention: {
      ru: "Выносливость ограничена: нужна системная аэробная база и снижение пиковых нагрузок.",
      en: "Endurance is limited: build aerobic base and reduce peak intensity.",
    },
    critical: {
      ru: "ССС работает на пределе при умеренной нагрузке, нужен восстановительный режим.",
      en: "Cardio system is near its limit under moderate load; recovery mode is needed.",
    },
  },
  strength_endurance: {
    excellent: {
      ru: "Силовая выносливость кора и ног на высоком уровне, ресурс стабилен.",
      en: "Core and leg endurance are high with stable physical reserve.",
    },
    stable: {
      ru: "Хорошая силовая база, есть потенциал прироста через дозированную прогрессию.",
      en: "Good strength base with growth potential through gradual progression.",
    },
    attention: {
      ru: "Средняя силовая выносливость: приоритет — укрепление кора и ног без перегруза.",
      en: "Average strength endurance: prioritize core/leg strengthening without overload.",
    },
    critical: {
      ru: "Силовая база недостаточна: высокий риск быстрой утомляемости и перегрузки поясницы.",
      en: "Strength base is insufficient: high fatigue risk and lower-back overload risk.",
    },
  },
  flexibility: {
    excellent: {
      ru: "Гибкость и мобильность хорошо поддерживают свободную механику движений.",
      en: "Flexibility and mobility support free movement mechanics well.",
    },
    stable: {
      ru: "Мобильность достаточная, но важна регулярность и контроль симметрии плеч.",
      en: "Mobility is sufficient, but consistency and shoulder symmetry remain key.",
    },
    attention: {
      ru: "Есть ограничения амплитуды: нужно регулярно раскрывать заднюю цепь и плечи.",
      en: "Range of motion is limited: posterior chain and shoulders need regular mobility work.",
    },
    critical: {
      ru: "Критически жесткая мобильность: повышен риск болей в пояснице и плечевых перегрузок.",
      en: "Critically limited mobility: increased lower-back and shoulder overload risk.",
    },
  },
  coordination_balance: {
    excellent: {
      ru: "Координация и проприоцепция развиты, контроль тела в движении высокий.",
      en: "Coordination and proprioception are strong with high movement control.",
    },
    stable: {
      ru: "Хороший баланс, но важно поддерживать симметрию правой и левой сторон.",
      en: "Balance is good, with side-to-side symmetry maintenance still important.",
    },
    attention: {
      ru: "Баланс средний: нужны упражнения на стабилизаторы и нейромышечный контроль.",
      en: "Balance is average: add stabilizer and neuromuscular control work.",
    },
    critical: {
      ru: "Слабая координация и стабильность: растет риск падений и травм.",
      en: "Low coordination and stability: fall and injury risk is elevated.",
    },
  },
};

export const physicalFlagHints: Record<PhysicalRiskFlag, Record<Locale, string>> = {
  stress_ns: {
    ru: "Флаг стресса НС: добавь мягкое дыхание и снизь общий стресс-фон.",
    en: "Nervous-system stress flag: add gentle breathwork and reduce stress load.",
  },
  critical_breathing_imbalance: {
    ru: "Критический дисбаланс дыхания: перепроверь технику и работай с дыхательным паттерном.",
    en: "Critical breathing imbalance: re-check protocol and retrain breathing pattern.",
  },
  zone5_leg_swings: {
    ru: "Пульс в зоне 5: снизь интенсивность и восстанови кардио-базу.",
    en: "Zone 5 pulse: lower intensity and rebuild cardio base.",
  },
  shoulder_asymmetry: {
    ru: "Асимметрия плеч: добавь одностороннюю мобильность и контроль левой/правой стороны.",
    en: "Shoulder asymmetry: add unilateral mobility and side-to-side control.",
  },
  dynamic_balance_asymmetry: {
    ru: "Асимметрия динамического баланса: включи односторонние координационные упражнения.",
    en: "Dynamic balance asymmetry: include unilateral coordination drills.",
  },
  static_balance_asymmetry: {
    ru: "Асимметрия статического баланса: добавь статическую стабилизацию на слабой стороне.",
    en: "Static balance asymmetry: add static stabilization on the weaker side.",
  },
};

export const physicalTestFocus: Record<PhysicalTestKey, Record<Locale, string>> = {
  stange: {
    ru: "Тест Штанге: развивай устойчивость к гипоксии через постепенные задержки на вдохе.",
    en: "Stange: improve hypoxia tolerance with gradual inhale holds.",
  },
  genchi: {
    ru: "Тест Генчи: работай с выдохом и устойчивостью к CO2.",
    en: "Genchi: train exhale control and CO2 tolerance.",
  },
  ruffier: {
    ru: "Руфье: улучшай восстановление пульса через регулярное кардио умеренной интенсивности.",
    en: "Ruffier: improve pulse recovery with moderate cardio.",
  },
  leg_swings: {
    ru: "Leg Swings: отслеживай пульс и избегай хронической работы в зоне 5.",
    en: "Leg Swings: monitor pulse and avoid chronic zone 5 work.",
  },
  plank: {
    ru: "Plank: укрепляй кор и антиразгибание корпуса.",
    en: "Plank: build core anti-extension strength.",
  },
  wall_sit: {
    ru: "Wall Sit: постепенно увеличивай время изометрии ног.",
    en: "Wall Sit: gradually increase lower-body isometric time.",
  },
  forward_bend: {
    ru: "Forward Bend: добавь мягкую заднюю линию и регулярную растяжку.",
    en: "Forward Bend: improve posterior-chain mobility with regular stretching.",
  },
  shoulders_lock: {
    ru: "Плечи в замок: выравнивай правую/левую сторону и раскрытие грудного отдела.",
    en: "Shoulders lock: balance right/left side and thoracic opening.",
  },
  dynamic_balance: {
    ru: "Динамический баланс: тренируй контроль корпуса в движении.",
    en: "Dynamic balance: train trunk control in movement.",
  },
  static_balance: {
    ru: "Статический баланс: усиливай статическую стабилизацию и проприоцепцию.",
    en: "Static balance: strengthen static stabilization and proprioception.",
  },
};

export const physicalTestMark = (pct: number): { emoji: string; ru: string; en: string } => {
  if (pct >= 100) return { emoji: "🟣", ru: "Отличный", en: "Excellent" };
  if (pct >= 75) return { emoji: "🟢", ru: "Хороший", en: "Good" };
  if (pct >= 50) return { emoji: "🟡", ru: "Средний", en: "Average" };
  return { emoji: "🔴", ru: "Минимальный", en: "Low" };
};

export const interpretBreathingRatio = (ratio: number): Record<Locale, string> => {
  if (ratio < 1.0) {
    return {
      ru: "🔴 Аномалия (<1.0): выраженный дисбаланс дыхательного паттерна.",
      en: "🔴 Anomaly (<1.0): pronounced breathing-pattern imbalance.",
    };
  }
  if (ratio < 1.4) {
    return {
      ru: "🟡 Зажатость (1.0-1.3): вероятно ограничение диафрагмы и грудной клетки.",
      en: "🟡 Tightness (1.0-1.3): likely diaphragm/chest mobility limitation.",
    };
  }
  if (ratio <= 2.2) {
    return {
      ru: "🟣 Идеальный баланс (1.4-2.2): гармоничный паттерн дыхания.",
      en: "🟣 Ideal balance (1.4-2.2): harmonic breathing pattern.",
    };
  }
  if (ratio <= 2.8) {
    return {
      ru: "🟢 Допустимо (2.3-2.8): рабочий баланс с запасом для улучшения.",
      en: "🟢 Acceptable (2.3-2.8): workable balance with room to improve.",
    };
  }
  return {
    ru: "🟡 Дисбаланс (>2.8): вероятен гипервентиляционный/стрессовый паттерн.",
    en: "🟡 Imbalance (>2.8): likely hyperventilation/stress breathing pattern.",
  };
};

export const describeForwardBendLevel = (level: number): Record<Locale, string> => {
  const map: Record<number, Record<Locale, string>> = {
    1: { ru: "касание голени/стоп", en: "shin/feet touch" },
    2: { ru: "пол пальцами", en: "fingers to floor" },
    3: { ru: "пол кулаками", en: "fists to floor" },
    4: { ru: "пол ладонями", en: "palms to floor" },
  };

  return map[level] ?? { ru: "уровень не определен", en: "undefined level" };
};
