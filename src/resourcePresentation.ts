import type { AggregatedResource, GameCategory, Locale, Resource, Subworld } from './types'

export type ResourceTone = 'plant' | 'fauna' | 'material'

export function aggregateTerrainResources(terrains: Subworld[], locale: Locale): AggregatedResource[] {
  const resources = new Map<string, AggregatedResource>()

  terrains.forEach((terrain) => terrain.resources.forEach((resource) => {
    const displayResource = resource.representative
      ? {
          ...resource,
          simhash: resource.representative.id,
          name_en: resource.representative.name_en,
          name_zh: resource.representative.name_zh,
          type: resource.representative.entity.type,
        }
      : resource
    const current = resources.get(displayResource.simhash)
    if (current) {
      if (!current.terrainIds.includes(terrain.id)) current.terrainIds.push(terrain.id)
      if (!current.sourceSimhashes.includes(resource.simhash)) current.sourceSimhashes.push(resource.simhash)
    } else {
      resources.set(displayResource.simhash, {
        ...displayResource,
        terrainIds: [terrain.id],
        sourceSimhashes: [resource.simhash],
      })
    }
  }))

  const displayName = (resource: Resource) =>
    locale === 'zh' ? resource.name_zh || resource.name_en : resource.name_en

  return [...resources.values()].sort((a, b) => displayName(a).localeCompare(displayName(b)))
}

export function sortGameCategories(categories: GameCategory[], locale: Locale): GameCategory[] {
  return [...categories].sort((a, b) => {
    const left = locale === 'zh' ? a.name_zh || a.name_en : a.name_en
    const right = locale === 'zh' ? b.name_zh || b.name_en : b.name_en
    return left.localeCompare(right, locale === 'zh' ? 'zh-Hant' : 'en')
  })
}

export function effectiveGameCategory(
  activeCategory: GameCategory['id'] | 'all',
  availableCategories: GameCategory[],
): GameCategory['id'] | 'all' {
  return activeCategory === 'all' || availableCategories.some(({ id }) => id === activeCategory)
    ? activeCategory
    : 'all'
}

export function resourceMatchesQuery(resource: AggregatedResource, query: string): boolean {
  const representative = resource.representative
  const searchText = [
    resource.name_en,
    resource.name_zh,
    resource.simhash,
    ...resource.sourceSimhashes,
    representative?.id,
    representative?.name_en,
    representative?.name_zh,
    representative?.entity.id,
    representative?.entity.name_en,
    representative?.entity.name_zh,
  ].filter(Boolean).join(' ').toLowerCase()
  return searchText.includes(query.toLowerCase())
}

export function resourceTone(resource: Resource): ResourceTone {
  if (resource.type === 'plant') return 'plant'
  if (resource.type === 'critter') return 'fauna'
  return 'material'
}
