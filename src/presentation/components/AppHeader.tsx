"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import type { Locale } from "@/domain/psychosomatic/model";
import type { Dictionary } from "@/presentation/i18n/dictionaries";
import { LocaleLinks, withLang } from "@/presentation/components/LocaleLinks";
import { UserMenu } from "@/presentation/components/UserMenu";
import { ThemeToggle } from "@/presentation/components/ThemeToggle";
import { BrandLogo } from "@/presentation/components/BrandLogo";
import { UiModeToggle } from "@/presentation/components/UiModeToggle";
import { signInWithGoogle, signOutBrowserUser } from "@/infrastructure/supabase/client";

const navItems = [
  { key: "mission", path: "/" },
  { key: "diagnostics", path: "/diagnostics" },
  { key: "products", path: "/products" },
  { key: "knowledge", path: "/knowledge" },
  { key: "about", path: "/about" },
] as const;

export const AppHeader = ({
  locale,
  dictionary,
  pathname,
  isAuthenticated,
  avatarUrl,
  displayName,
}: {
  locale: Locale;
  dictionary: Dictionary;
  pathname: string;
  isAuthenticated: boolean;
  avatarUrl?: string | null;
  displayName?: string | null;
}) => {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const isPathActive = (path: string): boolean =>
    path === "/" ? pathname === "/" : pathname.startsWith(path);

  // Close menu on navigation
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  // Lock scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const signIn = async () => {
    setBusy(true);
    try {
      const nextPath = `${window.location.pathname}${window.location.search}`;
      const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(nextPath)}`;
      await signInWithGoogle(redirectTo);
    } finally {
      setBusy(false);
    }
  };

  const signOut = async () => {
    setBusy(true);
    try {
      const ok = await signOutBrowserUser();
      if (ok) {
        window.location.assign("/");
      }
    } finally {
      setBusy(false);
    }
  };

  const userMenuProps = {
    isAuthenticated,
    avatarUrl,
    displayName,
    loginLabel: dictionary.auth.google,
    profileLabel: dictionary.profile.viewProfile,
    signOutLabel: dictionary.profile.signOut,
    profileHref: withLang("/profile", locale),
  };

  const initials = displayName
    ? displayName.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()
    : "?";

  return (
    <header className="topbar" data-menu-open={isOpen || undefined}>
      <div className="topbar-inner">
        {/* Brand + desktop nav */}
        <div className="topbar-nav">
          <BrandLogo href={withLang("/", locale)} text={dictionary.brand} />
          <nav className="nav-links desktop-only" aria-label="Main navigation">
            {navItems.map((item) => {
              const isActive = isPathActive(item.path);
              return (
                <Link
                  key={item.key}
                  href={withLang(item.path, locale)}
                  className="nav-link"
                  data-active={isActive || undefined}
                >
                  {dictionary.nav[item.key]}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Right controls */}
        <div className="topbar-controls desktop-only">
          <ThemeToggle />
          <UiModeToggle />
          <LocaleLinks pathname={pathname} locale={locale} />
          <UserMenu {...userMenuProps} />
        </div>

        {/* Burger Button (Mobile) */}
        <button
          className="burger-btn mobile-only"
          onClick={(event) => {
            setIsOpen(!isOpen);
            event.currentTarget.blur();
          }}
          aria-label="Toggle mobile menu"
          aria-expanded={isOpen}
          data-testid="burger-toggle"
        >
          {isOpen ? (
            <svg suppressHydrationWarning viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          ) : (
            <svg suppressHydrationWarning viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 12h18M3 6h18M3 18h18" />
            </svg>
          )}
        </button>
      </div>

      {/* Mobile Menu Overlay */}
      <div
        className={`mobile-menu-overlay ${isOpen ? "open" : ""}`}
        data-testid="mobile-menu-overlay"
        data-open={isOpen || undefined}
      >
        <nav className="mobile-nav" aria-label="Mobile navigation">
          {navItems.map((item) => {
            const isActive = isPathActive(item.path);
            const href = withLang(item.path, locale);
            return (
              <Link
                key={item.key}
                href={href}
                className="nav-link"
                data-active={isActive || undefined}
                data-testid={`mobile-nav-${item.key}`}
                onClick={(event) => {
                  if (isActive) {
                    event.preventDefault();
                    setIsOpen(false);
                    router.refresh();
                    return;
                  }
                  setIsOpen(false);
                }}
              >
                {dictionary.nav[item.key]}
              </Link>
            );
          })}
        </nav>

        <div className="mobile-controls">

          {/* Mobile profile section — flat inline, no floating popover */}
          {isAuthenticated ? (
            <div className="mobile-profile-section">
              <div className="mobile-profile-identity">
                <span className="avatar-btn mobile-avatar-static">
                  {avatarUrl ? (
                    <Image
                      src={avatarUrl}
                      alt={displayName ?? "Avatar"}
                      width={34}
                      height={34}
                      className="avatar-img"
                      referrerPolicy="no-referrer"
                      suppressHydrationWarning
                    />
                  ) : (
                    <span className="avatar-initials">{initials}</span>
                  )}
                </span>
                {displayName && (
                  <span className="mobile-profile-name">{displayName}</span>
                )}
              </div>
              <div className="mobile-profile-actions">
                <Link
                  href={withLang("/profile", locale)}
                  className="button button-muted mobile-action-link"
                >
                  {dictionary.profile.viewProfile}
                </Link>
                <button
                  type="button"
                  className="button button-muted mobile-action-button"
                  onClick={signOut}
                  disabled={busy}
                >
                  {dictionary.profile.signOut}
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              className="button button-accent mobile-auth-button"
              onClick={signIn}
              disabled={busy}
            >
              {dictionary.auth.google}
            </button>
          )}

          {/* Controls: theme + locale — below profile */}
          <div className="mobile-controls-row">
            <ThemeToggle />
            <UiModeToggle />
            <LocaleLinks pathname={pathname} locale={locale} />
          </div>
        </div>
      </div>
    </header>
  );
};
