import { useMemo, useState } from 'react'
import { dlcLabel } from '../dlc'
import { localName, secondaryName, ui } from '../i18n'
import { filterWorldGroups, groupWorlds, inferWorldVariantRole } from '../plannerModel'
import type { Locale, World } from '../types'

interface Props {
  worlds: World[]
  selectedId: string
  locale: Locale
  onSelect: (id: string) => void
}

const roleOrder = { start: 0, warp: 1, mini: 2, general: 3 } as const

function duplicateVariantQualifier(id: string, locale: Locale): string {
  const labels = ui[locale].variantQualifiers
  if (/basegame/i.test(id)) return labels.baseGame
  if (/classic/i.test(id)) return labels.classic
  if (/spacedout/i.test(id)) return labels.spacedOut
  if (/small/i.test(id)) return labels.small
  return labels.standard
}

export function PlanetSelector({ worlds, selectedId, locale, onSelect }: Props) {
  const t = ui[locale]
  const [query, setQuery] = useState('')
  const [excludedDlcs, setExcludedDlcs] = useState<Set<string>>(new Set())
  const [showAdvanced, setShowAdvanced] = useState(false)
  const dlcs = useMemo(() => [...new Set(worlds.map((world) => world.dlcTag))].sort(), [worlds])
  const selectedDlcs = useMemo(() => new Set(dlcs.filter((tag) => !excludedDlcs.has(tag))), [dlcs, excludedDlcs])
  const groups = useMemo(() => groupWorlds(worlds), [worlds])
  const filtered = useMemo(
    () => filterWorldGroups(groups, selectedDlcs, query, showAdvanced),
    [groups, selectedDlcs, query, showAdvanced],
  )

  const toggleDlc = (tag: string) => setExcludedDlcs((current) => {
    const next = new Set(current)
    if (next.has(tag)) next.delete(tag)
    else next.add(tag)
    return next
  })

  return (
    <section className="panel planet-panel">
      <div className="section-heading">
        <div>
          <span className="eyebrow">PLANET</span>
          <h2>{t.planet}</h2>
        </div>
        <span className="count-chip" title={t.planetGroupCount}>{filtered.length}</span>
      </div>
      <div className="planet-filters">
        <fieldset className="dlc-filter-group">
          <legend>{t.filterDlc}</legend>
          <div className="dlc-filter-options">
            {dlcs.map((tag) => (
              <label className={selectedDlcs.has(tag) ? 'checked' : ''} key={tag}>
                <input type="checkbox" checked={selectedDlcs.has(tag)} onChange={() => toggleDlc(tag)} />
                <span>{dlcLabel(tag, true)}</span>
              </label>
            ))}
          </div>
          <div className="filter-actions">
            <button className="filter-reset" type="button" onClick={() => setExcludedDlcs(new Set())}>{t.allDlc}</button>
            <button className="filter-reset" type="button" onClick={() => setExcludedDlcs(new Set(dlcs))}>{t.clearAll}</button>
          </div>
        </fieldset>
        <label>
          <span className="sr-only">{t.searchPlanet}</span>
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t.searchPlanet} />
        </label>
        <label className="advanced-toggle">
          <input type="checkbox" checked={showAdvanced} onChange={(event) => setShowAdvanced(event.target.checked)} />
          <span>{t.showAdvancedMaps}</span>
        </label>
        <p className="advanced-note">{t.advancedMapsNote}</p>
      </div>
      <div className="planet-list" aria-label={t.planet}>
        {filtered.length === 0 && <p className="empty">{t.noPlanet}</p>}
        {filtered.map((group) => {
          const orderedWorlds = [...group.worlds].sort((a, b) => roleOrder[inferWorldVariantRole(a)] - roleOrder[inferWorldVariantRole(b)])
          const active = orderedWorlds.some((world) => world.id === selectedId)
          return (
            <div className={`planet-group ${active ? 'selected' : ''}`} key={group.key}>
              <div className="planet-group-heading">
                <span className="planet-icon">◉</span>
                <span className="planet-copy">
                  <strong>{localName(group, locale)}</strong>
                  <small>{secondaryName(group, locale)}</small>
                </span>
                <span className="dlc-badge">{dlcLabel(group.dlcTag, true)}</span>
              </div>
              <div className="world-variant-options" aria-label={t.worldVariant}>
                {orderedWorlds.map((world) => {
                  const role = inferWorldVariantRole(world)
                  const sameRoleCount = orderedWorlds.filter((candidate) => inferWorldVariantRole(candidate) === role).length
                  const qualifier = sameRoleCount > 1 ? duplicateVariantQualifier(world.id, locale) : ''
                  return (
                    <button
                      type="button"
                      key={world.id}
                      className={world.id === selectedId ? 'active' : ''}
                      onClick={() => onSelect(world.id)}
                      aria-pressed={world.id === selectedId}
                      aria-label={`${localName(group, locale)} — ${t.variantRoles[role]}${qualifier ? ` — ${qualifier}` : ''}`}
                      title={world.id}
                    >
                      {t.variantRoles[role]}
                      {qualifier && <small>{qualifier}</small>}
                    </button>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
