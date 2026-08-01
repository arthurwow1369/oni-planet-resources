import { describe, expect, it } from 'vitest'
import { buildMainSourceRecommendations } from './recommendations'
import type { Resource, Subworld } from './types'

const resource = (simhash: string, categories: Resource['categories'] = []): Resource => ({
  simhash,
  name_en: simhash,
  name_zh: `中-${simhash}`,
  type: 'solid',
  categories,
  use_en: '',
  use_zh: '',
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

describe('buildMainSourceRecommendations', () => {
  it('always returns food, oxygen, power, and radiation in display order', () => {
    const result = buildMainSourceRecommendations([])

    expect(result.map((item) => item.category)).toEqual(['food', 'oxygen', 'power', 'radiation'])
    expect(result).toHaveLength(4)
  })

  it('uses only the supplied selected terrains', () => {
    const selected = terrain('selected-water', [resource('Water', ['oxygen', 'food', 'liquid'])])
    const unselected = terrain('unselected-algae', [resource('Algae', ['oxygen', 'food'])])

    const selectedResult = buildMainSourceRecommendations([selected])
    const allResult = buildMainSourceRecommendations([selected, unselected])
    const selectedOxygen = selectedResult.find((item) => item.category === 'oxygen')
    const allOxygen = allResult.find((item) => item.category === 'oxygen')

    expect(selectedOxygen?.strategyId).toBe('water-electrolysis')
    expect(selectedOxygen?.terrainIds).toEqual(['selected-water'])
    expect(allOxygen?.terrainIds).not.toContain('unselected-algae')
  })

  it('uses deterministic domain precedence instead of biome weight', () => {
    const mixed = terrain('mixed', [
      { ...resource('Algae', ['oxygen', 'food']), weight: 999 },
      { ...resource('Water', ['oxygen', 'food', 'liquid']), weight: 0.01 },
      resource('Dirt', ['food', 'industrial']),
      resource('MushroomPlant'),
    ])

    const result = buildMainSourceRecommendations([mixed])

    expect(result.find((item) => item.category === 'oxygen')?.strategyId).toBe('water-electrolysis')
    expect(result.find((item) => item.category === 'food')?.strategyId).toBe('mushroom-farm')
  })

  it('returns an honest unavailable radiation result when no mapped source exists', () => {
    const result = buildMainSourceRecommendations([
      terrain('plain', [resource('Dirt', ['food', 'industrial'])]),
    ])
    const radiation = result.find((item) => item.category === 'radiation')

    expect(radiation).toMatchObject({
      category: 'radiation',
      available: false,
      strategyId: null,
      matchedResources: [],
      terrainIds: [],
      basis: 'potential-worldgen',
    })
  })

  it('preserves matched source-terrain provenance across selected terrains', () => {
    const result = buildMainSourceRecommendations([
      terrain('ocean-a', [resource('SaltWater', ['liquid', 'food'])]),
      terrain('ocean-b', [resource('Brine', ['liquid', 'food'])]),
      terrain('dry', [resource('Carbon', ['power', 'industrial'])]),
    ])
    const oxygen = result.find((item) => item.category === 'oxygen')

    expect(oxygen?.strategyId).toBe('water-electrolysis')
    expect(oxygen?.matchedResources.map((item) => item.simhash)).toEqual(['SaltWater', 'Brine'])
    expect(oxygen?.terrainIds).toEqual(['ocean-a', 'ocean-b'])
  })

  it('marks every recommendation as potential worldgen rather than a quantity guarantee', () => {
    const result = buildMainSourceRecommendations([
      terrain('uranium', [resource('UraniumOre', ['power', 'radiation', 'industrial'])]),
    ])

    expect(result.every((item) => item.basis === 'potential-worldgen')).toBe(true)
  })
})
