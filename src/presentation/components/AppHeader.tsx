"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import type { Locale } from "@/domain/psychosomatic/model";
import type { Dictionary } from "@/presentation/i18n/dictionaries";
import { LocaleLinks, withLang } from "@/presentation/components/LocaleLinks";
import { UserMenu } from "@/presentation/components/UserMenu";
import { ThemeToggle } from "@/presentation/components/ThemeToggle";
import { BrandLogo } from "@/presentation/components/BrandLogo";

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
  const [isOpen, setIsOpen] = useState(false);

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

  const userMenuProps = {
    isAuthenticated,
    avatarUrl,
    displayName,
    loginLabel: dictionary.auth.google,
    profileLabel: dictionary.profile.viewProfile,
    signOutLabel: dictionary.profile.signOut,
    profileHref: withLang("/profile", locale),
  };

  return (
    <header className="topbar">
      <div className="topbar-inner">
        {/* Brand + desktop nav */}
        <div className="topbar-nav">
          <BrandLogo href={withLang("/", locale)} text={dictionary.brand} />
          <nav className="nav-links desktop-only" aria-label="Main navigation">
            {navItems.map((item) => {
              const isActive =
                item.path === "/"
                  ? pathname === "/"
                  : pathname.startsWith(item.path);
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
          <LocaleLinks pathname={pathname} locale={locale} />
          <UserMenu {...userMenuProps} />
        </div>

        {/* Burger Button (Mobile) */}
        <button
          className="burger-btn mobile-only"
          onClick={() => setIsOpen(!isOpen)}
          aria-label="Toggle mobile menu"
          aria-expanded={isOpen}
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
      <div className={`mobile-menu-overlay ${isOpen ? "open" : ""}`}>
        <nav className="mobile-nav" aria-label="Mobile navigation">
          {navItems.map((item) => {
            const isActive =
              item.path === "/"
                ? pathname === "/"
                : pathname.startsWith(item.path);
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
        <div className="mobile-controls">
          <div className="mobile-controls-row">
            <ThemeToggle />
            <LocaleLinks pathname={pathname} locale={locale} />
          </div>
          <UserMenu {...userMenuProps} />
        </div>
      </div>
    </header>
  );
};

