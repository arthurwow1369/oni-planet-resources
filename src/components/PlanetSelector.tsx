import { useMemo, useState } from 'react'
import { dlcLabel } from '../dlc'
import { localName, secondaryName, ui } from '../i18n'
import type { Locale, World } from '../types'

interface Props {
  worlds: World[]
  selectedId: string
  locale: Locale
  onSelect: (id: string) => void
}

export function PlanetSelector({ worlds, selectedId, locale, onSelect }: Props) {
  const t = ui[locale]
  const [query, setQuery] = useState('')
  const [dlc, setDlc] = useState('all')
  const dlcs = useMemo(() => [...new Set(worlds.map((w) => w.dlcTag))].sort(), [worlds])
  const filtered = useMemo(() => worlds.filter((world) => {
    if (dlc !== 'all' && world.dlcTag !== dlc) return false
    const haystack = `${world.name_en} ${world.name_zh} ${world.id}`.toLowerCase()
    return haystack.includes(query.toLowerCase())
  }), [worlds, dlc, query])

  return (
    <section className="panel planet-panel">
      <div className="section-heading">
        <div>
          <span className="eyebrow">PLANET</span>
          <h2>{t.planet}</h2>
        </div>
        <span className="count-chip">{filtered.length}</span>
      </div>
      <div className="planet-filters">
        <label>
          <span>{t.filterDlc}</span>
          <select value={dlc} onChange={(event) => setDlc(event.target.value)}>
            <option value="all">{t.allDlc}</option>
            {dlcs.map((tag) => <option key={tag} value={tag}>{dlcLabel(tag)}</option>)}
          </select>
        </label>
        <label>
          <span className="sr-only">{t.searchPlanet}</span>
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t.searchPlanet} />
        </label>
      </div>
      <div className="planet-list" role="listbox">
        {filtered.length === 0 && <p className="empty">{t.noPlanet}</p>}
        {filtered.map((world) => (
          <button
            key={world.id}
            className={`planet-option ${world.id === selectedId ? 'selected' : ''}`}
            onClick={() => onSelect(world.id)}
            role="option"
            aria-selected={world.id === selectedId}
          >
            <span className="planet-icon">◉</span>
            <span className="planet-copy">
              <strong>{localName(world, locale)}</strong>
              <small>{secondaryName(world, locale)}</small>
            </span>
            <span className="dlc-badge">{dlcLabel(world.dlcTag, true)}</span>
          </button>
        ))}
      </div>
    </section>
  )
}
