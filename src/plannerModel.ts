import type { Subworld, TerrainResearchStage, World } from './types'

export type WorldVariantRole = 'start' | 'warp' | 'general' | 'unreferenced'
export type WorldWidthBand =
  | 'extremely-small'
  | 'moonlet-mini-width'
  | 'spaced-out-standard-width'
  | 'classic-large-width'
  | 'base-game-extra-large-width'

export interface WorldGroup {
  key: string
  dlcTags: string[]
  name_en: string
  name_zh: string
  worlds: World[]
}

export interface BiomeGroup {
  zoneType: string
  terrains: Subworld[]
  resourceCount: number
}

export function recommendationPhases(stage: TerrainResearchStage): Array<'early' | 'repeatable'> {
  if (stage === 'all' || stage === 'early-mid') return ['early', 'repeatable']
  return stage === 'early' ? ['early'] : ['repeatable']
}

export interface ConfigurationCoverage {
  zoneType: string
  terrainIds: string[]
  covered: number
  total: number
  percentage: number
  conditional: boolean
}

const worldFamily = (world: World): string => {
  const id = world.id.split('/').pop() ?? world.id
  const family = id
    .replace(/(?:Start|Warp)$/i, '')
    .replace(/(?:BaseGameAsteroid|ClassicAsteroid|SpacedOutAsteroid)$/i, '')
  return family !== id || /^mini/i.test(id) ? family : world.name_en
}

const groupKey = (world: World) => worldFamily(world).toLocaleLowerCase()

export function worldVariantDlcTag(world: World): string {
  const id = world.id.split('/').pop() ?? world.id
  if (/BaseGameAsteroid$/i.test(id)) return 'base'
  if (/SpacedOutAsteroid$/i.test(id)) return 'expansion1'
  return world.dlcTag
}

export function inferWorldVariantRole(world: World): WorldVariantRole {
  if (world.clusterRoles.includes('start')) return 'start'
  if (world.clusterRoles.includes('warp')) return 'warp'
  if (world.clusterRoles.includes('general')) return 'general'
  return 'unreferenced'
}

export function worldWidthBand(world: Pick<World, 'width'>): WorldWidthBand {
  if (world.width <= 96) return 'extremely-small'
  if (world.width <= 128) return 'moonlet-mini-width'
  if (world.width <= 160) return 'spaced-out-standard-width'
  if (world.width <= 240) return 'classic-large-width'
  return 'base-game-extra-large-width'
}

export function isAdvancedWorld(world: World): boolean {
  return world.internal
    || !world.referencedByCluster
    || /\bfor devs?\b/i.test(world.name_en)
    || /(?:^|[/_:])spaceshipinterior$/i.test(world.id)
}

export function groupWorlds(worlds: World[]): WorldGroup[] {
  const groups = new Map<string, WorldGroup>()

  worlds.forEach((world) => {
    const key = groupKey(world)
    const current = groups.get(key)
    const variantDlcTag = worldVariantDlcTag(world)
    if (current) {
      current.worlds.push(world)
      if (!current.dlcTags.includes(variantDlcTag)) current.dlcTags.push(variantDlcTag)
      if (world.name_en.length < current.name_en.length) {
        current.name_en = world.name_en
        current.name_zh = world.name_zh
      } else if (!current.name_zh && world.name_zh) current.name_zh = world.name_zh
      return
    }
    groups.set(key, {
      key,
      dlcTags: [variantDlcTag],
      name_en: world.name_en,
      name_zh: world.name_zh,
      worlds: [world],
    })
  })

  return [...groups.values()]
}

export function filterWorldGroups(
  groups: WorldGroup[],
  selectedDlcTags: ReadonlySet<string>,
  query: string,
  showAdvanced: boolean,
  selectedId?: string,
): WorldGroup[] {
  const normalizedQuery = query.trim().toLocaleLowerCase()

  return groups.flatMap((group) => {
    const selectedWorlds = group.worlds.filter((world) => selectedDlcTags.has(worldVariantDlcTag(world)))
    const visibleWorlds = showAdvanced
      ? selectedWorlds
      : selectedWorlds.filter((world) => !isAdvancedWorld(world) || world.id === selectedId)
    if (visibleWorlds.length === 0) return []

    const haystack = [
      group.name_en,
      group.name_zh,
      ...new Set(visibleWorlds.map(worldVariantDlcTag)),
      ...visibleWorlds.flatMap((world) => [world.id, world.name_en, world.name_zh]),
    ].join(' ').toLocaleLowerCase()
    if (normalizedQuery && !haystack.includes(normalizedQuery)) return []

    return [{ ...group, worlds: visibleWorlds }]
  })
}

export function groupTerrainsByBiome(terrains: Subworld[]): BiomeGroup[] {
  const groups = new Map<string, Subworld[]>()
  terrains.forEach((terrain) => {
    const current = groups.get(terrain.zoneType)
    if (current) current.push(terrain)
    else groups.set(terrain.zoneType, [terrain])
  })

  return [...groups].map(([zoneType, sourceTerrains]) => ({
    zoneType,
    terrains: sourceTerrains,
    resourceCount: new Set(sourceTerrains.flatMap((terrain) => terrain.resources.map((resource) => resource.simhash))).size,
  }))
}

export function configurationCoverageForResource(
  simhash: string | string[],
  terrains: Subworld[],
): ConfigurationCoverage[] {
  const simhashes = new Set(Array.isArray(simhash) ? simhash : [simhash])
  return groupTerrainsByBiome(terrains).map((group) => {
    const matchingResources = group.terrains.flatMap((terrain) =>
      terrain.resources
        .filter((resource) => simhashes.has(resource.simhash))
        .map((resource) => ({ resource, terrainId: terrain.id })),
    )
    const terrainIds = [...new Set(matchingResources.map((item) => item.terrainId))]
    return {
      zoneType: group.zoneType,
      terrainIds,
      covered: terrainIds.length,
      total: group.terrains.length,
      percentage: Math.round((terrainIds.length / group.terrains.length) * 100),
      conditional: matchingResources.some(({ resource }) =>
        resource.sources?.some((source) => source === 'spawn-tag' || source.includes('worldgen/features/')) ?? false,
      ),
    }
  })
}

export function totalConfigurationCoverage(coverage: ConfigurationCoverage[]): {
  covered: number
  total: number
  percentage: number
} {
  const covered = coverage.reduce((sum, item) => sum + item.covered, 0)
  const total = coverage.reduce((sum, item) => sum + item.total, 0)
  return {
    covered,
    total,
    percentage: total === 0 ? 0 : Math.round((covered / total) * 100),
  }
}
