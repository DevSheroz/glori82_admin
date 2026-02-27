import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

import en from './en.json'
import ru from './ru.json'

// Read saved language from localStorage, fall back to browser language, then English
const savedLang = localStorage.getItem('i18n_lang')
const browserLang = navigator.language?.split('-')[0]
const lng = savedLang || (browserLang === 'ru' ? 'ru' : 'en')

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      ru: { translation: ru },
    },
    lng,
    fallbackLng: 'en',
    supportedLngs: ['en', 'ru'],
    interpolation: {
      escapeValue: false,
    },
  })

// Persist language to localStorage whenever it changes
i18n.on('languageChanged', (lang) => {
  localStorage.setItem('i18n_lang', lang)
})

export default i18n
