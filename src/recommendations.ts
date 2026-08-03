import type { Resource, Subworld } from './types'

export type MainSourceCategory = 'food' | 'oxygen' | 'power' | 'radiation'

export interface MainSourceResource {
  simhash: string
  name_en: string
  name_zh: string
  terrainIds: string[]
}

export interface MainSourceRecommendation {
  category: MainSourceCategory
  available: boolean
  strategyId: string | null
  title_en: string
  title_zh: string
  description_en: string
  description_zh: string
  matchedResources: MainSourceResource[]
  terrainIds: string[]
  basis: 'potential-worldgen'
}

interface StrategyRule {
  category: MainSourceCategory
  id: string
  anyOf?: string[]
  allOf?: string[]
  title_en: string
  title_zh: string
  description_en: string
  description_zh: string
}

const rules: StrategyRule[] = [
  {
    category: 'food', id: 'pacu-ranching', anyOf: ['Pacu'],
    title_en: 'Pacu ranching', title_zh: '帕庫養殖',
    description_en: 'Use the local Pacu population as a renewable food chain once a stable ranch and feed supply are ready.',
    description_zh: '建立穩定魚舍與飼料供應後，可利用當地帕庫形成可再生食物鏈。',
  },
  {
    category: 'food', id: 'sleet-wheat-farm', anyOf: ['ColdWheat', 'ColdWheatSeed'],
    title_en: 'Cold-climate crop farm', title_zh: '低溫作物農場',
    description_en: 'The selected terrains contain a cold-climate crop candidate suitable for a managed food farm.',
    description_zh: '所選地形含有低溫作物候選，可規劃為受控的食物農場。',
  },
  {
    category: 'food', id: 'mushroom-farm', anyOf: ['MushroomPlant', 'MushroomSeed', 'Mushroom'],
    title_en: 'Mushroom farm', title_zh: '蘑菇農場',
    description_en: 'A mushroom crop is present; reserve a carbon-dioxide farming area and confirm its input supply.',
    description_zh: '此處有蘑菇作物候選；可預留二氧化碳農區，並先確認所需原料供應。',
  },
  {
    category: 'food', id: 'bristle-farm', anyOf: ['PrickleFlower', 'PrickleFlowerSeed', 'PrickleFruit'],
    title_en: 'Temperate crop farm', title_zh: '溫帶作物農場',
    description_en: 'A temperate edible crop candidate is present and can support a regular irrigated farm.',
    description_zh: '此處有溫帶食用作物候選，可規劃為常態灌溉農場。',
  },
  {
    category: 'food', id: 'bog-crop-farm', anyOf: ['SwampHarvestPlant', 'SwampHarvestPlantSeed'],
    title_en: 'Marsh crop farm', title_zh: '草澤作物農場',
    description_en: 'A marsh crop candidate is present; plan around its liquid and temperature requirements.',
    description_zh: '此處有草澤作物候選；農場設計需配合其液體與溫度需求。',
  },
  {
    category: 'food', id: 'bean-farm', anyOf: ['BeanPlant', 'BeanPlantSeed', 'BeanPlantSeedSparse'],
    title_en: 'Bean crop farm', title_zh: '豆類作物農場',
    description_en: 'A bean crop candidate is present and can become a specialized late-colony food source.',
    description_zh: '此處有豆類作物候選，可發展成殖民地後期的專門食物來源。',
  },
  {
    category: 'food', id: 'waterweed-farm', anyOf: ['SeaLettuce', 'SeaLettuceSeed', 'Lettuce'],
    title_en: 'Aquatic crop farm', title_zh: '水生作物農場',
    description_en: 'An aquatic edible crop candidate is present; verify the required liquid environment before scaling it.',
    description_zh: '此處有水生食用作物候選；擴建前應先確認所需液體環境。',
  },
  {
    category: 'food', id: 'pip-tree-chain', allOf: ['ForestTree', 'Squirrel'],
    title_en: 'Pip and arbor-tree food chain', title_zh: '樹鼠與喬木食物鏈',
    description_en: 'Both arbor trees and Pip-like critters are present, enabling a ranching and agriculture support chain.',
    description_zh: '此處同時有喬木與樹鼠類生物，可規劃養殖與農業支援鏈。',
  },
  {
    category: 'food', id: 'food-chain-input', anyOf: ['Water', 'Algae', 'Dirt', 'Sulfur', 'Phosphorite', 'Fertilizer', 'Salt', 'SaltWater', 'Brine'],
    title_en: 'Food-chain input only', title_zh: '僅有食物鏈原料',
    description_en: 'A useful agricultural input is present, but no direct edible crop or ranch source is confidently mapped in the selected terrains.',
    description_zh: '所選地形有可用農業原料，但目前未可靠對應到可直接生產食物的作物或養殖來源。',
  },
  {
    category: 'oxygen', id: 'water-electrolysis', anyOf: ['Water', 'SaltWater', 'Brine', 'Ice', 'Snow', 'DirtyIce', 'BrineIce'],
    title_en: 'Water-chain electrolysis', title_zh: '水資源鏈電解製氧',
    description_en: 'Recover clean water where needed, then use electrolysis as the scalable oxygen route.',
    description_zh: '必要時先將水源處理成淨水，再以電解作為可擴充的製氧路線。',
  },
  {
    category: 'oxygen', id: 'algae-oxygen', anyOf: ['Algae'],
    title_en: 'Algae oxygen production', title_zh: '藻類製氧',
    description_en: 'Use local algae for straightforward early oxygen production while preparing a renewable replacement.',
    description_zh: '可利用當地藻類供應前期氧氣，同時準備較可持續的替代方案。',
  },
  {
    category: 'oxygen', id: 'oxyfern-oxygen', anyOf: ['Oxyfern', 'OxyfernSeed'],
    title_en: 'Oxyfern oxygen garden', title_zh: '氧齒蕨製氧區',
    description_en: 'Oxyfern candidates can provide a low-throughput biological oxygen option when planted appropriately.',
    description_zh: '氧齒蕨候選可在適當種植後提供低流量的生物製氧方案。',
  },
  {
    category: 'oxygen', id: 'rust-deoxidizer', allOf: ['Rust', 'Salt'],
    title_en: 'Rust deoxidizer', title_zh: '除鏽機製氧',
    description_en: 'Use Rust with Salt input to produce Oxygen, Chlorine output, and Iron Ore; both mined inputs are finite unless replenished.',
    description_zh: '以鏽和鹽作為輸入，產出氧氣、氯氣與鐵礦；若無補充來源，兩種採掘原料都會耗盡。',
  },
  {
    category: 'oxygen', id: 'polluted-oxygen-chain', anyOf: ['SlimeMold', 'DirtyWater', 'ContaminatedOxygen'],
    title_en: 'Polluted-oxygen recovery chain', title_zh: '汙氧淨化鏈',
    description_en: 'Capture polluted oxygen from local materials and deodorize it; manage germs and pressure carefully.',
    description_zh: '可收集當地原料釋放的汙氧並除臭淨化；需妥善管理病菌與氣壓。',
  },
  {
    category: 'power', id: 'natural-gas-power', anyOf: ['Methane'],
    title_en: 'Natural-gas generation', title_zh: '天然氣發電',
    description_en: 'Natural gas is the strongest directly mapped generator fuel in the selected terrains; confirm a renewable supply before relying on it.',
    description_zh: '天然氣是所選地形中優先對應的發電燃料；作為主力前仍應確認可再生供應。',
  },
  {
    category: 'power', id: 'petroleum-power', anyOf: ['Petroleum', 'CrudeOil'],
    title_en: 'Petroleum power chain', title_zh: '石油發電鏈',
    description_en: 'Local oil-chain material supports high-output petroleum generation after refining and heat management.',
    description_zh: '當地油料可在精煉與熱管理後支援高輸出的石油發電。',
  },
  {
    category: 'power', id: 'geothermal-power', anyOf: ['Magma'],
    title_en: 'Geothermal power', title_zh: '地熱發電',
    description_en: 'Magma enables a long-lived geothermal plan if heat extraction and material limits are engineered safely.',
    description_zh: '若能安全設計取熱系統並控制材料溫度上限，岩漿可支援長期地熱方案。',
  },
  {
    category: 'power', id: 'hydrogen-power', anyOf: ['Hydrogen'],
    title_en: 'Hydrogen generation', title_zh: '氫氣發電',
    description_en: 'Use local hydrogen in dedicated generators, ideally as part of a balanced oxygen-production chain.',
    description_zh: '可用當地氫氣驅動專用發電機，最好與平衡的製氧鏈整合。',
  },
  {
    category: 'power', id: 'coal-power', anyOf: ['Carbon'],
    title_en: 'Coal generation', title_zh: '煤炭發電',
    description_en: 'Coal offers a simple early power source; monitor finite reserves and carbon-dioxide output.',
    description_zh: '煤炭可提供簡單的前期電力；需留意有限儲量及二氧化碳排放。',
  },
  {
    category: 'power', id: 'ethanol-power', anyOf: ['Ethanol', 'ForestTree'],
    title_en: 'Arbor-tree and ethanol chain', title_zh: '喬木與乙醇發電鏈',
    description_en: 'Arbor-tree or ethanol resources can support a renewable fuel chain with the required processing infrastructure.',
    description_zh: '喬木或乙醇資源可在具備處理設施後形成可再生燃料鏈。',
  },
  {
    category: 'power', id: 'uranium-power', anyOf: ['UraniumOre', 'EnrichedUranium'],
    title_en: 'Research-reactor power', title_zh: '研究反應爐發電',
    description_en: 'Uranium enables a late-game reactor route after enrichment, cooling, waste, and radiation controls are ready.',
    description_zh: '鈾可在濃縮、冷卻、廢料及輻射控制完成後支援後期反應爐發電。',
  },
  {
    category: 'radiation', id: 'uranium-radiation', anyOf: ['UraniumOre', 'EnrichedUranium', 'DepletedUranium'],
    title_en: 'Uranium radiation systems', title_zh: '鈾系輻射系統',
    description_en: 'Uranium is the strongest mapped route for reactor radiation and radbolt infrastructure.',
    description_zh: '鈾是目前對應最明確的反應爐輻射及輻射粒子基礎設施路線。',
  },
  {
    category: 'radiation', id: 'wheezewort-radiation', anyOf: ['ColdBreather', 'ColdBreatherSparse'],
    title_en: 'Wheezewort radiation garden', title_zh: '冰樹輻射區',
    description_en: 'A Wheezewort candidate can provide localized radiation for research when planted and fertilized.',
    description_zh: '冰樹候選在種植並施肥後，可提供研究所需的局部輻射。',
  },
  {
    category: 'radiation', id: 'shine-bug-radiation', anyOf: ['LightBug'],
    title_en: 'Shine-bug ranch', title_zh: '發光蟲養殖區',
    description_en: 'A Shine Bug candidate can supply a biological radiation source through controlled ranching.',
    description_zh: '發光蟲候選可透過受控養殖提供生物性輻射來源。',
  },
  {
    category: 'radiation', id: 'radioactive-materials', anyOf: ['Radium', 'Corium'],
    title_en: 'Radioactive material handling', title_zh: '放射性材料利用',
    description_en: 'Mapped radioactive material can support radiation projects, but requires strict containment and heat planning.',
    description_zh: '已對應的放射性材料可支援輻射工程，但需嚴格規劃隔離與熱管理。',
  },
  {
    category: 'radiation', id: 'helium-radiation', anyOf: ['Helium'],
    title_en: 'Helium radiation candidate', title_zh: '氦輻射候選',
    description_en: 'Helium is present as a mapped radiation-chain candidate; verify the relevant DLC production route before committing.',
    description_zh: '此處有氦的輻射鏈候選；投入建設前應先確認對應 DLC 的生產路線。',
  },
]

const categoryOrder: MainSourceCategory[] = ['food', 'oxygen', 'power', 'radiation']

interface IndexedResource {
  resource: Resource
  terrainIds: Set<string>
}

const unique = <T,>(values: T[]) => [...new Set(values)]

export function buildMainSourceRecommendations(terrains: Subworld[]): MainSourceRecommendation[] {
  const resourceIndex = new Map<string, IndexedResource>()

  terrains.forEach((terrain) => terrain.resources.forEach((resource) => {
    const indexed = resourceIndex.get(resource.simhash)
    if (indexed) {
      indexed.terrainIds.add(terrain.id)
    } else {
      resourceIndex.set(resource.simhash, { resource, terrainIds: new Set([terrain.id]) })
    }
  }))

  return categoryOrder.map((category) => {
    const rule = rules.find((candidate) => {
      if (candidate.category !== category) return false
      const hasAll = !candidate.allOf || candidate.allOf.every((id) => resourceIndex.has(id))
      const hasAny = !candidate.anyOf || candidate.anyOf.some((id) => resourceIndex.has(id))
      return hasAll && hasAny
    })

    if (!rule) {
      return {
        category,
        available: false,
        strategyId: null,
        title_en: '',
        title_zh: '',
        description_en: '',
        description_zh: '',
        matchedResources: [],
        terrainIds: [],
        basis: 'potential-worldgen',
      }
    }

    const matchedIds = unique([
      ...(rule.allOf ?? []),
      ...(rule.anyOf ?? []).filter((id) => resourceIndex.has(id)),
    ])
    const matchedResources = matchedIds.flatMap((id) => {
      const indexed = resourceIndex.get(id)
      if (!indexed) return []
      return [{
        simhash: indexed.resource.simhash,
        name_en: indexed.resource.name_en,
        name_zh: indexed.resource.name_zh,
        terrainIds: [...indexed.terrainIds],
      }]
    })

    return {
      category,
      available: true,
      strategyId: rule.id,
      title_en: rule.title_en,
      title_zh: rule.title_zh,
      description_en: rule.description_en,
      description_zh: rule.description_zh,
      matchedResources,
      terrainIds: unique(matchedResources.flatMap((resource) => resource.terrainIds)),
      basis: 'potential-worldgen',
    }
  })
}
