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
    operations: Array<{
      mode: string
      label_en: string
      label_zh: string
      detail_en: string
      detail_zh: string
    }>
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
    settlement: {
      classification: string
      score: number
      operationMode: string
      recommendedMission: string
      summary_en: string
      summary_zh: string
      strengths_en: string[]
      strengths_zh: string[]
      risks_en: string[]
      risks_zh: string[]
      metrics: Record<'hasWater' | 'hasOxygen' | 'hasFood' | 'hasPower', boolean>
      specialOperations: Array<{
        routeId: string
        mode: string
        label_en: string
        label_zh: string
        detail_en: string
        detail_zh: string
      }>
    }
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
    expect(worlds).toHaveLength(92)
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
    expect(worlds.filter((world) => !world.referencedByCluster)).toHaveLength(19)
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

  it('classifies every world for settlement and operational staffing', () => {
    const classificationCounts = new Map<string, number>()
    for (const world of worlds) {
      const analysis = world.settlement
      expect(['recommended', 'conditional', 'outpost'], world.id).toContain(analysis.classification)
      expect(analysis.score, world.id).toBeGreaterThanOrEqual(0)
      expect(analysis.score, world.id).toBeLessThanOrEqual(100)
      expect(analysis.summary_en, world.id).not.toBe('')
      expect(analysis.summary_zh, world.id).not.toBe('')
      expect(Object.keys(analysis.metrics).sort(), world.id).toEqual([
        'comfortableTerrainRatio',
        'extremeTerrainRatio',
        'hasFood',
        'hasOxygen',
        'hasPower',
        'hasWater',
        'terrainCount',
      ])
      classificationCounts.set(analysis.classification, (classificationCounts.get(analysis.classification) ?? 0) + 1)
    }
    expect(Object.fromEntries(classificationCounts)).toEqual({ recommended: 45, conditional: 30, outpost: 17 })

    const byId = new Map(worlds.map((world) => [world.id, world]))
    expect(byId.get('dlc5::worlds/AquaticSpacedOutAsteroid')?.settlement).toMatchObject({ classification: 'recommended' })
    expect(byId.get('expansion1::worlds/RegolithMoonlet')?.settlement).toMatchObject({ classification: 'conditional' })
    expect(byId.get('expansion1::worlds/WaterMoonlet')?.settlement).toMatchObject({ classification: 'outpost', operationMode: 'extract-and-leave' })
    expect(byId.get('expansion1::worlds/NiobiumMoonlet')?.settlement).toMatchObject({ classification: 'outpost', operationMode: 'automated-outpost' })
    expect(byId.get('expansion1::worlds/MarshyMoonlet')?.settlement).toMatchObject({ classification: 'outpost', operationMode: 'managed-outpost' })
    expect(byId.get('expansion1::worlds/MooMoonlet')?.settlement).toMatchObject({ classification: 'outpost', operationMode: 'managed-outpost' })
  })

  it('gives every non-recommended world at least one applicable bilingual risk', () => {
    for (const world of worlds.filter((world) => world.settlement.classification !== 'recommended')) {
      expect(world.settlement.risks_en.length, world.id).toBeGreaterThan(0)
      expect(world.settlement.risks_zh.length, world.id).toBe(world.settlement.risks_en.length)
    }
  })

  it('describes MiniShatteredGeoAsteroid as size-limited without claiming life-support imports', () => {
    const world = worlds.find((world) => world.id === 'dlc2::worlds/MiniShatteredGeoAsteroid')
    expect(world).toBeDefined()
    expect(world).toMatchObject({ width: 128, settlement: { classification: 'conditional' } })
    expect(world?.settlement.metrics).toMatchObject({
      hasWater: true,
      hasOxygen: true,
      hasFood: true,
      hasPower: true,
    })
    expect(world?.settlement.risks_en.some((risk) => /wide|expansion space/i.test(risk))).toBe(true)
    expect(world?.settlement.risks_zh.some((risk) => /寬度|擴建空間/.test(risk))).toBe(true)
    expect(world?.settlement.summary_en).toMatch(/expansion space/i)
    expect(world?.settlement.summary_en).not.toMatch(/import/i)
    expect(world?.settlement.summary_zh).toMatch(/擴建空間/)
    expect(world?.settlement.summary_zh).not.toMatch(/輸入/)
  })

  it('marks BigEmpty as a destination with no settlement or extraction target', () => {
    const world = worlds.find((world) => world.id === 'worlds/BigEmpty')
    expect(world?.settlement).toMatchObject({
      classification: 'outpost',
      operationMode: 'avoid',
      recommendedMission: 'no-resource-destination',
      specialOperations: [],
    })
    expect(world?.settlement.summary_en).toMatch(/no settlement or extraction target/i)
    expect(world?.settlement.summary_zh).toMatch(/未找到定居或採集目標/)
  })

  it('prioritizes a conditional world special-resource operation over its settlement mission', () => {
    const world = worlds.find((world) => world.id === 'expansion1::worlds/MiniRadioactiveOcean')
    expect(world?.specialResourceIds).toContain('uranium-nuclear')
    expect(world?.settlement).toMatchObject({
      classification: 'conditional',
      operationMode: 'automated-outpost',
      recommendedMission: 'automated-resource-outpost',
    })
    expect(world?.settlement.specialOperations.some((operation) => operation.mode === 'automated-outpost')).toBe(true)
  })

  it('requires worldgen evidence before recommending renewable special-resource operations', () => {
    const uraniumOnly = worlds.find((world) => world.id === 'expansion1::worlds/VanillaArboria')
    expect(uraniumOnly?.specialResourceIds).toContain('uranium-nuclear')
    expect(uraniumOnly?.settlement.specialOperations.some((operation) => operation.mode === 'extract-and-leave')).toBe(true)
    expect(uraniumOnly?.settlement.specialOperations.some((operation) => operation.mode === 'automated-outpost')).toBe(false)

    const beetaWorld = worlds.find((world) => world.id === 'expansion1::worlds/SmallRadioactiveLandingSite')
    expect(beetaWorld?.settlement.specialOperations.some((operation) => operation.mode === 'automated-outpost')).toBe(true)

    const niobiumWorld = worlds.find((world) => world.id === 'expansion1::worlds/NiobiumMoonlet')
    expect(niobiumWorld?.settlement.specialOperations.map((operation) => operation.mode)).toEqual([
      'extract-and-leave',
      'automated-outpost',
    ])
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
      expect(route.operations.length, route.id).toBeGreaterThan(0)
      for (const operation of route.operations) {
        expect(['extract-and-leave', 'automated-outpost', 'managed-outpost'], route.id).toContain(operation.mode)
        expect(operation.label_en, route.id).not.toBe('')
        expect(operation.label_zh, route.id).not.toBe('')
        expect(operation.detail_en, route.id).not.toBe('')
        expect(operation.detail_zh, route.id).not.toBe('')
      }
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

type SpacePoiData = {
  schema_version: number
  baseline: { coordinatePolicy_en: string; coordinatePolicy_zh: string }
  pois: Array<{
    id: string
    kind: 'harvestable' | 'artifact' | 'special'
    name_en: string
    name_zh: string
    desc_en: string
    desc_zh: string
    dlcTag: string
    cargo: string[]
    capacityRangeKg?: { min: number; max: number }
    outputs: Array<{ id: string; name_en: string; name_zh: string; phase: string; ratio: number; temperatureC: number; type: string; primaryCategory: string; use_en: string; use_zh: string }>
    collectibles?: Array<{ id: string }>
    placements: Array<{ clusterId: string; allowedRings: { min: number; max: number } }>
    strategicResourceIds: string[]
    strategic_en: string[]
    strategic_zh: string[]
  }>
  sources: Array<{ id: string }>
}

describe('space POI catalog', () => {
  const spacePois = readJson<SpacePoiData>('public/data/space-pois.json')

  it('catalogs every placed POI with a localized name and a cluster placement', () => {
    expect(spacePois.pois.length).toBeGreaterThan(30)
    for (const poi of spacePois.pois) {
      expect(poi.name_en.trim().length).toBeGreaterThan(0)
      expect(poi.name_zh.trim().length).toBeGreaterThan(0)
      expect(poi.placements.length).toBeGreaterThan(0)
      expect(poi.strategic_en.length).toBeGreaterThan(0)
      expect(poi.strategic_zh.length).toBeGreaterThan(0)
    }
  })

  it('normalizes every harvestable composition to whole shares of the harvested mass', () => {
    const harvestable = spacePois.pois.filter((poi) => poi.kind === 'harvestable')
    expect(harvestable.length).toBeGreaterThan(25)
    for (const poi of harvestable) {
      const total = poi.outputs.reduce((sum, output) => sum + output.ratio, 0)
      expect(Math.abs(total - 100)).toBeLessThan(0.05)
      expect(poi.capacityRangeKg!.min).toBeLessThanOrEqual(poi.capacityRangeKg!.max)
      // The cargo bays a POI needs are exactly the phases it yields.
      expect(poi.cargo).toEqual([...new Set(poi.outputs.map((output) => output.phase))].sort())
    }
  })

  it('publishes the documented collectible rewards for every artifact POI', () => {
    const artifacts = spacePois.pois.filter((poi) => poi.kind === 'artifact')
    expect(artifacts.length).toBeGreaterThan(0)
    for (const poi of artifacts) {
      const collectibleIds = new Set(poi.collectibles?.map((item) => item.id))
      expect(collectibleIds, poi.id).toEqual(new Set(['Artifact', 'DataBank']))
    }
  })

  it('never publishes a per-seed starmap coordinate', () => {
    expect(spacePois.baseline.coordinatePolicy_en).toMatch(/rolled per world seed/i)
    const serialized = JSON.stringify(spacePois)
    expect(serialized).not.toMatch(/"[qr]":\s*-?\d/)
    expect(serialized).not.toMatch(/"(colonyName|sourceSave|cycle|revealStatus)"/i)
    for (const poi of spacePois.pois) {
      for (const placement of poi.placements) {
        expect(placement.allowedRings.min).toBeLessThanOrEqual(placement.allowedRings.max)
      }
    }
  })

  it('keeps each POI description its own, not an element description borrowed from an output', () => {
    for (const poi of spacePois.pois) {
      expect(poi.desc_zh.trim().length, poi.id).toBeGreaterThan(0)
      const outputUses = new Set(poi.outputs.flatMap((output) => [output.use_en.trim(), output.use_zh.trim()]))
      expect(outputUses.has(poi.desc_en.trim()), poi.id).toBe(false)
      expect(outputUses.has(poi.desc_zh.trim()), poi.id).toBe(false)
    }
    const gilded = spacePois.pois.find((poi) => poi.id === 'HarvestableSpacePOI_GildedAsteroidField')
    expect(gilded?.desc_en).toMatch(/asteroid field/i)
  })

  it('describes every output like a planet resource, so both views can share one card format', () => {
    const categoryIds = new Set(readJson<Array<{ id: string }>>('public/data/game-categories.json').map((category) => category.id))
    const outputs = spacePois.pois.flatMap((poi) => poi.outputs)
    expect(outputs.length).toBeGreaterThan(0)
    for (const output of outputs) {
      expect(output.use_en.trim().length).toBeGreaterThan(0)
      expect(output.use_zh.trim().length).toBeGreaterThan(0)
      expect(categoryIds.has(output.primaryCategory)).toBe(true)
      expect(['solid', 'liquid', 'gas']).toContain(output.type)
      // The game assembly declares the collected phase. A generic resource
      // catalog must never override this POI-specific fact.
      expect(output.type).toBe(output.phase)
    }
  })

  it('only marks strategic resources the POI actually yields, and cites its sources', () => {
    const sourceIds = new Set(spacePois.sources.map((source) => source.id))
    expect(sourceIds.size).toBeGreaterThan(0)
    for (const poi of spacePois.pois) {
      const outputIds = new Set(poi.outputs.map((output) => output.id))
      for (const id of poi.strategicResourceIds) expect(outputIds.has(id)).toBe(true)
    }
  })
})

type GeyserRow = {
  id: string
  name_en: string
  name_zh: string
  element: string
  elementName_en: string
  elementName_zh: string
  shape: 'gas' | 'liquid' | 'molten'
  temperatureC: number
  rateKgPerCycle: { min: number; max: number }
  isGenericGeyser: boolean
}

type WorldGeyserRow = {
  id: string
  geysers?: {
    fixed: Array<{ geyserId: string; count: number }>
    pools: Array<{ geyserIds: string[]; draws: number; allowDuplicates: boolean; guaranteed: boolean; isRandomSpawner: boolean }>
  }
}

describe('geyser catalog', () => {
  const geysers = readJson<GeyserRow[]>('public/data/geysers.json')
  const geyserWorlds = readJson<WorldGeyserRow[]>('public/data/worlds.json')
  const byId = new Map(geysers.map((geyser) => [geyser.id, geyser]))

  it('publishes every geyser type with bilingual names and a positive rate', () => {
    expect(geysers.length).toBeGreaterThanOrEqual(25)
    for (const geyser of geysers) {
      expect(geyser.name_en.trim().length, geyser.id).toBeGreaterThan(0)
      expect(geyser.name_zh.trim().length, geyser.id).toBeGreaterThan(0)
      expect(geyser.elementName_zh.trim().length, geyser.id).toBeGreaterThan(0)
      expect(geyser.rateKgPerCycle.min, geyser.id).toBeGreaterThan(0)
      expect(geyser.rateKgPerCycle.min, geyser.id).toBeLessThanOrEqual(geyser.rateKgPerCycle.max)
      expect(['gas', 'liquid', 'molten']).toContain(geyser.shape)
    }
  })

  it('keeps the four curated-only types out of the random pool', () => {
    // geysers/generic is the Random Geyser Spawner and can only roll flagged types.
    const curatedOnly = geysers.filter((geyser) => !geyser.isGenericGeyser).map((geyser) => geyser.id).sort()
    expect(curatedOnly).toEqual(['chlorine_gas_cool', 'molten_niobium', 'molten_tungsten', 'murky_brine'])
  })

  it('resolves every world geyser reference to a published type', () => {
    for (const world of geyserWorlds) {
      for (const entry of world.geysers?.fixed ?? []) {
        expect(byId.has(entry.geyserId), `${world.id}/${entry.geyserId}`).toBe(true)
        expect(entry.count, world.id).toBeGreaterThan(0)
      }
      for (const pool of world.geysers?.pools ?? []) {
        expect(pool.geyserIds.length, world.id).toBeGreaterThan(0)
        expect(pool.draws, world.id).toBeGreaterThan(0)
        for (const id of pool.geyserIds) expect(byId.has(id), `${world.id}/${id}`).toBe(true)
      }
    }
  })

  it('separates guaranteed placements from pooled draws instead of calling everything fixed', () => {
    const aquatic = geyserWorlds.find((world) => world.id === 'dlc5::worlds/AquaticSpacedOutAsteroid')
    // The curated block is `TryOne times:3 allowDuplicates:true` over 8 names,
    // so none of those 8 may be reported as always present.
    const pool = aquatic?.geysers?.pools.find((entry) => entry.geyserIds.length === 8)
    expect(pool).toMatchObject({ draws: 3, allowDuplicates: true, guaranteed: false, isRandomSpawner: false })
    const fixedIds = new Set(aquatic?.geysers?.fixed.map((entry) => entry.geyserId))
    for (const id of pool?.geyserIds ?? []) expect(fixedIds.has(id), id).toBe(false)
  })

  it('models the generic spawner as a 12-draw pool over the whole random set', () => {
    const sandstone = geyserWorlds.find((world) => world.id === 'worlds/SandstoneDefault')
    const generic = sandstone?.geysers?.pools.find((pool) => pool.isRandomSpawner)
    expect(generic).toMatchObject({ draws: 12, allowDuplicates: true })
    expect(generic?.geyserIds.length).toBe(geysers.filter((geyser) => geyser.isGenericGeyser).length)
  })

  it('keeps tungsten and niobium volcanoes as fixed placements on their own moonlets', () => {
    const marshy = geyserWorlds.find((world) => world.id === 'expansion1::worlds/MarshyMoonlet')
    expect(marshy?.geysers?.fixed.map((entry) => entry.geyserId)).toContain('molten_tungsten')
    const niobium = geyserWorlds.find((world) => world.id === 'expansion1::worlds/NiobiumMoonlet')
    expect(niobium?.geysers?.fixed.map((entry) => entry.geyserId)).toContain('molten_niobium')
  })
})
