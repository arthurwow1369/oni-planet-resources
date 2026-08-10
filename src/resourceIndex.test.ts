import { describe, expect, it } from 'vitest'
import { buildResourceIndex, filterResourceSources, filterResources, GEYSER_CATEGORY_ID, GEYSER_ID_PREFIX, sourceDlcTags, usedCategoryIds } from './resourceIndex'
import type { Geyser, SpacePoi, Subworld, World } from './types'

const resource = (simhash: string, primaryCategory: string) => ({
  simhash,
  name_en: simhash,
  name_zh: `${simhash}-zh`,
  type: 'solid',
  categories: [],
  primaryCategory,
  use_en: 'use',
  use_zh: '用途',
})

const subworlds = [
  { id: 'sw/a', resources: [resource('Gold', 'RefinedMetal'), resource('Sand', 'Filter')] },
  { id: 'sw/b', resources: [resource('Sand', 'Filter')] },
] as unknown as Subworld[]

const worlds = [
  { id: 'worlds/one', name_en: 'One', name_zh: '一', dlcTag: 'base', subworldIds: ['sw/a', 'sw/b'] },
  { id: 'worlds/two', name_en: 'Two', name_zh: '二', dlcTag: 'base', subworldIds: ['sw/b'] },
] as unknown as World[]

const pois = [{
  id: 'HarvestableSpacePOI_Test',
  name_en: 'Test Field',
  name_zh: '測試礦場',
  kind: 'harvestable',
  dlcTag: 'expansion1',
  outputs: [
    { id: 'Gold', name_en: 'Gold', name_zh: '金', phase: 'solid', ratio: 60, temperatureC: 26.85, type: 'solid', categories: [], primaryCategory: 'RefinedMetal', use_en: 'use', use_zh: '用途' },
    { id: 'Fullerene', name_en: 'Fullerene', name_zh: '富勒烯', phase: 'solid', ratio: 40, temperatureC: -31, type: 'solid', categories: [], primaryCategory: 'RareMaterials', use_en: 'use', use_zh: '用途' },
  ],
}] as unknown as SpacePoi[]

describe('buildResourceIndex', () => {
  const index = buildResourceIndex(worlds, subworlds, pois)
  const byId = new Map(index.map((entry) => [entry.id, entry]))

  it('counts a world once even when several of its subworlds list the resource', () => {
    expect(byId.get('Sand')?.worldIds).toEqual(['worlds/one', 'worlds/two'])
  })

  it('merges terrain and POI sources onto one resource entry', () => {
    expect(byId.get('Gold')).toMatchObject({
      worldIds: ['worlds/one'],
      poiIds: ['HarvestableSpacePOI_Test'],
    })
  })

  it('keeps space-only resources that no world generates', () => {
    expect(byId.get('Fullerene')).toMatchObject({ worldIds: [], poiIds: ['HarvestableSpacePOI_Test'] })
  })
})

describe('filterResources', () => {
  const index = buildResourceIndex(worlds, subworlds, pois)

  it('filters by category and localized query', () => {
    expect(filterResources(index, { query: '', category: 'Filter', locale: 'zh' }).map((r) => r.id)).toEqual(['Sand'])
    expect(filterResources(index, { query: '富勒烯', category: 'all', locale: 'zh' }).map((r) => r.id)).toEqual(['Fullerene'])
    expect(filterResources(index, { query: '', category: 'all', locale: 'zh' })).toHaveLength(3)
  })

  it('lists only categories that are actually present', () => {
    expect(usedCategoryIds(index).sort()).toEqual(['Filter', 'RareMaterials', 'RefinedMetal'])
  })
})

describe('filterResourceSources', () => {
  const index = buildResourceIndex(worlds, subworlds, pois)
  const gold = index.find((entry) => entry.id === 'Gold')
  const none = { excludedKinds: new Set<string>(), excludedDlcTags: new Set<string>() }

  it('shows both source kinds when nothing is excluded', () => {
    const result = filterResourceSources(gold, worlds, pois, none)
    expect(result.worlds.map((w) => w.id)).toEqual(['worlds/one'])
    expect(result.pois.map((p) => p.id)).toEqual(['HarvestableSpacePOI_Test'])
  })

  it('drops a whole source kind when its chip is unchecked', () => {
    expect(filterResourceSources(gold, worlds, pois, { ...none, excludedKinds: new Set(['worlds']) }).worlds).toEqual([])
    expect(filterResourceSources(gold, worlds, pois, { ...none, excludedKinds: new Set(['pois']) }).pois).toEqual([])
  })

  it('applies the DLC chips to planets and POIs alike', () => {
    const result = filterResourceSources(gold, worlds, pois, { ...none, excludedDlcTags: new Set(['base']) })
    expect(result.worlds).toEqual([])
    expect(result.pois.map((p) => p.id)).toEqual(['HarvestableSpacePOI_Test'])

    const noExpansion = filterResourceSources(gold, worlds, pois, { ...none, excludedDlcTags: new Set(['expansion1']) })
    expect(noExpansion.worlds.map((w) => w.id)).toEqual(['worlds/one'])
    expect(noExpansion.pois).toEqual([])
  })

  it('offers the union of planet and POI DLC tags as chips', () => {
    expect(sourceDlcTags(worlds, pois)).toEqual(['base', 'expansion1'])
  })

  it('returns nothing when no resource is selected', () => {
    expect(filterResourceSources(undefined, worlds, pois, none)).toEqual({ worlds: [], pois: [] })
  })
})

const geyserCatalog = [
  {
    id: 'steam', name_en: 'Cool Steam Vent', name_zh: '低溫蒸氣噴口',
    element: 'Steam', elementName_en: 'Steam', elementName_zh: '蒸氣',
    desc_en: 'A vent.', desc_zh: '一個噴口。', shape: 'gas',
    temperatureC: 110, rateKgPerCycle: { min: 100, max: 200 }, maxPressureKg: 5,
    isGenericGeyser: true, requiredDlcTags: [],
  },
  {
    id: 'molten_tungsten', name_en: 'Tungsten Volcano', name_zh: '鎢火山',
    element: 'MoltenTungsten', elementName_en: 'Molten Tungsten', elementName_zh: '熔融鎢',
    desc_en: 'A volcano.', desc_zh: '一座火山。', shape: 'molten',
    temperatureC: 3726.85, rateKgPerCycle: { min: 200, max: 400 }, maxPressureKg: 150,
    isGenericGeyser: false, requiredDlcTags: ['expansion1'],
  },
] as unknown as Geyser[]

const geyserWorlds = [
  {
    id: 'worlds/one', name_en: 'One', name_zh: '一', dlcTag: 'base', subworldIds: [],
    geysers: { fixed: [{ geyserId: 'molten_tungsten', count: 1 }], pools: [] },
  },
  {
    id: 'worlds/two', name_en: 'Two', name_zh: '二', dlcTag: 'base', subworldIds: [],
    geysers: { fixed: [], pools: [{ geyserIds: ['steam', 'molten_tungsten'], draws: 1, allowDuplicates: false, guaranteed: false, isRandomSpawner: false }] },
  },
] as unknown as World[]

describe('geysers as a resource type', () => {
  const index = buildResourceIndex(geyserWorlds, [], [], geyserCatalog)
  const byId = new Map(index.map((entry) => [entry.id, entry]))
  const tungsten = byId.get(`${GEYSER_ID_PREFIX}molten_tungsten`)

  it('namespaces geyser ids so they cannot collide with an element simhash', () => {
    expect(byId.has(`${GEYSER_ID_PREFIX}steam`)).toBe(true)
    expect(byId.has('steam')).toBe(false)
  })

  it('files geysers under their own category with the geyser type', () => {
    expect(tungsten).toMatchObject({ type: 'geyser', primaryCategory: GEYSER_CATEGORY_ID, name_zh: '鎢火山' })
    expect(tungsten?.geyser?.rateKgPerCycle).toEqual({ min: 200, max: 400 })
    expect(usedCategoryIds(index)).toContain(GEYSER_CATEGORY_ID)
  })

  it('separates worlds where a geyser is fixed from worlds that only pool it', () => {
    expect(tungsten?.worldIds.sort()).toEqual(['worlds/one', 'worlds/two'])
    expect(tungsten?.guaranteedWorldIds).toEqual(['worlds/one'])
    expect(byId.get(`${GEYSER_ID_PREFIX}steam`)?.guaranteedWorldIds).toEqual([])
  })

  it('finds geysers through the same search and category filters as materials', () => {
    expect(filterResources(index, { query: '鎢火山', category: 'all', locale: 'zh' }).map((r) => r.id))
      .toEqual([`${GEYSER_ID_PREFIX}molten_tungsten`])
    expect(filterResources(index, { query: '', category: GEYSER_CATEGORY_ID, locale: 'zh' })).toHaveLength(2)
  })

  it('routes geyser sources through the planet list, never the POI list', () => {
    const result = filterResourceSources(tungsten, geyserWorlds, [], { excludedKinds: new Set(), excludedDlcTags: new Set() })
    expect(result.worlds.map((w) => w.id).sort()).toEqual(['worlds/one', 'worlds/two'])
    expect(result.pois).toEqual([])
  })
})
