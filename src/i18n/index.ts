import en from "./locales/en";
import zh from "./locales/zh";
import ja from "./locales/ja";

export type Locale = "en" | "zh" | "ja";

export type TranslationKeys = typeof en;

const translations: Record<Locale, TranslationKeys> = {
  en,
  zh,
  ja,
};

export const localeNames: Record<Locale, string> = {
  en: "English",
  zh: "简体中文",
  ja: "日本語",
};

export const getTranslations = (locale: Locale): TranslationKeys => {
  return translations[locale] || translations.en;
};

export const interpolate = (text: string, params: Record<string, string | number>): string => {
  return text.replace(/\{(\w+)\}/g, (match, key) => {
    return params[key]?.toString() || match;
  });
};

// Get nested translation value
export const getNestedValue = (obj: any, path: string): string => {
  const keys = path.split(".");
  let value = obj;
  
  for (const key of keys) {
    if (value && typeof value === "object" && key in value) {
      value = value[key];
    } else {
      return path; // Return path if not found
    }
  }
  
  return typeof value === "string" ? value : path;
};

// Detect browser language
export const detectBrowserLanguage = (): Locale => {
  if (typeof navigator === "undefined") return "en";
  
  const browserLang = navigator.language.toLowerCase();
  
  if (browserLang.startsWith("zh")) return "zh";
  if (browserLang.startsWith("ja")) return "ja";
  
  return "en";
};

// Get saved locale from localStorage
export const getSavedLocale = (): Locale | null => {
  if (typeof localStorage === "undefined") return null;
  
  const saved = localStorage.getItem("lumison-locale");
  if (saved && (saved === "en" || saved === "zh" || saved === "ja")) {
    return saved as Locale;
  }
  
  return null;
};

// Save locale to localStorage
export const saveLocale = (locale: Locale): void => {
  if (typeof localStorage !== "undefined") {
    localStorage.setItem("lumison-locale", locale);
  }
};
