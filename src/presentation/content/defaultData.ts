import type { Locale } from "@/domain/psychosomatic/model";

export type ProductCard = {
  id: string;
  title: Record<Locale, string>;
  description: Record<Locale, string>;
};

export const defaultProducts: ProductCard[] = [
  {
    id: "stabilize-awareness",
    title: { ru: "Стабилизация и Осознанность", en: "Stabilize & Awareness" },
    description: {
      ru: "Мягкая стабилизация состояния, фокус на осознанности и базовой регуляции.",
      en: "Soft stabilization track with awareness and baseline regulation.",
    },
  },
  {
    id: "release-regulation",
    title: { ru: "Релиз и Регуляция", en: "Release & Regulation" },
    description: {
      ru: "Работа с устойчивыми зажимами и восстановлением переключаемости нервной системы.",
      en: "For persistent tension patterns and nervous system regulation.",
    },
  },
  {
    id: "safety-recovery",
    title: { ru: "Безопасность и Восстановление", en: "Safety & Recovery" },
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
    content: Record<Locale, string>;
  }
> = {
  "balance-model": {
    title: { ru: "Твоя модель баланса", en: "Your Balance Model" },
    excerpt: {
      ru: "Тело, Сознание, Энергия — эволюция через баланс. Три фундаментальных уровня трансформации.",
      en: "Body, Consciousness, Energy — evolution through balance. Three fundamental levels of transformation.",
    },
    content: {
      ru: "# Твоя модель баланса\n\nТело, Сознание, Энергия — три фундаментальных уровня устойчивой трансформации.",
      en: "# Your Balance Model\n\nBody, Consciousness, Energy are three core layers of sustainable transformation.",
    },
  },
};
