import { useMemo, useState } from 'react'
import { localName, secondaryName, ui } from '../i18n'
import { configurationCoverageForResource, totalConfigurationCoverage } from '../plannerModel'
import { aggregateTerrainResources, categoryIcon, effectiveGameCategory, resourceMatchesQuery, resourceTone, sortGameCategories } from '../resourcePresentation'
import type { AggregatedResource, GameCategory, GameCategoryId, Locale, SpecialResourceRoute, SpecialResourceSource, Subworld, TerrainResearchData } from '../types'
import { TerrainResearchPanel } from './TerrainResearchPanel'
import { AnchoredPopover } from './AnchoredPopover'

interface Props {
  terrains: Subworld[]
  locale: Locale
  research: TerrainResearchData | null
  categories?: GameCategory[]
  specialResources?: SpecialResourceRoute[]
  specialResourceSources?: SpecialResourceSource[]
  specialResourceBaseline?: { as_of: string; latest_public_checked: string; scope_en: string; scope_zh: string }
}

const typeLabel: Record<string, { zh: string; en: string }> = {
  solid: { zh: '固體', en: 'Solid' }, liquid: { zh: '液體', en: 'Liquid' }, gas: { zh: '氣體', en: 'Gas' },
  plant: { zh: '植物', en: 'Plant' }, critter: { zh: '生物', en: 'Critter' },
}

export function ResourceDashboard({ terrains, research, categories = [], locale, specialResources = [], specialResourceSources = [], specialResourceBaseline }: Props) {
  const t = ui[locale]
  const [query, setQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState<GameCategoryId | 'all'>('all')

  const resources = useMemo(() => aggregateTerrainResources(terrains, locale), [terrains, locale])

  const grouped = useMemo(() => {
    const result = new Map<GameCategoryId, AggregatedResource[]>()
    resources.forEach((resource) => {
      const current = result.get(resource.primaryCategory)
      if (current) current.push(resource)
      else result.set(resource.primaryCategory, [resource])
    })
    return result
  }, [resources])

  const categoryById = useMemo(() => new Map(categories.map((category) => [category.id, category])), [categories])
  const availableCategories = useMemo(() => sortGameCategories(
    [...grouped.keys()].map((id) => categoryById.get(id) ?? { id, name_en: id, name_zh: id }),
    locale,
  ), [categoryById, grouped, locale])
  const selectedCategory = effectiveGameCategory(activeCategory, availableCategories)

  const terrainByZone = useMemo(() => new Map(terrains.map((terrain) => [terrain.zoneType, terrain])), [terrains])
  const specialSourceById = useMemo(() => new Map(specialResourceSources.map((source) => [source.id, source])), [specialResourceSources])
  const visibleCategories = selectedCategory === 'all'
    ? availableCategories
    : availableCategories.filter((category) => category.id === selectedCategory)

  if (terrains.length === 0 && specialResources.length === 0) {
    return <section className="panel resource-panel"><div className="section-heading"><h2>{t.resources}</h2></div><p className="empty large">{t.chooseTerrain}</p></section>
  }

  return (
    <section className="panel resource-panel">
      <div className="section-heading resource-heading">
        <div>
          <span className="eyebrow">RESOURCE INTELLIGENCE</span>
          <h2>{t.resources}</h2>
          <p>{resources.length} {t.resourceCount} · {terrains.length} {t.configurationCount}</p>
        </div>
        <input className="resource-search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder={locale === 'zh' ? '搜尋資源…' : 'Search resources…'} />
      </div>

      <TerrainResearchPanel terrains={terrains} research={research} locale={locale} />

      {specialResources.length > 0 && (
        <section className="special-resource-section" aria-labelledby="special-resource-title">
          <div className="main-source-heading">
            <div>
              <span className="eyebrow">STRATEGIC MATERIALS</span>
              <h3 id="special-resource-title">{locale === 'zh' ? '✦ 特殊／後期戰略資源' : '✦ Special / late-game strategic resources'}</h3>
              <p>{specialResourceBaseline
                ? `${locale === 'zh' ? specialResourceBaseline.scope_zh : specialResourceBaseline.scope_en} · ${specialResourceBaseline.latest_public_checked} · ${specialResourceBaseline.as_of}`
                : locale === 'zh' ? '此星球提供下列稀有材料或關鍵產線的原生／事件來源。' : 'This world provides a native or event source for these strategic routes.'}</p>
            </div>
            <span className="special-resource-count">{specialResources.length}</span>
          </div>
          <div className="special-resource-list">
            {specialResources.map((resource, index) => {
              const name = locale === 'zh' ? resource.name_zh : resource.name_en
              const secondary = locale === 'zh' ? resource.name_en : resource.name_zh
              const stage = locale === 'zh' ? resource.stage_zh : resource.stage_en
              const availability = locale === 'zh' ? resource.availability_zh : resource.availability_en
              const production = locale === 'zh' ? resource.production_zh : resource.production_en
              const uses = locale === 'zh' ? resource.uses_zh : resource.uses_en
              const attention = locale === 'zh' ? resource.attention_zh : resource.attention_en
              const sources = resource.source_ids.map((id) => specialSourceById.get(id)).filter((source): source is SpecialResourceSource => Boolean(source))
              return (
                <details className="special-resource-card" key={resource.id} open={index === 0}>
                  <summary>
                    <span className="special-resource-title"><strong>{name}</strong><small>{secondary}</small></span>
                    <span className="special-stage-chip">{stage}</span>
                  </summary>
                  <div className="special-resource-body">
                    <p className="special-availability"><strong>{locale === 'zh' ? '星球來源' : 'World source'}</strong>{availability}</p>
                    <div className="special-resource-detail-grid">
                      <section><h4>{locale === 'zh' ? '製造鏈' : 'Production chain'}</h4><ol>{production.map((item) => <li key={item}>{item}</li>)}</ol></section>
                      <section><h4>{locale === 'zh' ? '主要用途' : 'Primary uses'}</h4><ul>{uses.map((item) => <li key={item}>{item}</li>)}</ul></section>
                    </div>
                    <section className="special-attention"><h4>⚠ {locale === 'zh' ? '注意與限制' : 'Attention and limits'}</h4><ul>{attention.map((item) => <li key={item}>{item}</li>)}</ul></section>
                    {sources.length > 0 && <div className="special-sources"><strong>{locale === 'zh' ? '研究來源' : 'Research sources'}</strong>{sources.map((source) => <a key={source.id} href={source.url} target="_blank" rel="noreferrer">{source.title}</a>)}</div>}
                  </div>
                </details>
              )
            })}
          </div>
        </section>
      )}

      <div className="category-tabs">
        <button className={selectedCategory === 'all' ? 'active' : ''} onClick={() => setActiveCategory('all')}>{locale === 'zh' ? '全部' : 'All'} <span>{resources.length}</span></button>
        {availableCategories.map((category) => {
          const count = grouped.get(category.id)?.length ?? 0
          const name = locale === 'zh' ? category.name_zh || category.name_en : category.name_en
          return <button key={category.id} className={selectedCategory === category.id ? 'active' : ''} onClick={() => setActiveCategory(category.id)}>{categoryIcon(category.id)} {name} <span>{count}</span></button>
        })}
      </div>

      <p className="data-note">ℹ️ {t.dataNote}</p>
      <div className="resource-sections">
        {visibleCategories.map((category) => {
          const name = locale === 'zh' ? category.name_zh || category.name_en : category.name_en
          const items = (grouped.get(category.id) ?? []).filter((resource) => resourceMatchesQuery(resource, query))
          if (items.length === 0) return null
          return (
            <section className="category-section" key={category.id}>
              <div className="category-header">
                <span className="category-icon">{categoryIcon(category.id)}</span>
                <div><h3>{name}</h3><p>{items.length} {t.resourceCount}</p></div>
              </div>
              <div className="resource-grid">
                {items.map((resource) => {
                  const use = locale === 'zh' ? resource.use_zh : resource.use_en
                  const coverage = configurationCoverageForResource(resource.sourceSimhashes, terrains)
                  const representative = resource.representative
                  const representativeType = representative?.kind === 'seed'
                    ? t.representativeSeed
                    : representative?.kind === 'egg'
                      ? t.representativeEgg
                      : t.representativeSpawn
                  const entityUse = representative
                    ? locale === 'zh' ? representative.entity.use_zh : representative.entity.use_en
                    : ''
                  const mechanism = representative
                    ? locale === 'zh' ? representative.mechanism_zh : representative.mechanism_en
                    : ''
                  const totalCoverage = totalConfigurationCoverage(coverage)
                  const coverageMarkup = (
                    <AnchoredPopover
                      triggerLabel={<>{t.configurationCoverageCompact} <strong>{totalCoverage.percentage}%</strong></>}
                      dialogLabel={t.configurationCoverage}
                      closeLabel={t.closeDetails}
                      title={`${totalCoverage.covered}/${totalCoverage.total} · ${totalCoverage.percentage}%`}
                    >
                      <div className="coverage-list">
                        <div>{coverage.map((item) => {
                          const terrain = terrainByZone.get(item.zoneType)
                          const terrainName = terrain ? localName(terrain, locale) : item.zoneType
                          return (
                            <em key={item.zoneType} title={t.configurationCoverageExplanation}>
                              <span>{terrainName}</span>
                              <strong>{item.covered}/{item.total} · {item.percentage}%</strong>
                              <small>
                                {item.covered === 0
                                  ? t.coverageNone
                                  : item.conditional
                                    ? t.coverageConditional
                                    : item.covered === item.total
                                      ? t.coverageAllVariants
                                      : t.coveragePossible}
                              </small>
                            </em>
                          )
                        })}</div>
                      </div>
                    </AnchoredPopover>
                  )
                  if (representative) {
                    const representedType = representative.entity.type === 'plant' ? t.representedPlant : t.representedCritter
                    const representedName = locale === 'zh' ? representative.entity.name_zh : representative.entity.name_en
                    const representedSecondaryName = locale === 'zh' ? representative.entity.name_en : representative.entity.name_zh
                    const separator = locale === 'zh' ? '：' : ': '
                    return (
                      <article className={`resource-card resource-card-${resourceTone(resource)} representative-card`} key={`${category.id}-${resource.simhash}`}>
                        <div className="resource-title">
                          <div><strong>{localName(resource, locale)}</strong><small>{secondaryName(resource, locale)}</small></div>
                          <span className={`type-chip type-${representative.kind}`}>{representativeType}</span>
                        </div>
                        {representative.isVirtual && <span className="virtual-object-chip">⚠ {t.virtualObject}</span>}
                        {mechanism && <p className="use-copy" title={mechanism}>{mechanism}</p>}
                        <div className="resource-card-actions">
                          <AnchoredPopover
                            triggerLabel={<>{representedType}{separator}{representedName}</>}
                            dialogLabel={`${representedType}${separator}${representedName}`}
                            closeLabel={t.closeDetails}
                            className="representative-popover-trigger"
                          >
                            <div className="represented-entity">
                              <span>{representedType}</span>
                              <strong>{representedName}</strong>
                              <small>{representedSecondaryName}</small>
                              <p className="use-copy">{entityUse}</p>
                            </div>
                          </AnchoredPopover>
                          {coverageMarkup}
                        </div>
                      </article>
                    )
                  }
                  return (
                    <article className={`resource-card resource-card-${resourceTone(resource)}`} key={`${category.id}-${resource.simhash}`}>
                      <div className="resource-title">
                        <div><strong>{localName(resource, locale)}</strong><small>{secondaryName(resource, locale)}</small></div>
                        <span className={`type-chip type-${resource.type}`}>{typeLabel[resource.type]?.[locale] ?? resource.type}</span>
                      </div>
                      <p className="use-copy" title={use}>{use}</p>
                      <div className="resource-card-actions">{coverageMarkup}</div>
                    </article>
                  )
                })}
              </div>
            </section>
          )
        })}
      </div>
    </section>
  )
}
