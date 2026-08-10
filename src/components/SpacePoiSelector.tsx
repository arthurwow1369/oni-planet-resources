import { useMemo, useState } from 'react'
import { dlcLabel } from '../dlc'
import { localName, secondaryName, ui } from '../i18n'
import { filterSpacePois, formatRingRange, kindIcon, spacePoiRingRange, type SpacePoiKindFilter } from '../spacePoiModel'
import type { BrowseMode, Locale, SpacePoi } from '../types'
import { BrowseModeToggle } from './BrowseModeToggle'

interface Props {
  pois: SpacePoi[]
  selectedId: string
  locale: Locale
  mode: BrowseMode
  onSelect: (id: string) => void
  onModeChange: (mode: BrowseMode) => void
}

export function SpacePoiSelector({ pois, selectedId, locale, mode, onSelect, onModeChange }: Props) {
  const t = ui[locale]
  const [kind, setKind] = useState<SpacePoiKindFilter>('all')
  const [strategicOnly, setStrategicOnly] = useState(false)
  const [query, setQuery] = useState('')

  const visible = useMemo(
    () => filterSpacePois(pois, { kind, strategicOnly, query, locale }),
    [pois, kind, strategicOnly, query, locale],
  )

  return (
    <section className="panel planet-panel">
      <BrowseModeToggle mode={mode} locale={locale} onChange={onModeChange} />

      <div className="section-heading">
        <div>
          <span className="eyebrow">STARMAP</span>
          <h2>{t.spacePoiSelect}</h2>
        </div>
        <span className="count-chip" title={t.spacePoiCount}>{visible.length}</span>
      </div>

      <div className="planet-filters">
        <label>
          <span>{t.spacePoiKindFilter}</span>
          <select value={kind} onChange={(event) => setKind(event.target.value as SpacePoiKindFilter)}>
            <option value="all">{t.spacePoiKindLabels.all}</option>
            <option value="harvestable">{t.spacePoiKindLabels.harvestable}</option>
            <option value="artifact">{t.spacePoiKindLabels.artifact}</option>
            <option value="special">{t.spacePoiKindLabels.special}</option>
          </select>
        </label>
        <label>
          <span className="sr-only">{t.spacePoiSearch}</span>
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t.spacePoiSearch} />
        </label>
        <label className="advanced-toggle">
          <input type="checkbox" checked={strategicOnly} onChange={(event) => setStrategicOnly(event.target.checked)} />
          <span>{t.spacePoiStrategicOnly}</span>
        </label>
      </div>

      <div className="planet-list" aria-label={t.spacePoiSelect}>
        {visible.length === 0 && <p className="empty">{t.spacePoiNone}</p>}
        {visible.map((poi) => {
          const rings = spacePoiRingRange(poi)
          return (
            <button
              type="button"
              key={poi.id}
              className={`poi-option ${poi.id === selectedId ? 'selected' : ''}`}
              aria-pressed={poi.id === selectedId}
              onClick={() => onSelect(poi.id)}
            >
              <span className="poi-option-icon" aria-hidden="true">{kindIcon[poi.kind]}</span>
              <span className="poi-option-copy">
                <strong>{localName(poi, locale)}</strong>
                <small>{secondaryName(poi, locale)}</small>
                <span className="poi-option-meta">
                  {rings && <em>{t.spacePoiRingRange} {formatRingRange(rings)}</em>}
                  <em>{dlcLabel(poi.dlcTag, true, locale)}</em>
                </span>
              </span>
              {poi.strategicResourceIds.length > 0 && (
                <span className="planet-special-marker" title={t.spacePoiStrategic} aria-label={t.spacePoiStrategic}>✦</span>
              )}
            </button>
          )
        })}
      </div>
    </section>
  )
}
