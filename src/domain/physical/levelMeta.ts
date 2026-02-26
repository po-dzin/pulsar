import type { Locale } from "@/domain/psychosomatic/model";
import type { PhysicalLevel } from "@/domain/physical/model";

export type PhysicalLevelTone = "critical" | "attention" | "stable" | "excellent";

export type PhysicalLevelMeta = {
  emoji: string;
  tone: PhysicalLevelTone;
  label: Record<Locale, string>;
};

export const physicalLevelMeta: Record<PhysicalLevel, PhysicalLevelMeta> = {
  excellent: {
    emoji: "🟣",
    tone: "excellent",
    label: { ru: "Отличный", en: "Excellent" },
  },
  stable: {
    emoji: "🟢",
    tone: "stable",
    label: { ru: "Хороший", en: "Good" },
  },
  attention: {
    emoji: "🟡",
    tone: "attention",
    label: { ru: "Средний", en: "Average" },
  },
  critical: {
    emoji: "🔴",
    tone: "critical",
    label: { ru: "Минимальный", en: "Low" },
  },
};
