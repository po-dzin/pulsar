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
        "Отдохни 1-2 минуты в положении сидя.",
        "Сделай 2-3 глубоких вдоха-выдоха.",
        "Сделай вдох на 80-90% объема легких.",
        "Задержи дыхание и засеки время.",
        "Останови таймер при первом явном желании вдохнуть.",
        "Запиши время в секундах.",
      ],
      en: [
        "Sit and rest for 1-2 minutes.",
        "Take 2-3 deep breaths.",
        "Inhale to about 80-90% of lung volume.",
        "Hold breath and start timer.",
        "Stop at first clear urge to inhale.",
        "Record time in seconds.",
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
        "Отдохни 1-2 минуты в положении сидя.",
        "Сделай 2-3 обычных вдоха-выдоха.",
        "Сделай обычный выдох (без форсирования).",
        "Задержи дыхание и засеки время.",
        "Останови таймер при первом явном желании вдохнуть.",
        "Запиши время в секундах.",
      ],
      en: [
        "Sit and rest for 1-2 minutes.",
        "Take 2-3 normal breaths.",
        "Take a normal exhale without forcing.",
        "Hold after exhale and start timer.",
        "Stop at first clear urge to inhale.",
        "Record time in seconds.",
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
        "Шаг 1 (P1): ляг на спину, расслабься 3 минуты и измерь пульс за 15 секунд ×4.",
        "Шаг 2: сделай ровно 30 приседаний за 45 секунд (1 приседание за 1.5 сек), спина прямая, угол 90°.",
        "Шаг 3 (P2): сразу после 30-го приседания измерь пульс за первые 15 секунд отдыха ×4.",
        "Шаг 4 (P3): на 45-60 секунде восстановления измерь пульс за 15 секунд ×4.",
        "Запиши P1/P2/P3 в BPM.",
      ],
      en: [
        "Step 1 (P1): lie down, relax for 3 minutes and measure pulse for 15 sec ×4.",
        "Step 2: perform exactly 30 squats in 45 seconds (1 squat per 1.5 sec), straight back, 90° squat.",
        "Step 3 (P2): immediately after squat 30, measure pulse for first 15 sec of recovery ×4.",
        "Step 4 (P3): at second 45-60 of recovery, measure pulse for 15 sec ×4.",
        "Record P1/P2/P3 in BPM.",
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
    title: { ru: "Махи ногами", en: "Leg Swings" },
    description: {
      ru: "Пульсовой ответ на динамическую нагрузку относительно возраста.",
      en: "Pulse response to dynamic load relative to age.",
    },
    protocol: {
      ru: [
        "Исходное положение: стойка, руки в стороны, ноги на ширине плеч.",
        "Выполняй махи ногами к противоположной руке в непрерывном ритме 2 минуты (120 сек).",
        "Если очень тяжело, можно остановиться раньше и зафиксировать фактический результат.",
        "Сразу после завершения измерь пульс (за 15 секунд ×4) и запиши BPM.",
        "Укажи возраст для пересчета процента от максимального пульса (220 - возраст).",
      ],
      en: [
        "Start standing, arms out, feet shoulder-width apart.",
        "Perform alternating leg swings to opposite hand in a continuous rhythm for 2 minutes (120 sec).",
        "If load is too high, stop earlier and use factual result.",
        "Measure pulse immediately after test (15 sec ×4) and record BPM.",
        "Provide age to calculate % of max heart rate (220 - age).",
      ],
    },
    inputs: [
      numberInput("leg_swings_bpm", "Махи ногами: пульс после теста (BPM)", "Leg Swings: post-test pulse (BPM)", "Пульс сразу после нагрузки", "Pulse after load", 30, 240),
      numberInput("age_years", "Возраст", "Age", "Полных лет", "Years", 12, 90),
    ],
  },
  {
    key: "plank",
    category: "strength_endurance",
    title: { ru: "Планка", en: "Plank" },
    description: {
      ru: "Удержание планки для оценки выносливости кора.",
      en: "Plank hold to assess core endurance.",
    },
    protocol: {
      ru: [
        "Прими упор лежа на предплечьях.",
        "Тело держи в одной линии от головы до пяток.",
        "Локти под плечами, таз зафиксирован, поясницу не прогибай.",
        "Удерживай позицию до нарушения техники.",
        "Запиши время в секундах.",
      ],
      en: ["Take a forearm plank position.", "Hold until form breaks.", "Record time in seconds."],
    },
    inputs: [numberInput("plank_sec", "Планка (сек)", "Plank (sec)", "Время удержания", "Hold time", 1, 600)],
  },
  {
    key: "wall_sit",
    category: "strength_endurance",
    title: { ru: "Присед у стены", en: "Wall Sit" },
    description: {
      ru: "Статический присед у стены для оценки выносливости ног.",
      en: "Wall sit for lower-body endurance.",
    },
    protocol: {
      ru: [
        "Встань спиной к стене.",
        "Опустись в присед: угол в коленях около 90°.",
        "Спина плотно прижата к стене, руки на бедрах или вдоль тела.",
        "Удерживай позицию до отказа.",
        "Запиши время в секундах.",
      ],
      en: [
        "Stand with your back against a wall.",
        "Lower into a squat with knees around 90°.",
        "Keep back pressed to wall, arms on hips or along body.",
        "Hold to failure.",
        "Record time in seconds.",
      ],
    },
    inputs: [numberInput("wall_sit_sec", "Присед у стены (сек)", "Wall Sit (sec)", "Время удержания", "Hold time", 1, 600)],
  },
  {
    key: "forward_bend",
    category: "flexibility",
    title: { ru: "Наклон вперед", en: "Forward Bend" },
    description: {
      ru: "Наклон вперед по 4-уровневой шкале.",
      en: "Forward bend on a 4-level scale.",
    },
    protocol: {
      ru: [
        "Встань, ноги на ширине плеч.",
        "Выполни наклон вперед с прямыми ногами, руки тянутся к полу.",
        "Зафиксируй максимальный наклон на 2-3 секунды.",
        "Оцени результат по шкале 1-4.",
        "Уровни: 1 — касание голени/стоп, 2 — пол пальцами, 3 — пол кулаками, 4 — пол ладонями.",
      ],
      en: [
        "Stand with feet shoulder-width apart.",
        "Bend forward with straight legs, hands reaching to floor.",
        "Fix maximal bend for 2-3 seconds.",
        "Rate result on 1-4 scale.",
        "Levels: 1 - shin/feet touch, 2 - floor by fingers, 3 - floor by fists, 4 - floor by palms.",
      ],
    },
    inputs: [scaleInput("forward_bend_level", "Наклон вперед (1-4)", "Forward Bend (1-4)", "Уровень по шкале", "Scale level")],
  },
  {
    key: "shoulders_lock",
    category: "flexibility",
    title: { ru: "Плечи-замок", en: "Shoulders lock" },
    description: {
      ru: "Оценка подвижности плеч отдельно справа и слева.",
      en: "Shoulder mobility on right and left sides.",
    },
    protocol: {
      ru: [
        "Вариант А (правое плечо): правую руку заведи снизу за спину, левую сверху, попробуй соединить пальцы.",
        "Вариант Б (левое плечо): левую руку снизу, правую сверху, снова попробуй соединить пальцы.",
        "Для каждой стороны укажи уровень 1-4.",
        "Итог теста считается по среднему значению правой и левой стороны.",
      ],
      en: [
        "Variant A (right shoulder): place right hand from below and left from above behind back, try to connect fingers.",
        "Variant B (left shoulder): place left hand from below and right from above, try to connect fingers.",
        "Provide 1-4 level for each side.",
        "Final score is averaged across right and left sides.",
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
        "Исходное положение: стой на правой ноге, левое колено поднято, правая рука вытянута вперед.",
        "Балансируя, плавно наклоняйся вперед, левую ногу вытягивай назад, затем вернись в исходное положение.",
        "Повторяй движение в динамике до потери равновесия.",
        "Повтори на левой ноге.",
        "Запиши время для каждой стороны в секундах.",
        "Итог теста считается по среднему значению правой и левой стороны.",
      ],
      en: [
        "Start on right leg, left knee lifted, right arm extended forward.",
        "While balancing, lean forward, extend left leg back, then return to start.",
        "Repeat movement dynamically until balance loss.",
        "Repeat on left leg.",
        "Record each side time in seconds.",
        "Final score is averaged across right and left sides.",
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
        "Встань на правую ногу.",
        "Левую ногу согни и подними, руки сложи перед грудью.",
        "Закрой глаза и удерживай равновесие до потери баланса.",
        "Повтори на левой ноге.",
        "Запиши время для каждой стороны в секундах.",
        "Итог теста считается по среднему значению правой и левой стороны.",
      ],
      en: [
        "Stand on the right leg.",
        "Bend and raise left leg, keep hands in front of chest.",
        "Close eyes and hold until balance loss.",
        "Repeat on the left leg.",
        "Record each side time in seconds.",
        "Final score is averaged across right and left sides.",
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
