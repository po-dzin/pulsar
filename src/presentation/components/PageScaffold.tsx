import type { ReactNode } from "react";
import type { Locale } from "@/domain/psychosomatic/model";
import type { Dictionary } from "@/presentation/i18n/dictionaries";
import { AppHeader } from "@/presentation/components/AppHeader";
import { Footer } from "@/presentation/components/Footer";

export const PageScaffold = ({
  locale,
  dictionary,
  pathname,
  isAuthenticated,
  avatarUrl,
  displayName,
  children,
}: {
  locale: Locale;
  dictionary: Dictionary;
  pathname: string;
  isAuthenticated: boolean;
  avatarUrl?: string | null;
  displayName?: string | null;
  children: ReactNode;
}) => {
  return (
    <div className="app-shell">
      <AppHeader
        locale={locale}
        dictionary={dictionary}
        pathname={pathname}
        isAuthenticated={isAuthenticated}
        avatarUrl={avatarUrl}
        displayName={displayName}
      />
      <main className={`main ${pathname === "/" ? "main-landing" : ""}`}>{children}</main>
      <Footer dictionary={dictionary} />
    </div>
  );
};
