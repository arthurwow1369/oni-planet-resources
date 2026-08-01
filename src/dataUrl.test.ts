import { describe, expect, it } from 'vitest'
import { dataUrl } from './dataUrl'

describe('dataUrl', () => {
  it('places data below the configured deployment base', () => {
    expect(dataUrl('worlds.json', '/tools/oni-planet-resources/'))
      .toBe('/tools/oni-planet-resources/data/worlds.json')
  })

  it('normalizes missing and extra slashes', () => {
    expect(dataUrl('/stats.json', '/preview')).toBe('/preview/data/stats.json')
  })
})