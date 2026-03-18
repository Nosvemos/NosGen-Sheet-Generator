import { createContext, type Dispatch, type SetStateAction } from "react";
import type { Locale, TranslationKey } from "@/lib/i18n";

export type I18nContextValue = {
  locale: Locale;
  setLocale: Dispatch<SetStateAction<Locale>>;
  t: (key: TranslationKey, params?: Record<string, string | number>) => string;
};

export const I18nContext = createContext<I18nContextValue | undefined>(undefined);
