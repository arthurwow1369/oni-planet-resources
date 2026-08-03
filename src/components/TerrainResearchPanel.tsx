import { useMemo } from 'react'
import { dlcLabel } from '../dlc'
import { ui } from '../i18n'
import { recommendationPhases } from '../plannerModel'
import type {
  Locale,
  Subworld,
  TerrainResearchConfidence,
  TerrainCostEfficiencyRating,
  TerrainResearchData,
  TerrainResearchDependency,
  TerrainResearchEntityProfile,

  TerrainResearchSpawnable,
  TerrainResearchStage,
  TerrainResearchZone,
} from '../types'

interface Props {
  terrains: Subworld[]
  research: TerrainResearchData | null
  locale: Locale
}

const stageLabels: Record<TerrainResearchStage, { en: string; zh: string }> = {
  all: { en: 'All stages', zh: '全階段' },
  early: { en: 'Early game', zh: '前期' },
  'early-mid': { en: 'Early–mid game', zh: '前至中期' },
  mid: { en: 'Mid game', zh: '中期' },
  'mid-late': { en: 'Mid–late game', zh: '中至後期' },
  late: { en: 'Late game', zh: '後期' },
}

const confidenceLabels: Record<TerrainResearchConfidence, { en: string; zh: string }> = {
  high: { en: 'High confidence', zh: '高可信度' },
  medium: { en: 'Medium confidence', zh: '中等可信度' },
}

const dependencyLabels: Record<TerrainResearchDependency, { en: string; zh: string }> = {
  'connected-frosty-biome': { en: 'Needs a connected Frosty biome', zh: '需相連的寒霜生態' },
  imported: { en: 'Imported inputs', zh: '需運入資源' },
  'imported-or-connected': { en: 'Imported or connected supply', zh: '需運入或由相連區域供應' },
  'imported-or-location-dependent': { en: 'Imported or location-dependent', zh: '需運入或視位置而定' },
  'imported-spaced-out': { en: 'Imported; Spaced Out! mechanics', zh: '需運入；使用《眼冒金星！》機制' },
  'location-dependent': { en: 'Location-dependent', zh: '視位置而定' },
  'location-dependent-spaced-out': { en: 'Location-dependent; Spaced Out! mechanics', zh: '視位置而定；使用《眼冒金星！》機制' },
  mixed: { en: 'Mixed local and imported inputs', zh: '混合當地與運入資源' },
  native: { en: 'Native', zh: '原生' },
  'native-bridge': { en: 'Native bridge supply', zh: '原生過渡供應' },
  'native-bridge-then-mixed': { en: 'Native bridge, then mixed inputs', zh: '先用原生資源過渡，再採混合供應' },
  'native-complex': { en: 'Native, complex setup', zh: '原生，但系統複雜' },
  'native-feature': { en: 'Native terrain feature', zh: '原生地形特徵' },
  'native-finite': { en: 'Native but finite', zh: '原生但有限' },
  'native-finite-then-imported': { en: 'Finite native supply, then imported', zh: '先用有限原生資源，再改由運入' },
  'native-finite-unless-looped': { en: 'Native; finite without a renewable loop', zh: '原生；未建立循環時為有限' },
  'native-location': { en: 'Native at suitable locations', zh: '合適位置的原生來源' },
  'native-direct-gas': { en: 'Native gas used directly', zh: '直接利用原生氣體' },
  'native-direct-offgassing': { en: 'Native direct offgassing', zh: '原生資源直接逸氣' },
  'native-ingredient-plus-fauna': { en: 'Native ingredient plus fauna', zh: '原生食材加動物來源' },
  'native-manual-only': { en: 'Native manual power only', zh: '原生方案僅有人力發電' },
  'native-plant-plus-critter': { en: 'Native plant; requires a critter', zh: '原生植物；需要小動物' },
  'native-plant-plus-imported-or-connected-dirt': { en: 'Native plant; needs imported or connected Dirt', zh: '原生植物；需運入或由相連區域供應泥土' },
  'native-plant-plus-imported-or-connected-hydrogen-and-critters': { en: 'Native plant; needs external hydrogen and critters', zh: '原生植物；需外部氫氣與小動物' },
  'native-plus-buildings': { en: 'Native inputs plus buildings', zh: '原生資源加建築設施' },
  'native-plus-connected': { en: 'Native plus connected supply', zh: '原生加相連區域供應' },
  'native-plus-imported': { en: 'Native plus imported inputs', zh: '原生加運入資源' },
  'native-plus-infrastructure': { en: 'Native plus infrastructure', zh: '原生加基礎設施' },
  'native-plus-one-building': { en: 'Native input plus one building', zh: '原生資源加一座建築' },
  'native-plus-processing': { en: 'Native with processing', zh: '原生但需加工' },
  'native-spaced-out': { en: 'Native; Spaced Out! mechanics', zh: '原生；使用《眼冒金星！》機制' },
  'native-variant': { en: 'Native in some variants', zh: '部分變體原生' },
  'native-variant-finite': { en: 'Finite and native in some variants', zh: '部分變體原生且有限' },
  'native-variant-finite-then-imported': { en: 'Finite variant supply, then imported', zh: '先用變體中的有限資源，再改由運入' },
  'native-variant-ice-or-imported': { en: 'Variant-native ice or imported supply', zh: '變體原生冰或運入供應' },
  'native-variant-or-imported': { en: 'Variant-native or imported', zh: '變體原生或需運入' },
  'native-variant-or-imported-ethanol': { en: 'Variant-native or imported Ethanol', zh: '變體原生或運入乙醇' },
  'native-variant-plus-imported': { en: 'Variant-native plus imported inputs', zh: '變體原生加運入資源' },
  'native-variant-spaced-out': { en: 'Variant-native; Spaced Out! mechanics', zh: '部分變體原生；使用《眼冒金星！》機制' },
  'requires-reef': { en: 'Requires a Reef biome', zh: '需要珊瑚生態' },
  'seed-dependent': { en: 'World-seed dependent', zh: '視世界種子而定' },
  'seed-dependent-native-feature': { en: 'Seed-dependent native feature', zh: '視種子生成的原生特徵' },
  'no-direct-native-route': { en: 'No direct native route', zh: '無原生直接路徑' },
  'no-guaranteed-direct-native-fuel': { en: 'No guaranteed direct native fuel', zh: '無保證生成的原生直接燃料' },
  'variant-or-imported': { en: 'Variant-native or imported', zh: '部分變體原生或需運入' },
}

const recommendationGroups = [
  ['food', '🍽️', 'researchFood'],
  ['oxygen', '🌬️', 'researchOxygen'],
  ['energy', '⚡', 'researchEnergy'],
  ['radiation', '☢️', 'researchRadiation'],
] as const

type RecommendationCategory = typeof recommendationGroups[number][0]

function localized<T extends { en: string; zh: string }>(labels: T, locale: Locale): string {
  return labels[locale]
}


function spawnableName(item: TerrainResearchSpawnable, locale: Locale): string {
  return locale === 'zh' ? item.name_zh || item.name : item.name
}

function TagList({ items, empty }: { items: { id: string; label: string }[]; empty: string }) {
  if (items.length === 0) return <p className="research-empty">{empty}</p>
  return <ul className="research-tag-list">{items.map((item) => <li key={item.id} title={item.id}>{item.label}</li>)}</ul>
}

function EntityProfileList({
  items,
  profiles,
  locale,
  empty,
}: {
  items: TerrainResearchSpawnable[]
  profiles: Map<string, TerrainResearchEntityProfile>
  locale: Locale
  empty: string
}) {
  const t = ui[locale]
  if (items.length === 0) return <p className="research-empty">{empty}</p>
  return (
    <ul className="research-entity-list">
      {items.map((item) => {
        const profile = profiles.get(item.prefab_id)
        if (!profile) return null
        return (
          <li key={item.prefab_id}>
            <details className="research-entity-card">
              <summary>
                <strong>{spawnableName(item, locale)}</strong>
              </summary>
              <div>
                <h6>{t.entityDetails}</h6>
                <p>{locale === 'zh' ? profile.summary_zh : profile.summary_en}</p>
                <a href={profile.mechanics_url} target="_blank" rel="noreferrer">
                  {t.mechanicsSource} ↗
                </a>
              </div>
            </details>
          </li>
        )
      })}
    </ul>
  )
}

function ratingExplanation(rating: TerrainCostEfficiencyRating, locale: Locale): string {
  if (locale === 'zh') {
    return `5 分起算；依賴與物流扣 ${rating.dependency_penalty} 分、建立階段扣 ${rating.stage_penalty} 分、可信度扣 ${rating.confidence_penalty} 分${rating.no_direct_native_route ? '；無原生直接路徑時最高 2 分' : ''}。採最佳可行方法，不因額外備案降分。`
  }
  return `Starts at 5; dependency/logistics −${rating.dependency_penalty}, setup stage −${rating.stage_penalty}, confidence −${rating.confidence_penalty}${rating.no_direct_native_route ? '; capped at 2 without a direct native route' : ''}. Uses the best usable method; extra fallbacks do not reduce the score.`
}

function CategoryRecommendationList({ zones, locale, category }: {
  zones: TerrainResearchZone[]
  locale: Locale
  category: RecommendationCategory
}) {
  const t = ui[locale]
  const phases = [
    { id: 'early', label: t.researchEarlyPhase },
    { id: 'repeatable', label: t.researchRepeatablePhase },
  ] as const
  const orderedZones = [...zones].sort((left, right) => {
    const ratingDifference = right.cost_efficiency_ratings[category].rating - left.cost_efficiency_ratings[category].rating
    if (ratingDifference !== 0) return ratingDifference
    const leftName = locale === 'zh' ? left.friendly_name_zh || left.friendly_name : left.friendly_name
    const rightName = locale === 'zh' ? right.friendly_name_zh || right.friendly_name : right.friendly_name
    return leftName.localeCompare(rightName, locale === 'zh' ? 'zh-Hant' : 'en')
  })

  return (
    <div className="research-phase-list">
      {category === 'radiation' && (
        <aside className="radiation-distinction">
          <div><strong>{t.ambientRadiationSource}</strong><span>{t.radboltProduction}</span></div>
          <p>{t.radiationDistinction}</p>
        </aside>
      )}
      {phases.map((phase) => {
        const entries = orderedZones.flatMap((zone) => zone.recommendations[category]
          .map((method, methodIndex) => ({ zone, method, methodIndex }))
          .filter(({ method }) => recommendationPhases(method.stage).includes(phase.id)))
        if (entries.length === 0) return null
        return (
          <section className={`survival-phase-group research-phase research-phase-${phase.id}`} key={phase.id}>
            <h6>{phase.label}</h6>
            <ul className="research-method-list">
              {entries.map(({ zone, method, methodIndex }) => {
                const rating = zone.cost_efficiency_ratings[category]
                const terrainName = locale === 'zh' ? zone.friendly_name_zh || zone.friendly_name : zone.friendly_name
                return (
                <li key={`${zone.zone_type}-${method.method}-${methodIndex}`}>
                  <div className="terrain-method-meta">
                    <span className="terrain-method-source">{terrainName}</span>
                    <span className={`cost-efficiency-rating rating-${rating.rating}`} title={ratingExplanation(rating, locale)}>
                      {t.costEfficiency} {rating.rating}/5
                    </span>
                  </div>
                  <p>{locale === 'zh' ? method.method_zh || method.method : method.method}</p>
                  <div className="research-qualifiers">
                    <span title={t.outputTarget}>{t.outputTarget}: {category === 'food'
                      ? t.researchFoodOutput
                      : category === 'energy'
                        ? t.researchPowerOutput
                        : category === 'oxygen'
                          ? t.researchOxygenOutput
                          : /Radbolt Generator|radbolts/i.test(method.method)
                            ? `${t.ambientRadiationSource} + ${t.radboltProduction}`
                            : t.ambientRadiationSource}</span>
                    <span title={t.inputConditions}>{t.inputConditions}: {localized(dependencyLabels[method.dependency], locale)}</span>
                    <span title={t.availabilityLimits}>{t.availabilityLimits}: {localized(stageLabels[method.stage], locale)}</span>
                    <span className={`confidence-${method.confidence}`} title={t.confidence}>{localized(confidenceLabels[method.confidence], locale)}</span>
                  </div>
                </li>
                )
              })}
            </ul>
          </section>
        )
      })}
    </div>
  )
}

function TerrainReferenceCard({
  zone,
  research,
  locale,
}: {
  zone: TerrainResearchZone
  research: TerrainResearchData
  locale: Locale
}) {
  const t = ui[locale]
  const sourcesById = useMemo(() => new Map(research.sources.map((source) => [source.id, source])), [research.sources])
  const profilesByPrefab = useMemo(
    () => new Map(research.entity_profiles.map((profile) => [profile.prefab_id, profile])),
    [research.entity_profiles],
  )
  const sources = zone.source_ids.map((id) => sourcesById.get(id)).filter((source) => source !== undefined)
  const title = locale === 'zh' ? zone.friendly_name_zh || zone.friendly_name : zone.friendly_name
  const summary = locale === 'zh' ? zone.summary_zh || zone.summary : zone.summary
  const attention = locale === 'zh' && zone.attention_zh.length > 0 ? zone.attention_zh : zone.attention
  const worldgenWarnings = locale === 'zh' ? zone.worldgen.worldgen_warnings_zh : zone.worldgen.worldgen_warnings

  return (
    <details className="terrain-reference-card">
      <summary>
        <span className="research-card-title">
          <strong>{title}</strong>
          <small>{locale === 'en' && `${zone.zone_type} · `}{zone.variant_count} {t.variants}</small>
        </span>
        <span className="research-card-scope">{zone.dlc_scopes.map((scope) => dlcLabel(scope.id, false, locale)).join(' · ')}</span>
      </summary>
      <div className="research-card-body">
        <p className="research-summary">{summary}</p>
        <div className="research-scope-row">
          <strong>{t.dlcScope}</strong>
          <div>{zone.dlc_scopes.map((scope) => <span key={scope.id}>{dlcLabel(scope.id, false, locale)}</span>)}</div>
        </div>

        <div className="research-worldgen-grid">
              <section>
                <h5>{t.possibleElements}</h5>
                <TagList items={zone.worldgen.elements.map((item) => ({ id: item.id, label: locale === 'zh' ? item.name_zh || item.name_en : item.name_en }))} empty={t.noEntries} />
              </section>
              <section>
                <h5>{t.possibleFlora}</h5>
                <EntityProfileList items={zone.worldgen.flora} profiles={profilesByPrefab} locale={locale} empty={t.noEntries} />
              </section>
              <section>
                <h5>{t.possibleFauna}</h5>
                <EntityProfileList items={zone.worldgen.fauna} profiles={profilesByPrefab} locale={locale} empty={t.noEntries} />
              </section>
              {zone.worldgen.other_spawnables.length > 0 && (
                <section>
                  <h5>{t.otherSpawnables}</h5>
                  <TagList items={zone.worldgen.other_spawnables.map((item) => ({ id: item.prefab_id, label: spawnableName(item, locale) }))} empty={t.noEntries} />
                </section>
              )}
              <section className="research-feature-section">
                <h5>{t.notableFeatures}</h5>
                <TagList items={zone.worldgen.features_localized.map((feature) => ({
                  id: feature.id,
                  label: locale === 'zh' ? feature.name_zh : feature.name_en,
                }))} empty={t.noEntries} />
              </section>
        </div>

        <div className="research-bottom-grid">
              <section className="research-attention">
                <h4>⚠️ {t.attention}</h4>
                <p>{t.terrainAttentionScope}</p>
                <ul>
                  {attention.map((item) => <li key={item}>{item}</li>)}
                  {worldgenWarnings.map((warning) => <li key={warning}>{warning}</li>)}
                </ul>
              </section>
              <section className="research-citations">
                <h4>🔗 {t.citations}</h4>
                <ol>
                  {sources.map((source) => (
                    <li key={source.id}>
                      {source.url ? <a href={source.url} target="_blank" rel="noreferrer">{source.title}</a> : <span>{source.title}</span>}
                    </li>
                  ))}
                </ol>
              </section>
        </div>
      </div>
    </details>
  )
}

export function TerrainResearchPanel({ terrains, research, locale }: Props) {
  const t = ui[locale]
  const zones = useMemo(() => {
    if (!research) return []
    const selectedZoneTypes = new Set(terrains.map((terrain) => terrain.zoneType))
    const zoneByType = new Map(research.zones.map((zone) => [zone.zone_type, zone]))
    return [...selectedZoneTypes].flatMap((zoneType) => {
      const zone = zoneByType.get(zoneType)
      return zone ? [zone] : []
    })
  }, [research, terrains])

  return (
    <section className="terrain-research-section" aria-labelledby="terrain-research-title">
      <div className="main-source-heading">
        <div>
          <span className="eyebrow">SURVIVAL METHODS</span>
          <h3 id="terrain-research-title">{t.terrainResearch}</h3>
          <p>{t.terrainResearchSubtitle}</p>
        </div>
        <span className="candidate-badge">{zones.length}</span>
      </div>

      {research && (
        <aside className="research-union-warning">
          <strong>⚠️ {t.possibleUnion}</strong>
          <span>{locale === 'zh' ? research.scope_note_zh || research.scope_note : research.scope_note}</span>
          <span>
            {t.researchVersionBaseline}：{research.baseline.game_version}
            {research.baseline.latest_public_checked && ` ｜ ${t.researchLatestChecked}：${research.baseline.latest_public_checked}`}
          </span>
        </aside>
      )}

      {zones.length === 0 ? <p className="empty">{t.noResearch}</p> : (
        <div className="survival-category-grid">
          {recommendationGroups.map(([category, icon, label]) => (
            <details className={`survival-category-card survival-category-${category}`} key={category}>
              <summary>
                <span className="survival-category-title"><span>{icon}</span><strong>{t[label]}</strong></span>
                <span className="candidate-badge">{zones.length}</span>
              </summary>
              <div className="survival-category-body">
                <CategoryRecommendationList zones={zones} locale={locale} category={category} />
                <details className="category-terrain-reference">
                  <summary>{t.terrainSupportingData}</summary>
                  <div className="terrain-reference-list">
                    {zones.map((zone) => (
                      <TerrainReferenceCard
                        key={`${category}-${zone.zone_type}`}
                        zone={zone}
                        research={research!}
                        locale={locale}
                      />
                    ))}
                  </div>
                </details>
              </div>
            </details>
          ))}
        </div>
      )}
    </section>
  )
}
