import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

void i18n.use(initReactI18next).init({
  lng: 'en',
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
  resources: {
    en: {
      translation: {
        app_name: 'Participant Portal',
      },
    },
    es: {
      translation: {
        app_name: 'Portal del participante',
      },
    },
    fr: {
      translation: {
        app_name: 'Portail des participants',
      },
    },
    zh: {
      translation: {
        app_name: '参与者门户',
      },
    },
  },
})

export default i18n
