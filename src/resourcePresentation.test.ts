import { describe, expect, it } from 'vitest'
import {
  aggregateTerrainResources,
  effectiveGameCategory,
  resourceMatchesQuery,
  resourceTone,
  sortGameCategories,
} from './resourcePresentation'
import type { Resource, Subworld } from './types'

const resource = (
  simhash: string,
  type: Resource['type'],
  categories: Resource['categories'] = [],
  overrides: Partial<Resource> = {},
): Resource => ({
  simhash,
  name_en: simhash,
  name_zh: `中-${simhash}`,
  type,
  categories,
  primaryCategory: 'Other',
  use_en: '',
  use_zh: '',
  ...overrides,
})

const terrain = (id: string, resources: Resource[]): Subworld => ({
  id,
  name_en: id,
  name_zh: `中-${id}`,
  variant_en: id,
  variant_zh: `中-${id}`,
  zoneType: 'Test',
  dlcTag: 'test',
  resources,
  features: [],
})

describe('seed and egg resource presentation', () => {
  it('aggregates resources from only the selected terrains', () => {
    const selected = terrain('selected-marsh', [
      resource('MushroomPlant', 'plant', [], { primaryCategory: 'Seed' }),
      resource('Puft', 'critter', [], { primaryCategory: 'Egg' }),
    ])
    const unselected = terrain('unselected-ocean', [resource('Pacu', 'critter')])

    const resources = aggregateTerrainResources([selected], 'en')

    expect(resources.map((item) => item.simhash)).toEqual(['MushroomPlant', 'Puft'])
    expect(resources.every((item) => item.terrainIds.includes('selected-marsh'))).toBe(true)
    expect(resources.some((item) => item.simhash === unselected.resources[0].simhash)).toBe(false)
  })

  it('collapses plant occurrences onto one seed card and preserves the represented plant', () => {
    const representative = {
      id: 'PrickleGrassSeed',
      kind: 'seed' as const,
      isVirtual: false,
      name_en: 'Blossom Seed',
      name_zh: '花種子',
      entity: {
        id: 'PrickleGrass',
        type: 'plant' as const,
        name_en: 'Bristle Blossom',
        name_zh: '刺花',
        use_en: 'Produces Bristle Berries.',
        use_zh: '產出刺莓。',
      },
    }
    const terrains = [
      terrain('one', [resource('PrickleGrass', 'plant', [], { primaryCategory: 'Seed', representative })]),
      terrain('two', [resource('PrickleGrassSeed', 'plant', [], { primaryCategory: 'Seed', representative })]),
    ]

    const [aggregated] = aggregateTerrainResources(terrains, 'en')

    expect(aggregated.simhash).toBe('PrickleGrassSeed')
    expect(aggregated.sourceSimhashes).toEqual(['PrickleGrass', 'PrickleGrassSeed'])
    expect(aggregated.representative?.entity.name_en).toBe('Bristle Blossom')
    expect(aggregated.terrainIds).toEqual(['one', 'two'])
  })

  it('assigns distinct visual tones to plants, fauna, and materials', () => {
    expect(resourceTone(resource('MushroomPlant', 'plant'))).toBe('plant')
    expect(resourceTone(resource('Puft', 'critter'))).toBe('fauna')
    expect(resourceTone(resource('Rock', 'solid'))).toBe('material')
  })
})

describe('sortGameCategories', () => {
  it('matches the game by sorting localized category names alphabetically', () => {
    const categories = [
      { id: 'Seed' as const, name_en: 'Seeds', name_zh: '種子' },
      { id: 'Egg' as const, name_en: 'Critter Egg', name_zh: '小動物蛋' },
      { id: 'Liquid' as const, name_en: 'Liquids', name_zh: '液體' },
    ]

    expect(sortGameCategories(categories, 'en').map((category) => category.id)).toEqual(['Egg', 'Liquid', 'Seed'])
    expect(sortGameCategories(categories, 'zh').map((category) => category.id)).toEqual(['Egg', 'Liquid', 'Seed'])
  })
})

describe('effectiveGameCategory', () => {
  it('falls back to all when a terrain rerender removes the active category', () => {
    const categoriesBefore = [{ id: 'Seed', name_en: 'Seeds', name_zh: '種子' }]
    const categoriesAfter = [{ id: 'Edible', name_en: 'Food', name_zh: '食物' }]

    expect(effectiveGameCategory('Seed', categoriesBefore)).toBe('Seed')
    expect(effectiveGameCategory('Seed', categoriesAfter)).toBe('all')
  })
})

describe('resourceMatchesQuery', () => {
  it('searches the represented entity and every source simhash on representative cards', () => {
    const representative = {
      id: 'PrickleGrassSeed',
      kind: 'seed' as const,
      isVirtual: false,
      name_en: 'Blossom Seed',
      name_zh: '花種子',
      entity: {
        id: 'PrickleGrass',
        type: 'plant' as const,
        name_en: 'Bristle Blossom',
        name_zh: '刺花',
        use_en: 'Produces Bristle Berries.',
        use_zh: '產出刺莓。',
      },
    }
    const [aggregated] = aggregateTerrainResources([
      terrain('one', [resource('PrickleGrassWorldgen', 'plant', [], { primaryCategory: 'Seed', representative })]),
      terrain('two', [resource('PrickleGrassLegacy', 'plant', [], { primaryCategory: 'Seed', representative })]),
    ], 'en')

    expect(resourceMatchesQuery(aggregated, 'PrickleGrass')).toBe(true)
    expect(resourceMatchesQuery(aggregated, 'Bristle Blossom')).toBe(true)
    expect(resourceMatchesQuery(aggregated, '刺花')).toBe(true)
    expect(resourceMatchesQuery(aggregated, 'PrickleGrassWorldgen')).toBe(true)
    expect(resourceMatchesQuery(aggregated, 'PrickleGrassLegacy')).toBe(true)
  })
})
