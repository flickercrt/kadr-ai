"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { L10n } from "@/config/site";
import { localeStorageKey } from "@/config/site";
import { dictionary, type Dictionary, type Locale } from "@/lib/i18n";

type LocaleValue = {
  locale: Locale;
  dir: "rtl" | "ltr";
  t: Dictionary;
  setLocale: (locale: Locale) => void;
  tx: (value: L10n) => string;
};

const LocaleContext = createContext<LocaleValue | null>(null);

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("ar");

  useEffect(() => {
    const id = window.setTimeout(() => {
      const saved = window.localStorage.getItem(localeStorageKey);
      if (saved === "en" || saved === "ar") setLocaleState(saved);
    }, 0);
    return () => window.clearTimeout(id);
  }, []);

  useEffect(() => {
    document.documentElement.lang = locale === "ar" ? "ar" : "en";
    document.documentElement.dir = locale === "ar" ? "rtl" : "ltr";
  }, [locale]);

  const value = useMemo<LocaleValue>(() => {
    const setLocale = (next: Locale) => {
      setLocaleState(next);
      window.localStorage.setItem(localeStorageKey, next);
    };
    return {
      locale,
      dir: locale === "ar" ? "rtl" : "ltr",
      t: dictionary[locale],
      setLocale,
      tx: (item) => item[locale],
    };
  }, [locale]);

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useI18n() {
  const value = useContext(LocaleContext);
  if (!value) throw new Error("useI18n must be used inside LocaleProvider");
  return value;
}
