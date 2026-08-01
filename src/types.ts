export type Locale = 'zh' | 'en'

export type Category =
  | 'food'
  | 'plants'
  | 'fauna'
  | 'oxygen'
  | 'power'
  | 'radiation'
  | 'lateGame'
  | 'industrial'
  | 'decoration'
  | 'hazard'
  | 'liquid'
  | 'gas'
  | 'uncategorized'

export interface Resource {
  simhash: string
  name_en: string
  name_zh: string
  type: 'solid' | 'liquid' | 'gas' | 'plant' | 'critter' | string
  categories: Category[]
  use_en: string
  use_zh: string
  weight?: number
  sources?: string[]
}

export interface Subworld {
  id: string
  name_en: string
  name_zh: string
  variant_en: string
  variant_zh: string
  zoneType: string
  dlcTag: string
  resources: Resource[]
  features: string[]
}

export interface World {
  id: string
  name_en: string
  name_zh: string
  desc_en: string
  desc_zh: string
  dlcTag: string
  subworldIds: string[]
  clusterExtensionSubworldIds: string[]
  guarantees: string[]
}

export interface Stats {
  worlds: number
  subworlds: number
  resources: number
  categorizedResources: number
  describedResources?: number
  translations: number
}

export interface AggregatedResource extends Resource {
  terrainIds: string[]
}

export type TerrainResearchStage = 'all' | 'early' | 'early-mid' | 'mid' | 'mid-late' | 'late'

export type TerrainResearchConfidence = 'high' | 'medium'

export type TerrainResearchDependency =
  | 'connected-frosty-biome'
  | 'imported'
  | 'imported-or-connected'
  | 'imported-or-location-dependent'
  | 'imported-spaced-out'
  | 'location-dependent'
  | 'location-dependent-spaced-out'
  | 'mixed'
  | 'native'
  | 'native-bridge'
  | 'native-bridge-then-mixed'
  | 'native-complex'
  | 'native-feature'
  | 'native-finite'
  | 'native-finite-then-imported'
  | 'native-finite-unless-looped'
  | 'native-location'
  | 'native-plant-plus-imported-or-connected-dirt'
  | 'native-plant-plus-imported-or-connected-hydrogen-and-critters'
  | 'native-plus-buildings'
  | 'native-plus-connected'
  | 'native-plus-imported'
  | 'native-plus-infrastructure'
  | 'native-plus-processing'
  | 'native-spaced-out'
  | 'native-variant'
  | 'native-variant-finite'
  | 'native-variant-finite-then-imported'
  | 'native-variant-ice-or-imported'
  | 'native-variant-or-imported'
  | 'native-variant-or-imported-ethanol'
  | 'native-variant-plus-imported'
  | 'native-variant-spaced-out'
  | 'requires-reef'
  | 'seed-dependent'
  | 'seed-dependent-native-feature'

export interface TerrainResearchBaseline {
  as_of: string
  game_version: string
  installed_steam_build_id: string
  terrain_taxonomy: string
}

export interface TerrainResearchDlcScope {
  id: 'base' | 'expansion1' | 'dlc2' | 'dlc4' | 'dlc5'
  name: string
}

export interface TerrainResearchElement {
  id: string
  name_en: string
  name_zh: string
}

export interface TerrainResearchSpawnable {
  prefab_id: string
  name: string
  kind: 'flora' | 'fauna' | 'other'
  spawn_tags: string[]
  mob_lookup_sources: string[]
  name_zh: string
}

export type TerrainResearchEntityRole =
  | 'food'
  | 'oxygen'
  | 'power'
  | 'radiation'
  | 'industrial'
  | 'decor'
  | 'hazard'

export interface TerrainResearchEntityProfile {
  prefab_id: string
  name_en: string
  name_zh: string
  kind: 'flora' | 'fauna'
  roles: TerrainResearchEntityRole[]
  summary_en: string
  summary_zh: string
  mechanics_url: string
  zones: string[]
  sources: {
    mechanics: string
    description_localization: string
  }
}

export interface TerrainResearchFeature {
  id: string
  name_en: string
  name_zh: string
}

export interface TerrainResearchWorldgen {
  elements: TerrainResearchElement[]
  flora: TerrainResearchSpawnable[]
  fauna: TerrainResearchSpawnable[]
  other_spawnables: TerrainResearchSpawnable[]
  features: string[]
  features_localized: TerrainResearchFeature[]
  worldgen_warnings: string[]
  worldgen_warnings_zh: string[]
}

export interface TerrainResearchMethod {
  method: string
  dependency: TerrainResearchDependency
  stage: TerrainResearchStage
  confidence: TerrainResearchConfidence
  method_zh: string
}

export interface TerrainResearchRecommendations {
  food: TerrainResearchMethod[]
  energy: TerrainResearchMethod[]
  oxygen: TerrainResearchMethod[]
  radiation: TerrainResearchMethod[]
}

export interface TerrainResearchZoneConfidence {
  worldgen: 'high-with-union-caveat'
  strategy: 'high unless a method is marked medium'
}

export interface TerrainResearchZone {
  zone_type: string
  friendly_name: string
  summary: string
  dlc_scopes: TerrainResearchDlcScope[]
  variant_count: number
  worldgen: TerrainResearchWorldgen
  recommendations: TerrainResearchRecommendations
  attention: string[]
  source_ids: string[]
  confidence: TerrainResearchZoneConfidence
  friendly_name_zh: string
  summary_zh: string
  attention_zh: string[]
}

export interface TerrainResearchSource {
  id: string
  title: string
  url: string | null
  kind: 'community-discussion' | 'content-reference' | 'mechanics-reference' | 'mechanics-strategy-reference' | 'official-release-notes' | 'primary-game-data' | 'version-reference' | 'worldgen-reference'
  published_at: string | null
  accessed_at: string | null
  version_scope: string
  reliability: 'advisory' | 'advisory-cross-checked' | 'primary' | 'secondary' | 'secondary-cross-checked' | 'secondary-with-official-link'
}

export interface TerrainResearchData {
  schema_version: 1
  locale: 'zh-TW'
  terminology_source: string
  generated_at: string
  baseline: TerrainResearchBaseline
  scope_note: string
  scope_note_zh: string
  interpretation_rules: string[]
  interpretation_rules_zh: string[]
  entity_profiles: TerrainResearchEntityProfile[]
  zones: TerrainResearchZone[]
  sources: TerrainResearchSource[]
  known_gaps: string[]
  known_gaps_zh: string[]
}
