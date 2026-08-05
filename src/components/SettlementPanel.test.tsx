import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import worldsData from '../../public/data/worlds.json'
import type { SettlementAnalysis, World } from '../types'
import { SettlementPanel } from './SettlementPanel'

const worlds = worldsData as unknown as World[]

const analysisFor = (worldId: string): SettlementAnalysis => {
  const analysis = worlds.find((world) => world.id === worldId)?.settlement
  if (!analysis) throw new Error(`Missing settlement analysis for ${worldId}`)
  return analysis
}

describe('SettlementPanel', () => {
  it('renders a size-only conditional world without an import or engineering claim', () => {
    const analysis = analysisFor('dlc2::worlds/MiniShatteredGeoAsteroid')
    expect(analysis.metrics).toMatchObject({ hasWater: true, hasOxygen: true, hasFood: true, hasPower: true })

    const english = renderToStaticMarkup(<SettlementPanel analysis={analysis} locale="en" />)
    const chinese = renderToStaticMarkup(<SettlementPanel analysis={analysis} locale="zh" />)

    expect(english).toContain('Conditional settlement')
    expect(english).not.toMatch(/import|engineering/i)
    expect(chinese).toContain('有條件定居')
    expect(chinese).not.toMatch(/需(?:要)?輸入|工程支援/)
  })

  it('directly recommends extraction for an ordinary-resource outpost without a special-operation plan', () => {
    const analysis = analysisFor('worlds/TinySurface')
    expect(analysis.specialOperations).toEqual([])

    const markup = renderToStaticMarkup(<SettlementPanel analysis={analysis} locale="en" />)

    expect(markup).toContain('Short expedition — extract and leave')
    expect(markup).toContain('Ordinary terrain resources are identified')
    expect(markup).not.toMatch(/plan below|Special-resource operations/i)
  })

  it('renders the avoid label and no-target summary for an empty-resource outpost', () => {
    const analysis = analysisFor('worlds/BigEmpty')
    expect(analysis.specialOperations).toEqual([])

    const english = renderToStaticMarkup(<SettlementPanel analysis={analysis} locale="en" />)
    const chinese = renderToStaticMarkup(<SettlementPanel analysis={analysis} locale="zh" />)

    expect(english).toContain('Avoid — no resource target')
    expect(english).toContain('No settlement or extraction target was identified')
    expect(chinese).toContain('避開：無資源目標')
    expect(chinese).toContain('未找到定居或採集目標')
  })
})
