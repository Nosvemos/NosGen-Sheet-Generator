import { useEffect, useMemo, useState, type ReactNode } from "react";
import { I18nContext } from "@/lib/i18n-context";
import enTranslations from "@/lib/translations/en.json";
import trTranslations from "@/lib/translations/tr.json";
import deTranslations from "@/lib/translations/de.json";
import plTranslations from "@/lib/translations/pl.json";
import ruTranslations from "@/lib/translations/ru.json";

const translations = {
  en: enTranslations,
  tr: trTranslations,
  de: deTranslations,
  pl: plTranslations,
  ru: ruTranslations,
} as const;

export type Locale = keyof typeof translations;
export type TranslationKey = keyof typeof translations.en;

const DEFAULT_LOCALE: Locale = "en";

const translate = (
  locale: Locale,
  key: TranslationKey,
  params?: Record<string, string | number>
) => {
  const localeEntries = translations[locale] as Partial<
    Record<TranslationKey, string>
  >;
  const entry =
    localeEntries[key] ??
    (translations.en as Record<TranslationKey, string>)[key] ??
    key;

  if (!params) {
    return entry;
  }

  return entry.replace(/\{(\w+)\}/g, (_, token) =>
    String(params[token] ?? `{${token}}`)
  );
};

const getInitialLocale = (): Locale => {
  if (typeof window === "undefined") {
    return DEFAULT_LOCALE;
  }
  const stored = window.localStorage.getItem("sg-locale");
  if (
    stored === "en" ||
    stored === "tr" ||
    stored === "de" ||
    stored === "pl" ||
    stored === "ru"
  ) {
    return stored;
  }
  return DEFAULT_LOCALE;
};

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocale] = useState<Locale>(getInitialLocale);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    window.localStorage.setItem("sg-locale", locale);
  }, [locale]);

  const t = useMemo(
    () => (key: TranslationKey, params?: Record<string, string | number>) =>
      translate(locale, key, params),
    [locale]
  );

  const value = useMemo(() => ({ locale, setLocale, t }), [locale, t]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}
