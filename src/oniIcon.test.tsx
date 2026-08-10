import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { OniIcon } from './oniIcon'
import { oniIconSourceUrl, oniIconUrl } from './oniIconIndex'

describe('ONI icon helper', () => {
  it('returns a base-path-safe local URL and recorded source for a resolved icon', () => {
    expect(oniIconUrl('resources', 'Water')).toBe(`${import.meta.env.BASE_URL}assets/oni-icons/resource-Water.png`)
    expect(oniIconSourceUrl('resources', 'Water')).toMatch(/^https:\/\/oxygennotincluded\.wiki\.gg\/wiki\/File:/)
  })

  it('renders the existing emoji if no downloaded icon is indexed', () => {
    const markup = renderToStaticMarkup(<OniIcon group="resources" id="missing" alt="Missing" fallback="◇" />)
    expect(markup).toContain('◇')
    expect(markup).not.toContain('<img')
  })

  it('returns verified base-path-safe local URLs for indexed world and geyser art', () => {
    expect(oniIconUrl('worlds', 'worlds/ForestDefault')).toBe(`${import.meta.env.BASE_URL}assets/oni-icons/world-worlds_ForestDefault.png`)
    expect(oniIconUrl('geysers', 'big_volcano')).toBe(`${import.meta.env.BASE_URL}assets/oni-icons/geyser-big_volcano.png`)
    expect(oniIconSourceUrl('worlds', 'worlds/ForestDefault')).toMatch(/^https:\/\/oxygennotincluded\.wiki\.gg\/wiki\/File:/)
  })

  it('accepts world and geyser groups without treating absent entries as URLs', () => {
    expect(oniIconUrl('worlds', 'not-a-world')).toBeUndefined()
    expect(oniIconSourceUrl('geysers', 'not-a-geyser')).toBeUndefined()
  })
})
