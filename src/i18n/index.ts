import { createI18n } from 'vue-i18n'
import zhCN from './locales/zh-CN'
import zhTW from './locales/zh-TW'
import en from './locales/en'
import ja from './locales/ja'
import ko from './locales/ko'
import es from './locales/es'
import ru from './locales/ru'

const LOCALE_KEY = 'weaviate_locale'

export const supportedLocales = [
  { value: 'zh-CN', label: '中文' },
  { value: 'zh-TW', label: '繁體中文' },
  { value: 'en', label: 'English' },
  { value: 'ja', label: '日本語' },
  { value: 'ko', label: '한국어' },
  { value: 'es', label: 'Español' },
  { value: 'ru', label: 'Русский' },
] as const

export type LocaleType = (typeof supportedLocales)[number]['value']

function getSavedLocale(): LocaleType {
  try {
    const saved = localStorage.getItem(LOCALE_KEY) as LocaleType | null
    if (saved && supportedLocales.some((l) => l.value === saved)) return saved
  } catch {}
  return 'zh-CN'
}

export const i18n = createI18n({
  legacy: false,
  locale: getSavedLocale(),
  fallbackLocale: 'zh-CN',
  messages: {
    'zh-CN': zhCN,
    'zh-TW': zhTW,
    en,
    ja,
    ko,
    es,
    ru,
  },
})

export function setLocale(locale: LocaleType) {
  i18n.global.locale.value = locale
  try {
    localStorage.setItem(LOCALE_KEY, locale)
  } catch {}
}
