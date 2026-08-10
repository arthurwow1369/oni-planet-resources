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

export type GameCategoryId = string

export interface GameCategory {
  id: GameCategoryId
  name_en: string
  name_zh: string
}

export interface RepresentedEntity {
  id: string
  type: 'plant' | 'critter'
  name_en: string
  name_zh: string
  use_en: string
  use_zh: string
}

export interface ResourceRepresentative {
  id: string
  kind: 'seed' | 'egg' | 'spawn'
  isVirtual: boolean
  name_en: string
  name_zh: string
  entity: RepresentedEntity
  mechanism_en?: string
  mechanism_zh?: string
  sourceEvidence?: string
}

export interface Resource {
  simhash: string
  name_en: string
  name_zh: string
  type: 'solid' | 'liquid' | 'gas' | 'plant' | 'critter' | string
  categories: Category[]
  primaryCategory: GameCategoryId
  representative?: ResourceRepresentative
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
  temperatureRange?: string
  dlcTag: string
  resources: Resource[]
  features: string[]
}

export type SettlementClassification = 'recommended' | 'conditional' | 'outpost'
export type SettlementOperationMode =
  | 'settlement'
  | 'conditional-settlement'
  | 'extract-and-leave'
  | 'automated-outpost'
  | 'managed-outpost'
  | 'avoid'

export interface SpecialOperation {
  routeId: string
  routeName_en: string
  routeName_zh: string
  mode: 'extract-and-leave' | 'automated-outpost' | 'managed-outpost'
  label_en: string
  label_zh: string
  detail_en: string
  detail_zh: string
}

export interface SettlementAnalysis {
  classification: SettlementClassification
  recommendedMission: 'settlement' | 'conditional-settlement' | 'resource-expedition' | 'automated-resource-outpost' | 'managed-production-outpost' | 'no-resource-destination'
  operationMode: SettlementOperationMode
  specialOperations: SpecialOperation[]
  score: number
  summary_en: string
  summary_zh: string
  strengths_en: string[]
  strengths_zh: string[]
  risks_en: string[]
  risks_zh: string[]
  metrics: {
    hasWater: boolean
    hasOxygen: boolean
    hasFood: boolean
    hasPower: boolean
    comfortableTerrainRatio: number
    extremeTerrainRatio: number
    terrainCount: number
  }
}

export type GeyserShape = 'gas' | 'liquid' | 'molten'

export interface Geyser {
  id: string
  name_en: string
  name_zh: string
  element: string
  elementName_en: string
  elementName_zh: string
  desc_en: string
  desc_zh: string
  shape: GeyserShape
  temperatureC: number
  rateKgPerCycle: { min: number; max: number }
  maxPressureKg: number
  isGenericGeyser: boolean
  requiredDlcTags: string[]
}

export interface WorldGeyserPool {
  geyserIds: string[]
  draws: number
  allowDuplicates: boolean
  guaranteed: boolean
  isRandomSpawner: boolean
}

export interface WorldGeysers {
  fixed: Array<{ geyserId: string; count: number }>
  pools: WorldGeyserPool[]
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
  width: number
  height: number
  fixedTraits?: string[]
  seasons?: string[]
  clusterRoles: Array<'start' | 'warp' | 'general'>
  referencedByCluster: boolean
  internal: boolean
  specialResourceIds: string[]
  settlement?: SettlementAnalysis
  geysers?: WorldGeysers
}

export interface SpecialResourceRoute {
  id: string
  name_en: string
  name_zh: string
  stage_en: string
  stage_zh: string
  operations?: Array<{
    mode: 'extract-and-leave' | 'automated-outpost' | 'managed-outpost'
    label_en: string
    label_zh: string
    detail_en: string
    detail_zh: string
    requires_any_resource_ids?: string[]
    requires_any_guarantee_tokens?: string[]
  }>
  availability_en: string
  availability_zh: string
  production_en: string[]
  production_zh: string[]
  uses_en: string[]
  uses_zh: string[]
  attention_en: string[]
  attention_zh: string[]
  source_ids: string[]
}

export interface SpecialResourceSource {
  id: string
  title: string
  url: string
  kind: string
  accessed_at: string
}

export interface SpecialResourceData {
  schema_version: 1
  baseline: {
    as_of: string
    installed_game_version: string
    latest_public_checked: string
    scope_en: string
    scope_zh: string
  }
  routes: SpecialResourceRoute[]
  sources: SpecialResourceSource[]
}

export type BrowseMode = 'planets' | 'pois' | 'resources'

export type SpacePoiKind = 'harvestable' | 'artifact' | 'special'

export type SpacePoiCargo = 'solid' | 'liquid' | 'gas'

export interface SpacePoiRange {
  min: number
  max: number
}

export interface SpacePoiOutput {
  id: string
  name_en: string
  name_zh: string
  phase: SpacePoiCargo
  ratio: number
  temperatureC: number
  type: Resource['type']
  categories: Category[]
  primaryCategory: GameCategoryId
  use_en: string
  use_zh: string
}

export interface SpacePoiCollectible {
  id: string
  name_en: string
  name_zh: string
  detail_en: string
  detail_zh: string
}

export interface SpacePoiPlacement {
  clusterId: string
  clusterName_en: string
  clusterName_zh: string
  worldIds?: string[]
  allowedRings: SpacePoiRange
  numToSpawn: number
  canSpawnDuplicates: boolean
  guaranteedInGroup: boolean
}

export interface SpacePoi {
  id: string
  prefabId: string
  kind: SpacePoiKind
  name_en: string
  name_zh: string
  desc_en: string
  desc_zh: string
  dlcTag: string
  capacityRangeKg?: SpacePoiRange
  rechargeRangeKgPerCycle?: SpacePoiRange
  cargo: SpacePoiCargo[]
  outputs: SpacePoiOutput[]
  collectibles?: SpacePoiCollectible[]
  placements: SpacePoiPlacement[]
  strategic_en: string[]
  strategic_zh: string[]
  attention_en: string[]
  attention_zh: string[]
  strategicResourceIds: string[]
  source_ids: string[]
}

export interface SpacePoiSource {
  id: string
  title: string
  url: string
  kind: string
  accessed_at: string
}

export interface SpacePoiData {
  schema_version: 1
  baseline: {
    as_of: string
    installed_game_version: string
    scope_en: string
    scope_zh: string
    coordinatePolicy_en: string
    coordinatePolicy_zh: string
  }
  mechanics: {
    summary_en: string
    summary_zh: string
    recharge_en: string
    recharge_zh: string
    source_ids: string[]
  }
  pois: SpacePoi[]
  sources: SpacePoiSource[]
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
  sourceSimhashes: string[]
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
  | 'native-direct-gas'
  | 'native-direct-offgassing'
  | 'native-ingredient-plus-fauna'
  | 'native-manual-only'
  | 'native-plant-plus-critter'
  | 'native-plant-plus-imported-or-connected-dirt'
  | 'native-plant-plus-imported-or-connected-hydrogen-and-critters'
  | 'native-plus-buildings'
  | 'native-plus-connected'
  | 'native-plus-imported'
  | 'native-plus-infrastructure'
  | 'native-plus-one-building'
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
  | 'no-direct-native-route'
  | 'no-guaranteed-direct-native-fuel'
  | 'variant-or-imported'

export interface TerrainResearchBaseline {
  as_of: string
  game_version: string
  installed_steam_build_id: string
  latest_public_checked?: string
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

export interface TerrainResearchEntityProfile {
  prefab_id: string
  name_en: string
  name_zh: string
  kind: 'flora' | 'fauna'
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

export interface TerrainCostEfficiencyRating {
  rating: number
  best_method_index: number | null
  dependency_penalty: number
  stage_penalty: number
  confidence_penalty: number
  no_direct_native_route: boolean
}

export interface TerrainCostEfficiencyRatings {
  food: TerrainCostEfficiencyRating
  energy: TerrainCostEfficiencyRating
  oxygen: TerrainCostEfficiencyRating
  radiation: TerrainCostEfficiencyRating
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
  cost_efficiency_ratings: TerrainCostEfficiencyRatings
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
  schema_version: 3
  locale: 'zh-TW'
  terminology_source: string
  generated_at: string
  baseline: TerrainResearchBaseline
  scope_note: string
  scope_note_zh: string
  interpretation_rules: string[]
  interpretation_rules_zh: string[]
  cost_efficiency_rubric: {
    scale: { min: number; max: number }
    aggregation: 'best-usable-method'
    formula: string
  }
  entity_profiles: TerrainResearchEntityProfile[]
  zones: TerrainResearchZone[]
  sources: TerrainResearchSource[]
  known_gaps: string[]
  known_gaps_zh: string[]
}
