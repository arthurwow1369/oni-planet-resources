import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'
import type { World } from '../types'
import { PlanetSelector } from './PlanetSelector'

const world = (id: string, name_en: string): World => ({
  id,
  name_en,
  name_zh: name_en,
  desc_en: '',
  desc_zh: '',
  dlcTag: 'expansion1',
  subworldIds: [],
  clusterExtensionSubworldIds: [],
  guarantees: [],
  width: 128,
  height: 153,
  clusterRoles: ['general'],
  referencedByCluster: true,
  internal: false,
  specialResourceIds: [],
})

describe('PlanetSelector', () => {
  const ceresWorlds: World[] = [
    { ...world('dlc2::worlds/CeresBaseGameAsteroid', 'Ceres'), name_zh: '穀神星', dlcTag: 'dlc2', width: 256, height: 384, clusterRoles: ['start'] },
    { ...world('dlc2::worlds/CeresClassicAsteroid', 'Ceres Classic'), name_zh: '穀神星', dlcTag: 'dlc2', width: 240, height: 380, clusterRoles: ['start'] },
    { ...world('dlc2::worlds/CeresSpacedOutAsteroid', 'Ceres Asteroid'), name_zh: '穀神星', dlcTag: 'dlc2', width: 160, height: 274, clusterRoles: ['start'] },
  ]

  it('shows three separate version buttons and no heading badge when all Ceres versions are selected', () => {
    const markup = renderToStaticMarkup(
      <PlanetSelector
        worlds={ceresWorlds}
        selectedId="dlc2::worlds/CeresBaseGameAsteroid"
        locale="zh"
        onSelect={vi.fn()}
      />,
    )

    expect(markup).not.toContain('class="dlc-badge"')
    expect(markup).toContain('<legend>內容包篩選</legend>')
    expect(markup).not.toContain('DLC 篩選')
    expect(markup).toContain('>起始 · <small>本體</small></button>')
    expect(markup).toContain('>起始 · <small>寒霜行星包</small></button>')
    expect(markup).toContain('>起始 · <small>太空拓荒</small></button>')
    expect(markup).toContain('title="起始｜256×384｜本體／特大型寬度｜所需內容：寒霜行星包')
    expect(markup).not.toContain('>起始 · 256×384')
    expect(markup).not.toContain('Base Game')
    expect(markup).not.toContain('<small>Classic 大型寬度</small>')
    expect(markup).not.toContain('<small>Spaced Out 標準寬度</small>')
    expect(markup).not.toContain('>The Prehistoric Planet Pack<')
  })

  it('moves the only selected version to the heading and leaves one plain Start button', () => {
    const baseMarkup = renderToStaticMarkup(
      <PlanetSelector
        worlds={ceresWorlds}
        selectedId="dlc2::worlds/CeresBaseGameAsteroid"
        initialSelectedDlcTags={['base']}
        locale="zh"
        onSelect={vi.fn()}
      />,
    )
    expect(baseMarkup).toContain('<span class="dlc-badge">本體</span>')
    expect(baseMarkup).toContain('>起始</button>')
    expect(baseMarkup).not.toContain('>起始 ·')
    expect(baseMarkup).not.toContain('CeresClassicAsteroid')
    expect(baseMarkup).not.toContain('CeresSpacedOutAsteroid')

    const frostyMarkup = renderToStaticMarkup(
      <PlanetSelector
        worlds={ceresWorlds}
        selectedId="dlc2::worlds/CeresClassicAsteroid"
        initialSelectedDlcTags={['dlc2']}
        locale="zh"
        onSelect={vi.fn()}
      />,
    )
    expect(frostyMarkup).toContain('<span class="dlc-badge">寒霜行星包</span>')
    expect(frostyMarkup).toContain('>起始</button>')
    expect(frostyMarkup).not.toContain('>起始 ·')
    expect(frostyMarkup).not.toContain('CeresBaseGameAsteroid')
    expect(frostyMarkup).not.toContain('CeresSpacedOutAsteroid')
  })

  it('shows two labeled buttons and no heading badge when two Ceres versions are selected', () => {
    const markup = renderToStaticMarkup(
      <PlanetSelector
        worlds={ceresWorlds}
        selectedId="dlc2::worlds/CeresBaseGameAsteroid"
        initialSelectedDlcTags={['base', 'dlc2']}
        locale="zh"
        onSelect={vi.fn()}
      />,
    )

    expect(markup).not.toContain('class="dlc-badge"')
    expect(markup).toContain('>起始 · <small>本體</small></button>')
    expect(markup).toContain('>起始 · <small>寒霜行星包</small></button>')
    expect(markup).not.toContain('>起始 · <small>太空拓荒</small></button>')
  })

  it('uses English tooltip punctuation while preserving the exact world ID', () => {
    const markup = renderToStaticMarkup(
      <PlanetSelector
        worlds={[{ ...world('expansion1::worlds/MiniFlippedWarp', 'Flipped Asteroid'), clusterRoles: ['warp'] }]}
        selectedId="expansion1::worlds/MiniFlippedWarp"
        locale="en"
        onSelect={vi.fn()}
      />,
    )

    expect(markup).toContain('title="Role: Warp | Horizontal width: 128 tiles | Full size: 128×153 | Moonlet / mini width. Starmap icon scale does not represent actual size.\nID: expansion1::worlds/MiniFlippedWarp"')
    expect(markup).not.toContain('Role：')
  })

  it('moves pack labels from the group heading to variants when one planet spans selected packs', () => {
    const markup = renderToStaticMarkup(
      <PlanetSelector
        worlds={[
          { ...world('base::worlds/SharedStart', 'Shared Planet'), name_zh: '共同行星', dlcTag: 'base', clusterRoles: ['start'] },
          { ...world('dlc4::worlds/SharedStart', 'Shared Planet'), name_zh: '共同行星', dlcTag: 'dlc4', clusterRoles: ['start'] },
        ]}
        selectedId="base::worlds/SharedStart"
        locale="zh"
        onSelect={vi.fn()}
      />,
    )

    expect(markup).not.toContain('class="dlc-badge"')
    expect(markup).toContain('>起始 · <small>本體</small></button>')
    expect(markup).toContain('>起始 · <small>史前行星包</small></button>')
  })

  it('marks planet families and only the exact variants that contain strategic resources', () => {
    const markup = renderToStaticMarkup(
      <PlanetSelector
        worlds={[
          { ...world('base::worlds/SharedStart', 'Shared Planet'), name_zh: '共同行星', dlcTag: 'base', clusterRoles: ['start'], specialResourceIds: [] },
          { ...world('dlc4::worlds/SharedStart', 'Shared Planet'), name_zh: '共同行星', dlcTag: 'dlc4', clusterRoles: ['start'], specialResourceIds: ['iridium-demolior'] },
        ]}
        selectedId="dlc4::worlds/SharedStart"
        locale="zh"
        onSelect={vi.fn()}
        specialResourceNames={{ 'iridium-demolior': '毀滅者事件 → 銥' }}
      />,
    )

    expect(markup).toContain('aria-label="含特殊／後期戰略資源：毀滅者事件 → 銥"')
    expect(markup).toContain('title="特殊／後期戰略資源：毀滅者事件 → 銥"')
    expect(markup).toContain('— 含特殊／後期戰略資源：毀滅者事件 → 銥"')
    expect(markup).toContain('>起始 · <small>本體</small></button>')
    expect(markup).toContain('>起始 · <small>史前行星包</small><span class="variant-special-marker"')
  })
})
