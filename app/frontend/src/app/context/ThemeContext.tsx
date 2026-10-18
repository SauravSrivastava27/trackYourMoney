
"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { ReactNode } from "react";

type Theme = "light" | "dark";

type ThemeContextValue = {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
};

const ThemeContext =
  createContext<ThemeContextValue | null>(null);

export function ThemeProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [theme, setThemeState] =
    useState<Theme>("light");

  useEffect(() => {
    const saved = localStorage.getItem("theme");

    const initialTheme: Theme =
      saved === "dark" ||
      (!saved &&
        window.matchMedia(
          "(prefers-color-scheme: dark)"
        ).matches)
        ? "dark"
        : "light";

    setThemeState(initialTheme);
    document.documentElement.classList.toggle(
      "dark",
      initialTheme === "dark"
    );

    if (!saved) {
      localStorage.setItem("theme", initialTheme);
    }
  }, []);

  const setTheme = useCallback((next: Theme) => {
    setThemeState(next);
    document.documentElement.classList.toggle(
      "dark",
      next === "dark"
    );
    localStorage.setItem("theme", next);
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(theme === "dark" ? "light" : "dark");
  }, [theme, setTheme]);

  const value = useMemo(
    () => ({ theme, toggleTheme, setTheme }),
    [theme, toggleTheme, setTheme]
  );

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error(
      "useTheme must be used inside ThemeProvider."
    );
  }

  return context;
}
