import { describe, expect, it } from 'vitest'
import { calculatePopoverPosition, selectPopoverAnchor } from '../popoverPosition'

describe('calculatePopoverPosition', () => {
  it('prefers the resource card rectangle over its small trigger rectangle', () => {
    const trigger = { left: 120, top: 390, width: 100, height: 28 }
    const card = { left: 100, top: 245, width: 260, height: 190 }

    expect(selectPopoverAnchor(trigger, card)).toEqual(card)
  })

  it('overlaps the clicked object with a small down-right displacement', () => {
    expect(calculatePopoverPosition(
      { left: 100, top: 80, width: 260, height: 190 },
      { width: 900, height: 700 },
    )).toMatchObject({ left: 116, top: 112 })
  })

  it('keeps the popover inside the viewport near the right and bottom edges', () => {
    const position = calculatePopoverPosition(
      { left: 760, top: 620, width: 130, height: 70 },
      { width: 900, height: 700 },
    )

    expect(position.left).toBeLessThanOrEqual(568)
    expect(position.top).toBeLessThanOrEqual(368)
    expect(position.maxHeight).toBeGreaterThan(0)
  })
})