import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import {
  Locale,
  TranslationKeys,
  getTranslations,
  interpolate,
  getNestedValue,
  detectBrowserLanguage,
  getSavedLocale,
  saveLocale,
} from "../i18n";

interface I18nContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
  translations: TranslationKeys;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

export const I18nProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [locale, setLocaleState] = useState<Locale>(() => {
    return getSavedLocale() || detectBrowserLanguage();
  });

  const [translations, setTranslations] = useState<TranslationKeys>(() => {
    return getTranslations(locale);
  });

  const setLocale = useCallback((newLocale: Locale) => {
    setLocaleState(newLocale);
    setTranslations(getTranslations(newLocale));
    saveLocale(newLocale);
  }, []);

  const t = useCallback(
    (key: string, params?: Record<string, string | number>): string => {
      const value = getNestedValue(translations, key);
      
      if (params) {
        return interpolate(value, params);
      }
      
      return value;
    },
    [translations]
  );

  useEffect(() => {
    setTranslations(getTranslations(locale));
  }, [locale]);

  return (
    <I18nContext.Provider value={{ locale, setLocale, t, translations }}>
      {children}
    </I18nContext.Provider>
  );
};

export const useI18n = (): I18nContextType => {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error("useI18n must be used within an I18nProvider");
  }
  return context;
};
