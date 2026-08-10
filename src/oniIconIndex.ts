import iconIndex from '../public/data/icon-index.json'

type IconGroup = 'resources' | 'pois' | 'worlds' | 'geysers'
type IconEntry = { path?: string; url?: string; source_page_url?: string; file_title?: string }
type IconCatalog = Record<IconGroup, Record<string, IconEntry>>
const catalog = iconIndex as IconCatalog

/** A base-path-safe local icon URL, or undefined when no verified local PNG exists. */
export function oniIconUrl(group: IconGroup, id: string): string | undefined {
  const entry = catalog[group]?.[id]
  if (!entry) return undefined
  return entry.url ?? (entry.path ? `${import.meta.env.BASE_URL}${entry.path}` : undefined)
}

export function oniIconSourceUrl(group: IconGroup, id: string): string | undefined {
  return catalog[group]?.[id]?.source_page_url
}

export type { IconGroup }
