"use client";

import {
  AccentTheme,
  ColorMode,
  DEFAULT_ACCENT_THEME,
  DEFAULT_COLOR_MODE,
  isAccentTheme,
  isColorMode
} from "@/lib/theme/config";

type ThemeController = {
  getState: () => { colorMode: ColorMode; accentTheme: AccentTheme };
  setMode: (nextColorMode: ColorMode) => void;
  setAccent: (nextAccentTheme: AccentTheme) => void;
  setTheme: (nextColorMode: ColorMode, nextAccentTheme: AccentTheme) => void;
  reset: () => void;
};

declare global {
  interface Window {
    __glycoWatchTheme?: ThemeController;
  }
}

function getRootThemeState(): { colorMode: ColorMode; accentTheme: AccentTheme } {
  if (typeof document === "undefined") {
    return { colorMode: DEFAULT_COLOR_MODE, accentTheme: DEFAULT_ACCENT_THEME };
  }

  const root = document.documentElement;
  const colorModeValue = root.getAttribute("data-color-mode");
  const accentThemeValue = root.getAttribute("data-accent-theme");

  return {
    colorMode: isColorMode(colorModeValue) ? colorModeValue : DEFAULT_COLOR_MODE,
    accentTheme: isAccentTheme(accentThemeValue) ? accentThemeValue : DEFAULT_ACCENT_THEME
  };
}

export function getThemeState(): { colorMode: ColorMode; accentTheme: AccentTheme } {
  return window.__glycoWatchTheme?.getState() ?? getRootThemeState();
}

export function setColorMode(nextColorMode: ColorMode): void {
  if (window.__glycoWatchTheme) {
    window.__glycoWatchTheme.setMode(nextColorMode);
    return;
  }

  document.documentElement.setAttribute("data-color-mode", nextColorMode);
}

export function setAccentTheme(nextAccentTheme: AccentTheme): void {
  if (window.__glycoWatchTheme) {
    window.__glycoWatchTheme.setAccent(nextAccentTheme);
    return;
  }

  document.documentElement.setAttribute("data-accent-theme", nextAccentTheme);
}
