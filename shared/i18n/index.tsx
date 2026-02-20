import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  createContext,
  createElement,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { NativeModules, Platform } from 'react-native';
import type { Translations } from './locales/en';
import en from './locales/en';
import ja from './locales/ja';
import ru from './locales/ru';

const LOCALE_STORAGE_KEY = 'sonicwave_locale';

type Locale = 'en' | 'ja' | 'ru';

const translations: Record<Locale, Translations> = { en, ja, ru };

const availableLocales: { code: Locale; name: string; nativeName: string }[] = [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'ja', name: 'Japanese', nativeName: '日本語' },
  { code: 'ru', name: 'Russian', nativeName: 'Русский' },
];

function getDeviceLocale(): Locale {
  try {
    let deviceLocale = 'en';

    if (Platform.OS === 'ios') {
      const settings = NativeModules.SettingsManager?.settings;
      deviceLocale = settings?.AppleLocale || settings?.AppleLanguages?.[0] || 'en';
    } else if (Platform.OS === 'android') {
      deviceLocale = NativeModules.I18nManager?.localeIdentifier || 'en';
    } else if (Platform.OS === 'web') {
      deviceLocale = typeof navigator !== 'undefined' ? navigator.language : 'en';
    }

    const langCode = deviceLocale.split(/[-_]/)[0].toLowerCase();

    if (langCode === 'ja') return 'ja';
    if (langCode === 'ru') return 'ru';
    return 'en';
  } catch {
    return 'en';
  }
}

function getNestedValue(obj: Record<string, any>, path: string): string {
  const keys = path.split('.');
  let current: any = obj;
  for (const key of keys) {
    if (current === undefined || current === null) return path;
    current = current[key];
  }
  return typeof current === 'string' ? current : path;
}

interface I18nContextValue {
  t: (key: string) => string;
  locale: Locale;
  setLocale: (locale: Locale) => void;
  availableLocales: typeof availableLocales;
}

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(getDeviceLocale());
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(LOCALE_STORAGE_KEY)
      .then((stored) => {
        if (stored && (stored === 'en' || stored === 'ja' || stored === 'ru')) {
          setLocaleState(stored as Locale);
        }
        setIsLoaded(true);
      })
      .catch(() => {
        setIsLoaded(true);
      });
  }, []);

  const setLocale = useCallback((newLocale: Locale) => {
    setLocaleState(newLocale);
    AsyncStorage.setItem(LOCALE_STORAGE_KEY, newLocale).catch(() => {});
  }, []);

  const t = useCallback(
    (key: string): string => {
      return getNestedValue(translations[locale] as unknown as Record<string, any>, key);
    },
    [locale],
  );

  const value = useMemo(
    () => ({
      t,
      locale,
      setLocale,
      availableLocales,
    }),
    [t, locale, setLocale],
  );

  if (!isLoaded) return null;

  return createElement(I18nContext.Provider, { value }, children);
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return context;
}

export { I18nContext };
export type { Locale, Translations };
