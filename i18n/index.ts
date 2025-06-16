import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';

// Import translations
import en from './locales/en.json';
import fr from './locales/fr.json';
import pt from './locales/pt.json';
import sw from './locales/sw.json';
import ar from './locales/ar.json';
import zh from './locales/zh.json';
import hi from './locales/hi.json';
import es from './locales/es.json';
import ru from './locales/ru.json';
import ja from './locales/ja.json';
import de from './locales/de.json';
import ko from './locales/ko.json';
import yo from './locales/yo.json';
import ig from './locales/ig.json';
import ha from './locales/ha.json';
import am from './locales/am.json';
import zu from './locales/zu.json';
import xh from './locales/xh.json';
import af from './locales/af.json';
import th from './locales/th.json';
import vi from './locales/vi.json';
import id from './locales/id.json';
import ms from './locales/ms.json';
import tl from './locales/tl.json';
import bn from './locales/bn.json';
import ur from './locales/ur.json';
import tr from './locales/tr.json';
import it from './locales/it.json';
import pl from './locales/pl.json';
import nl from './locales/nl.json';

const resources = {
  // Global languages
  en: { translation: en },
  zh: { translation: zh },
  hi: { translation: hi },
  es: { translation: es },
  ar: { translation: ar },
  bn: { translation: bn },
  pt: { translation: pt },
  ru: { translation: ru },
  ja: { translation: ja },
  ur: { translation: ur },
  
  // European languages
  fr: { translation: fr },
  de: { translation: de },
  it: { translation: it },
  pl: { translation: pl },
  nl: { translation: nl },
  tr: { translation: tr },
  
  // Asian languages
  ko: { translation: ko },
  th: { translation: th },
  vi: { translation: vi },
  id: { translation: id },
  ms: { translation: ms },
  tl: { translation: tl },
  
  // African languages
  sw: { translation: sw },
  yo: { translation: yo },
  ig: { translation: ig },
  ha: { translation: ha },
  am: { translation: am },
  zu: { translation: zu },
  xh: { translation: xh },
  af: { translation: af },
};

// Language mapping for better detection
const languageMapping: { [key: string]: string } = {
  'en-US': 'en',
  'en-GB': 'en',
  'en-CA': 'en',
  'en-AU': 'en',
  'zh-CN': 'zh',
  'zh-TW': 'zh',
  'zh-HK': 'zh',
  'es-ES': 'es',
  'es-MX': 'es',
  'es-AR': 'es',
  'pt-BR': 'pt',
  'pt-PT': 'pt',
  'fr-FR': 'fr',
  'fr-CA': 'fr',
  'de-DE': 'de',
  'de-AT': 'de',
  'it-IT': 'it',
  'ja-JP': 'ja',
  'ko-KR': 'ko',
  'ru-RU': 'ru',
  'ar-SA': 'ar',
  'ar-EG': 'ar',
  'hi-IN': 'hi',
  'bn-BD': 'bn',
  'bn-IN': 'bn',
  'ur-PK': 'ur',
  'tr-TR': 'tr',
  'th-TH': 'th',
  'vi-VN': 'vi',
  'id-ID': 'id',
  'ms-MY': 'ms',
  'tl-PH': 'tl',
  'sw-KE': 'sw',
  'sw-TZ': 'sw',
  'yo-NG': 'yo',
  'ig-NG': 'ig',
  'ha-NG': 'ha',
  'am-ET': 'am',
  'zu-ZA': 'zu',
  'xh-ZA': 'xh',
  'af-ZA': 'af',
  'pl-PL': 'pl',
  'nl-NL': 'nl',
  'nl-BE': 'nl',
};

// Detect user's preferred language
function detectLanguage(): string {
  const locales = Localization.locales || [];
  
  // Try exact match first
  for (const locale of locales) {
    const languageTag = (locale as any).languageTag || (locale as string);
    if (resources[languageTag as keyof typeof resources]) {
      return languageTag;
    }
    
    // Try mapped language
    if (languageMapping[languageTag]) {
      return languageMapping[languageTag];
    }
    
    // Try language code only (e.g., 'en' from 'en-US')
    const langCode = languageTag.split('-')[0];
    if (resources[langCode as keyof typeof resources]) {
      return langCode;
    }
  }
  
  // Fallback to English
  return 'en';
}

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: detectLanguage(),
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
    react: {
      useSuspense: false,
    },
    // Enable RTL support for Arabic and Urdu
    supportedLngs: Object.keys(resources),
    debug: __DEV__,
  });

export default i18n;

// Export language information for UI components
export const supportedLanguages = [
  // Global/International
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇺🇸' },
  { code: 'zh', name: 'Chinese', nativeName: '中文', flag: '🇨🇳' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', flag: '🇮🇳' },
  { code: 'es', name: 'Spanish', nativeName: 'Español', flag: '🇪🇸' },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية', flag: '🇸🇦', rtl: true },
  { code: 'bn', name: 'Bengali', nativeName: 'বাংলা', flag: '🇧🇩' },
  { code: 'pt', name: 'Portuguese', nativeName: 'Português', flag: '🇧🇷' },
  { code: 'ru', name: 'Russian', nativeName: 'Русский', flag: '🇷🇺' },
  { code: 'ja', name: 'Japanese', nativeName: '日本語', flag: '🇯🇵' },
  { code: 'ur', name: 'Urdu', nativeName: 'اردو', flag: '🇵🇰', rtl: true },
  
  // European
  { code: 'fr', name: 'French', nativeName: 'Français', flag: '🇫🇷' },
  { code: 'de', name: 'German', nativeName: 'Deutsch', flag: '🇩🇪' },
  { code: 'it', name: 'Italian', nativeName: 'Italiano', flag: '🇮🇹' },
  { code: 'pl', name: 'Polish', nativeName: 'Polski', flag: '🇵🇱' },
  { code: 'nl', name: 'Dutch', nativeName: 'Nederlands', flag: '🇳🇱' },
  { code: 'tr', name: 'Turkish', nativeName: 'Türkçe', flag: '🇹🇷' },
  
  // Asian
  { code: 'ko', name: 'Korean', nativeName: '한국어', flag: '🇰🇷' },
  { code: 'th', name: 'Thai', nativeName: 'ไทย', flag: '🇹🇭' },
  { code: 'vi', name: 'Vietnamese', nativeName: 'Tiếng Việt', flag: '🇻🇳' },
  { code: 'id', name: 'Indonesian', nativeName: 'Bahasa Indonesia', flag: '🇮🇩' },
  { code: 'ms', name: 'Malay', nativeName: 'Bahasa Melayu', flag: '🇲🇾' },
  { code: 'tl', name: 'Filipino', nativeName: 'Filipino', flag: '🇵🇭' },
  
  // African
  { code: 'sw', name: 'Swahili', nativeName: 'Kiswahili', flag: '🇰🇪' },
  { code: 'yo', name: 'Yoruba', nativeName: 'Yorùbá', flag: '🇳🇬' },
  { code: 'ig', name: 'Igbo', nativeName: 'Igbo', flag: '🇳🇬' },
  { code: 'ha', name: 'Hausa', nativeName: 'Hausa', flag: '🇳🇬' },
  { code: 'am', name: 'Amharic', nativeName: 'አማርኛ', flag: '🇪🇹' },
  { code: 'zu', name: 'Zulu', nativeName: 'isiZulu', flag: '🇿🇦' },
  { code: 'xh', name: 'Xhosa', nativeName: 'isiXhosa', flag: '🇿🇦' },
  { code: 'af', name: 'Afrikaans', nativeName: 'Afrikaans', flag: '🇿🇦' },
];

// Helper function to check if language is RTL
export const isRTL = (languageCode: string): boolean => {
  const rtlLanguages = ['ar', 'ur', 'he', 'fa'];
  return rtlLanguages.includes(languageCode);
};

// Helper function to get language direction
export const getLanguageDirection = (languageCode: string): 'ltr' | 'rtl' => {
  return isRTL(languageCode) ? 'rtl' : 'ltr';
};