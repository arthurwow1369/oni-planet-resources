import type { Locale } from '../types'

interface Props {
  locale: Locale
  onChange: (locale: Locale) => void
}

export function LocaleToggle({ locale, onChange }: Props) {
  return (
    <div className="locale-toggle" aria-label="Language">
      <button className={locale === 'zh' ? 'active' : ''} onClick={() => onChange('zh')}>繁中</button>
      <button className={locale === 'en' ? 'active' : ''} onClick={() => onChange('en')}>EN</button>
    </div>
  )
}
