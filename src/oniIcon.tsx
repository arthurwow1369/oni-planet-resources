import { useState } from 'react'
import { oniIconUrl, type IconGroup } from './oniIconIndex'

interface Props {
  group: IconGroup
  id: string
  alt: string
  fallback: string
  className?: string
}

/**
 * Uses a downloaded image when available. A failed local image immediately
 * becomes the existing emoji presentation, so no runtime network request occurs.
 */
export function OniIcon({ group, id, alt, fallback, className = '' }: Props) {
  const [failed, setFailed] = useState(false)
  const src = oniIconUrl(group, id)
  if (!src || failed) return <span className={`oni-icon oni-icon-fallback ${className}`.trim()} aria-hidden="true">{fallback}</span>
  return <img className={`oni-icon ${className}`.trim()} src={src} alt={alt} onError={() => setFailed(true)} />
}
