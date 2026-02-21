import Link from "next/link";
import type { Locale } from "@/domain/psychosomatic/model";

export const withLang = (pathname: string, locale: Locale): string => {
  const separator = pathname.includes("?") ? "&" : "?";
  return `${pathname}${separator}lang=${locale}`;
};

export const LocaleLinks = ({
  pathname,
  locale,
}: {
  pathname: string;
  locale: Locale;
}) => {
  const nextLocale: Locale = locale === "ru" ? "en" : "ru";
  return (
    <Link
      href={withLang(pathname, nextLocale)}
      className="locale-btn"
      data-testid="locale-switcher"
      title={`Switch to ${nextLocale.toUpperCase()}`}
      aria-label={`Switch to ${nextLocale.toUpperCase()}`}
    >
      {locale.toUpperCase()}
    </Link>
  );
};
