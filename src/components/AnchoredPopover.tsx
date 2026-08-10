import { useEffect, useId, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { calculatePopoverPosition, selectPopoverAnchor, type PopoverPosition } from '../popoverPosition'

interface Props {
  triggerLabel: ReactNode
  dialogLabel: string
  closeLabel: string
  children: ReactNode
  className?: string
  title?: string
}

export function AnchoredPopover({ triggerLabel, dialogLabel, closeLabel, children, className = '', title }: Props) {
  const dialogId = useId()
  const triggerRef = useRef<HTMLButtonElement>(null)
  const dialogRef = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(false)
  const [position, setPosition] = useState<PopoverPosition | null>(null)

  const updatePosition = () => {
    const trigger = triggerRef.current?.getBoundingClientRect()
    if (!trigger) return
    const resourceCard = triggerRef.current?.closest<HTMLElement>('.resource-card')?.getBoundingClientRect()
    const anchor = selectPopoverAnchor(trigger, resourceCard)
    setPosition(calculatePopoverPosition(anchor, { width: window.innerWidth, height: window.innerHeight }))
  }

  const close = (restoreFocus = false) => {
    setOpen(false)
    if (restoreFocus) triggerRef.current?.focus()
  }

  useEffect(() => {
    if (!open) return
    updatePosition()

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close(true)
    }
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node
      if (!dialogRef.current?.contains(target) && !triggerRef.current?.contains(target)) close()
    }
    const onViewportChange = () => updatePosition()

    document.addEventListener('keydown', onKeyDown)
    document.addEventListener('pointerdown', onPointerDown)
    window.addEventListener('resize', onViewportChange)
    window.addEventListener('scroll', onViewportChange, true)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.removeEventListener('pointerdown', onPointerDown)
      window.removeEventListener('resize', onViewportChange)
      window.removeEventListener('scroll', onViewportChange, true)
    }
  }, [open])

  useEffect(() => {
    if (open && position) dialogRef.current?.focus()
  }, [open, position])

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        className={`resource-popover-trigger ${className}`.trim()}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={dialogId}
        title={title}
        onClick={() => setOpen((value) => !value)}
      >
        {triggerLabel}
      </button>
      {open && position && typeof document !== 'undefined' && createPortal(
        <div
          ref={dialogRef}
          id={dialogId}
          role="dialog"
          aria-label={dialogLabel}
          aria-modal="false"
          tabIndex={-1}
          className="resource-card-popover"
          style={{ left: position.left, top: position.top, width: position.width, maxHeight: position.maxHeight }}
        >
          <div className="resource-popover-heading">
            <strong>{dialogLabel}</strong>
            <button type="button" aria-label={closeLabel} onClick={() => close(true)}>×</button>
          </div>
          <div className="resource-popover-body">{children}</div>
        </div>,
        document.body,
      )}
    </>
  )
}
