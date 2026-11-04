import React, { createContext, useContext, useState, useCallback } from "react";
import translations, { type Lang, type Translations } from "@/lib/translations";

interface LanguageState {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: Translations;
}

const STORAGE_KEY = "messmanager-lang";

function loadLang(): Lang {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && (saved === "en" || saved === "hi" || saved === "bn")) return saved;
  } catch {}
  return "en";
}

const LanguageContext = createContext<LanguageState | null>(null);

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be inside LanguageProvider");
  return ctx;
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>(loadLang);

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    localStorage.setItem(STORAGE_KEY, l);
  }, []);

  const t = translations[lang];

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}
