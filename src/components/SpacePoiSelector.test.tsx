import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import type { SpacePoiData } from '../types'
import * as spacePoiModel from '../spacePoiModel'
import { filterSpacePois, groupPlacementsByCluster, spacePoiRingRange } from '../spacePoiModel'
import { SpacePoiDetail } from './SpacePoiDetail'
import { ResourceDetail } from './ResourceDetail'
import { SpacePoiSelector } from './SpacePoiSelector'
import { buildResourceIndex } from '../resourceIndex'
import type { World } from '../types'

const data: SpacePoiData = {
  schema_version: 1,
  baseline: {
    as_of: '2026-08-06',
    installed_game_version: 'U59-740622',
    scope_en: 'Space POIs a shipping cluster can generate, extracted from installed worldgen cluster files.',
    scope_zh: '由已安裝的星團世界生成檔擷取，列出星團可能生成的太空興趣點。',
    coordinatePolicy_en: 'Exact starmap coordinates are rolled per world seed and are not listed; only the ring range a cluster allows is shown.',
    coordinatePolicy_zh: '確切星圖座標由世界種子決定，本站不列出；僅顯示星團允許的環距範圍。',
  },
  mechanics: {
    summary_en: 'Harvest with a Drillcone and matching cargo modules.',
    summary_zh: '使用鑽頭前錐與對應貨艙採集。',
    recharge_en: 'Maximum mass and refill rate are randomized at world generation.',
    recharge_zh: '最大容量與回充率在世界生成時隨機決定。',
    source_ids: ['wiki-starmap'],
  },
  pois: [{
    id: 'HarvestableSpacePOI_GildedAsteroidField',
    prefabId: 'HarvestableSpacePOI_GildedAsteroidField',
    kind: 'harvestable',
    name_en: 'Gilded Asteroid Field',
    name_zh: '鍍金小行星礦場',
    desc_en: 'An asteroid field containing Gold, Fullerene, Regolith and more.',
    desc_zh: '含有金、富勒烯、浮土等資源的小行星帶。',
    dlcTag: 'expansion1',
    capacityRangeKg: { min: 30000, max: 45000 },
    cargo: ['solid'],
    outputs: [
      { id: 'SedimentaryRock', name_en: 'Sedimentary Rock', name_zh: '沉積岩', phase: 'solid', ratio: 45, temperatureC: 26.85, type: 'solid', categories: [], primaryCategory: 'BuildableRaw', use_en: 'Test use.', use_zh: '測試用途。' },
      { id: 'Gold', name_en: 'Gold', name_zh: '金', phase: 'solid', ratio: 25, temperatureC: 26.85, type: 'solid', categories: [], primaryCategory: 'BuildableRaw', use_en: 'Test use.', use_zh: '測試用途。' },
      { id: 'Fullerene', name_en: 'Fullerene', name_zh: '富勒烯', phase: 'solid', ratio: 10, temperatureC: -31, type: 'solid', categories: [], primaryCategory: 'BuildableRaw', use_en: 'Test use.', use_zh: '測試用途。' },
      { id: 'RefinedCarbon', name_en: 'Refined Carbon', name_zh: '精煉碳', phase: 'solid', ratio: 10, temperatureC: 26.85, type: 'solid', categories: [], primaryCategory: 'BuildableRaw', use_en: 'Test use.', use_zh: '測試用途。' },
      { id: 'Regolith', name_en: 'Regolith', name_zh: '浮土', phase: 'solid', ratio: 10, temperatureC: 26.85, type: 'solid', categories: [], primaryCategory: 'BuildableRaw', use_en: 'Test use.', use_zh: '測試用途。' },
    ],
    placements: [
      {
        clusterId: 'dlc5::clusters/AquaticSpacedOutCluster',
        clusterName_en: 'Aquatic Cluster',
        clusterName_zh: '水生星團',
        allowedRings: { min: 8, max: 11 },
        numToSpawn: 5,
        canSpawnDuplicates: false,
        guaranteedInGroup: true,
      },
      {
        clusterId: 'dlc5::clusters/AquaticSpacedOutCluster',
        clusterName_en: 'Aquatic Cluster',
        clusterName_zh: '水生星團',
        allowedRings: { min: 7, max: 11 },
        numToSpawn: 10,
        canSpawnDuplicates: true,
        guaranteedInGroup: false,
      },
    ],
    strategic_en: ['Fullerene is a renewable source for Super Coolant.'],
    strategic_zh: ['富勒烯是製造超級冷卻液的可再生來源。'],
    attention_en: ['Requires a Drillcone and solid cargo bay.'],
    attention_zh: ['需要鑽頭前錐與固體貨艙。'],
    strategicResourceIds: ['Fullerene'],
    source_ids: ['wiki-starmap', 'wiki-fullerene'],
  }, {
    id: 'TemporalTear',
    prefabId: 'TemporalTear',
    kind: 'special',
    name_en: 'Temporal Tear',
    name_zh: '時空裂縫',
    desc_en: 'A tear in space-time.',
    desc_zh: '時空中的裂縫。',
    dlcTag: 'expansion1',
    cargo: [],
    outputs: [],
    placements: [{
      clusterId: 'dlc5::clusters/AquaticSpacedOutCluster',
      clusterName_en: 'Aquatic Cluster',
      clusterName_zh: '水生星團',
      allowedRings: { min: 8, max: 11 },
      numToSpawn: 1,
      canSpawnDuplicates: false,
      guaranteedInGroup: true,
    }],
    strategic_en: ['End-game destination.'],
    strategic_zh: ['後期星圖目的地。'],
    attention_en: ['Requires the Temporal Tear Opener.'],
    attention_zh: ['需要時空裂縫開啟器。'],
    strategicResourceIds: [],
    source_ids: ['cluster-aquatic'],
  }],
  sources: [
    { id: 'wiki-starmap', title: 'Starmap (Spaced Out)', url: 'https://oxygennotincluded.wiki.gg/wiki/Starmap_(Spaced_Out)', kind: 'mechanics-reference', accessed_at: '2026-08-06' },
    { id: 'wiki-fullerene', title: 'Fullerene', url: 'https://oxygennotincluded.wiki.gg/wiki/Fullerene', kind: 'mechanics-reference', accessed_at: '2026-08-06' },
    { id: 'cluster-aquatic', title: 'AquaticSpacedOutCluster.yaml', url: 'local-game-data:dlc/dlc5/worldgen/clusters/AquaticSpacedOutCluster.yaml', kind: 'installed-game-data', accessed_at: '2026-08-06' },
  ],
}

describe('SpacePoiSelector', () => {
  const render = (selectedId: string) => renderToStaticMarkup(
    <SpacePoiSelector
      pois={data.pois}
      selectedId={selectedId}
      locale="zh"
      mode="pois"
      onSelect={() => {}}
      onModeChange={() => {}}
    />,
  )

  it('lists every POI with its localized name and ring range', () => {
    const markup = render('')

    expect(markup).toContain('鍍金小行星礦場')
    expect(markup).toContain('時空裂縫')
    expect(markup).toContain('環距 7–11')
  })

  it('offers the browse-mode switch as a labelled button group, not incomplete ARIA tabs', () => {
    const markup = render('')

    expect(markup).toContain('role="group"')
    expect(markup).not.toContain('role="tab"')
    expect(markup).toContain('星球')
    expect(markup).toContain('POI')
  })

  it('marks the selected POI as pressed and leaves the rest unpressed', () => {
    const markup = render('TemporalTear')

    expect(markup).toMatch(/class="poi-option selected" aria-pressed="true"[^>]*>(?:(?!aria-pressed)[\s\S])*?時空裂縫/)
    expect((markup.match(/class="poi-option[^"]*" aria-pressed="true"/g) ?? []).length).toBe(1)
  })

  it('keeps exact ratios and temperatures out of the list, which is a picker not a data table', () => {
    const markup = render('')

    expect(markup).not.toContain('45%')
    expect(markup).not.toContain('26.85°C')
  })
})

describe('SpacePoiDetail', () => {
  const categories = [
    { id: 'BuildableRaw', name_en: 'Buildable Raw', name_zh: '建材原料' },
    { id: 'RefinedMetal', name_en: 'Refined Metal', name_zh: '精煉金屬' },
  ]

  it('renders outputs as planet-style resource cards grouped by game category', () => {
    const markup = renderToStaticMarkup(<SpacePoiDetail data={data} poi={data.pois[0]} locale="zh" categories={categories} />)

    // Same markup contract the planet resource dashboard renders.
    expect(markup).toContain('category-section')
    expect(markup).toContain('resource-grid')
    expect(markup).toContain('resource-card')
    expect(markup).toContain('use-copy')
    expect(markup).toContain('建材原料')
    expect(markup).toContain('測試用途。')
  })

  it('marks strategic outputs on the card itself', () => {
    const markup = renderToStaticMarkup(<SpacePoiDetail data={data} poi={data.pois[0]} locale="zh" categories={categories} />)

    expect(markup).toContain('resource-card-strategic')
    expect((markup.match(/resource-card-strategic/g) ?? []).length).toBe(data.pois[0].strategicResourceIds.length)
  })

  it('renders the full composition on the right without needing a popover', () => {
    const markup = renderToStaticMarkup(<SpacePoiDetail data={data} poi={data.pois[0]} locale="zh" />)

    expect(markup).toContain('鍍金小行星礦場')
    expect(markup).toContain('45%')
    expect(markup).toContain('26.85°C')
    expect(markup).toContain('-31°C')
    expect(markup).toContain('富勒烯')
    expect(markup).toContain('確切星圖座標由世界種子決定')
  })

  it('renders structured collectible rewards for an artifact POI', () => {
    const artifact = {
      ...data.pois[1],
      collectibles: [{
        id: 'Artifact',
        name_en: 'Artifact',
        name_zh: '文物',
        detail_en: 'One recoverable artifact.',
        detail_zh: '可回收一件文物。',
      }, {
        id: 'DataBank',
        name_en: 'Data Bank',
        name_zh: '資料庫',
        detail_en: 'Recoverable research data.',
        detail_zh: '可回收的研究資料。',
      }],
    }
    const markup = renderToStaticMarkup(<SpacePoiDetail data={data} poi={artifact} locale="zh" />)

    expect(markup).toContain('可取得項目')
    expect(markup).toContain('文物')
    expect(markup).toContain('資料庫')
  })

  it('collapses placement groups into one row per cluster', () => {
    const markup = renderToStaticMarkup(<SpacePoiDetail data={data} poi={data.pois[0]} locale="zh" />)

    expect(markup).toContain('水生星團')
    expect(markup).toContain('環距 7–11')
    expect((markup.match(/水生星團/g) ?? []).length).toBe(1)
  })

  it('prompts for a selection instead of rendering an empty shell', () => {
    const markup = renderToStaticMarkup(<SpacePoiDetail data={data} poi={undefined} locale="zh" />)

    expect(markup).toContain('請從左側清單選擇一個太空興趣點')
    expect(markup).not.toContain('45%')
  })
})

describe('space POI filtering', () => {
  it('falls back to all outputs when the next POI lacks the selected category', () => {
    const resolveOutputCategory = (spacePoiModel as typeof spacePoiModel & {
      resolveOutputCategory?: (selected: string, available: string[]) => string
    }).resolveOutputCategory

    expect(resolveOutputCategory?.('RefinedMetal', ['BuildableRaw'])).toBe('all')
    expect(resolveOutputCategory?.('BuildableRaw', ['BuildableRaw'])).toBe('BuildableRaw')
  })

  it('spans every placement group when reducing a POI to one ring range', () => {
    expect(spacePoiRingRange(data.pois[0])).toEqual({ min: 7, max: 11 })
    expect(spacePoiRingRange(data.pois[1])).toEqual({ min: 8, max: 11 })
  })

  it('collapses repeated placement groups into one row per cluster', () => {
    const clusters = groupPlacementsByCluster(data.pois[0].placements)

    expect(clusters).toHaveLength(1)
    expect(clusters[0].allowedRings).toEqual({ min: 7, max: 11 })
    expect(clusters[0].guaranteed).toBe(true)
    expect(data.pois[0].placements[0].allowedRings).toEqual({ min: 8, max: 11 })
  })

  it('filters by kind, strategic value and localized search text without mutating the catalog', () => {
    expect(filterSpacePois(data.pois, { kind: 'harvestable', strategicOnly: true, query: '富勒烯', locale: 'zh' }).map((poi) => poi.id)).toEqual([
      'HarvestableSpacePOI_GildedAsteroidField',
    ])
    expect(filterSpacePois(data.pois, { kind: 'special', strategicOnly: false, query: '', locale: 'zh' }).map((poi) => poi.id)).toEqual(['TemporalTear'])
    expect(filterSpacePois(data.pois, { kind: 'all', strategicOnly: true, query: '', locale: 'zh' }).map((poi) => poi.id)).toEqual([
      'HarvestableSpacePOI_GildedAsteroidField',
    ])
    expect(data.pois).toHaveLength(2)
  })
})

describe('ResourceDetail source-kind chips', () => {
  const worlds = [{ id: 'worlds/one', name_en: 'One', name_zh: '一', dlcTag: 'base', subworldIds: [] }] as unknown as World[]
  const index = buildResourceIndex(worlds, [], data.pois, [])
  const noop = () => {}
  const render = (resourceId: string) => renderToStaticMarkup(
    <ResourceDetail
      resource={index.find((entry) => entry.id === resourceId)}
      worlds={worlds}
      pois={data.pois}
      categories={[]}
      locale="zh"
      selection={{ excludedKinds: new Set(), excludedDlcTags: new Set() }}
      onToggleKind={noop}
      onToggleDlcTag={noop}
      onResetSources={noop}
      onOpenWorld={noop}
      onOpenPoi={noop}
    />,
  )

  it('disables the planet chip for a resource that only comes from POIs', () => {
    // Fullerene is a POI-only output: no world in this fixture generates it.
    const markup = render('Fullerene')

    expect(markup).toMatch(/🪐[^<]*\(0\)/)
    expect((markup.match(/disabled=""/g) ?? []).length).toBe(1)
    expect(markup).toContain('此資源沒有這類來源')
  })

  it('leaves a chip enabled when the resource has that kind of source', () => {
    const markup = render('Fullerene')

    // The POI chip must stay usable: the fixture POI does yield Fullerene.
    expect(markup).toMatch(/⛏️[^<]*\(1\)/)
  })
})
