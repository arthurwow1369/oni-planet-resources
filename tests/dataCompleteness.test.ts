import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const readJson = <T>(path: string): T => JSON.parse(readFileSync(path, 'utf8')) as T

type ResourceRecord = {
  simhash: string
  name_en: string
  name_zh: string
  type: string
  categories: string[]
  primaryCategory: string
  use_en: string
  use_zh: string
}

type Spawnable = { prefab_id: string }
type ExtractionStats = {
  uncataloguedCandidates: string[]
  unresolvedFeatures: string[]
}
type ResearchData = {
  schema_version: number
  cost_efficiency_rubric: {
    scale: { min: number; max: number }
    aggregation: string
  }
  entity_profiles: Array<{
    prefab_id: string
    summary_en: string
    summary_zh: string
    mechanics_url: string
    roles: string[]
  }>
  zones: Array<{
    zone_type: string
    worldgen: { flora: Spawnable[]; fauna: Spawnable[] }
    recommendations: Record<'food' | 'energy' | 'oxygen' | 'radiation', Array<{
      method: string
      method_zh: string
      stage: string
      dependency: string
    }>>
    cost_efficiency_ratings: Record<'food' | 'energy' | 'oxygen' | 'radiation', {
      rating: number
      best_method_index: number | null
    }>
    attention: string[]
  }>
}

type SpecialResourceData = {
  schema_version: number
  baseline: { as_of: string; latest_public_checked: string }
  routes: Array<{
    id: string
    name_en: string
    name_zh: string
    production_en: string[]
    production_zh: string[]
    uses_en: string[]
    uses_zh: string[]
    attention_en: string[]
    attention_zh: string[]
    source_ids: string[]
  }>
  sources: Array<{ id: string; url: string; kind: string }>
}

describe('generated data completeness', () => {
  const subworlds = readJson<Array<{ resources: ResourceRecord[] }>>('public/data/subworlds.json')
  const resources = [
    ...new Map(
      subworlds.flatMap((subworld) => subworld.resources).map((resource) => [resource.simhash, resource]),
    ).values(),
  ]
  const catalog = readJson<{ entries: Record<string, ResourceRecord> }>(
    'research/resource-catalog/resource-catalog.json',
  )
  const research = readJson<ResearchData>('public/data/terrain-research.json')
  const worlds = readJson<Array<{
    id: string
    width: number
    height: number
    clusterRoles: string[]
    referencedByCluster: boolean
    internal: boolean
    specialResourceIds: string[]
  }>>('public/data/worlds.json')
  const specialResources = readJson<SpecialResourceData>('public/data/special-resources.json')
  const gameCategories = readJson<Array<{ id: string }>>('public/data/game-categories.json')
  const gameTaxonomy = readJson<{ prefab_categories: Record<string, string> }>(
    'research/resource-catalog/game-taxonomy.json',
  )

  it('has a complete bilingual catalog for every generated resource', () => {
    expect(resources.length).toBeGreaterThanOrEqual(194)
    const catalogIds = new Set(Object.keys(catalog.entries))
    expect(resources.filter((item) => !catalogIds.has(item.simhash))).toEqual([])
    for (const resource of resources) {
      expect(resource.name_en, resource.simhash).not.toBe('')
      expect(resource.name_zh, resource.simhash).not.toBe('')
      expect(resource.use_en, resource.simhash).not.toBe('')
      expect(resource.use_zh, resource.simhash).not.toBe('')
    }
    expect(JSON.stringify(resources)).not.toContain('No curated use is mapped yet')
    expect(JSON.stringify(resources)).not.toContain('目前尚未建立用途建議')
  })

  it('corrects previously misleading internal names and resource types', () => {
    const byId = new Map(resources.map((item) => [item.simhash, item]))
    expect(byId.get('ColdBreather')).toMatchObject({ name_en: 'Wheezewort', type: 'plant' })
    expect(byId.get('Staterpillar')).toMatchObject({ name_en: 'Plug Slug', type: 'critter' })
    expect(byId.get('Glom')).toMatchObject({ name_en: 'Morb', type: 'critter' })
    expect(byId.get('MurkyBrine')).toMatchObject({ name_en: 'Polluted Brine', type: 'liquid' })
    expect(byId.get('Chlorine')).toMatchObject({ name_en: 'Liquid Chlorine', type: 'liquid' })
  })

  it('includes feature-spawned flora and fauna in the terrain resource cards', () => {
    const mooCaverns = subworlds.find(
      (subworld) => (subworld as { id?: string }).id === 'expansion1::subworlds/moo/MooCaverns',
    ) as ({ resources: ResourceRecord[] } & { id: string }) | undefined
    expect(mooCaverns).toBeDefined()
    const ids = new Set(mooCaverns?.resources.map((resource) => resource.simhash))
    expect(ids).toContain('GasGrass')
    expect(ids).toContain('Moo')

    const frozenMedium = subworlds.find(
      (subworld) => (subworld as { id?: string }).id === 'expansion1::subworlds/frozen/FrozenMedium',
    ) as ({ resources: ResourceRecord[] } & { id: string }) | undefined
    const oceanSurface = subworlds.find(
      (subworld) => (subworld as { id?: string }).id === 'expansion1::subworlds/ocean/med_OceanSurface',
    ) as ({ resources: ResourceRecord[] } & { id: string }) | undefined

    expect(frozenMedium?.resources.some((resource) => resource.simhash === 'ColdWheatSeed')).toBe(true)
    expect(oceanSurface?.resources.some((resource) => resource.simhash === 'Pacu')).toBe(true)
  })

  it('reports no unresolved features or uncatalogued spawn candidates', () => {
    const stats = readJson<ExtractionStats>('public/data/stats.json')
    expect(stats.uncataloguedCandidates).toEqual([])
    expect(stats.unresolvedFeatures).toEqual([])
  })

  it('publishes exact world dimensions and cluster-backed roles independently', () => {
    expect(worlds).toHaveLength(94)
    expect(worlds.filter((world) => world.width === 128 && world.height === 153)).toHaveLength(24)
    for (const world of worlds) {
      expect(world.width, world.id).toBeGreaterThan(0)
      expect(world.height, world.id).toBeGreaterThan(0)
      expect(world.clusterRoles.every((role) => ['start', 'warp', 'general'].includes(role)), world.id).toBe(true)
      expect(world.referencedByCluster, world.id).toBe(world.clusterRoles.length > 0)
    }

    const byId = new Map(worlds.map((world) => [world.id, world]))
    expect(byId.get('expansion1::worlds/MiniRegolithMoonlet')).toMatchObject({ width: 96, height: 96 })
    expect(byId.get('expansion1::worlds/WaterMoonlet')).toMatchObject({ width: 80, height: 174 })
    expect(byId.get('expansion1::worlds/MediumForestyWasteland')?.clusterRoles).toContain('warp')
    expect(byId.get('worlds/SandstoneDefault')?.clusterRoles).toEqual(['start'])
    expect(byId.get('worlds/BigEmpty')).toMatchObject({ clusterRoles: [], referencedByCluster: false, internal: false })
    expect(byId.get('worlds/TinySurface')).toMatchObject({ clusterRoles: [], referencedByCluster: false })

    const roleCounts = worlds.reduce((counts, world) => {
      for (const role of world.clusterRoles) counts.set(role, (counts.get(role) ?? 0) + 1)
      return counts
    }, new Map<string, number>())
    expect(Object.fromEntries(roleCounts)).toEqual({ start: 43, warp: 12, general: 18 })
    expect(worlds.filter((world) => !world.referencedByCluster)).toHaveLength(21)
  })

  it('maps curated strategic resource routes to exact player-facing world variants', () => {
    const byId = new Map(worlds.map((world) => [world.id, world]))
    expect(byId.get('expansion1::worlds/WaterMoonlet')?.specialResourceIds).toContain('graphite-super-coolant')
    expect(byId.get('expansion1::worlds/NiobiumMoonlet')?.specialResourceIds).toContain('niobium-thermium')
    expect(byId.get('expansion1::worlds/MarshyMoonlet')?.specialResourceIds).toContain('sap-isosap')
    expect(byId.get('expansion1::worlds/MooMoonlet')?.specialResourceIds).toContain('moo-brackene')
    expect(byId.get('dlc4::worlds/PrehistoricSpacedOutAsteroid')?.specialResourceIds).toContain('iridium-demolior')
    expect(byId.get('expansion1::worlds/MiniRadioactiveOcean')?.specialResourceIds).toContain('uranium-nuclear')
    expect(byId.get('worlds/SandstoneDefault')?.specialResourceIds).toEqual([])

    const routeIds = new Set(specialResources.routes.map((route) => route.id))
    for (const world of worlds) {
      expect(world.specialResourceIds.every((id) => routeIds.has(id)), world.id).toBe(true)
    }
  })

  it('ships bilingual, cited and current special-resource guidance', () => {
    expect(specialResources.schema_version).toBe(1)
    expect(specialResources.baseline).toMatchObject({ as_of: '2026-08-03', latest_public_checked: 'U59-744825' })
    expect(specialResources.routes.map((route) => route.id)).toEqual([
      'graphite-super-coolant',
      'niobium-thermium',
      'sap-isosap',
      'moo-brackene',
      'iridium-demolior',
      'uranium-nuclear',
    ])
    const sourceIds = new Set(specialResources.sources.map((source) => source.id))
    expect(specialResources.sources.some((source) => source.kind === 'community-discussion')).toBe(true)
    for (const route of specialResources.routes) {
      expect(route.name_en, route.id).not.toBe('')
      expect(route.name_zh, route.id).not.toBe('')
      expect(route.production_en.length, route.id).toBeGreaterThan(0)
      expect(route.production_zh.length, route.id).toBe(route.production_en.length)
      expect(route.uses_zh.length, route.id).toBe(route.uses_en.length)
      expect(route.attention_zh.length, route.id).toBe(route.attention_en.length)
      expect(route.source_ids.length, route.id).toBeGreaterThan(0)
      expect(route.source_ids.every((id) => sourceIds.has(id)), route.id).toBe(true)
    }
  })

  it('assigns every resource exactly one known in-game category', () => {
    const categoryIds = new Set(gameCategories.map((category) => category.id))
    expect(resources.filter((resource) => !resource.primaryCategory)).toEqual([])
    expect(resources.filter((resource) => !categoryIds.has(resource.primaryCategory))).toEqual([])
  })

  it('classifies forage food prefabs as Edible from the generated game taxonomy', () => {
    const byId = new Map(resources.map((resource) => [resource.simhash, resource]))
    for (const id of [
      'BasicForagePlant',
      'GardenForagePlant',
      'IceCavesForagePlant',
      'SwampForagePlant',
    ]) {
      expect(gameTaxonomy.prefab_categories[id], id).toBe('Edible')
      expect(byId.get(id)?.primaryCategory, id).toBe('Edible')
    }
  })

  it('profiles every flora and fauna candidate with bilingual text and current mechanics links', () => {
    expect(research.entity_profiles).toHaveLength(123)
    expect(research.schema_version).toBe(3)
    expect(research.entity_profiles.every((profile: Record<string, unknown>) => !('roles' in profile))).toBe(true)
    const profiles = new Map(research.entity_profiles.map((profile) => [profile.prefab_id, profile]))
    for (const zone of research.zones) {
      for (const item of [...zone.worldgen.flora, ...zone.worldgen.fauna]) {
        const profile = profiles.get(item.prefab_id)
        expect(profile, item.prefab_id).toBeDefined()
        expect(profile?.summary_en, item.prefab_id).not.toBe('')
        expect(profile?.summary_zh, item.prefab_id).not.toBe('')
        expect(profile?.mechanics_url, item.prefab_id).toMatch(/^https:\/\/oxygennotincluded\.wiki\.gg\/wiki\//)
      }
      for (const category of ['food', 'energy', 'oxygen', 'radiation'] as const) {
        expect(zone.recommendations[category].length).toBeGreaterThan(0)
      }
      expect(zone.attention.length).toBeGreaterThan(0)
    }
  })

  it('rates all 104 terrain survival categories on a validated 1–5 cost-efficiency scale', () => {
    const categories = ['food', 'energy', 'oxygen', 'radiation'] as const
    const ratings = research.zones.flatMap((zone) => categories.map((category) => {
      const rating = zone.cost_efficiency_ratings[category]
      expect(Number.isInteger(rating.rating), `${zone.zone_type}:${category}`).toBe(true)
      expect(rating.rating, `${zone.zone_type}:${category}`).toBeGreaterThanOrEqual(1)
      expect(rating.rating, `${zone.zone_type}:${category}`).toBeLessThanOrEqual(5)
      if (rating.best_method_index !== null) {
        expect(rating.best_method_index, `${zone.zone_type}:${category}`).toBeGreaterThanOrEqual(0)
        expect(rating.best_method_index, `${zone.zone_type}:${category}`).toBeLessThan(zone.recommendations[category].length)
      }
      return rating.rating
    }))

    expect(ratings).toHaveLength(26 * 4)
    expect(research.cost_efficiency_rubric.scale).toEqual({ min: 1, max: 5 })
    expect(research.cost_efficiency_rubric.aggregation).toBe('best-usable-method')
  })

  it('ships non-empty Traditional Chinese guidance without the rejected multi-converter shortcuts', () => {
    const methods = research.zones.flatMap((zone) =>
      (['food', 'energy', 'oxygen', 'radiation'] as const).flatMap((category) => zone.recommendations[category]),
    )
    expect(methods.every((method) => method.method_zh.trim().length > 0)).toBe(true)
    const mentionedExcludedChains = methods.filter((method) =>
      /ethanol chain|polluted-water-to-hydrogen|Sludge-Press|water cleaning plus electrolysis/i.test(method.method),
    )
    expect(mentionedExcludedChains.every((method) =>
      /advanced|exclude|exceed/i.test(method.method),
    )).toBe(true)

    const directMethods = methods.filter((method) => !/advanced|exclude|exceed|not a direct/i.test(method.method))
    expect(directMethods.map((method) => method.method).join('\n')).not.toMatch(
      /desalinat\w*.*electrolys|process Salt Water\/Brine.*electroly|refine or boil Crude Oil.*Petroleum|properly cooled Research Reactor/i,
    )
    expect(directMethods.map((method) => method.method).join('\n')).not.toMatch(
      /powered Radiation Lamp.*Radbolt Generator/i,
    )

    const radioactive = research.zones.find((zone) => zone.zone_type === 'Radioactive')
    expect(radioactive?.recommendations.radiation[0].method).toMatch(/ambient radiation/i)
    expect(radioactive?.recommendations.radiation[0].method).toMatch(/Radbolt Generator/i)
  })
})
