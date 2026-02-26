import type { Locale } from "@/domain/psychosomatic/model";
import type {
  PhysicalCategoryKey,
  PhysicalInputDefinition,
  PhysicalTestDefinition,
  PhysicalTestKey,
} from "@/domain/physical/model";

const scale14: Record<string, Record<Locale, string>> = {
  "1": { ru: "Уровень 1", en: "Level 1" },
  "2": { ru: "Уровень 2", en: "Level 2" },
  "3": { ru: "Уровень 3", en: "Level 3" },
  "4": { ru: "Уровень 4", en: "Level 4" },
};

const numberInput = (
  key: string,
  ru: string,
  en: string,
  hintRu: string,
  hintEn: string,
  min = 0,
  max = 500,
  step = 1
): PhysicalInputDefinition => ({
  key,
  type: "number",
  title: { ru, en },
  hint: { ru: hintRu, en: hintEn },
  min,
  max,
  step,
});

const scaleInput = (
  key: string,
  ru: string,
  en: string,
  hintRu: string,
  hintEn: string
): PhysicalInputDefinition => ({
  key,
  type: "scale",
  title: { ru, en },
  hint: { ru: hintRu, en: hintEn },
  min: 1,
  max: 4,
  step: 1,
  scaleLabels: scale14,
});

export const physicalCategoryTitles: Record<PhysicalCategoryKey, Record<Locale, string>> = {
  breathing: { ru: "Дыхательная система", en: "Breathing system" },
  cardio_strength: { ru: "Кардио и силовая выносливость", en: "Cardio and endurance" },
  strength_endurance: { ru: "Силовая выносливость", en: "Strength endurance" },
  flexibility: { ru: "Гибкость", en: "Flexibility" },
  coordination_balance: { ru: "Координация и баланс", en: "Coordination and balance" },
};

export const physicalTests: PhysicalTestDefinition[] = [
  {
    key: "stange",
    category: "breathing",
    title: { ru: "Тест Штанге", en: "Stange test" },
    description: {
      ru: "Задержка дыхания на вдохе для оценки устойчивости к гипоксии.",
      en: "Inhale breath-hold test to estimate hypoxia tolerance.",
    },
    protocol: {
      ru: [
        "Сядь спокойно и отдохни 1-2 минуты.",
        "Сделай 2-3 спокойных вдоха и выдоха.",
        "Сделай вдох на 80-90% объема и задержи дыхание.",
        "Останови таймер при первом явном желании вдохнуть.",
      ],
      en: [
        "Sit and rest for 1-2 minutes.",
        "Take 2-3 calm breaths.",
        "Inhale to about 80-90% of lung volume and hold.",
        "Stop at first clear urge to inhale.",
      ],
    },
    inputs: [numberInput("stange_sec", "Штанге (сек)", "Stange (sec)", "Время задержки дыхания", "Breath-hold duration", 1, 240)],
  },
  {
    key: "genchi",
    category: "breathing",
    title: { ru: "Тест Генчи", en: "Genchi test" },
    description: {
      ru: "Задержка дыхания на выдохе для оценки устойчивости к CO2 и стрессу НС.",
      en: "Exhale breath-hold test for CO2 tolerance and nervous-system stress.",
    },
    protocol: {
      ru: [
        "Сядь спокойно и отдохни 1-2 минуты.",
        "Сделай обычный выдох, без форсирования.",
        "Задержи дыхание после выдоха и запусти таймер.",
        "Останови при первом явном желании вдохнуть.",
      ],
      en: [
        "Sit and rest for 1-2 minutes.",
        "Take a normal exhale, no force.",
        "Hold after exhale and start timer.",
        "Stop at first clear urge to inhale.",
      ],
    },
    inputs: [numberInput("genchi_sec", "Генчи (сек)", "Genchi (sec)", "Время задержки на выдохе", "Exhale hold duration", 1, 180)],
  },
  {
    key: "ruffier",
    category: "cardio_strength",
    title: { ru: "Индекс Руфье", en: "Ruffier index" },
    description: {
      ru: "Кардио-реакция на 30 приседаний и восстановление пульса.",
      en: "Cardio response to 30 squats and pulse recovery.",
    },
    protocol: {
      ru: [
        "Измерь пульс в покое (P1).",
        "Сделай 30 приседаний за 45 секунд.",
        "Измерь пульс сразу после нагрузки (P2).",
        "Измерь пульс на 45-60 секунде восстановления (P3).",
      ],
      en: [
        "Measure resting pulse (P1).",
        "Do 30 squats in 45 seconds.",
        "Measure pulse right after load (P2).",
        "Measure pulse at 45-60 second of recovery (P3).",
      ],
    },
    inputs: [
      numberInput("ruffier_p1", "Руфье: P1 (BPM)", "Ruffier: P1 (BPM)", "Пульс в покое", "Rest pulse", 30, 220),
      numberInput("ruffier_p2", "Руфье: P2 (BPM)", "Ruffier: P2 (BPM)", "Пульс сразу после нагрузки", "Pulse after load", 30, 240),
      numberInput("ruffier_p3", "Руфье: P3 (BPM)", "Ruffier: P3 (BPM)", "Пульс восстановления", "Recovery pulse", 30, 240),
    ],
  },
  {
    key: "leg_swings",
    category: "cardio_strength",
    title: { ru: "Leg Swings", en: "Leg Swings" },
    description: {
      ru: "Пульсовой ответ на динамическую нагрузку относительно возраста.",
      en: "Pulse response to dynamic load relative to age.",
    },
    protocol: {
      ru: [
        "Сделай динамический тест Leg Swings по протоколу.",
        "Измерь пульс сразу после теста.",
        "Укажи свой возраст для пересчета % от максимального пульса.",
      ],
      en: [
        "Perform Leg Swings by protocol.",
        "Measure pulse right after the test.",
        "Provide age to calculate % of max heart rate.",
      ],
    },
    inputs: [
      numberInput("leg_swings_bpm", "Leg Swings: пульс после теста (BPM)", "Leg Swings: post-test pulse (BPM)", "Пульс сразу после нагрузки", "Pulse after load", 30, 240),
      numberInput("age_years", "Возраст", "Age", "Полных лет", "Years", 12, 90),
    ],
  },
  {
    key: "plank",
    category: "strength_endurance",
    title: { ru: "Plank", en: "Plank" },
    description: {
      ru: "Удержание планки для оценки выносливости кора.",
      en: "Plank hold to assess core endurance.",
    },
    protocol: {
      ru: ["Прими стандартную планку на предплечьях.", "Держи позицию до нарушения техники.", "Запиши время в секундах."],
      en: ["Take a forearm plank position.", "Hold until form breaks.", "Record time in seconds."],
    },
    inputs: [numberInput("plank_sec", "Plank (сек)", "Plank (sec)", "Время удержания", "Hold time", 1, 600)],
  },
  {
    key: "wall_sit",
    category: "strength_endurance",
    title: { ru: "Wall Sit", en: "Wall Sit" },
    description: {
      ru: "Статический присед у стены для оценки выносливости ног.",
      en: "Wall sit for lower-body endurance.",
    },
    protocol: {
      ru: ["Встань спиной к стене, угол колен 90°.", "Удерживай позицию до отказа.", "Запиши время в секундах."],
      en: ["Back to wall, knees at 90°.", "Hold to failure.", "Record time in seconds."],
    },
    inputs: [numberInput("wall_sit_sec", "Wall Sit (сек)", "Wall Sit (sec)", "Время удержания", "Hold time", 1, 600)],
  },
  {
    key: "forward_bend",
    category: "flexibility",
    title: { ru: "Forward Bend", en: "Forward Bend" },
    description: {
      ru: "Наклон вперед по 4-уровневой шкале.",
      en: "Forward bend on a 4-level scale.",
    },
    protocol: {
      ru: ["Выполни наклон вперед по протоколу.", "Оцени результат по шкале 1-4.", "1 = минимально, 4 = максимально."],
      en: ["Perform forward bend by protocol.", "Rate result on 1-4 scale.", "1 = minimal, 4 = maximal."],
    },
    inputs: [scaleInput("forward_bend_level", "Forward Bend (1-4)", "Forward Bend (1-4)", "Уровень по шкале", "Scale level")],
  },
  {
    key: "shoulders_lock",
    category: "flexibility",
    title: { ru: "Плечи в замок", en: "Shoulders lock" },
    description: {
      ru: "Оценка подвижности плеч отдельно справа и слева.",
      en: "Shoulder mobility on right and left sides.",
    },
    protocol: {
      ru: [
        "Сделай тест плечи в замок для правой стороны.",
        "Повтори для левой стороны.",
        "Для каждой стороны укажи уровень 1-4.",
      ],
      en: [
        "Perform shoulders lock test for the right side.",
        "Repeat for the left side.",
        "Provide 1-4 level for each side.",
      ],
    },
    inputs: [
      scaleInput("shoulders_right_level", "Плечо правое (1-4)", "Right shoulder (1-4)", "Уровень правой стороны", "Right side level"),
      scaleInput("shoulders_left_level", "Плечо левое (1-4)", "Left shoulder (1-4)", "Уровень левой стороны", "Left side level"),
    ],
  },
  {
    key: "dynamic_balance",
    category: "coordination_balance",
    title: { ru: "Динамический баланс", en: "Dynamic balance" },
    description: {
      ru: "Баланс в динамике на правой и левой ноге.",
      en: "Dynamic balance on right and left leg.",
    },
    protocol: {
      ru: [
        "Выполни тест динамического баланса на правой ноге.",
        "Повтори на левой ноге.",
        "Запиши время для каждой стороны в секундах.",
      ],
      en: [
        "Perform dynamic balance on the right leg.",
        "Repeat on the left leg.",
        "Record each side time in seconds.",
      ],
    },
    inputs: [
      numberInput("dynamic_right_sec", "Динамический баланс правая (сек)", "Dynamic balance right (sec)", "Правая нога", "Right leg", 1, 180),
      numberInput("dynamic_left_sec", "Динамический баланс левая (сек)", "Dynamic balance left (sec)", "Левая нога", "Left leg", 1, 180),
    ],
  },
  {
    key: "static_balance",
    category: "coordination_balance",
    title: { ru: "Статический баланс", en: "Static balance" },
    description: {
      ru: "Статический баланс на правой и левой ноге.",
      en: "Static balance on right and left leg.",
    },
    protocol: {
      ru: [
        "Выполни тест статического баланса на правой ноге.",
        "Повтори на левой ноге.",
        "Запиши время для каждой стороны в секундах.",
      ],
      en: [
        "Perform static balance on the right leg.",
        "Repeat on the left leg.",
        "Record each side time in seconds.",
      ],
    },
    inputs: [
      numberInput("static_right_sec", "Статический баланс правая (сек)", "Static balance right (sec)", "Правая нога", "Right leg", 1, 180),
      numberInput("static_left_sec", "Статический баланс левая (сек)", "Static balance left (sec)", "Левая нога", "Left leg", 1, 180),
    ],
  },
];

export const physicalTestByKey: Record<PhysicalTestKey, PhysicalTestDefinition> = physicalTests.reduce((acc, test) => {
  acc[test.key] = test;
  return acc;
}, {} as Record<PhysicalTestKey, PhysicalTestDefinition>);

export const physicalTestKeys = physicalTests.map((test) => test.key) as PhysicalTestKey[];
