import en from "@/i18n/en.json";
import ru from "@/i18n/ru.json";
import type { Locale } from "@/domain/psychosomatic/model";

export type Dictionary = typeof ru;

const dictionaries: Record<Locale, Dictionary> = {
  en,
  ru,
};

export const resolveLocale = (candidate?: string | null): Locale => {
  if (candidate === "en") return "en";
  return "ru";
};

export const getDictionary = (locale: Locale): Dictionary => dictionaries[locale] ?? dictionaries.ru;
