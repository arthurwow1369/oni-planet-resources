import { useMemo } from 'react'
import { dlcLabel } from '../dlc'
import { ui } from '../i18n'
import type {
  Locale,
  Subworld,
  TerrainResearchConfidence,
  TerrainResearchData,
  TerrainResearchDependency,
  TerrainResearchMethod,
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
  imported: { en: 'Imported inputs', zh: '需外運資源' },
  'imported-or-connected': { en: 'Imported or connected supply', zh: '需外運或相連區域供應' },
  'imported-or-location-dependent': { en: 'Imported or location-dependent', zh: '需外運或視位置而定' },
  'imported-spaced-out': { en: 'Imported; Spaced Out! mechanics', zh: '需外運；使用《Spaced Out!》機制' },
  'location-dependent': { en: 'Location-dependent', zh: '視位置而定' },
  'location-dependent-spaced-out': { en: 'Location-dependent; Spaced Out! mechanics', zh: '視位置而定；使用《Spaced Out!》機制' },
  mixed: { en: 'Mixed local and imported inputs', zh: '混合當地與外運資源' },
  native: { en: 'Native', zh: '原生' },
  'native-bridge': { en: 'Native bridge supply', zh: '原生過渡供應' },
  'native-bridge-then-mixed': { en: 'Native bridge, then mixed inputs', zh: '先用原生資源過渡，再採混合供應' },
  'native-complex': { en: 'Native, complex setup', zh: '原生，但系統複雜' },
  'native-feature': { en: 'Native terrain feature', zh: '原生地形特徵' },
  'native-finite': { en: 'Native but finite', zh: '原生但有限' },
  'native-finite-then-imported': { en: 'Finite native supply, then imported', zh: '先用有限原生資源，再改由外運' },
  'native-finite-unless-looped': { en: 'Native; finite without a renewable loop', zh: '原生；未建立循環時為有限' },
  'native-location': { en: 'Native at suitable locations', zh: '合適位置的原生來源' },
  'native-plant-plus-imported-or-connected-dirt': { en: 'Native plant; needs imported or connected Dirt', zh: '原生植物；需外運或相連區域的泥土' },
  'native-plant-plus-imported-or-connected-hydrogen-and-critters': { en: 'Native plant; needs external hydrogen and critters', zh: '原生植物；需外部氫氣與小動物' },
  'native-plus-buildings': { en: 'Native inputs plus buildings', zh: '原生資源加建築設施' },
  'native-plus-connected': { en: 'Native plus connected supply', zh: '原生加相連區域供應' },
  'native-plus-imported': { en: 'Native plus imported inputs', zh: '原生加外運資源' },
  'native-plus-infrastructure': { en: 'Native plus infrastructure', zh: '原生加基礎設施' },
  'native-plus-processing': { en: 'Native with processing', zh: '原生但需加工' },
  'native-spaced-out': { en: 'Native; Spaced Out! mechanics', zh: '原生；使用《Spaced Out!》機制' },
  'native-variant': { en: 'Native in some variants', zh: '部分變體原生' },
  'native-variant-finite': { en: 'Finite and native in some variants', zh: '部分變體原生且有限' },
  'native-variant-finite-then-imported': { en: 'Finite variant supply, then imported', zh: '先用變體中的有限資源，再改由外運' },
  'native-variant-ice-or-imported': { en: 'Variant-native ice or imported supply', zh: '變體原生冰或外運供應' },
  'native-variant-or-imported': { en: 'Variant-native or imported', zh: '變體原生或需外運' },
  'native-variant-or-imported-ethanol': { en: 'Variant-native or imported Ethanol', zh: '變體原生或外運乙醇' },
  'native-variant-plus-imported': { en: 'Variant-native plus imported inputs', zh: '變體原生加外運資源' },
  'native-variant-spaced-out': { en: 'Variant-native; Spaced Out! mechanics', zh: '部分變體原生；使用《Spaced Out!》機制' },
  'requires-reef': { en: 'Requires a Reef biome', zh: '需要珊瑚生態' },
  'seed-dependent': { en: 'World-seed dependent', zh: '視世界種子而定' },
  'seed-dependent-native-feature': { en: 'Seed-dependent native feature', zh: '視種子生成的原生特徵' },
}

const recommendationGroups = [
  ['food', '🍽️', 'researchFood'],
  ['energy', '⚡', 'researchEnergy'],
  ['oxygen', '🌬️', 'researchOxygen'],
  ['radiation', '☢️', 'researchRadiation'],
] as const

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

function RecommendationList({ methods, locale }: { methods: TerrainResearchMethod[]; locale: Locale }) {
  const t = ui[locale]
  return (
    <ul className="research-method-list">
      {methods.map((method, index) => (
        <li key={`${method.method}-${index}`}>
          <p>{locale === 'zh' ? method.method_zh || method.method : method.method}</p>
          <div className="research-qualifiers">
            <span title={t.stage}>{localized(stageLabels[method.stage], locale)}</span>
            <span title={t.dependency}>{localized(dependencyLabels[method.dependency], locale)}</span>
            <span className={`confidence-${method.confidence}`} title={t.confidence}>{localized(confidenceLabels[method.confidence], locale)}</span>
          </div>
        </li>
      ))}
    </ul>
  )
}

function ResearchZoneCard({ zone, research, locale }: { zone: TerrainResearchZone; research: TerrainResearchData; locale: Locale }) {
  const t = ui[locale]
  const sourcesById = useMemo(() => new Map(research.sources.map((source) => [source.id, source])), [research.sources])
  const sources = zone.source_ids.map((id) => sourcesById.get(id)).filter((source) => source !== undefined)
  const title = locale === 'zh' ? zone.friendly_name_zh || zone.friendly_name : zone.friendly_name
  const summary = locale === 'zh' ? zone.summary_zh || zone.summary : zone.summary
  const attention = locale === 'zh' && zone.attention_zh.length > 0 ? zone.attention_zh : zone.attention
  const worldgenWarnings = locale === 'zh' ? zone.worldgen.worldgen_warnings_zh : zone.worldgen.worldgen_warnings

  return (
    <details className="terrain-research-card">
      <summary>
        <span className="research-card-title">
          <strong>{title}</strong>
          <small>{locale === 'en' && `${zone.zone_type} · `}{zone.variant_count} {t.variants}</small>
        </span>
        <span className="research-card-scope">{zone.dlc_scopes.map((scope) => dlcLabel(scope.id)).join(' · ')}</span>
      </summary>
      <div className="research-card-body">
        <p className="research-summary">{summary}</p>
        <div className="research-scope-row">
          <strong>{t.dlcScope}</strong>
          <div>{zone.dlc_scopes.map((scope) => <span key={scope.id}>{dlcLabel(scope.id)}</span>)}</div>
        </div>

        <div className="research-worldgen-grid">
          <section>
            <h5>{t.possibleElements}</h5>
            <TagList items={zone.worldgen.elements.map((item) => ({ id: item.id, label: locale === 'zh' ? item.name_zh || item.name_en : item.name_en }))} empty={t.noEntries} />
          </section>
          <section>
            <h5>{t.possibleFlora}</h5>
            <TagList items={zone.worldgen.flora.map((item) => ({ id: item.prefab_id, label: spawnableName(item, locale) }))} empty={t.noEntries} />
          </section>
          <section>
            <h5>{t.possibleFauna}</h5>
            <TagList items={zone.worldgen.fauna.map((item) => ({ id: item.prefab_id, label: spawnableName(item, locale) }))} empty={t.noEntries} />
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

        <section className="research-recommendations">
          <h4>{t.researchRecommendations}</h4>
          <div className="research-recommendation-grid">
            {recommendationGroups.map(([key, icon, label]) => (
              <section key={key}>
                <h5><span>{icon}</span>{t[label]}</h5>
                <RecommendationList methods={zone.recommendations[key]} locale={locale} />
              </section>
            ))}
          </div>
        </section>

        <div className="research-bottom-grid">
          <section className="research-attention">
            <h4>⚠️ {t.attention}</h4>
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
          <span className="eyebrow">TERRAIN RESEARCH</span>
          <h3 id="terrain-research-title">{t.terrainResearch}</h3>
          <p>{t.terrainResearchSubtitle}</p>
        </div>
        <span className="candidate-badge">{zones.length}</span>
      </div>

      {research && (
        <aside className="research-union-warning">
          <strong>⚠️ {t.possibleUnion}</strong>
          <span>{locale === 'zh' ? research.scope_note_zh || research.scope_note : research.scope_note}</span>
        </aside>
      )}

      {zones.length === 0 ? <p className="empty">{t.noResearch}</p> : (
        <div className="terrain-research-grid">
          {zones.map((zone) => <ResearchZoneCard key={zone.zone_type} zone={zone} research={research!} locale={locale} />)}
        </div>
      )}
    </section>
  )
}
