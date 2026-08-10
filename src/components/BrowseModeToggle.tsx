import { ui } from '../i18n'
import type { BrowseMode, Locale } from '../types'

interface Props {
  mode: BrowseMode
  locale: Locale
  onChange: (mode: BrowseMode) => void
}

export function BrowseModeToggle({ mode, locale, onChange }: Props) {
  const t = ui[locale]
  const options: Array<[BrowseMode, string]> = [
    ['planets', t.browseModePlanets],
    ['pois', t.browseModePois],
    ['resources', t.browseModeResources],
  ]

  return (
    <div className="browse-mode-toggle" role="group" aria-label={t.browseMode}>
      {options.map(([value, label]) => (
        <button
          type="button"
          key={value}
          className={value === mode ? 'active' : ''}
          aria-pressed={value === mode}
          onClick={() => onChange(value)}
        >
          {label}
        </button>
      ))}
    </div>
  )
}
