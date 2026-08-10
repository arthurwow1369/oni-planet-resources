import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { recommendationPhases } from '../plannerModel'
import type { Subworld, TerrainResearchData, TerrainResearchMethod } from '../types'
import { TerrainResearchPanel } from './TerrainResearchPanel'

const method = (stage: TerrainResearchMethod['stage'], method_zh: string): TerrainResearchMethod => ({
  method: method_zh,
  method_zh,
  stage,
  dependency: 'native',
  confidence: 'high',
})

const terrain: Subworld = {
  id: 'forest', name_en: 'Forest', name_zh: '森林', variant_en: 'Forest', variant_zh: '森林',
  zoneType: 'Forest', dlcTag: 'base', resources: [], features: [],
}

const research = {
  baseline: { game_version: 'U59-740622' },
  entity_profiles: [],
  sources: [],
  zones: [{
    zone_type: 'Forest', friendly_name: 'Forest', friendly_name_zh: '森林生態', summary: '', summary_zh: '',
    variant_count: 1, dlc_scopes: [], attention: ['Heat'], attention_zh: ['注意高溫'], source_ids: [],
    confidence: { worldgen: 'high-with-union-caveat', strategy: 'high unless a method is marked medium' },
    worldgen: {
      elements: [], flora: [], fauna: [], other_spawnables: [], features: [], features_localized: [],
      worldgen_warnings: [], worldgen_warnings_zh: [],
    },
    recommendations: {
      food: [method('early', '先採集六角果充飢'), method('mid', '建立米虱木農場')],
      energy: [method('early-mid', '以人力發電機啟動'), method('mid-late', '以木材直接供應木材燃燒器')],
      oxygen: [method('all', '保留野生氧氣蕨'), method('late', '建立長期供氧備援')],
      radiation: [method('mid', '以輻射粒子產生器收集環境輻射並產生輻射粒子')],
    },
    cost_efficiency_ratings: {
      food: { rating: 5, best_method_index: 0, no_direct_native_route: false },
      oxygen: { rating: 4, best_method_index: 0, no_direct_native_route: false },
      energy: { rating: 3, best_method_index: 0, no_direct_native_route: false },
      radiation: { rating: 2, best_method_index: 0, no_direct_native_route: false },
    },
  }],
} as unknown as TerrainResearchData

describe('TerrainResearchPanel', () => {
  it('maps every approved source stage into an early or repeatable presentation phase', () => {
    expect(recommendationPhases('all')).toEqual(['early', 'repeatable'])
    expect(recommendationPhases('early')).toEqual(['early'])
    expect(recommendationPhases('early-mid')).toEqual(['early', 'repeatable'])
    expect(['mid', 'mid-late', 'late'].map((stage) => recommendationPhases(stage as TerrainResearchMethod['stage']))).toEqual([['repeatable'], ['repeatable'], ['repeatable']])
  })

  it('uses survival needs as the outer hierarchy and terrain advice inside each need', () => {
    const markup = renderToStaticMarkup(
      <TerrainResearchPanel terrains={[terrain]} research={research} locale="zh" />,
    )

    expect(markup).toContain('初期／立即可用')
    expect(markup).toContain('中期／可重複及後續')
    expect(markup).toContain('先採集六角果充飢')
    expect(markup).toContain('以木材直接供應木材燃燒器')
    expect(markup).toContain('環境輻射來源')
    expect(markup).toContain('輻射粒子生產')
    expect(markup).toContain('目標產出')
    expect(markup).toContain('輸入／條件')
    expect(markup).toContain('可用期／耗竭限制')
    expect(markup).toContain('共通危險、限制與耗竭注意事項')
    expect(markup.match(/class="survival-category-card\b/g)).toHaveLength(4)
    expect(markup).not.toContain('class="terrain-research-grid"')

    const food = markup.indexOf('<strong>食物</strong>')
    const oxygen = markup.indexOf('<strong>氧氣</strong>')
    const energy = markup.indexOf('<strong>電力</strong>')
    const radiation = markup.indexOf('<strong>輻射</strong>')
    expect(food).toBeGreaterThan(-1)
    expect(food).toBeLessThan(oxygen)
    expect(oxygen).toBeLessThan(energy)
    expect(energy).toBeLessThan(radiation)

    const foodSection = markup.slice(food, oxygen)
    expect(foodSection).toContain('森林生態')
    expect(foodSection).toContain('成本效益 5/5')
    expect(foodSection).toContain('先採集六角果充飢')
    expect(foodSection).not.toContain('以人力發電機啟動')
    expect(foodSection.match(/class="survival-phase-group\b/g)).toHaveLength(2)
    expect(foodSection).toContain('class="terrain-method-source">森林生態</span>')
    expect(foodSection).not.toContain('class="terrain-research-card"')
    expect(foodSection.indexOf('初期／立即可用')).toBeLessThan(foodSection.indexOf('中期／可重複及後續'))
  })

  it('sorts terrain advice from highest to lowest cost-efficiency rating within each survival need', () => {
    const forestZone = research.zones[0]
    const lowFoodZone = {
      ...forestZone,
      zone_type: 'Barren',
      friendly_name: 'Barren',
      friendly_name_zh: '荒蕪生態',
      cost_efficiency_ratings: {
        ...forestZone.cost_efficiency_ratings,
        food: { rating: 2, best_method_index: 0, no_direct_native_route: false },
      },
    }
    const barrenTerrain = { ...terrain, id: 'barren', zoneType: 'Barren', name_en: 'Barren', name_zh: '荒蕪' }
    const ratingResearch = { ...research, zones: [lowFoodZone, forestZone] } as TerrainResearchData
    const markup = renderToStaticMarkup(
      <TerrainResearchPanel terrains={[barrenTerrain, terrain]} research={ratingResearch} locale="zh" />,
    )
    const food = markup.indexOf('<strong>食物</strong>')
    const oxygen = markup.indexOf('<strong>氧氣</strong>')
    const foodSection = markup.slice(food, oxygen)

    expect(foodSection.indexOf('森林生態')).toBeLessThan(foodSection.indexOf('荒蕪生態'))
    expect(foodSection).toContain('成本效益 5/5')
    expect(foodSection).toContain('成本效益 2/5')
  })
})
