import type { Subworld, World } from './types'

export type WorldVariantRole = 'start' | 'warp' | 'mini' | 'general'

export interface WorldGroup {
  key: string
  dlcTag: string
  name_en: string
  name_zh: string
  worlds: World[]
}

export interface BiomeGroup {
  zoneType: string
  terrains: Subworld[]
  resourceCount: number
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

const groupKey = (world: World) => `${world.dlcTag}\u0000${worldFamily(world).toLocaleLowerCase()}`

export function inferWorldVariantRole(world: World): WorldVariantRole {
  const id = world.id.split('/').pop() ?? world.id
  if (/start/i.test(id)) return 'start'
  if (/warp/i.test(id)) return 'warp'
  if (/mini/i.test(id)) return 'mini'
  return 'general'
}

export function isAdvancedWorld(world: World): boolean {
  return /\bfor devs?\b/i.test(world.name_en) || /(?:^|[/_:])spaceshipinterior$/i.test(world.id)
}

export function groupWorlds(worlds: World[]): WorldGroup[] {
  const groups = new Map<string, WorldGroup>()

  worlds.forEach((world) => {
    const key = groupKey(world)
    const current = groups.get(key)
    if (current) {
      current.worlds.push(world)
      if (world.name_en.length < current.name_en.length) {
        current.name_en = world.name_en
        current.name_zh = world.name_zh
      } else if (!current.name_zh && world.name_zh) current.name_zh = world.name_zh
      return
    }
    groups.set(key, {
      key,
      dlcTag: world.dlcTag,
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
): WorldGroup[] {
  const normalizedQuery = query.trim().toLocaleLowerCase()

  return groups.flatMap((group) => {
    if (!selectedDlcTags.has(group.dlcTag)) return []
    const visibleWorlds = showAdvanced ? group.worlds : group.worlds.filter((world) => !isAdvancedWorld(world))
    if (visibleWorlds.length === 0) return []

    const haystack = [
      group.name_en,
      group.name_zh,
      group.dlcTag,
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
  simhash: string,
  terrains: Subworld[],
): ConfigurationCoverage[] {
  return groupTerrainsByBiome(terrains).flatMap((group) => {
    const matchingResources = group.terrains.flatMap((terrain) =>
      terrain.resources
        .filter((resource) => resource.simhash === simhash)
        .map((resource) => ({ resource, terrainId: terrain.id })),
    )
    const terrainIds = [...new Set(matchingResources.map((item) => item.terrainId))]
    if (terrainIds.length === 0) return []

    return [{
      zoneType: group.zoneType,
      terrainIds,
      covered: terrainIds.length,
      total: group.terrains.length,
      percentage: Math.round((terrainIds.length / group.terrains.length) * 100),
      conditional: matchingResources.some(({ resource }) =>
        resource.sources?.some((source) => source === 'spawn-tag' || source.includes('worldgen/features/')) ?? false,
      ),
    }]
  })
}
