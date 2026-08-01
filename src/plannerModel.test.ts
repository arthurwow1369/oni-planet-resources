import { describe, expect, it } from 'vitest'
import {
  configurationCoverageForResource,
  filterWorldGroups,
  groupTerrainsByBiome,
  groupWorlds,
  inferWorldVariantRole,
  isAdvancedWorld,
} from './plannerModel'
import type { Resource, Subworld, World } from './types'

const world = (id: string, name_en: string, dlcTag = 'expansion1'): World => ({
  id,
  name_en,
  name_zh: `中-${name_en}`,
  desc_en: '',
  desc_zh: '',
  dlcTag,
  subworldIds: [],
  clusterExtensionSubworldIds: [],
  guarantees: [],
})

const resource = (simhash: string, sources: string[] = []): Resource => ({
  simhash,
  name_en: simhash,
  name_zh: `中-${simhash}`,
  type: 'solid',
  categories: [],
  use_en: '',
  use_zh: '',
  sources,
})

const terrain = (id: string, zoneType: string, resources: Resource[] = []): Subworld => ({
  id,
  zoneType,
  name_en: `${zoneType} Biome`,
  name_zh: `中-${zoneType}`,
  variant_en: id.split('/').pop() ?? id,
  variant_zh: '',
  dlcTag: 'expansion1',
  resources,
  features: [],
})

describe('planet grouping and filters', () => {
  it('groups worlds only when DLC tag and localized English name are both equal', () => {
    const groups = groupWorlds([
      world('expansion1::worlds/MiniFlipped', 'Flipped Asteroid'),
      world('expansion1::worlds/MiniFlippedStart', 'Flipped Asteroid'),
      world('expansion1::worlds/MiniFlippedWarp', 'Flipped Asteroid'),
      world('base::worlds/Flipped', 'Flipped Asteroid', 'base'),
    ])

    expect(groups).toHaveLength(2)
    expect(groups.find((group) => group.dlcTag === 'expansion1')?.worlds).toHaveLength(3)
    expect(groups.find((group) => group.dlcTag === 'base')?.worlds).toHaveLength(1)
  })

  it('groups one player-visible asteroid family even when role-specific display names differ', () => {
    const groups = groupWorlds([
      world('dlc2::worlds/CeresBaseGameAsteroid', 'Ceres'),
      world('dlc2::worlds/CeresClassicAsteroid', 'Ceres Classic'),
      world('dlc2::worlds/CeresSpacedOutAsteroid', 'Ceres Asteroid'),
    ])

    expect(groups).toHaveLength(1)
    expect(groups[0].worlds).toHaveLength(3)
  })

  it('infers semantic Start, Warp, Mini, and general roles without changing exact IDs', () => {
    const variants = [
      world('expansion1::worlds/MiniFlippedStart', 'Flipped Asteroid'),
      world('expansion1::worlds/MiniFlippedWarp', 'Flipped Asteroid'),
      world('expansion1::worlds/MiniFlipped', 'Flipped Asteroid'),
      world('expansion1::worlds/IdealLandingSite', 'Forest Asteroid'),
    ]

    expect(variants.map(inferWorldVariantRole)).toEqual(['start', 'warp', 'mini', 'general'])
    expect(groupWorlds(variants.slice(0, 3))[0].worlds.map((item) => item.id)).toEqual(variants.slice(0, 3).map((item) => item.id))
  })

  it('identifies developer/test maps and hides them unless advanced maps are requested', () => {
    const playerWorld = world('worlds/SandstoneDefault', 'Terra', 'base')
    const devWorld = world('worlds/TinyEmpty', 'Tiny Empty FOR DEVS', 'base')
    const testWorld = world('expansion1::worlds/SpaceshipInterior', 'SpaceshipInterior')
    const groups = groupWorlds([playerWorld, devWorld, testWorld])

    expect(isAdvancedWorld(devWorld)).toBe(true)
    expect(isAdvancedWorld(testWorld)).toBe(true)
    expect(filterWorldGroups(groups, new Set(['base', 'expansion1']), '', false).flatMap((group) => group.worlds)).toEqual([playerWorld])
    expect(filterWorldGroups(groups, new Set(['base', 'expansion1']), '', true).flatMap((group) => group.worlds)).toHaveLength(3)
  })

  it('supports multiple selected DLCs and searches grouped variants by exact ID', () => {
    const base = world('worlds/SandstoneDefault', 'Terra', 'base')
    const start = world('expansion1::worlds/MiniFlippedStart', 'Flipped Asteroid')
    const warp = world('expansion1::worlds/MiniFlippedWarp', 'Flipped Asteroid')
    const dlc2 = world('dlc2::worlds/CeresBaseGameAsteroid', 'Ceres', 'dlc2')
    const groups = groupWorlds([base, start, warp, dlc2])

    expect(filterWorldGroups(groups, new Set(['base', 'expansion1']), '', false).flatMap((group) => group.worlds)).toEqual([base, start, warp])
    expect(filterWorldGroups(groups, new Set(['expansion1']), 'MiniFlippedWarp', false)[0].worlds.map((item) => item.id)).toEqual([start.id, warp.id])
  })
})

describe('biome grouping and configuration coverage', () => {
  it('groups all source variants under one zoneType card', () => {
    const terrains = [
      terrain('beach/BeachStart', 'Beach'),
      terrain('beach/BeachMiniWater', 'Beach'),
      terrain('reef/ReefBasic', 'Reef'),
    ]

    const groups = groupTerrainsByBiome(terrains)

    expect(groups.map((group) => [group.zoneType, group.terrains.map((item) => item.id)])).toEqual([
      ['Beach', ['beach/BeachStart', 'beach/BeachMiniWater']],
      ['Reef', ['reef/ReefBasic']],
    ])
  })

  it('reports per-biome source-configuration coverage, not a seed probability', () => {
    const water = resource('Water')
    const algae = resource('Algae')
    const terrains = [
      terrain('beach/a', 'Beach', [water, algae]),
      terrain('beach/b', 'Beach', [water]),
      terrain('beach/c', 'Beach', [algae]),
      terrain('reef/a', 'Reef', [water]),
    ]

    expect(configurationCoverageForResource('Water', terrains)).toEqual([
      { zoneType: 'Beach', terrainIds: ['beach/a', 'beach/b'], covered: 2, total: 3, percentage: 67, conditional: false },
      { zoneType: 'Reef', terrainIds: ['reef/a'], covered: 1, total: 1, percentage: 100, conditional: false },
    ])
  })

  it('marks feature and spawn-tag resources as conditional even at full variant coverage', () => {
    const pacu = resource('Pacu', ['worldgen/features/ocean/PacuSchool.yaml'])
    const terrains = [terrain('ocean/a', 'Ocean', [pacu])]

    expect(configurationCoverageForResource('Pacu', terrains)[0]).toMatchObject({
      covered: 1,
      total: 1,
      percentage: 100,
      conditional: true,
    })
  })

  it('counts each source configuration once even if duplicate resource rows exist', () => {
    const water = resource('Water')
    const terrains = [terrain('beach/a', 'Beach', [water, water]), terrain('beach/b', 'Beach')]

    expect(configurationCoverageForResource('Water', terrains)[0]).toMatchObject({ covered: 1, total: 2, percentage: 50 })
  })
})
