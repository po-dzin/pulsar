import type { Locale } from "@/domain/psychosomatic/model";

export type ProductCard = {
  id: string;
  title: Record<Locale, string>;
  description: Record<Locale, string>;
};

export const defaultProducts: ProductCard[] = [
  {
    id: "stabilize-awareness",
    title: { ru: "Stabilize & Awareness", en: "Stabilize & Awareness" },
    description: {
      ru: "Мягкая стабилизация состояния, фокус на осознанности и базовой регуляции.",
      en: "Soft stabilization track with awareness and baseline regulation.",
    },
  },
  {
    id: "release-regulation",
    title: { ru: "Release & Regulation", en: "Release & Regulation" },
    description: {
      ru: "Работа с устойчивыми зажимами и восстановлением переключаемости нервной системы.",
      en: "For persistent tension patterns and nervous system regulation.",
    },
  },
  {
    id: "safety-recovery",
    title: { ru: "Safety & Recovery", en: "Safety & Recovery" },
    description: {
      ru: "Контур бережного восстановления и возврата чувства базовой безопасности.",
      en: "Safety-first recovery path for deep stabilization.",
    },
  },
];

export const localKbArticleFallback: Record<
  string,
  {
    title: Record<Locale, string>;
    excerpt: Record<Locale, string>;
    path: Record<Locale, string>;
  }
> = {
  "regulation-basics": {
    title: { ru: "Базовая регуляция", en: "Basic regulation" },
    excerpt: {
      ru: "Короткий старт для восстановления в течение дня",
      en: "Short daily reset protocol",
    },
    path: {
      ru: "src/content/kb/ru/regulation-basics.md",
      en: "src/content/kb/en/regulation-basics.md",
    },
  },
  "sleep-reset": {
    title: { ru: "Сон и восстановление", en: "Sleep reset" },
    excerpt: {
      ru: "Минимальный протокол сна для нервной системы",
      en: "Minimal sleep protocol for nervous system",
    },
    path: {
      ru: "src/content/kb/ru/sleep-reset.md",
      en: "src/content/kb/en/sleep-reset.md",
    },
  },
};
