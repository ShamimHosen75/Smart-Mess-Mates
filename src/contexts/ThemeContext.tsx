import React, { createContext, useContext, useState, useEffect, useCallback } from "react";

// Convert hex to HSL string (space-separated for CSS vars)
function hexToHSL(hex: string): string {
  hex = hex.replace("#", "");
  if (hex.length === 3) hex = hex.split("").map((c) => c + c).join("");
  const r = parseInt(hex.substring(0, 2), 16) / 255;
  const g = parseInt(hex.substring(2, 4), 16) / 255;
  const b = parseInt(hex.substring(4, 6), 16) / 255;

  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }

  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

function contrastForeground(hex: string): string {
  hex = hex.replace("#", "");
  if (hex.length === 3) hex = hex.split("").map((c) => c + c).join("");
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5 ? "222 47% 8%" : "210 40% 98%";
}

export type ThemeMode = "dark" | "light";

export interface ThemeColors {
  accent: string;
  primary: string;
  secondary: string;
  background: string;
  text: string;
  muted: string;
  border: string;
  card: string;
}

interface ThemeState {
  mode: ThemeMode;
  colors: ThemeColors;
  radius: number;
  setMode: (m: ThemeMode) => void;
  updateColor: (key: keyof ThemeColors, value: string) => void;
  setRadius: (r: number) => void;
  resetTheme: () => void;
  saveTheme: () => void;
}

const DARK_COLORS: ThemeColors = {
  accent: "#2dd4bf",
  primary: "#2dd4bf",
  secondary: "#0c1220",
  background: "#030508",
  text: "#e8ecf1",
  muted: "#6b7280",
  border: "#111a28",
  card: "#091018",
};

const LIGHT_COLORS: ThemeColors = {
  accent: "#0d9488",
  primary: "#0d9488",
  secondary: "#e8ecf2",
  background: "#f1f3f8",
  text: "#0f172a",
  muted: "#8793a6",
  border: "#cdd5e0",
  card: "#ffffff",
};

const STORAGE_KEY = "messmanager-theme";
const THEME_VERSION = 8; // improved light mode

interface SavedTheme {
  mode: ThemeMode;
  colors: ThemeColors;
  radius: number;
}

function loadSavedTheme(): SavedTheme {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      // If version mismatch, reset to new defaults
      if (parsed.version !== THEME_VERSION) {
        localStorage.removeItem(STORAGE_KEY);
        return { mode: "dark", colors: DARK_COLORS, radius: 0.75 };
      }
      return { mode: parsed.mode || "dark", colors: parsed.colors || DARK_COLORS, radius: parsed.radius ?? 0.75 };
    }
  } catch {}
  return { mode: "dark", colors: DARK_COLORS, radius: 0.75 };
}

const ThemeContext = createContext<ThemeState | null>(null);

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be inside ThemeProvider");
  return ctx;
}

export function getDefaultColors(mode: ThemeMode): ThemeColors {
  return mode === "dark" ? { ...DARK_COLORS } : { ...LIGHT_COLORS };
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const saved = loadSavedTheme();
  const [mode, setModeState] = useState<ThemeMode>(saved.mode);
  const [colors, setColors] = useState<ThemeColors>(saved.colors);
  const [radius, setRadius] = useState(saved.radius);

  const applyToDOM = useCallback((c: ThemeColors, r: number, m: ThemeMode) => {
    const root = document.documentElement.style;
    const isValidHex = (v: string) => /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(v);

    // Toggle light/dark class for CSS-level styling
    if (m === "light") {
      document.documentElement.classList.add("light-mode");
      document.documentElement.classList.remove("dark-mode");
    } else {
      document.documentElement.classList.add("dark-mode");
      document.documentElement.classList.remove("light-mode");
    }

    if (isValidHex(c.accent)) {
      const hsl = hexToHSL(c.accent);
      const fg = contrastForeground(c.accent);
      root.setProperty("--primary", hsl);
      root.setProperty("--primary-foreground", fg);
      root.setProperty("--accent", hsl);
      root.setProperty("--accent-foreground", fg);
      root.setProperty("--ring", hsl);
      root.setProperty("--sidebar-primary", hsl);
      root.setProperty("--sidebar-primary-foreground", fg);
      root.setProperty("--chart-1", hsl);
    }
    if (isValidHex(c.secondary)) {
      const hsl = hexToHSL(c.secondary);
      root.setProperty("--secondary", hsl);
      root.setProperty("--secondary-foreground", contrastForeground(c.secondary));
    }
    if (isValidHex(c.background)) {
      root.setProperty("--background", hexToHSL(c.background));
      // Light mode: subtle mint/sage sidebar; dark mode: match background
      root.setProperty("--sidebar-background", m === "light" ? "152 30% 96%" : hexToHSL(c.background));
      root.setProperty("--sidebar-accent", m === "light" ? "152 25% 92%" : hexToHSL(c.card));
      root.setProperty("--sidebar-border", m === "light" ? "152 18% 88%" : hexToHSL(c.border));
    }
    if (isValidHex(c.text)) {
      root.setProperty("--foreground", hexToHSL(c.text));
      root.setProperty("--card-foreground", hexToHSL(c.text));
      root.setProperty("--popover-foreground", hexToHSL(c.text));
      root.setProperty("--sidebar-accent-foreground", hexToHSL(c.text));
    }
    if (isValidHex(c.muted)) {
      root.setProperty("--muted-foreground", hexToHSL(c.muted));
      root.setProperty("--sidebar-foreground", hexToHSL(c.muted));
    }
    if (isValidHex(c.border)) {
      root.setProperty("--border", hexToHSL(c.border));
      root.setProperty("--input", hexToHSL(c.border));
      root.setProperty("--sidebar-border", hexToHSL(c.border));
    }
    if (isValidHex(c.card)) {
      root.setProperty("--card", hexToHSL(c.card));
      root.setProperty("--popover", hexToHSL(c.card));
      root.setProperty("--sidebar-accent", hexToHSL(c.card));
      root.setProperty("--muted", hexToHSL(c.card));
    }

    root.setProperty("--radius", `${r}rem`);
  }, []);

  useEffect(() => {
    applyToDOM(colors, radius, mode);
  }, [colors, radius, mode, applyToDOM]);

  const setMode = (m: ThemeMode) => {
    setModeState(m);
    const defaults = getDefaultColors(m);
    // Keep current accent when switching modes
    setColors({ ...defaults, accent: colors.accent });
  };

  const updateColor = (key: keyof ThemeColors, value: string) => {
    setColors((prev) => ({ ...prev, [key]: value }));
  };

  const resetTheme = () => {
    setModeState("dark");
    setColors(DARK_COLORS);
    setRadius(0.75);
    localStorage.removeItem(STORAGE_KEY);
  };

  const saveTheme = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ mode, colors, radius, version: THEME_VERSION }));
  };

  return (
    <ThemeContext.Provider value={{ mode, colors, radius, setMode, updateColor, setRadius, resetTheme, saveTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}
