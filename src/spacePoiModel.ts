import { localName, secondaryName } from './i18n'
import type { GameCategory, GameCategoryId, Locale, SpacePoi, SpacePoiCargo, SpacePoiKind, SpacePoiOutput, SpacePoiPlacement, SpacePoiRange } from './types'

export interface SpacePoiClusterPlacement {
  clusterId: string
  clusterName_en: string
  clusterName_zh: string
  allowedRings: SpacePoiRange
  guaranteed: boolean
}

export type SpacePoiKindFilter = 'all' | SpacePoiKind

export interface SpacePoiFilter {
  kind: SpacePoiKindFilter
  strategicOnly: boolean
  query: string
  locale: Locale
}

export const kindIcon: Record<SpacePoiKind, string> = {
  harvestable: '⛏️',
  artifact: '🏺',
  special: '🌀',
}

export const cargoIcon: Record<SpacePoiCargo, string> = {
  solid: '🪨',
  liquid: '💧',
  gas: '☁️',
}

export const spacePoiRingRange = (poi: SpacePoi): SpacePoiRange | null => {
  if (poi.placements.length === 0) return null
  return {
    min: Math.min(...poi.placements.map((placement) => placement.allowedRings.min)),
    max: Math.max(...poi.placements.map((placement) => placement.allowedRings.max)),
  }
}

/**
 * A cluster can list the same POI in several placement groups. Collapse them so
 * each cluster contributes one row with its widest ring range.
 */
export const groupPlacementsByCluster = (placements: SpacePoiPlacement[]): SpacePoiClusterPlacement[] => {
  const byCluster = new Map<string, SpacePoiClusterPlacement>()
  for (const placement of placements) {
    const existing = byCluster.get(placement.clusterId)
    if (!existing) {
      byCluster.set(placement.clusterId, {
        clusterId: placement.clusterId,
        clusterName_en: placement.clusterName_en,
        clusterName_zh: placement.clusterName_zh,
        allowedRings: { ...placement.allowedRings },
        guaranteed: placement.guaranteedInGroup,
      })
      continue
    }
    existing.allowedRings.min = Math.min(existing.allowedRings.min, placement.allowedRings.min)
    existing.allowedRings.max = Math.max(existing.allowedRings.max, placement.allowedRings.max)
    existing.guaranteed = existing.guaranteed || placement.guaranteedInGroup
  }
  return [...byCluster.values()].sort((a, b) => a.clusterName_en.localeCompare(b.clusterName_en))
}

export const formatRingRange = (range: SpacePoiRange) => (range.min === range.max ? `${range.min}` : `${range.min}–${range.max}`)

export const formatMass = (kg: number) => (kg >= 1000 ? `${(kg / 1000).toLocaleString()} t` : `${kg.toLocaleString()} kg`)

/** Keep the detail pane populated when a POI switch invalidates its old filter. */
export const resolveOutputCategory = (
  selected: GameCategoryId | 'all',
  available: GameCategoryId[],
): GameCategoryId | 'all' => (selected === 'all' || available.includes(selected) ? selected : 'all')

const searchText = (poi: SpacePoi, locale: Locale) => [
  localName(poi, locale),
  secondaryName(poi, locale),
  poi.prefabId,
  ...poi.outputs.flatMap((output) => [output.name_en, output.name_zh]),
  ...(locale === 'zh' ? poi.strategic_zh : poi.strategic_en),
].join(' ').toLowerCase()

export function filterSpacePois(pois: SpacePoi[], filter: SpacePoiFilter): SpacePoi[] {
  const query = filter.query.trim().toLowerCase()
  return pois.filter((poi) => {
    if (filter.kind !== 'all' && poi.kind !== filter.kind) return false
    if (filter.strategicOnly && poi.strategicResourceIds.length === 0) return false
    if (query && !searchText(poi, filter.locale).includes(query)) return false
    return true
  })
}

export interface SpacePoiOutputGroup {
  category: GameCategory
  outputs: SpacePoiOutput[]
}

/**
 * Bucket a POI's outputs into the same game categories the planet resource
 * dashboard uses, so both views group materials identically. Heaviest share
 * first, and categories ordered by their largest contribution.
 */
export const groupOutputsByCategory = (
  outputs: SpacePoiOutput[],
  categories: GameCategory[],
  locale: Locale,
): SpacePoiOutputGroup[] => {
  const byId = new Map(categories.map((category) => [category.id, category]))
  const buckets = new Map<GameCategoryId, SpacePoiOutput[]>()
  for (const output of outputs) {
    const bucket = buckets.get(output.primaryCategory)
    if (bucket) bucket.push(output)
    else buckets.set(output.primaryCategory, [output])
  }
  return [...buckets.entries()]
    .map(([id, items]) => ({
      category: byId.get(id) ?? { id, name_en: id, name_zh: id },
      outputs: [...items].sort((a, b) => b.ratio - a.ratio || localName(a, locale).localeCompare(localName(b, locale))),
    }))
    .sort((a, b) => b.outputs[0].ratio - a.outputs[0].ratio)
}
