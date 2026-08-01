import type { AggregatedResource, Category, Locale, Resource, Subworld } from './types'

export type ResourceTone = 'plant' | 'fauna' | 'material'

export function aggregateTerrainResources(terrains: Subworld[], locale: Locale): AggregatedResource[] {
  const resources = new Map<string, AggregatedResource>()

  terrains.forEach((terrain) => terrain.resources.forEach((resource) => {
    const current = resources.get(resource.simhash)
    if (current) {
      if (!current.terrainIds.includes(terrain.id)) current.terrainIds.push(terrain.id)
    } else {
      resources.set(resource.simhash, { ...resource, terrainIds: [terrain.id] })
    }
  }))

  const displayName = (resource: Resource) =>
    locale === 'zh' ? resource.name_zh || resource.name_en : resource.name_en

  return [...resources.values()].sort((a, b) => displayName(a).localeCompare(displayName(b)))
}

export function presentationCategories(resource: Resource): Category[] {
  const categories = [...resource.categories]
  if (resource.type === 'plant') categories.push('plants')
  if (resource.type === 'critter') categories.push('fauna')
  return categories.length ? [...new Set(categories)] : ['uncategorized']
}

export function resourceTone(resource: Resource): ResourceTone {
  if (resource.type === 'plant') return 'plant'
  if (resource.type === 'critter') return 'fauna'
  return 'material'
}
