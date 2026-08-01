import { useMemo, useState } from 'react'
import { categoryMeta, localName, secondaryName, ui } from '../i18n'
import { configurationCoverageForResource } from '../plannerModel'
import { aggregateTerrainResources, presentationCategories, resourceTone } from '../resourcePresentation'
import type { AggregatedResource, Category, Locale, Subworld, TerrainResearchData } from '../types'
import { MainSourceRecommendations } from './MainSourceRecommendations'
import { TerrainResearchPanel } from './TerrainResearchPanel'

interface Props {
  terrains: Subworld[]
  locale: Locale
  research: TerrainResearchData | null
}

const categoryOrder: Category[] = ['food', 'plants', 'fauna', 'oxygen', 'power', 'radiation', 'hazard', 'lateGame', 'industrial', 'decoration', 'liquid', 'gas', 'uncategorized']

const typeLabel: Record<string, { zh: string; en: string }> = {
  solid: { zh: '固體', en: 'Solid' }, liquid: { zh: '液體', en: 'Liquid' }, gas: { zh: '氣體', en: 'Gas' },
  plant: { zh: '植物', en: 'Plant' }, critter: { zh: '生物', en: 'Critter' },
}

export function ResourceDashboard({ terrains, research, locale }: Props) {
  const t = ui[locale]
  const [query, setQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState<Category | 'all'>('all')

  const resources = useMemo(() => aggregateTerrainResources(terrains, locale), [terrains, locale])

  const grouped = useMemo(() => {
    const result = new Map<Category, AggregatedResource[]>()
    categoryOrder.forEach((category) => result.set(category, []))
    resources.forEach((resource) => {
      presentationCategories(resource).forEach((category) => result.get(category)?.push(resource))
    })
    return result
  }, [resources])

  const terrainByZone = useMemo(() => new Map(terrains.map((terrain) => [terrain.zoneType, terrain])), [terrains])
  const visibleCategories = activeCategory === 'all' ? categoryOrder : [activeCategory]

  if (terrains.length === 0) {
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

      <MainSourceRecommendations terrains={terrains} locale={locale} />
      <TerrainResearchPanel terrains={terrains} research={research} locale={locale} />

      <div className="category-tabs">
        <button className={activeCategory === 'all' ? 'active' : ''} onClick={() => setActiveCategory('all')}>{locale === 'zh' ? '全部' : 'All'} <span>{resources.length}</span></button>
        {categoryOrder.map((category) => {
          const meta = categoryMeta[category]
          const count = grouped.get(category)?.length ?? 0
          return <button key={category} className={activeCategory === category ? 'active' : ''} onClick={() => setActiveCategory(category)}>{meta.icon} {locale === 'zh' ? meta.zh : meta.en} <span>{count}</span></button>
        })}
      </div>

      <p className="data-note">ℹ️ {t.dataNote}</p>
      <div className="resource-sections">
        {visibleCategories.map((category) => {
          const meta = categoryMeta[category]
          const items = (grouped.get(category) ?? []).filter((resource) => `${resource.name_en} ${resource.name_zh} ${resource.simhash}`.toLowerCase().includes(query.toLowerCase()))
          if (items.length === 0) return null
          return (
            <section className="category-section" key={category}>
              <div className="category-header">
                <span className="category-icon">{meta.icon}</span>
                <div><h3>{locale === 'zh' ? meta.zh : meta.en}</h3><p>{items.length} {t.resourceCount}</p></div>
              </div>
              <div className="resource-grid">
                {items.map((resource) => {
                  const use = locale === 'zh' ? resource.use_zh : resource.use_en
                  const coverage = configurationCoverageForResource(resource.simhash, terrains)
                  return (
                    <article className={`resource-card resource-card-${resourceTone(resource)}`} key={`${category}-${resource.simhash}`}>
                      <div className="resource-title">
                        <div><strong>{localName(resource, locale)}</strong><small>{secondaryName(resource, locale)}</small></div>
                        <span className={`type-chip type-${resource.type}`}>{typeLabel[resource.type]?.[locale] ?? resource.type}</span>
                      </div>
                      <p className="use-copy">{use}</p>
                      <div className="source-list coverage-list">
                        <span>{t.configurationCoverage}</span>
                        <div>{coverage.map((item) => {
                          const terrain = terrainByZone.get(item.zoneType)
                          const name = terrain ? localName(terrain, locale) : item.zoneType
                          return (
                            <em key={item.zoneType} title={t.configurationCoverageExplanation}>
                              <span>{name}</span>
                              <strong>{item.covered}/{item.total} · {item.percentage}%</strong>
                              <small>
                                {item.conditional
                                  ? t.coverageConditional
                                  : item.covered === item.total
                                    ? t.coverageAllVariants
                                    : t.coveragePossible}
                              </small>
                            </em>
                          )
                        })}</div>
                      </div>
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
