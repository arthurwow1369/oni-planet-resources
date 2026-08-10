import { worldVariantDlcTag } from './plannerModel'
import type { GameCategoryId, Geyser, Locale, SpacePoi, Subworld, World } from './types'

export type ResourceSourceKind = 'worlds' | 'pois'

/** Synthetic category id for geysers; the game taxonomy has no equivalent. */
export const GEYSER_CATEGORY_ID = 'Geyser'
/** Geyser ids are namespaced so they cannot collide with an element simhash. */
export const GEYSER_ID_PREFIX = 'geyser:'

export interface IndexedResource {
  id: string
  name_en: string
  name_zh: string
  type: string
  primaryCategory: GameCategoryId
  use_en: string
  use_zh: string
  worldIds: string[]
  poiIds: string[]
  /** Worlds where this resource is guaranteed rather than drawn from a pool. */
  guaranteedWorldIds: string[]
  /** Present when this entry is a geyser rather than a material. */
  geyser?: Geyser
}

export interface ResourceFilter {
  query: string
  category: GameCategoryId | 'all'
  locale: Locale
}

/**
 * Chip filters for a resource's source lists. Both sets hold *excluded* values
 * so an empty set means "show everything", matching the DLC chips elsewhere.
 */
export interface ResourceSourceSelection {
  excludedKinds: Set<string>
  excludedDlcTags: Set<string>
}

/**
 * Collect every resource the site knows about, from both directions: terrain
 * resources reached through each world's subworlds, and space-POI outputs.
 * A resource can come from either, both, or (for refined space-only elements)
 * only the POI side.
 */
export function buildResourceIndex(
  worlds: World[],
  subworlds: Subworld[],
  pois: SpacePoi[],
  geysers: Geyser[] = [],
): IndexedResource[] {
  const byId = new Map<string, IndexedResource>()
  const subworldById = new Map(subworlds.map((subworld) => [subworld.id, subworld]))

  const ensure = (seed: Omit<IndexedResource, 'worldIds' | 'poiIds' | 'guaranteedWorldIds'>) => {
    const existing = byId.get(seed.id)
    if (existing) return existing
    const created: IndexedResource = { ...seed, worldIds: [], poiIds: [], guaranteedWorldIds: [] }
    byId.set(seed.id, created)
    return created
  }

  for (const world of worlds) {
    const seen = new Set<string>()
    for (const subworldId of world.subworldIds) {
      for (const resource of subworldById.get(subworldId)?.resources ?? []) {
        if (seen.has(resource.simhash)) continue
        seen.add(resource.simhash)
        ensure({
          id: resource.simhash,
          name_en: resource.name_en,
          name_zh: resource.name_zh,
          type: resource.type,
          primaryCategory: resource.primaryCategory,
          use_en: resource.use_en,
          use_zh: resource.use_zh,
        }).worldIds.push(world.id)
      }
    }
  }

  for (const poi of pois) {
    for (const output of poi.outputs) {
      ensure({
        id: output.id,
        name_en: output.name_en,
        name_zh: output.name_zh,
        type: output.type,
        primaryCategory: output.primaryCategory,
        use_en: output.use_en,
        use_zh: output.use_zh,
      }).poiIds.push(poi.id)
    }
  }

  // Geysers are their own resource type: they have no terrain or POI source,
  // only worlds whose worldgen rules can place them.
  const geyserById = new Map(geysers.map((geyser) => [geyser.id, geyser]))
  for (const world of worlds) {
    const fixed = new Set((world.geysers?.fixed ?? []).map((entry) => entry.geyserId))
    const pooled = new Set((world.geysers?.pools ?? []).flatMap((pool) => pool.geyserIds))
    for (const geyserId of new Set([...fixed, ...pooled])) {
      const geyser = geyserById.get(geyserId)
      if (!geyser) continue
      const entry = ensure({
        id: `${GEYSER_ID_PREFIX}${geyser.id}`,
        name_en: geyser.name_en,
        name_zh: geyser.name_zh,
        type: 'geyser',
        primaryCategory: GEYSER_CATEGORY_ID,
        use_en: geyser.desc_en,
        use_zh: geyser.desc_zh,
      })
      entry.geyser = geyser
      entry.worldIds.push(world.id)
      if (fixed.has(geyserId)) entry.guaranteedWorldIds.push(world.id)
    }
  }

  return [...byId.values()]
}

export function filterResources(resources: IndexedResource[], filter: ResourceFilter): IndexedResource[] {
  const query = filter.query.trim().toLowerCase()
  const collator = new Intl.Collator(filter.locale === 'zh' ? 'zh-Hant' : 'en')
  return resources
    .filter((resource) => {
      if (filter.category !== 'all' && resource.primaryCategory !== filter.category) return false
      if (query && ![resource.name_en, resource.name_zh, resource.id].some((text) => text.toLowerCase().includes(query))) return false
      return true
    })
    .sort((a, b) => collator.compare(
      filter.locale === 'zh' ? a.name_zh || a.name_en : a.name_en,
      filter.locale === 'zh' ? b.name_zh || b.name_en : b.name_en,
    ))
}

/** Game categories actually present in the index, in the order the picker should list them. */
export function usedCategoryIds(resources: IndexedResource[]): GameCategoryId[] {
  return [...new Set(resources.map((resource) => resource.primaryCategory))].sort()
}

export interface ResourceSources {
  worlds: World[]
  pois: SpacePoi[]
}

/** Every DLC tag that can appear on a resource source, for the chip row. */
export function sourceDlcTags(worlds: World[], pois: SpacePoi[]): string[] {
  return [...new Set([...worlds.map(worldVariantDlcTag), ...pois.map((poi) => poi.dlcTag)])].sort()
}

export function filterResourceSources(
  resource: IndexedResource | undefined,
  worlds: World[],
  pois: SpacePoi[],
  selection: ResourceSourceSelection,
): ResourceSources {
  if (!resource) return { worlds: [], pois: [] }
  const worldById = new Map(worlds.map((world) => [world.id, world]))
  const poiById = new Map(pois.map((poi) => [poi.id, poi]))
  const allowed = (tag: string) => !selection.excludedDlcTags.has(tag)
  return {
    worlds: selection.excludedKinds.has('worlds')
      ? []
      : resource.worldIds
        .map((id) => worldById.get(id))
        .filter((world): world is World => Boolean(world) && allowed(worldVariantDlcTag(world!))),
    pois: selection.excludedKinds.has('pois')
      ? []
      : resource.poiIds
        .map((id) => poiById.get(id))
        .filter((poi): poi is SpacePoi => Boolean(poi) && allowed(poi!.dlcTag)),
  }
}
