import { createContext, useContext } from 'react';
import { en } from './en';
import { zh } from './zh';

export type Language = 'en' | 'zh';
export type Translations = typeof en;

const translations: Record<Language, Translations> = { en, zh };

export function getTranslations(lang: Language): Translations {
  return translations[lang];
}

interface LanguageContextType {
  lang: Language;
  t: Translations;
  setLang: (lang: Language) => void;
}

export const LanguageContext = createContext<LanguageContextType>({
  lang: 'en',
  t: en,
  setLang: () => {},
});

export function useT() {
  return useContext(LanguageContext);
}
