import { useI18n } from 'vue-i18n';
import { Quasar } from 'quasar';

export const SUPPORTED_LOCALES = [
  { value: 'uk', label: 'Українська' },
  { value: 'ru', label: 'Русский' },
  { value: 'en-US', label: 'English' },
  { value: 'de', label: 'Deutsch' },
] as const;

export type AppLocale = (typeof SUPPORTED_LOCALES)[number]['value'];

const STORAGE_KEY = 'brw-bau-locale';

export function isAppLocale(value: string): value is AppLocale {
  return SUPPORTED_LOCALES.some((l) => l.value === value);
}

export function getInitialLocale(): AppLocale {
  const saved = localStorage.getItem(STORAGE_KEY);
  return saved && isAppLocale(saved) ? saved : 'uk';
}

export async function loadQuasarLang(locale: AppLocale) {
  switch (locale) {
    case 'ru':
      return (await import('quasar/lang/ru')).default;
    case 'en-US':
      return (await import('quasar/lang/en-US')).default;
    case 'de':
      return (await import('quasar/lang/de')).default;
    case 'uk':
    default:
      return (await import('quasar/lang/uk')).default;
  }
}

export function useLocale() {
  const { locale } = useI18n({ useScope: 'global' });

  async function setLocale(value: AppLocale) {
    locale.value = value;
    localStorage.setItem(STORAGE_KEY, value);
    Quasar.lang.set(await loadQuasarLang(value));
  }

  return { locale, setLocale, locales: SUPPORTED_LOCALES };
}
