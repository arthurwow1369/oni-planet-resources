import { useMemo, useState } from 'react'
import { dlcLabel } from '../dlc'
import { localName, secondaryName, ui } from '../i18n'
import { filterWorldGroups, groupWorlds, inferWorldVariantRole, worldVariantDlcTag, worldWidthBand } from '../plannerModel'
import type { BrowseMode, Locale, World } from '../types'
import { BrowseModeToggle } from './BrowseModeToggle'

interface Props {
  worlds: World[]
  selectedId: string
  locale: Locale
  onSelect: (id: string) => void
  initialSelectedDlcTags?: string[]
  specialResourceNames?: Record<string, string>
  mode?: BrowseMode
  onModeChange?: (mode: BrowseMode) => void
}

const roleOrder = { start: 0, warp: 1, general: 2, unreferenced: 3 } as const

function duplicateVariantQualifier(id: string, locale: Locale): string {
  const labels = ui[locale].variantQualifiers
  if (/basegame/i.test(id)) return labels.baseGame
  if (/classic/i.test(id)) return labels.classic
  if (/spacedout/i.test(id)) return labels.spacedOut
  if (/small/i.test(id)) return labels.small
  return labels.standard
}

export function PlanetSelector({ worlds, selectedId, locale, onSelect, initialSelectedDlcTags, specialResourceNames = {}, mode, onModeChange }: Props) {
  const t = ui[locale]
  const [query, setQuery] = useState('')
  const [showAdvanced, setShowAdvanced] = useState(false)
  const dlcs = useMemo(() => [...new Set(worlds.map(worldVariantDlcTag))].sort(), [worlds])
  const [excludedDlcs, setExcludedDlcs] = useState<Set<string>>(() => initialSelectedDlcTags
    ? new Set(dlcs.filter((tag) => !initialSelectedDlcTags.includes(tag)))
    : new Set())
  const selectedDlcs = useMemo(() => new Set(dlcs.filter((tag) => !excludedDlcs.has(tag))), [dlcs, excludedDlcs])
  const groups = useMemo(() => groupWorlds(worlds), [worlds])
  const filtered = useMemo(
    () => filterWorldGroups(groups, selectedDlcs, query, showAdvanced, selectedId),
    [groups, selectedDlcs, query, showAdvanced, selectedId],
  )

  const toggleDlc = (tag: string) => setExcludedDlcs((current) => {
    const next = new Set(current)
    if (next.has(tag)) next.delete(tag)
    else next.add(tag)
    return next
  })

  return (
    <section className="panel planet-panel">
      {mode && onModeChange && <BrowseModeToggle mode={mode} locale={locale} onChange={onModeChange} />}
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
                <span>{dlcLabel(tag, true, locale)}</span>
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
          const visibleDlcTags = [...new Set(orderedWorlds.map(worldVariantDlcTag))]
          const active = orderedWorlds.some((world) => world.id === selectedId)
          const groupSpecialIds = [...new Set(orderedWorlds.flatMap((world) => world.specialResourceIds))]
          const groupSpecialNames = groupSpecialIds.map((id) => specialResourceNames[id] ?? id)
          const markerLabel = locale === 'zh' ? '含特殊／後期戰略資源' : 'Contains special / late-game strategic resources'
          const markerTitle = locale === 'zh'
            ? `特殊／後期戰略資源：${groupSpecialNames.join('、')}`
            : `Special / late-game resources: ${groupSpecialNames.join(', ')}`
          return (
            <div className={`planet-group ${active ? 'selected' : ''}`} key={group.key}>
              <div className="planet-group-heading">
                <span className="planet-icon">◉</span>
                <span className="planet-copy">
                  <strong>{localName(group, locale)}</strong>
                  <small>{secondaryName(group, locale)}</small>
                </span>
                {groupSpecialIds.length > 0 && <span className="planet-special-marker" role="img" aria-label={`${markerLabel}：${groupSpecialNames.join('、')}`} title={markerTitle}>✦</span>}
                {visibleDlcTags.length === 1 && <span className="dlc-badge">{dlcLabel(visibleDlcTags[0], true, locale)}</span>}
              </div>
              <div className="world-variant-options" aria-label={t.worldVariant}>
                {orderedWorlds.map((world) => {
                  const role = inferWorldVariantRole(world)
                  const sameRoleCount = orderedWorlds.filter((candidate) => inferWorldVariantRole(candidate) === role).length
                  const qualifier = visibleDlcTags.length > 1
                    ? dlcLabel(worldVariantDlcTag(world), true, locale)
                    : sameRoleCount > 1
                      ? duplicateVariantQualifier(world.id, locale)
                      : ''
                  const roleDescription = t.variantRoleDescriptions[role]
                  const widthBand = t.widthBands[worldWidthBand(world)]
                  const requiredContent = dlcLabel(world.dlcTag, true, locale)
                  const worldSpecialNames = world.specialResourceIds.map((id) => specialResourceNames[id] ?? id)
                  const worldMarkerTitle = locale === 'zh'
                    ? `特殊／後期戰略資源：${worldSpecialNames.join('、')}`
                    : `Special / late-game resources: ${worldSpecialNames.join(', ')}`
                  const roleTooltip = locale === 'zh'
                    ? `${t.variantRoles[role]}｜${world.width}×${world.height}｜${qualifier ? `${qualifier}／` : ''}${widthBand}｜所需內容：${requiredContent}。星圖圖示比例不代表實際大小。\nID：${world.id}`
                    : `Role: ${t.variantRoles[role]} | Horizontal width: ${world.width} tiles | Full size: ${world.width}×${world.height} | ${widthBand}. Starmap icon scale does not represent actual size.\nID: ${world.id}`
                  return (
                    <button
                      type="button"
                      key={world.id}
                      className={world.id === selectedId ? 'active' : ''}
                      onClick={() => onSelect(world.id)}
                      aria-pressed={world.id === selectedId}
                      aria-label={`${localName(group, locale)} — ${t.variantRoles[role]} — ${world.width}×${world.height} — ${widthBand}${qualifier ? ` — ${qualifier}` : ''} — ${roleDescription}${worldSpecialNames.length > 0 ? ` — ${markerLabel}：${worldSpecialNames.join(locale === 'zh' ? '、' : ', ')}` : ''}`}
                      title={roleTooltip}
                    >
                      {t.variantRoles[role]}
                      {qualifier && <> · <small>{qualifier}</small></>}
                      {world.specialResourceIds.length > 0 && <span className="variant-special-marker" aria-hidden="true" title={worldMarkerTitle}>✦</span>}
                      {world.settlement && (
                        <span
                          className={`settlement-mini-badge settlement-mini-${world.settlement.classification}`}
                          title={`${t.settlementLabels[world.settlement.classification]} · ${t.operationLabels[world.settlement.operationMode]}`}
                        >
                          {t.settlementLabels[world.settlement.classification]}
                        </span>
                      )}
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
