import Link from "next/link";
import type { Locale } from "@/domain/psychosomatic/model";
import type { Dictionary } from "@/presentation/i18n/dictionaries";
import { LocaleLinks, withLang } from "@/presentation/components/LocaleLinks";
import { AuthControls } from "@/presentation/components/AuthControls";

export const AppHeader = ({
  locale,
  dictionary,
  pathname,
  isAuthenticated,
}: {
  locale: Locale;
  dictionary: Dictionary;
  pathname: string;
  isAuthenticated: boolean;
}) => {
  return (
    <header className="topbar">
      <div className="topbar-inner">
        <div className="inline-row">
          <Link href={withLang("/", locale)} className="brand">
            {dictionary.brand}
          </Link>
          <nav className="nav-links" aria-label="Main navigation">
            <Link href={withLang("/", locale)} className="nav-link">
              {dictionary.nav.mission}
            </Link>
            <Link href={withLang("/diagnostics", locale)} className="nav-link">
              {dictionary.nav.diagnostics}
            </Link>
            <Link href={withLang("/products", locale)} className="nav-link">
              {dictionary.nav.products}
            </Link>
            <Link href={withLang("/knowledge", locale)} className="nav-link">
              {dictionary.nav.knowledge}
            </Link>
            <Link href={withLang("/about", locale)} className="nav-link">
              {dictionary.nav.about}
            </Link>
            <Link href={withLang("/admin", locale)} className="nav-link">
              Admin
            </Link>
          </nav>
        </div>
        <div className="inline-row">
          <LocaleLinks pathname={pathname} locale={locale} />
          <AuthControls
            isAuthenticated={isAuthenticated}
            loginLabel={dictionary.auth.google}
            logoutLabel={dictionary.auth.logout}
          />
        </div>
      </div>
    </header>
  );
};
