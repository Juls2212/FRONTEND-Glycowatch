export const THEME_STORAGE_KEYS = {
  colorMode: "glycowatch-color-mode",
  accentTheme: "glycowatch-accent-theme"
} as const;

export const COLOR_MODES = ["dark", "light"] as const;
export const ACCENT_THEMES = ["blue", "red", "green", "cyan", "amber"] as const;

export type ColorMode = (typeof COLOR_MODES)[number];
export type AccentTheme = (typeof ACCENT_THEMES)[number];

export const DEFAULT_COLOR_MODE: ColorMode = "dark";
export const DEFAULT_ACCENT_THEME: AccentTheme = "blue";

export function isColorMode(value: string | null | undefined): value is ColorMode {
  return value != null && COLOR_MODES.includes(value as ColorMode);
}

export function isAccentTheme(value: string | null | undefined): value is AccentTheme {
  return value != null && ACCENT_THEMES.includes(value as AccentTheme);
}

export function getThemeBootstrapScript(): string {
  const colorModes = JSON.stringify(COLOR_MODES);
  const accentThemes = JSON.stringify(ACCENT_THEMES);

  return `
    (function () {
      var colorModeKey = "${THEME_STORAGE_KEYS.colorMode}";
      var accentThemeKey = "${THEME_STORAGE_KEYS.accentTheme}";
      var defaultColorMode = "${DEFAULT_COLOR_MODE}";
      var defaultAccentTheme = "${DEFAULT_ACCENT_THEME}";
      var allowedColorModes = ${colorModes};
      var allowedAccentThemes = ${accentThemes};
      var root = document.documentElement;

      function isAllowed(value, allowedValues) {
        return typeof value === "string" && allowedValues.indexOf(value) !== -1;
      }

      function getStoredValue(key, fallback, allowedValues) {
        try {
          var value = window.localStorage.getItem(key);
          return isAllowed(value, allowedValues) ? value : fallback;
        } catch (error) {
          return fallback;
        }
      }

      function applyTheme(nextColorMode, nextAccentTheme) {
        root.setAttribute("data-color-mode", nextColorMode);
        root.setAttribute("data-accent-theme", nextAccentTheme);
      }

      function setColorMode(nextColorMode) {
        if (!isAllowed(nextColorMode, allowedColorModes)) return;
        try {
          window.localStorage.setItem(colorModeKey, nextColorMode);
        } catch (error) {}
        applyTheme(nextColorMode, root.getAttribute("data-accent-theme") || defaultAccentTheme);
      }

      function setAccentTheme(nextAccentTheme) {
        if (!isAllowed(nextAccentTheme, allowedAccentThemes)) return;
        try {
          window.localStorage.setItem(accentThemeKey, nextAccentTheme);
        } catch (error) {}
        applyTheme(root.getAttribute("data-color-mode") || defaultColorMode, nextAccentTheme);
      }

      var initialColorMode = getStoredValue(colorModeKey, defaultColorMode, allowedColorModes);
      var initialAccentTheme = getStoredValue(accentThemeKey, defaultAccentTheme, allowedAccentThemes);

      applyTheme(initialColorMode, initialAccentTheme);

      window.__glycoWatchTheme = {
        getState: function () {
          return {
            colorMode: root.getAttribute("data-color-mode") || defaultColorMode,
            accentTheme: root.getAttribute("data-accent-theme") || defaultAccentTheme
          };
        },
        setMode: setColorMode,
        setAccent: setAccentTheme,
        setTheme: function (nextColorMode, nextAccentTheme) {
          setColorMode(nextColorMode);
          setAccentTheme(nextAccentTheme);
        },
        reset: function () {
          setColorMode(defaultColorMode);
          setAccentTheme(defaultAccentTheme);
        }
      };
    })();
  `;
}
