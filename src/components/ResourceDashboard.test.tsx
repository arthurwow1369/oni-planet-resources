import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import type { GameCategory, Subworld } from '../types'
import { ResourceDashboard } from './ResourceDashboard'

const categories: GameCategory[] = [
  { id: 'Seed', name_en: 'Seeds', name_zh: '種子' },
]

const terrains: Subworld[] = [{
  id: 'test-terrain',
  name_en: 'Test Terrain',
  name_zh: '測試生態區',
  variant_en: 'Default',
  variant_zh: '預設',
  zoneType: 'Test',
  dlcTag: 'base',
  features: [],
  resources: [{
    simhash: 'PrickleGrassSeed',
    name_en: 'Blossom Seed',
    name_zh: '花種子',
    type: 'plant',
    categories: [],
    primaryCategory: 'Seed',
    use_en: 'Produces Bristle Blossoms.',
    use_zh: '可種植刺花。',
    sources: ['biome'],
  }],
}]

describe('ResourceDashboard', () => {
  it('renders resources using the available in-game categories without crashing', () => {
    const markup = renderToStaticMarkup(
      <ResourceDashboard terrains={terrains} research={null} categories={categories} locale="zh" />,
    )

    expect(markup).toContain('花種子')
    expect(markup).toContain('種子')
    expect(markup).not.toContain('SURVIVAL PRIORITIES')
  })

  it('keeps represented organisms out of the fixed-height card and opens them from a popover trigger', () => {
    const representedTerrains: Subworld[] = [
      {
        ...terrains[0],
        resources: [{
          ...terrains[0].resources[0],
          representative: {
            id: 'PrickleGrassSeed', kind: 'seed', isVirtual: false,
            name_en: 'Blossom Seed', name_zh: '花種子',
            entity: {
              id: 'PrickleGrass', type: 'plant',
              name_en: 'Bristle Blossom', name_zh: '刺花',
              use_en: 'Produces Bristle Berries.', use_zh: '產出刺莓。',
            },
          },
        }],
      },
      {
        ...terrains[0],
        id: 'missing-terrain',
        name_en: 'Missing Terrain',
        name_zh: '無此資源生態區',
        zoneType: 'Missing',
        resources: [],
      },
    ]
    const markup = renderToStaticMarkup(
      <ResourceDashboard terrains={representedTerrains} research={null} categories={categories} locale="zh" />,
    )

    expect(markup).not.toContain('<details class="resource-card')
    expect(markup).toContain('aria-haspopup="dialog"')
    expect(markup).toContain('代表植物：刺花')
    expect(markup).toContain('刺花')
    expect(markup).not.toContain('產出刺莓。')
    expect(markup).toContain('配置涵蓋率 <strong>50%</strong>')
    expect(markup).not.toContain('class="coverage-list"')
  })

  it('clearly labels virtual spawn mechanisms as non-game objects', () => {
    const virtualTerrains: Subworld[] = [{
      ...terrains[0],
      resources: [{
        ...terrains[0].resources[0],
        representative: {
          id: 'spawn:GassyMoo', kind: 'spawn', isVirtual: true,
          name_en: 'Gassy Moo spawn mechanism', name_zh: '瓦斯牛生成機制',
          mechanism_en: 'Appears through a worldgen spawn point.',
          mechanism_zh: '由世界生成點直接產生。',
          entity: {
            id: 'GassyMoo', type: 'critter', name_en: 'Gassy Moo', name_zh: '瓦斯牛',
            use_en: 'Produces Natural Gas.', use_zh: '產生天然氣。',
          },
        },
      }],
    }]
    const markup = renderToStaticMarkup(
      <ResourceDashboard terrains={virtualTerrains} research={null} categories={categories} locale="zh" />,
    )

    expect(markup).toContain('非遊戲物件')
    expect(markup).toContain('由世界生成點直接產生。')
  })

  it('renders detailed planet-specific rare-resource chains before ordinary resource cards', () => {
    const markup = renderToStaticMarkup(
      <ResourceDashboard
        terrains={terrains}
        research={null}
        categories={categories}
        locale="zh"
        specialResources={[{
          id: 'niobium-thermium',
          name_en: 'Niobium → Thermium',
          name_zh: '鈮 → 超導體',
          stage_en: 'Late game',
          stage_zh: '後期／極端高溫',
          availability_en: 'Niobium source.',
          availability_zh: '超導小行星有原生鈮。',
          production_en: ['5 kg Niobium + 95 kg Tungsten = 100 kg Thermium.'],
          production_zh: ['5 公斤鈮 + 95 公斤鎢 = 100 公斤超導體。'],
          uses_en: ['Extreme heat buildings.'],
          uses_zh: ['可製作超高溫設備。'],
          attention_en: ['Reserve the first Niobium.'],
          attention_zh: ['保留最初取得的鈮。'],
          source_ids: ['wiki-niobium'],
        }]}
        specialResourceSources={[{
          id: 'wiki-niobium', title: 'Niobium', url: 'https://oxygennotincluded.wiki.gg/wiki/Niobium', kind: 'mechanics-reference', accessed_at: '2026-08-03',
        }]}
      />,
    )

    expect(markup).toContain('特殊／後期戰略資源')
    expect(markup).toContain('鈮 → 超導體')
    expect(markup).toContain('5 公斤鈮 + 95 公斤鎢 = 100 公斤超導體。')
    expect(markup).toContain('可製作超高溫設備。')
    expect(markup).toContain('保留最初取得的鈮。')
    expect(markup).toContain('href="https://oxygennotincluded.wiki.gg/wiki/Niobium"')
    expect(markup.indexOf('特殊／後期戰略資源')).toBeLessThan(markup.indexOf('種子'))
  })

  it('keeps planet-level strategic guidance visible after clearing all terrain selections', () => {
    const markup = renderToStaticMarkup(
      <ResourceDashboard
        terrains={[]}
        research={null}
        locale="zh"
        specialResources={[{
          id: 'iridium-demolior', name_en: 'Iridium', name_zh: '銥', stage_en: 'Timed event', stage_zh: '限時事件',
          availability_en: 'Event source.', availability_zh: '事件來源。', production_en: ['Defend.'], production_zh: ['完成防禦。'],
          uses_en: ['Hot buildings.'], uses_zh: ['高溫建築。'], attention_en: ['Timed.'], attention_zh: ['有時間限制。'], source_ids: [],
        }]}
      />,
    )

    expect(markup).toContain('特殊／後期戰略資源')
    expect(markup).toContain('銥')
    expect(markup).not.toContain('請至少選擇一個生態區')
  })
})
