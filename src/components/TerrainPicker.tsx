import { dlcLabel } from '../dlc'
import { localName, secondaryName, ui } from '../i18n'
import { OniIcon } from '../oniIcon'
import { groupTerrainsByBiome, inferWorldVariantRole, worldWidthBand } from '../plannerModel'
import type { Locale, Subworld, World } from '../types'
import { SettlementPanel } from './SettlementPanel'

interface Props {
  world: World | undefined
  terrains: Subworld[]
  selected: Set<string>
  locale: Locale
  onToggle: (ids: string[]) => void
  onSelectAll: () => void
  onClear: () => void
}

const prettyRule = (rule: string) => rule.split('/').pop()?.replace(/^poi_/, '').replace(/^med_/, '').replaceAll('_', ' ') ?? rule

export function TerrainPicker({ world, terrains, selected, locale, onToggle, onSelectAll, onClear }: Props) {
  const t = ui[locale]
  if (!world) return <section className="panel"><p className="empty">{t.noPlanet}</p></section>

  const biomeGroups = groupTerrainsByBiome(terrains)
  const selectedBiomeCount = biomeGroups.filter((group) => group.terrains.every((terrain) => selected.has(terrain.id))).length
  const role = inferWorldVariantRole(world)
  const widthBand = worldWidthBand(world)

  return (
    <section className="panel terrain-panel">
      <div className="world-summary">
        <div className="world-orbit">
          <OniIcon
            group="worlds"
            id={world.id}
            alt={localName(world, locale)}
            fallback="◉"
            className="world-summary-icon"
          />
        </div>
        <div>
          <span className="eyebrow">{dlcLabel(world.dlcTag)}</span>
          <h1>{localName(world, locale)}</h1>
          <p className="secondary-title">{secondaryName(world, locale)}</p>
          <div className="world-metadata" aria-label={t.worldVariant}>
            <span>{t.worldRole}：<strong>{t.variantRoles[role]}</strong></span>
            <span>{t.worldDimensions}：<strong>{world.width}×{world.height}</strong></span>
            <span>{t.horizontalWidth}：<strong>{world.width} {locale === 'zh' ? '格' : 'tiles'}</strong></span>
            <span><strong>{t.widthBands[widthBand]}</strong></span>
          </div>
          <p className="world-size-note">{t.starmapSizeNote}</p>
          {(locale === 'zh' ? world.desc_zh : world.desc_en) && <p className="world-description">{locale === 'zh' ? world.desc_zh : world.desc_en}</p>}
        </div>
      </div>

      {world.settlement && <SettlementPanel analysis={world.settlement} locale={locale} />}

      <div className="section-heading terrain-title">
        <div>
          <span className="eyebrow">BIOMES</span>
          <h2>{t.terrain}</h2>
        </div>
        <div className="button-row">
          <button className="text-button" onClick={onSelectAll}>{t.selectAll}</button>
          <button className="text-button" onClick={onClear}>{t.clearAll}</button>
        </div>
      </div>
      <p className="selection-summary">
        {t.selected} {selectedBiomeCount} / {biomeGroups.length} {t.biomeCount}
        <span> · {selected.size} / {terrains.length} {t.configurationCount}</span>
      </p>
      <p className="biome-selection-note">{t.biomeSelectionNote}</p>
      {terrains.length === 0 ? <p className="empty">{t.noTerrain}</p> : (
        <div className="terrain-grid">
          {biomeGroups.map((group) => {
            const ids = group.terrains.map((terrain) => terrain.id)
            const isSelected = ids.every((id) => selected.has(id))
            const isExtra = group.terrains.some((terrain) => world.clusterExtensionSubworldIds.includes(terrain.id))
            const representative = group.terrains[0]
            const variants = group.terrains.map((terrain) => locale === 'zh' ? terrain.variant_zh || terrain.variant_en : terrain.variant_en)
            return (
              <label className={`terrain-card ${isSelected ? 'checked' : ''}`} key={group.zoneType} title={variants.join('\n')}>
                <input type="checkbox" checked={isSelected} onChange={() => onToggle(ids)} />
                <span className="checkbox-ui">✓</span>
                <span className="terrain-copy">
                  <strong>{localName(representative, locale)}</strong>
                  <small>{secondaryName(representative, locale)}</small>
                  <span>{group.resourceCount} {t.resourceCount} · {group.terrains.length} {t.configurationCount}</span>
                  {group.terrains.length > 1 && <small className="variant-list">{variants.join(' · ')}</small>}
                </span>
                {isExtra && <span className="extra-badge">{t.dlcExtra}</span>}
              </label>
            )
          })}
        </div>
      )}

      {world.guarantees.length > 0 && (
        <details className="guarantees">
          <summary>{t.guarantees} <span>{world.guarantees.length}</span></summary>
          <div className="guarantee-tags">
            {world.guarantees.map((rule) => <code key={rule} title={rule}>{prettyRule(rule)}</code>)}
          </div>
        </details>
      )}
    </section>
  )
}
