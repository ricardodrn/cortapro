import { useTranslation } from 'react-i18next'
import { setLanguage, SUPPORTED_LANGUAGES, type Language } from '../i18n/index.ts'

export default function LanguageSwitcher() {
  const { t, i18n } = useTranslation()
  const current = (i18n.resolvedLanguage ?? i18n.language).slice(0, 2)

  return (
    <label className="flex items-center gap-1.5 text-xs text-slate-500">
      <span className="sr-only">{t('app.language')}</span>
      <select
        value={SUPPORTED_LANGUAGES.includes(current as Language) ? current : 'en'}
        onChange={(e) => setLanguage(e.target.value as Language)}
        aria-label={t('app.language')}
        className="rounded-md border border-slate-300 bg-white px-2 py-1 text-xs font-medium text-slate-600 outline-none transition-colors hover:bg-slate-100 focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
      >
        {SUPPORTED_LANGUAGES.map((lang) => (
          <option key={lang} value={lang}>
            {t(`app.lang.${lang}`)}
          </option>
        ))}
      </select>
    </label>
  )
}
