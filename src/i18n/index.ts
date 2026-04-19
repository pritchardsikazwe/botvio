import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import en from './locales/en.json';
import fr from './locales/fr.json';
import pt from './locales/pt.json';
import es from './locales/es.json';
import ar from './locales/ar.json';
import sw from './locales/sw.json';
import hi from './locales/hi.json';
import ms from './locales/ms.json';
import zh from './locales/zh.json';
import ru from './locales/ru.json';
import ja from './locales/ja.json';

const resources = {
  en: { translation: en },
  fr: { translation: fr },
  pt: { translation: pt },
  es: { translation: es },
  ar: { translation: ar },
  sw: { translation: sw },
  hi: { translation: hi },
  ms: { translation: ms },
  zh: { translation: zh },
  ru: { translation: ru },
  ja: { translation: ja },
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    supportedLngs: ['en', 'fr', 'pt', 'es', 'ar', 'sw', 'hi', 'ms', 'zh', 'ru', 'ja'],
    detection: {
      // localStorage first (manual choice wins), then our custom geo detector via initial value, then navigator
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage'],
      lookupLocalStorage: 'botvio_lang',
    },
    interpolation: {
      escapeValue: false,
    },
    react: {
      useSuspense: false,
    },
  });

export const languages = [
  { code: 'en', name: 'English', native: 'English', flag: '🇬🇧', dir: 'ltr' },
  { code: 'fr', name: 'French', native: 'Français', flag: '🇫🇷', dir: 'ltr' },
  { code: 'pt', name: 'Portuguese', native: 'Português', flag: '🇵🇹', dir: 'ltr' },
  { code: 'es', name: 'Spanish', native: 'Español', flag: '🇪🇸', dir: 'ltr' },
  { code: 'ar', name: 'Arabic', native: 'العربية', flag: '🇸🇦', dir: 'rtl' },
  { code: 'sw', name: 'Swahili', native: 'Kiswahili', flag: '🇰🇪', dir: 'ltr' },
  { code: 'hi', name: 'Hindi', native: 'हिन्दी', flag: '🇮🇳', dir: 'ltr' },
  { code: 'ms', name: 'Malay', native: 'Bahasa Melayu', flag: '🇲🇾', dir: 'ltr' },
  { code: 'zh', name: 'Chinese', native: '中文', flag: '🇨🇳', dir: 'ltr' },
  { code: 'ru', name: 'Russian', native: 'Русский', flag: '🇷🇺', dir: 'ltr' },
  { code: 'ja', name: 'Japanese', native: '日本語', flag: '🇯🇵', dir: 'ltr' },
] as const;

export type LanguageCode = typeof languages[number]['code'];

// ISO country code → language code mapping
// Defaults to English for unmapped countries.
export const countryToLanguage: Record<string, LanguageCode> = {
  // English (default)
  US: 'en', GB: 'en', CA: 'en', AU: 'en', NZ: 'en', IE: 'en', ZA: 'en', NG: 'en', GH: 'en',
  // French
  FR: 'fr', BE: 'fr', LU: 'fr', MC: 'fr', CI: 'fr', SN: 'fr', CM: 'fr', CD: 'fr', MG: 'fr', BJ: 'fr', BF: 'fr', ML: 'fr', NE: 'fr', TG: 'fr', GA: 'fr', CG: 'fr', RW: 'fr', BI: 'fr', DJ: 'fr', HT: 'fr',
  // Portuguese
  PT: 'pt', BR: 'pt', AO: 'pt', MZ: 'pt', CV: 'pt', GW: 'pt', ST: 'pt', TL: 'pt',
  // Spanish
  ES: 'es', MX: 'es', AR: 'es', CO: 'es', CL: 'es', PE: 'es', VE: 'es', EC: 'es', GT: 'es', CU: 'es', BO: 'es', DO: 'es', HN: 'es', PY: 'es', SV: 'es', NI: 'es', CR: 'es', PA: 'es', UY: 'es', PR: 'es',
  // Arabic
  SA: 'ar', AE: 'ar', EG: 'ar', QA: 'ar', KW: 'ar', BH: 'ar', OM: 'ar', JO: 'ar', LB: 'ar', SY: 'ar', IQ: 'ar', YE: 'ar', LY: 'ar', TN: 'ar', DZ: 'ar', MA: 'ar', SD: 'ar', SO: 'ar', MR: 'ar', PS: 'ar',
  // Swahili
  KE: 'sw', TZ: 'sw', UG: 'sw',
  // Hindi
  IN: 'hi',
  // Malay
  MY: 'ms', BN: 'ms', ID: 'ms', SG: 'ms',
  // Chinese
  CN: 'zh', TW: 'zh', HK: 'zh', MO: 'zh',
  // Russian
  RU: 'ru', BY: 'ru', KZ: 'ru', KG: 'ru', UA: 'ru',
  // Japanese
  JP: 'ja',
};

export default i18n;
