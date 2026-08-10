import { dlcLabel } from '../dlc'
import { localName, secondaryName, ui } from '../i18n'
import { categoryIcon } from '../resourcePresentation'
import { OniIcon } from '../oniIcon'
import { oniIconSourceUrl } from '../oniIconIndex'
import { kindIcon } from '../spacePoiModel'
import { filterResourceSources, sourceDlcTags, type IndexedResource, type ResourceSourceSelection } from '../resourceIndex'
import type { GameCategory, Locale, SpacePoi, World } from '../types'

interface Props {
  resource: IndexedResource | undefined
  worlds: World[]
  pois: SpacePoi[]
  categories: GameCategory[]
  locale: Locale
  selection: ResourceSourceSelection
  onToggleKind: (kind: string) => void
  onToggleDlcTag: (tag: string) => void
  onResetSources: (excludeAll: boolean) => void
  onOpenWorld: (id: string) => void
  onOpenPoi: (id: string) => void
}

const typeLabel: Record<string, { zh: string; en: string }> = {
  solid: { zh: '固體', en: 'Solid' },
  liquid: { zh: '液體', en: 'Liquid' },
  gas: { zh: '氣體', en: 'Gas' },
  plant: { zh: '植物', en: 'Plant' },
  critter: { zh: '生物', en: 'Critter' },
  geyser: { zh: '間歇泉', en: 'Geyser' },
}

export function ResourceDetail({
  resource, worlds, pois, categories, locale, selection, onToggleKind, onToggleDlcTag, onResetSources, onOpenWorld, onOpenPoi,
}: Props) {
  const t = ui[locale]

  if (!resource) {
    return (
      <section className="panel resource-panel">
        <div className="section-heading">
          <div>
            <span className="eyebrow">RESOURCE</span>
            <h2>{t.resourceSources}</h2>
          </div>
        </div>
        <p className="space-poi-empty">{t.resourceSelectPrompt}</p>
      </section>
    )
  }

  const category = categories.find((item) => item.id === resource.primaryCategory)
  const iconGroup = resource.geyser ? 'geysers' : 'resources'
  const iconId = resource.geyser?.id ?? resource.id
  const iconFallback = resource.geyser ? '🌋' : categoryIcon(resource.primaryCategory)
  const { worlds: matchedWorlds, pois: matchedPois } = filterResourceSources(resource, worlds, pois, selection)
  const dlcTags = sourceDlcTags(worlds, pois)
  // A resource with no source of a given kind cannot be filtered by it, so the
  // chip is disabled rather than silently yielding an empty list.
  const availableByKind: Record<string, number> = { worlds: resource.worldIds.length, pois: resource.poiIds.length }
  const kinds: Array<[string, string]> = [['worlds', t.sourceTypeLabels.worlds], ['pois', t.sourceTypeLabels.pois]]
  const guaranteedWorlds = new Set(resource.guaranteedWorldIds)

  return (
    <section className="panel resource-panel">
      <div className="space-poi-detail-heading">
        <div>
          <span className="eyebrow">RESOURCE</span>
          <h2><OniIcon group={iconGroup} id={iconId} alt={localName(resource, locale)} fallback={iconFallback} /> {localName(resource, locale)}</h2>
          <small>{secondaryName(resource, locale)}</small>
          {oniIconSourceUrl(iconGroup, iconId) && <a className="icon-source-link" href={oniIconSourceUrl(iconGroup, iconId)} target="_blank" rel="noreferrer">wiki.gg</a>}
        </div>
        <span className={`type-chip type-${resource.type}`}>
          {typeLabel[resource.type]?.[locale] ?? resource.type}
        </span>
      </div>

      <p className="use-copy">{locale === 'zh' ? resource.use_zh : resource.use_en}</p>

      <div className="space-poi-meta">
        {category && <span>{categoryIcon(category.id)} {localName(category, locale)}</span>}
        <span>🪐 {resource.worldIds.length}</span>
        {!resource.geyser && <span>⛏️ {resource.poiIds.length}</span>}
        {resource.geyser && (
          <>
            <span>{t.geyserOutput} {localName({ name_en: resource.geyser.elementName_en, name_zh: resource.geyser.elementName_zh }, locale)}</span>
            <span>{t.geyserRate} {resource.geyser.rateKgPerCycle.min}–{resource.geyser.rateKgPerCycle.max} {t.geyserPerCycle}</span>
            <span>{t.geyserTemperature} {resource.geyser.temperatureC}°C</span>
          </>
        )}
      </div>

      <div className="resource-source-filter">
        <fieldset className="dlc-filter-group">
          <legend>{t.sourceTypeFilter}</legend>
          <div className="dlc-filter-options">
            {kinds.map(([kind, label]) => {
              const available = availableByKind[kind] > 0
              const checked = available && !selection.excludedKinds.has(kind)
              return (
                <label
                  className={`${checked ? 'checked' : ''} ${available ? '' : 'disabled'}`.trim()}
                  key={kind}
                  title={available ? undefined : t.sourceKindUnavailable}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    disabled={!available}
                    onChange={() => onToggleKind(kind)}
                  />
                  <span>{kind === 'worlds' ? '🪐' : '⛏️'} {label} ({availableByKind[kind]})</span>
                </label>
              )
            })}
          </div>
        </fieldset>

        <fieldset className="dlc-filter-group">
          <legend>{t.filterDlc}</legend>
          <div className="dlc-filter-options">
            {dlcTags.map((tag) => (
              <label className={selection.excludedDlcTags.has(tag) ? '' : 'checked'} key={tag}>
                <input
                  type="checkbox"
                  checked={!selection.excludedDlcTags.has(tag)}
                  onChange={() => onToggleDlcTag(tag)}
                />
                <span>{dlcLabel(tag, true, locale)}</span>
              </label>
            ))}
          </div>
          <div className="filter-actions">
            <button className="filter-reset" type="button" onClick={() => onResetSources(false)}>{t.allDlc}</button>
            <button className="filter-reset" type="button" onClick={() => onResetSources(true)}>{t.clearAll}</button>
          </div>
        </fieldset>
      </div>

      <p className="space-poi-coordinate-note">{t.resourceSourceNote}</p>

      {matchedWorlds.length === 0 && matchedPois.length === 0 && (
        <p className="space-poi-empty">{t.noResourceSources}</p>
      )}

      {matchedWorlds.length > 0 && (
        <div className="space-poi-detail-section">
          <h3>{t.worldsContaining} ({matchedWorlds.length})</h3>
          <div className="resource-source-grid">
            {matchedWorlds.map((world) => (
              <button type="button" className="resource-source-link" key={world.id} onClick={() => onOpenWorld(world.id)}>
                <OniIcon group="worlds" id={world.id} alt={localName(world, locale)} fallback="🪐" />
                <span>
                  <strong>{localName(world, locale)}</strong>
                  <em>
                    {dlcLabel(world.dlcTag, true, locale)}
                    {resource.geyser && (
                      guaranteedWorlds.has(world.id)
                        ? <b className="source-guaranteed"> · {t.geyserWorldGuaranteed}</b>
                        : <span> · {t.geyserWorldPooled}</span>
                    )}
                  </em>
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {matchedPois.length > 0 && (
        <div className="space-poi-detail-section">
          <h3>{t.poisYielding} ({matchedPois.length})</h3>
          <div className="resource-source-grid">
            {matchedPois.map((poi) => {
              const output = poi.outputs.find((item) => item.id === resource.id)
              return (
                <button type="button" className="resource-source-link" key={poi.id} onClick={() => onOpenPoi(poi.id)}>
                  <OniIcon group="pois" id={poi.id} alt={localName(poi, locale)} fallback={kindIcon[poi.kind]} />
                  <span>
                    <strong>{localName(poi, locale)}</strong>
                    <em>{output ? `${t.spacePoiRatio} ${output.ratio}%` : dlcLabel(poi.dlcTag, true, locale)}</em>
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      )}
    </section>
  )
}
