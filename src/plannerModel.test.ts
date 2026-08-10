import { describe, expect, it } from 'vitest'
import {
  configurationCoverageForResource,
  filterWorldGroups,
  groupTerrainsByBiome,
  groupWorlds,
  inferWorldVariantRole,
  isAdvancedWorld,
  totalConfigurationCoverage,
  worldVariantDlcTag,
  worldWidthBand,
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
  width: 160,
  height: 274,
  clusterRoles: ['general'],
  referencedByCluster: true,
  internal: false,
  specialResourceIds: [],
})

const resource = (simhash: string, sources: string[] = []): Resource => ({
  simhash,
  name_en: simhash,
  name_zh: `中-${simhash}`,
  type: 'solid',
  categories: [],
  primaryCategory: 'Other',
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
  it('groups the same planet family across DLC tags so the selector can place pack labels on variants', () => {
    const groups = groupWorlds([
      world('expansion1::worlds/MiniFlipped', 'Flipped Asteroid'),
      world('expansion1::worlds/MiniFlippedStart', 'Flipped Asteroid'),
      world('expansion1::worlds/MiniFlippedWarp', 'Flipped Asteroid'),
      world('base::worlds/MiniFlipped', 'Flipped Asteroid', 'base'),
    ])

    expect(groups).toHaveLength(1)
    expect(groups[0].worlds).toHaveLength(4)
    expect(groups[0].dlcTags).toEqual(['expansion1', 'base'])
    expect(filterWorldGroups(groups, new Set(['base']), 'expansion1', false)).toEqual([])
  })

  it('groups one player-visible asteroid family even when role-specific display names differ', () => {
    const base = world('dlc2::worlds/CeresBaseGameAsteroid', 'Ceres', 'dlc2')
    const frosty = world('dlc2::worlds/CeresClassicAsteroid', 'Ceres Classic', 'dlc2')
    const spacedOut = world('dlc2::worlds/CeresSpacedOutAsteroid', 'Ceres Asteroid', 'dlc2')
    const groups = groupWorlds([base, frosty, spacedOut])

    expect(groups).toHaveLength(1)
    expect(groups[0].worlds).toHaveLength(3)
    expect(groups[0].dlcTags).toEqual(['base', 'dlc2', 'expansion1'])
    expect([base, frosty, spacedOut].map(worldVariantDlcTag)).toEqual(['base', 'dlc2', 'expansion1'])
    expect(filterWorldGroups(groups, new Set(['base']), '', false)[0].worlds).toEqual([base])
    expect(filterWorldGroups(groups, new Set(['dlc2']), '', false)[0].worlds).toEqual([frosty])
    expect(filterWorldGroups(groups, new Set(['expansion1']), '', false)[0].worlds).toEqual([spacedOut])
    expect(filterWorldGroups(groups, new Set(['base', 'dlc2']), '', false)[0].worlds).toEqual([base, frosty])
  })

  it('uses cluster evidence for Start, Warp, and general roles without treating Mini as a role', () => {
    const variants: World[] = [
      { ...world('expansion1::worlds/MiniFlippedStart', 'Flipped Asteroid'), clusterRoles: ['start'] },
      { ...world('expansion1::worlds/MiniFlippedWarp', 'Flipped Asteroid'), clusterRoles: ['warp'] },
      world('expansion1::worlds/MiniFlipped', 'Flipped Asteroid'),
      world('expansion1::worlds/IdealLandingSite', 'Forest Asteroid'),
    ]

    expect(variants.map(inferWorldVariantRole)).toEqual(['start', 'warp', 'general', 'general'])
    expect(groupWorlds(variants.slice(0, 3))[0].worlds.map((item) => item.id)).toEqual(variants.slice(0, 3).map((item) => item.id))
  })

  it('uses Start then Warp then general precedence when cluster roles overlap', () => {
    expect(inferWorldVariantRole({ ...world('worlds/Overlap', 'Overlap'), clusterRoles: ['general', 'warp', 'start'] })).toBe('start')
    expect(inferWorldVariantRole({ ...world('worlds/Overlap', 'Overlap'), clusterRoles: ['general', 'warp'] })).toBe('warp')
  })

  it('classifies width independently from role using the approved neutral bands', () => {
    expect(worldWidthBand({ ...world('worlds/a', 'A'), width: 96 })).toBe('extremely-small')
    expect(worldWidthBand({ ...world('worlds/b', 'B'), width: 128 })).toBe('moonlet-mini-width')
    expect(worldWidthBand({ ...world('worlds/c', 'C'), width: 160 })).toBe('spaced-out-standard-width')
    expect(worldWidthBand({ ...world('worlds/d', 'D'), width: 240 })).toBe('classic-large-width')
    expect(worldWidthBand({ ...world('worlds/e', 'E'), width: 256 })).toBe('base-game-extra-large-width')
  })

  it('identifies developer/test maps and hides them unless advanced maps are requested', () => {
    const playerWorld = world('worlds/SandstoneDefault', 'Terra', 'base')
    const devWorld = world('worlds/TinyEmpty', 'Tiny Empty FOR DEVS', 'base')
    const testWorld = world('expansion1::worlds/SpaceshipInterior', 'SpaceshipInterior')
    const unreferenced = { ...world('worlds/UnusedShippingWorld', 'Unused', 'base'), clusterRoles: [], referencedByCluster: false }
    const groups = groupWorlds([playerWorld, devWorld, testWorld, unreferenced])

    expect(isAdvancedWorld(devWorld)).toBe(true)
    expect(isAdvancedWorld(testWorld)).toBe(true)
    expect(isAdvancedWorld(unreferenced)).toBe(true)
    expect(filterWorldGroups(groups, new Set(['base', 'expansion1']), '', false).flatMap((group) => group.worlds)).toEqual([playerWorld])
    expect(filterWorldGroups(groups, new Set(['base', 'expansion1']), '', true).flatMap((group) => group.worlds)).toHaveLength(4)
    expect(filterWorldGroups(groups, new Set(['base', 'expansion1']), '', false, devWorld.id).flatMap((group) => group.worlds)).toEqual([playerWorld, devWorld])
  })

  it('supports multiple selected DLCs and searches grouped variants by exact ID', () => {
    const base = world('worlds/SandstoneDefault', 'Terra', 'base')
    const start = world('expansion1::worlds/MiniFlippedStart', 'Flipped Asteroid')
    const warp = world('expansion1::worlds/MiniFlippedWarp', 'Flipped Asteroid')
    const dlc2 = world('dlc2::worlds/CeresBaseGameAsteroid', 'Ceres', 'dlc2')
    const groups = groupWorlds([base, start, warp, dlc2])

    expect(filterWorldGroups(groups, new Set(['base', 'expansion1']), '', false).flatMap((group) => group.worlds)).toEqual([base, start, warp, dlc2])
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
      terrain('barren/a', 'Barren'),
    ]

    expect(configurationCoverageForResource('Water', terrains)).toEqual([
      { zoneType: 'Beach', terrainIds: ['beach/a', 'beach/b'], covered: 2, total: 3, percentage: 67, conditional: false },
      { zoneType: 'Reef', terrainIds: ['reef/a'], covered: 1, total: 1, percentage: 100, conditional: false },
      { zoneType: 'Barren', terrainIds: [], covered: 0, total: 1, percentage: 0, conditional: false },
    ])
    expect(totalConfigurationCoverage(configurationCoverageForResource('Water', terrains))).toEqual({
      covered: 3,
      total: 5,
      percentage: 60,
    })
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
