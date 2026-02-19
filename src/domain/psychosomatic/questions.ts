import type { Locale, PsychoQuestionKey } from "@/domain/psychosomatic/model";

export type PsychoQuestion = {
  key: PsychoQuestionKey;
  title: Record<Locale, string>;
  hint: Record<Locale, string>;
  options?: Record<
    Locale,
    {
      none: string;
      rare: string;
      sometimes: string;
      often: string;
    }
  >;
};

const defaultOptions = {
  ru: {
    none: "Нет / не ощущаю",
    rare: "Редко",
    sometimes: "Иногда",
    often: "Часто",
  },
  en: {
    none: "None / not present",
    rare: "Rarely",
    sometimes: "Sometimes",
    often: "Often",
  },
};

export const psychosomaticQuestions: PsychoQuestion[] = [
  {
    key: "q1",
    title: { ru: "Головная боль, давление, тяжесть в голове", en: "Head pressure, headache or heaviness" },
    hint: { ru: "Связано с перегрузом и избыточным контролем", en: "Often linked to overload and over-control" },
  },
  {
    key: "q2",
    title: { ru: "Сжатая челюсть, напряжение лица", en: "Jaw clenching or facial tension" },
    hint: { ru: "Связано с подавленными эмоциями", en: "May be linked to suppressed emotion" },
  },
  {
    key: "q3",
    title: { ru: "Напряжение или скованность в шее", en: "Neck stiffness or tension" },
    hint: { ru: "Маркер ответственности и перегруза", en: "Common overload marker" },
  },
  {
    key: "q4",
    title: { ru: "Напряжение в плечах и трапециях", en: "Shoulder and trapezius tension" },
    hint: { ru: "Тревожная готовность и фоновый стресс", en: "Background stress and vigilance" },
  },
  {
    key: "q5",
    title: { ru: "Напряжение между лопатками", en: "Tension between shoulder blades" },
    hint: { ru: "Часто при дефиците поддержки", en: "Can reflect support deficit" },
  },
  {
    key: "q6",
    title: { ru: "Скованность грудного отдела спины", en: "Thoracic back tension" },
    hint: { ru: "Связано со сдерживанием себя", en: "Linked to self-restraint patterns" },
  },
  {
    key: "q7",
    title: { ru: "Напряжение в пояснице", en: "Lower-back tension" },
    hint: { ru: "Маркер опоры и безопасности", en: "Common safety/opora marker" },
  },
  {
    key: "q8",
    title: { ru: "Трудно дышать глубоко", en: "Hard to breathe deeply" },
    hint: { ru: "Поверхностное дыхание при тревоге", en: "Shallow breath under stress" },
  },
  {
    key: "q9",
    title: { ru: "Спазмы или тяжесть в животе", en: "Abdominal tightness or discomfort" },
    hint: { ru: "Маркер непереваренного стресса", en: "Stress digestion marker" },
  },
  {
    key: "q10",
    title: { ru: "Сложно уснуть / ночные пробуждения", en: "Trouble falling asleep / night waking" },
    hint: { ru: "Нарушение переключения в восстановление", en: "Recovery mode switching issue" },
  },
  {
    key: "q11",
    title: { ru: "Время отхода ко сну", en: "Typical bedtime" },
    hint: { ru: "Ключевой показатель восстановления", en: "Key recovery indicator" },
    options: {
      ru: {
        none: "До 22:00",
        rare: "22:00-00:00",
        sometimes: "00:00-01:00",
        often: "После 01:00",
      },
      en: {
        none: "Before 22:00",
        rare: "22:00-00:00",
        sometimes: "00:00-01:00",
        often: "After 01:00",
      },
    },
  },
  {
    key: "q12",
    title: { ru: "Уровень энергии в течение дня", en: "Energy level during the day" },
    hint: { ru: "Индикатор глубины восстановления", en: "Recovery depth indicator" },
    options: {
      ru: {
        none: "Высокий, устойчивый",
        rare: "В целом хороший, но просадка к вечеру",
        sometimes: "Нестабильный, частые провалы",
        often: "Постоянное истощение",
      },
      en: {
        none: "High and stable",
        rare: "Mostly good, dips in the evening",
        sometimes: "Unstable with frequent drops",
        often: "Persistent exhaustion",
      },
    },
  },
  {
    key: "q13",
    title: { ru: "Напряжение в тазу и бедрах", en: "Pelvis and hips tension" },
    hint: { ru: "Маркер базовой небезопасности", en: "Baseline safety marker" },
  },
  {
    key: "q14",
    title: { ru: "Травмы, операции, ДТП, насилие в прошлом", en: "Trauma, surgeries, incidents in history" },
    hint: {
      ru: "Не входит в общий %, но влияет на риск-флаги",
      en: "Excluded from overall %, used for risk flags",
    },
  },
  {
    key: "q15",
    title: { ru: "Часто сдерживаешь эмоции, чтобы держаться", en: "Often suppress emotions to stay functional" },
    hint: { ru: "Эмоциональный маркер", en: "Emotional marker" },
  },
  {
    key: "q16",
    title: { ru: "Тело чаще напряжено, чем расслаблено", en: "Body is tense more often than relaxed" },
    hint: { ru: "Ключевой телесный маркер", en: "Primary body-state marker" },
  },
];

export const getQuestionOptions = (question: PsychoQuestion, locale: Locale) => {
  return question.options?.[locale] ?? defaultOptions[locale];
};

export const zoneLabels: Record<Locale, Record<string, string>> = {
  ru: {
    head_control: "Голова и контроль",
    neck_upper: "Шея и верх тела",
    back_support: "Спина и опора",
    breathing_abdomen: "Дыхание и живот",
    sleep_recovery: "Сон и восстановление",
    pelvis_safety: "Таз и безопасность",
    emotional_marker: "Эмоциональный маркер",
  },
  en: {
    head_control: "Head and control",
    neck_upper: "Neck and upper body",
    back_support: "Back and support",
    breathing_abdomen: "Breathing and abdomen",
    sleep_recovery: "Sleep and recovery",
    pelvis_safety: "Pelvis and safety",
    emotional_marker: "Emotional marker",
  },
};

export const levelLabels: Record<Locale, Record<string, string>> = {
  ru: {
    resource: "Ресурс",
    background_tension: "Фоновое напряжение",
    persistent_clamps: "Устойчивые зажимы",
    defense_mode: "Режим защиты",
  },
  en: {
    resource: "Resource",
    background_tension: "Background tension",
    persistent_clamps: "Persistent clamps",
    defense_mode: "Defense mode",
  },
};
