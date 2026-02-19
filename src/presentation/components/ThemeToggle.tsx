"use client";

import { useEffect, useState } from "react";

type Theme = "light" | "dark";

const getInitialTheme = (): Theme => {
  if (typeof window === "undefined") {
    return "light";
  }

  const stored = window.localStorage.getItem("impulse-theme");
  if (stored === "light" || stored === "dark") {
    return stored;
  }

  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
};

export const ThemeToggle = () => {
  const [theme, setTheme] = useState<Theme>("light");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const nextTheme = getInitialTheme();
    document.documentElement.setAttribute("data-theme", nextTheme);
    setTheme(nextTheme);
    setMounted(true);
  }, []);

  const toggle = () => {
    const nextTheme: Theme = theme === "light" ? "dark" : "light";
    document.documentElement.setAttribute("data-theme", nextTheme);
    window.localStorage.setItem("impulse-theme", nextTheme);
    setTheme(nextTheme);
  };

  return (
    <button
      type="button"
      className="nav-link theme-toggle"
      data-theme-mode={theme}
      onClick={toggle}
      disabled={!mounted}
      data-testid="theme-toggle"
      aria-label="Toggle color theme"
      title={theme === "light" ? "Switch to dark theme" : "Switch to light theme"}
    >
      {theme === "light" ? "Dark" : "Light"}
    </button>
  );
};
