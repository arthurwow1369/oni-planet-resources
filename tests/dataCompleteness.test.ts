import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const readJson = <T>(path: string): T => JSON.parse(readFileSync(path, 'utf8')) as T

type ResourceRecord = {
  simhash: string
  name_en: string
  name_zh: string
  type: string
  categories: string[]
  use_en: string
  use_zh: string
}

type Spawnable = { prefab_id: string }
type ExtractionStats = {
  uncataloguedCandidates: string[]
  unresolvedFeatures: string[]
}
type ResearchData = {
  entity_profiles: Array<{
    prefab_id: string
    summary_en: string
    summary_zh: string
    mechanics_url: string
    roles: string[]
  }>
  zones: Array<{
    worldgen: { flora: Spawnable[]; fauna: Spawnable[] }
    recommendations: Record<'food' | 'energy' | 'oxygen' | 'radiation', unknown[]>
    attention: string[]
  }>
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

  it('profiles every flora and fauna candidate with bilingual text and current mechanics links', () => {
    expect(research.entity_profiles).toHaveLength(123)
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
})
