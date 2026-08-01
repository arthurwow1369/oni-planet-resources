import { describe, expect, it } from 'vitest'
import {
  aggregateTerrainResources,
  presentationCategories,
  resourceTone,
} from './resourcePresentation'
import type { Resource, Subworld } from './types'

const resource = (
  simhash: string,
  type: Resource['type'],
  categories: Resource['categories'] = [],
): Resource => ({
  simhash,
  name_en: simhash,
  name_zh: `中-${simhash}`,
  type,
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

describe('fauna and plant resource presentation', () => {
  it('aggregates fauna and plants from only the selected terrains', () => {
    const selected = terrain('selected-marsh', [
      resource('MushroomPlant', 'plant', ['food']),
      resource('Puft', 'critter'),
    ])
    const unselected = terrain('unselected-ocean', [resource('Pacu', 'critter')])

    const resources = aggregateTerrainResources([selected], 'en')

    expect(resources.map((item) => item.simhash)).toEqual(['MushroomPlant', 'Puft'])
    expect(resources.every((item) => item.terrainIds.includes('selected-marsh'))).toBe(true)
    expect(resources.some((item) => item.simhash === unselected.resources[0].simhash)).toBe(false)
  })

  it('adds Plants while preserving a plant existing use categories', () => {
    const plant = resource('MushroomPlant', 'plant', ['food'])

    expect(presentationCategories(plant)).toEqual(['food', 'plants'])
  })

  it('places uncategorized critters in Fauna instead of Uncategorized', () => {
    const critter = resource('Puft', 'critter')

    expect(presentationCategories(critter)).toEqual(['fauna'])
  })

  it('keeps uncategorized materials in Uncategorized', () => {
    expect(presentationCategories(resource('Rock', 'solid'))).toEqual(['uncategorized'])
  })

  it('assigns distinct visual tones to plants, fauna, and materials', () => {
    expect(resourceTone(resource('MushroomPlant', 'plant'))).toBe('plant')
    expect(resourceTone(resource('Puft', 'critter'))).toBe('fauna')
    expect(resourceTone(resource('Rock', 'solid'))).toBe('material')
  })
})
