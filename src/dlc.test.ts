import { describe, expect, it } from 'vitest'
import { dlcLabel } from './dlc'

describe('dlcLabel', () => {
  it('uses official product names for every known internal DLC tag', () => {
    expect(dlcLabel('base')).toBe('Oxygen Not Included')
    expect(dlcLabel('expansion1')).toBe('Spaced Out!')
    expect(dlcLabel('dlc1')).toBe('Spaced Out!')
    expect(dlcLabel('dlc2')).toBe('The Frosty Planet Pack')
    expect(dlcLabel('dlc3')).toBe('The Bionic Booster Pack')
    expect(dlcLabel('dlc4')).toBe('The Prehistoric Planet Pack')
    expect(dlcLabel('dlc5')).toBe('The Aquatic Planet Pack')
  })

  it('supports compact base labels and case-insensitive internal aliases', () => {
    expect(dlcLabel('base', true)).toBe('Base Game')
    expect(dlcLabel('EXPANSION1')).toBe('Spaced Out!')
    expect(dlcLabel('DLC5')).toBe('The Aquatic Planet Pack')
  })
})
