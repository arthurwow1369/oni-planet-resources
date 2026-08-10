const POPOVER_WIDTH = 320
const POPOVER_HEIGHT = 320
const VIEWPORT_MARGIN = 12
const OFFSET_X = 16
const OFFSET_Y = 32

interface AnchorRect {
  left: number
  top: number
  width: number
  height: number
}

interface ViewportSize {
  width: number
  height: number
}

export function selectPopoverAnchor(trigger: AnchorRect, resourceCard?: AnchorRect | null): AnchorRect {
  return resourceCard ?? trigger
}

export interface PopoverPosition {
  left: number
  top: number
  width: number
  maxHeight: number
}

export function calculatePopoverPosition(anchor: AnchorRect, viewport: ViewportSize): PopoverPosition {
  const width = Math.min(POPOVER_WIDTH, Math.max(220, viewport.width - VIEWPORT_MARGIN * 2))
  const maxLeft = Math.max(VIEWPORT_MARGIN, viewport.width - width - VIEWPORT_MARGIN)
  const maxTop = Math.max(VIEWPORT_MARGIN, viewport.height - POPOVER_HEIGHT - VIEWPORT_MARGIN)
  const left = Math.min(Math.max(VIEWPORT_MARGIN, anchor.left + OFFSET_X), maxLeft)
  const top = Math.min(Math.max(VIEWPORT_MARGIN, anchor.top + OFFSET_Y), maxTop)

  return {
    left,
    top,
    width,
    maxHeight: Math.max(120, Math.min(POPOVER_HEIGHT, viewport.height - top - VIEWPORT_MARGIN)),
  }
}
