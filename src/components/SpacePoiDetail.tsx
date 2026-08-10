import { useState } from 'react'
import { categoryIcon } from '../resourcePresentation'
import { dlcLabel } from '../dlc'
import { localName, secondaryName, ui } from '../i18n'
import { cargoIcon, formatMass, formatRingRange, groupOutputsByCategory, groupPlacementsByCluster, kindIcon, resolveOutputCategory, spacePoiRingRange } from '../spacePoiModel'
import { OniIcon } from '../oniIcon'
import { oniIconSourceUrl } from '../oniIconIndex'
import type { GameCategory, GameCategoryId, Locale, SpacePoiData, World } from '../types'

interface Props {
  data: SpacePoiData
  poi: SpacePoiData['pois'][number] | undefined
  worlds?: World[]
  locale: Locale
  categories?: GameCategory[]
}

const typeLabel: Record<string, { zh: string; en: string }> = {
  solid: { zh: '固體', en: 'Solid' },
  liquid: { zh: '液體', en: 'Liquid' },
  gas: { zh: '氣體', en: 'Gas' },
}

export function SpacePoiDetail({ data, poi, worlds = [], locale, categories = [] }: Props) {
  const t = ui[locale]
  const [outputFilter, setOutputFilter] = useState<{ poiId: string; category: GameCategoryId | 'all' }>({ poiId: '', category: 'all' })
  const coordinatePolicy = locale === 'zh' ? data.baseline.coordinatePolicy_zh : data.baseline.coordinatePolicy_en

  if (!poi) {
    return (
      <section className="panel resource-panel">
        <div className="section-heading">
          <div>
            <span className="eyebrow">STARMAP</span>
            <h2>{t.spacePoiOverview}</h2>
          </div>
        </div>
        <p className="space-poi-empty">{t.spacePoiSelectPrompt}</p>
      </section>
    )
  }

  const rings = spacePoiRingRange(poi)
  const clusters = groupPlacementsByCluster(poi.placements)
  const worldById = new Map(worlds.map((world) => [world.id, world]))
  const strategic = locale === 'zh' ? poi.strategic_zh : poi.strategic_en
  const attention = locale === 'zh' ? poi.attention_zh : poi.attention_en
  const sourceById = new Map(data.sources.map((source) => [source.id, source]))
  const allOutputGroups = groupOutputsByCategory(poi.outputs, categories, locale)
  const availableOutputCategories = allOutputGroups.map((group) => group.category.id)
  const outputCategory = resolveOutputCategory(
    outputFilter.poiId === poi.id ? outputFilter.category : 'all',
    availableOutputCategories,
  )
  const outputGroups = outputCategory === 'all'
    ? allOutputGroups
    : allOutputGroups.filter((group) => group.category.id === outputCategory)

  return (
    <section className={`panel resource-panel space-poi-detail-panel space-poi-${poi.kind}`}>
      <div className="space-poi-detail-heading">
        <div>
          <span className="eyebrow">STARMAP</span>
          <h2><OniIcon group="pois" id={poi.id} alt={localName(poi, locale)} fallback={kindIcon[poi.kind]} /> {localName(poi, locale)}</h2>
          <small>{secondaryName(poi, locale)}</small>
          {oniIconSourceUrl('pois', poi.id) && <a className="icon-source-link" href={oniIconSourceUrl('pois', poi.id)} target="_blank" rel="noreferrer">wiki.gg</a>}
        </div>
        <span className={`type-chip type-${poi.kind}`}>
          <span aria-hidden="true">{kindIcon[poi.kind]}</span> {t.spacePoiKindLabels[poi.kind]}
        </span>
      </div>

      <p className="use-copy">{locale === 'zh' ? poi.desc_zh : poi.desc_en}</p>

      <div className="space-poi-meta">
        <span className="dlc-chip">{dlcLabel(poi.dlcTag, true, locale)}</span>
        {rings && <span>{t.spacePoiRingRange} {formatRingRange(rings)}</span>}
        {poi.capacityRangeKg && (
          <span>{t.spacePoiCapacity} {formatMass(poi.capacityRangeKg.min)}–{formatMass(poi.capacityRangeKg.max)}</span>
        )}
        {poi.rechargeRangeKgPerCycle && (
          <span>{t.spacePoiRecharge} {formatMass(poi.rechargeRangeKgPerCycle.min)}–{formatMass(poi.rechargeRangeKgPerCycle.max)}</span>
        )}
      </div>

      {poi.cargo.length > 0 && (
        <div className="space-poi-cargo" aria-label={t.spacePoiCargo}>
          {poi.cargo.map((cargo) => (
            <span key={cargo}><span aria-hidden="true">{cargoIcon[cargo]}</span> {t.spacePoiCargoLabels[cargo]}</span>
          ))}
        </div>
      )}

      <p className="space-poi-coordinate-note">{coordinatePolicy}</p>

      {poi.collectibles && poi.collectibles.length > 0 && (
        <div className="space-poi-detail-section">
          <h3>{t.spacePoiCollectibles}</h3>
          <div className="space-poi-collectibles">
            {poi.collectibles.map((item) => (
              <article key={item.id}>
                <strong>{localName(item, locale)}</strong>
                <small>{secondaryName(item, locale)}</small>
                <p>{locale === 'zh' ? item.detail_zh : item.detail_en}</p>
              </article>
            ))}
          </div>
        </div>
      )}

      {allOutputGroups.length > 0 && (
        <div className="space-poi-detail-section">
          <div className="space-poi-outputs-heading">
            <h3>{t.spacePoiOutputs}</h3>
            <label>
              <span className="sr-only">{t.resourceOutputFilter}</span>
              <select
                value={outputCategory}
                aria-label={t.resourceOutputFilter}
                onChange={(event) => setOutputFilter({
                  poiId: poi.id,
                  category: event.target.value as GameCategoryId | 'all',
                })}
              >
                <option value="all">{t.allCategories}</option>
                {allOutputGroups.map(({ category }) => (
                  <option key={category.id} value={category.id}>
                    {categoryIcon(category.id)} {localName(category, locale)}
                  </option>
                ))}
              </select>
            </label>
          </div>
          {outputGroups.length === 0 && <p className="space-poi-empty">{t.noResources}</p>}
          <div className="resource-sections">
            {outputGroups.map(({ category, outputs }) => (
              <section className="category-section" key={category.id}>
                <div className="category-header">
                  <span className="category-icon">{categoryIcon(category.id)}</span>
                  <div>
                    <h3>{localName(category, locale)}</h3>
                    <p>{outputs.length} {t.resourceCount}</p>
                  </div>
                </div>
                <div className="resource-grid">
                  {outputs.map((output) => {
                    const use = locale === 'zh' ? output.use_zh : output.use_en
                    const strategicOutput = poi.strategicResourceIds.includes(output.id)
                    return (
                      <article
                        className={`resource-card resource-card-material ${strategicOutput ? 'resource-card-strategic' : ''}`}
                        key={output.id}
                      >
                        <div className="resource-title">
                          <div>
                            <strong><OniIcon group="resources" id={output.id} alt={localName(output, locale)} fallback={categoryIcon(output.primaryCategory)} /> {localName(output, locale)}</strong>
                            <small>{secondaryName(output, locale)}</small>
                          </div>
                          <span className={`type-chip type-${output.type}`}>
                            {typeLabel[output.type]?.[locale] ?? output.type}
                          </span>
                        </div>
                        <p className="use-copy" title={use}>{use}</p>
                        <div className="resource-card-actions space-poi-output-facts">
                          <span title={t.spacePoiRatio}>{t.spacePoiRatio} <strong>{output.ratio}%</strong></span>
                          <span title={t.spacePoiTemperature}>{output.temperatureC}°C</span>
                          {strategicOutput && <span className="space-poi-strategic-flag">✦ {t.spacePoiStrategic}</span>}
                        </div>
                      </article>
                    )
                  })}
                </div>
              </section>
            ))}
          </div>
        </div>
      )}

      <div className="space-poi-detail-grid">
        {strategic.length > 0 && (
          <section>
            <h3>{t.spacePoiStrategic}</h3>
            <ul>{strategic.map((item) => <li key={item}>{item}</li>)}</ul>
          </section>
        )}
        {attention.length > 0 && (
          <section className="space-poi-attention">
            <h3>{t.attention}</h3>
            <ul>{attention.map((item) => <li key={item}>{item}</li>)}</ul>
          </section>
        )}
      </div>

      {clusters.length > 0 && (
        <div className="space-poi-detail-section">
          <h3>{t.spacePoiClusters} ({clusters.length})</h3>
          <div className="space-poi-cluster-grid">
            {clusters.map((cluster) => (
              <span key={cluster.clusterId}>
                <strong>{localName({ name_en: cluster.clusterName_en, name_zh: cluster.clusterName_zh }, locale)}</strong>
                <em>{t.spacePoiRingRange} {formatRingRange(cluster.allowedRings)}{cluster.guaranteed ? ` · ${t.spacePoiGuaranteed}` : ''}</em>
                {cluster.worldIds.length > 0 && <span className="space-poi-cluster-worlds">
                  {cluster.worldIds.map((worldId) => {
                    const world = worldById.get(worldId)
                    return world && <span key={world.id}><OniIcon group="worlds" id={world.id} alt={localName(world, locale)} fallback="🪐" /> {localName(world, locale)}</span>
                  })}
                </span>}
              </span>
            ))}
          </div>
        </div>
      )}

      {poi.source_ids.length > 0 && (
        <div className="space-poi-detail-section">
          <h3>{t.citations}</h3>
          <ul className="space-poi-citations">
            {poi.source_ids.map((id) => {
              const source = sourceById.get(id)
              if (!source) return <li key={id}>{id}</li>
              return <li key={id}>{source.title}</li>
            })}
          </ul>
        </div>
      )}
    </section>
  )
}
