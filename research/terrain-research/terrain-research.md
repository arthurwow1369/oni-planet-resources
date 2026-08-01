# Oxygen Not Included Terrain Research

Baseline: U59-740622 as of 2026-08-01

This research follows the existing website's 26 zoneType terrain groups. It merges all 232 installed base/DLC subworld definitions into per-zone unions. A listed resource is possible in at least one installed variant, not guaranteed on every asteroid, seed, or DLC combination.

## How to read this

- Native means the extracted zone union contains the required starting element, plant, critter, or feature in at least one variant; it does not guarantee that every map seed contains it.
- Imported means the method requires material, seed, critter, infrastructure, or atmosphere not shown in that zone union.
- Finite means worldgen stock can be exhausted unless another renewable loop, geyser, meteor, care package, ranch, or rocket source is established.
- Radiation production applies only when Spaced Out radiation mechanics are enabled. In base-game-only play, radiation and radbolts are not applicable.
- Recommendations intentionally avoid exact per-cycle ratios unless the current U59 value was verified; beta-era community numbers are not promoted as stable facts.

## Terrain matrix

### Abyss Biome (`Abyss`)

Deep Aquatic biome with Galena, Basalt, Diamond, polluted brine, Glo Squid, Tublia, Pinpoket, Bulbloom, and Abyss vents/fissures depending on the generated world.

- DLC scopes seen: Aquatic Planet Pack
- Installed variant definitions: 2
- Elements: Basalt, Carbon, Diamond, Galena, MurkyBrine
- Flora and seed/propagule resources: Bulbloom, Tublia, Pinpoket
- Fauna: Glo Squid
- Forageables and other spawnables: None found
- Features: None listed

Food:
- Ranch or harvest Glo Squid for the Calamari food chain (native, mid, medium)
- Import a proven crop or compact food reserve before permanent settlement (imported, early, high)

Energy:
- Use finite Carbon/Coal only as a bridge (native-finite, early, high)
- Where a Thermal Gas Fissure exists, evaluate a heat-to-steam-turbine system after measuring its output cycle (seed-dependent-native-feature, late, medium)

Oxygen:
- Pipe or carry oxygen from an established system and use Breathing Stations for underwater work (imported, all, high)
- Process renewable vent liquids only after confirming the exact polluted-brine treatment chain (seed-dependent, mid, medium)

Radiation:
- Import Wheezewort or Shine Bugs, or use a powered Radiation Lamp; collect with a Radbolt Generator (imported-spaced-out, mid, high)

Attention:
- Deep flooding and long breath paths
- Thermal Gas Fissure heat
- Polluted Brine handling
- Marine Drill access and power
- No dependable native food or oxygen loop in every variant

Sources: `local-u59-assets`, `klei-aquatic-release-736649`, `klei-hotfix-737790`, `wiki-aquatic-pack`, `wiki-radiation`

### Barren / Regolith Biomes (`Barren`)

Sparse terrain whose installed variants can include regolith, metals, Coal, ice, and Shove Voles; exact composition differs strongly by asteroid and DLC variant.

- DLC scopes seen: Spaced Out!
- Installed variant definitions: 13
- Elements: Carbon, Cuprite, Dirt, DirtyIce, Fullerene, Granite, Graphite, Ice, IgneousRock, Iron, IronOre, MaficRock, Obsidian, Regolith, Rust, Vacuum, Water
- Flora and seed/propagule resources: None found in installed worldgen
- Fauna: Shove Vole
- Forageables and other spawnables: None found
- Features: expansion1::features/barren/GraniteCoalDeposit

Food:
- Contain and ranch Shove Voles for meat where they spawn (native-variant, mid, high)
- Import durable food or a crop because flora is absent (imported, early, high)

Energy:
- Use finite Coal deposits as bootstrap power (native-variant-finite, early, high)
- Use Solar Panels if the barren region is at or connected to exposed surface (location-dependent, mid, medium)

Oxygen:
- Melt native-variant ice where present and electrolyze the water, or pipe/import oxygen (native-variant-ice-or-imported, early-mid, high)

Radiation:
- Use nearby space exposure when accessible; otherwise import Wheezewort/Shine Bugs (location-dependent-spaced-out, mid, medium)

Attention:
- No native plants
- Shove Voles burrow through many materials and can escape
- Regolith fall and meteor exposure
- One installed HardDust biome reference has no matching lookup key and is flagged unresolved

Sources: `local-u59-assets`, `wiki-biome-overview`, `wiki-space`, `wiki-radiation`

### Beach Biome (`Beach`)

Aquatic starting terrain with Zinc Ore, algae, Oxylite, Sand, Salt, Sulfur, Gum Palm, Mussel Sprout, Sodicane, Husha Cups, Slogo, and Pokeshell variants.

- DLC scopes seen: Aquatic Planet Pack
- Installed variant definitions: 6
- Elements: Algae, CarbonDioxide, Dirt, OxyRock, Oxygen, Salt, Sand, SandStone, SiltStone, Sulfur, Water, ZincOre
- Flora and seed/propagule resources: Gum Palm, Mussel Sprout, Sodicane, Sodicane Seed, Husha Cups
- Fauna: Pokeshell, Slogo
- Forageables and other spawnables: None found
- Features: dlc5::features/beach/AirPocket, dlc5::features/beach/AlgaeBall, dlc5::features/beach/MediumFreshwaterLake, dlc5::features/beach/OxyliteCave, dlc5::features/beach/TinyFreshWaterLake

Food:
- Use finite Mussel Sprouts while establishing Sodicane farming and aquatic/critter food (native, early, high)
- Treat wild forage as a bridge, not a permanent calorie budget (native-finite, early, high)

Energy:
- Start with Manual Generators; transition to hydrogen from the water/oxygen system or import another fuel (mixed, early-mid, high)
- Do not plan on a native Tidal Turbine in Beach; official 735589 moved Tidal Springs to Reef (requires-reef, mid, high)

Oxygen:
- Use starting Oxylite and Algae Diffusers, then move to water electrolysis or a Reef Flue Coral/Blowter system (native-bridge-then-mixed, early-mid, high)

Radiation:
- Import Wheezewort or Shine Bugs; protect aquatic farms from unwanted heating/crowding rather than assuming a native source (imported-spaced-out, mid, high)

Attention:
- Tidal Spring advice for Beach is obsolete after 735589
- Flooding, Soggy Feet, breath and swim-skill limits
- Slogo/Pokeshell handling
- Limited dry building space
- Gum Palm and aquatic farming infrastructure costs

Sources: `local-u59-assets`, `klei-aquatic-hotfix-735589`, `klei-aquatic-release-736649`, `wiki-marinea`, `wiki-radiation`

### Marsh Biome (`BoggyMarsh`)

Classic Marsh terrain with Slime, Polluted Water/Oxygen, algae, Gold Amalgam, Dusk Caps, Thimble Reeds, Pacu, Pufts, and Slimelung risk.

- DLC scopes seen: Base game, Spaced Out!
- Installed variant definitions: 11
- Elements: Algae, CarbonDioxide, Clay, ContaminatedOxygen, DirtyWater, GoldAmalgam, IgneousRock, Sand, SandStone, SedimentaryRock, SlimeMold, Water
- Flora and seed/propagule resources: Thimble Reed Seed, Thimble Reed, Buddy Bud, Buddy Bud Seed, Dusk Cap, Dusk Cap Spore
- Fauna: Pacu, Puft
- Forageables and other spawnables: None found
- Features: features/hotmarsh/BlobRoom, features/hotmarsh/BlobSlushRoom, features/hotmarsh/LargeBlobRoomDry, features/hotmarsh/SandGeode, features/hotmarsh/TallRoom, features/hotmarsh/TallSlushRoom

Food:
- Grow Dusk Caps from Slime and ranch Pacu for food plus eggshell material (native, early-mid, high)

Energy:
- Import Coal or another fuel; use local polluted-water processing to support later hydrogen power (mixed, mid, medium)

Oxygen:
- Exploit polluted oxygen with Deodorizers while containing Slimelung; use algae or cleaned water/electrolysis for controlled output (native, early-mid, high)

Radiation:
- Import Shine Bugs or Wheezeworts; the marsh itself has no dependable native source (imported-spaced-out, mid, high)

Attention:
- Slimelung in Slime and polluted oxygen
- Polluted Water offgassing
- Puft and Pacu crowding
- Keep Thimble Reed water use within budget
- Deodorizer filtration-medium consumption

Sources: `local-u59-assets`, `wiki-biome-overview`, `wiki-radiation`

### Carrot Quarry Biome (`CarrotQuarry`)

Frosty Carrot Quarry terrain with Plume Squash, Bammoths, ice, iron ore, and some ethanol-bearing variants.

- DLC scopes seen: Frosty Planet Pack
- Installed variant definitions: 5
- Elements: CarbonDioxide, Ethanol, Ice, IgneousRock, IronOre, Oxygen, Sucrose
- Flora and seed/propagule resources: Plume Squash Plant, Plume Squash Seed
- Fauna: Bammoth
- Forageables and other spawnables: Lumen Quartz
- Features: dlc2::features/carrotquarry/IceBellyCave

Food:
- Farm Plume Squash and ranch Bammoths for renewable food and fiber outputs (native, early-mid, high)

Energy:
- Use finite Ethanol pockets carefully; establish imported renewable fuel or a connected Ceres wood/ethanol loop (native-variant-plus-imported, early-mid, medium)

Oxygen:
- Import Alveo Vera seeds from Ice Caves or melt ice for an electrolyzer (connected-frosty-biome, early-mid, high)

Radiation:
- Import Wheezewort or Shine Bugs (imported-spaced-out, mid, high)

Attention:
- Cold penalties
- Melting ice changes terrain and can flood work areas
- Bammoth ranch space and temperature
- Do not count finite ethanol as sustainable

Sources: `local-u59-assets`, `wiki-ice-cave`, `forum-ceres-start`, `wiki-radiation`

### Forest Biome (`Forest`)

Dry starting terrain with Aluminum Ore, Arbor Trees, Pips, Oxyferns, Mealwood, Shine Bugs, and little or no algae/Coal in typical Forest starts.

- DLC scopes seen: Base game, Spaced Out!
- Installed variant definitions: 22
- Elements: AluminumOre, CarbonDioxide, Dirt, DirtyWater, Ice, IgneousRock, OxyRock, Oxygen, Phosphorite, Snow, Water
- Flora and seed/propagule resources: Mealwood, Mealwood Seed, Hexalent, Arbor Tree, Arbor Acorn, Mirth Leaf, Mirth Leaf Seed, Oxyfern, Oxyfern Seed
- Fauna: Shine Bug, Pip
- Forageables and other spawnables: None found
- Features: expansion1::features/forest/OxyrockCave, expansion1::features/forest/SmallDirtyLake, features/forest/OxyfernCave, features/forest/PhosphoriteLump, features/forest/SmallFrozenLake, features/forest/SmallLake

Food:
- Use Hexalent forage briefly, then Mealwood; use Pips and Arbor Trees to improve long-term Dirt/wood sustainability (native, early, high)

Energy:
- Convert Arbor Tree lumber to Ethanol and burn it after the required production chain is built (native, mid, high)

Oxygen:
- Use Oxyferns only as a supplement; explore early for water and transition to an electrolyzer or imported algae (native-bridge-then-mixed, early-mid, high)

Radiation:
- Ranch native Shine Bugs and collect their ambient radiation with a Radbolt Generator (native-spaced-out, mid, high)

Attention:
- Oxyferns usually do not sustain a growing colony alone
- Water scarcity
- No typical native Coal/algae
- Ethanol chains produce heat and byproducts
- Pip planting requires controlled natural tiles

Sources: `local-u59-assets`, `wiki-biome-overview`, `wiki-shine-bug`, `wiki-radiation`

### Tundra / Frozen Biome (`FrozenWastes`)

Tundra/Frozen terrain containing ice, polluted ice, Sleet Wheat, Wheezewort, Wolframite, and sometimes Shove Voles.

- DLC scopes seen: Base game, Frosty Planet Pack, Spaced Out!
- Installed variant definitions: 12
- Elements: BleachStone, BrineIce, CarbonDioxide, CrushedIce, DirtyIce, Granite, Ice, IgneousRock, LiquidCarbonDioxide, LiquidOxygen, MaficRock, Oxygen, Regolith, Rust, Salt, SaltWater, Sand, SandStone, Snow, SolidCarbonDioxide, SolidChlorine, Wolframite
- Flora and seed/propagule resources: Wheezewort, Wheezewort Seed, Sleet Wheat, Sleet Wheat Grain
- Fauna: Shove Vole
- Forageables and other spawnables: None found
- Features: expansion1::features/frozen/RustShelf, expansion1::features/frozen/SaltShelf, expansion1::features/frozen/SlushPool, features/frozen/CO2Lake, features/frozen/ColdBubble, features/frozen/SandGeode

Food:
- Preserve wild Sleet Wheat initially, then farm it with temperature-controlled water plus Dirt from a connected or imported source (native-plant-plus-imported-or-connected-dirt, mid, high)
- Ranch Shove Voles where present (native-variant, mid, high)

Energy:
- Use imported fuel or exploit connected geothermal/vent power (imported-or-connected, mid, medium)

Oxygen:
- Use existing native Oxygen pockets only as a bridge, then melt ice for water electrolysis with careful heat management (native, mid, high)

Radiation:
- Use native Wheezeworts; wild planting avoids Phosphorite consumption while retaining radiation (native-spaced-out, early-mid, high)

Attention:
- Frostbite and cold work penalties
- Meltwater flooding and terrain collapse
- Wheezewort seeds are finite
- Domestic Wheezeworts consume Phosphorite
- Sleet Wheat heat sensitivity

Sources: `local-u59-assets`, `wiki-biome-overview`, `wiki-wheezewort`, `wiki-radiation`

### Ice Cave Biome (`IceCaves`)

Ceres starting terrain with ice/snow, Pikeapple, Flox, Alveo Vera, Sherberry, and Idylla.

- DLC scopes seen: Frosty Planet Pack
- Installed variant definitions: 7
- Elements: CarbonDioxide, Cinnabar, CrushedIce, Dirt, Ice, OxyRock, Oxygen, Phosphorite, Snow, SolidCarbonDioxide, Vacuum
- Flora and seed/propagule resources: Alveo Vera, Alveo Vera Seed, Pikeapple Bush, Pikeapple Bush Seed, Sherberry Plant, Idylla Flower, Idylla Seed
- Fauna: Flox
- Forageables and other spawnables: Sherberry
- Features: dlc2::features/icecaves/DirtDeposit, dlc2::features/icecaves/MetalBlob, dlc2::features/icecaves/OxyliteDeposit, dlc2::features/icecaves/SnowCave, features/forest/PhosphoriteLump

Food:
- Transition finite Sherberries to Pikeapple farming; ranch Floxes only after feed supply is stable (native, early, high)

Energy:
- Use Flox wood in an ethanol chain; bootstrap with Manual Generators and local finite fuels (native-plus-buildings, early-mid, high)

Oxygen:
- Farm Alveo Vera using Carbon Dioxide and Ice to produce Oxylite; later melt ice and electrolyze water (native, early-mid, high)

Radiation:
- Import a Wheezewort/Shine Bug source; Ice Cave flora itself does not provide dependable ambient radiation (imported-spaced-out, mid, high)

Attention:
- Cold Athletics penalties
- Warm Coats and insulated living areas
- Alveo Vera needs a managed CO2 supply
- Oxylite behavior can alter the local gas balance
- Heating liquefiable Snow/Ice can collapse large areas

Sources: `local-u59-assets`, `wiki-ice-cave`, `forum-ceres-start`, `wiki-radiation`

### Kelp Forest Biome (`KelpForest`)

Aquatic Kelp Forest with Polluted Water/Oxygen, Polluted Mud, Tower Kelp, Kelpoles, Orehulls, Thimble Reed, and Buddy Bud.

- DLC scopes seen: Aquatic Planet Pack
- Installed variant definitions: 3
- Elements: ContaminatedOxygen, Dirt, DirtyWater, Granite, IronOre, ToxicMud
- Flora and seed/propagule resources: Thimble Reed, Buddy Bud, Tower Kelp
- Fauna: Kelpole, Orehull
- Forageables and other spawnables: None found
- Features: None listed

Food:
- Use Tower Kelp/Kelpole Nori production and Orehull ranching as the native food foundation (native, early-mid, high)

Energy:
- Use Manual Generators first; clean polluted water for an electrolyzer/hydrogen loop or import power (native-plus-processing, mid, medium)

Oxygen:
- Deodorize existing polluted oxygen and process polluted water into a controlled oxygen system (native, early-mid, high)

Radiation:
- Import Wheezewort or Shine Bugs (imported-spaced-out, mid, high)

Attention:
- Flooded pathing and swimmer breath
- Polluted Water/Oxygen contamination
- Aquatic ranch pool-size requirements
- Orehull grooming/pathing fixes require current U59
- Thimble Reed can consume large water quantities

Sources: `local-u59-assets`, `klei-aquatic-release-736649`, `klei-hotfix-737790`, `wiki-u59-740622`, `wiki-marinea`, `wiki-radiation`

### Magma Biome (`MagmaCore`)

Lifeless extreme-heat terrain with Magma, Obsidian, Igneous Rock, and Neutronium; Abyssalite may surround regions but is not present in the extracted zone-element union.

- DLC scopes seen: Base game, Frosty Planet Pack, Spaced Out!
- Installed variant definitions: 11
- Elements: IgneousRock, Magma, Obsidian, Unobtanium, Vacuum
- Flora and seed/propagule resources: None found in installed worldgen
- Fauna: None found in installed worldgen
- Forageables and other spawnables: None found
- Features: None listed

Food:
- Do not farm here; import food and isolate any nearby ranch or farm thermally (imported, all, high)

Energy:
- Extract geothermal heat into a controlled steam chamber and Steam Turbines (native, late, high)

Oxygen:
- Use sealed Atmo Suit access and pipe oxygen from elsewhere (imported, mid-late, high)

Radiation:
- Import a radiation source; Magma is not a radiation generator (imported-spaced-out, late, high)

Attention:
- Scalding and instant heat transfer
- Magma leaks
- Vacuum breaks
- Material melting points
- Steam Turbines are not a free-power device without a heat source and controlled cooling

Sources: `local-u59-assets`, `wiki-biome-overview`, `wiki-radiation`

### Metallic Biome (`Metallic`)

Sparse metallic terrain with high-value ore variants and no dependable native flora or fauna.

- DLC scopes seen: Spaced Out!
- Installed variant definitions: 3
- Elements: AluminumOre, Carbon, Cobaltite, Dirt, GoldAmalgam, IgneousRock, OxyRock
- Flora and seed/propagule resources: None found in installed worldgen
- Fauna: None found in installed worldgen
- Forageables and other spawnables: None found
- Features: None listed

Food:
- Import compact long-life food or build a sealed imported farm (imported, all, high)

Energy:
- Use imported fuel, connected solar power, or local geothermal only when the asteroid layout supports it (location-dependent, mid-late, medium)

Oxygen:
- Consume finite Oxylite only as a landing reserve, then pipe oxygen or import water (native-finite-then-imported, early-mid, high)

Radiation:
- Use exposed space where available or import Wheezeworts/Shine Bugs (location-dependent-spaced-out, mid, medium)

Attention:
- No native biological loop
- High logistics dependence
- Finite Oxylite
- Surface vacuum and radiation
- Do not confuse valuable ore with renewable supply

Sources: `local-u59-assets`, `wiki-biome-overview`, `wiki-space`, `wiki-radiation`

### Moo Biome (`Moo`)

Extremely cold chlorine/methane terrain with Gas Grass and Gassy Moos.

- DLC scopes seen: Spaced Out!
- Installed variant definitions: 3
- Elements: BleachStone, Chlorine, Granite, IgneousRock, Methane, Vacuum
- Flora and seed/propagule resources: Gas Grass
- Fauna: Gassy Moo
- Forageables and other spawnables: None found
- Features: expansion1::features/moo/MooBubbleSmall, expansion1::features/moo/MooCaveLarge

Food:
- Do not rely on Gassy Moos as a self-replacing staple; import normal food production (imported, all, high)

Energy:
- Ranch Gassy Moos on Gas Grass for Natural Gas, with a backup because reproduction/supply is constrained (native, late, high)

Oxygen:
- Use Atmo Suits and imported oxygen; the biome has no native breathable-gas loop (imported, all, high)

Radiation:
- Use nearby space radiation if exposed; otherwise import a source (location-dependent-spaced-out, mid-late, medium)

Attention:
- Frostbite-level cold
- Chlorine atmosphere
- No native oxygen
- Gas Grass temperature/pressure
- Gassy Moo population and feed sustainability

Sources: `local-u59-assets`, `wiki-biome-overview`, `wiki-space`, `wiki-radiation`

### Ocean / Tide Pool Biome (`Ocean`)

Tide Pool/Ocean terrain with Salt Water or Brine, Salt, Fossil, Sedimentary Rock, Waterweed, Pokeshells, Pacu, and some Pincha Pepperplant variants.

- DLC scopes seen: Base game, Spaced Out!
- Installed variant definitions: 12
- Elements: BleachStone, Brine, BrineIce, CarbonDioxide, Fossil, Granite, Hydrogen, Ice, Oxygen, Salt, SaltWater, Sand, SedimentaryRock, Snow
- Flora and seed/propagule resources: Waterweed, Waterweed Seed, Pincha Pepperplant, Pincha Peppernut
- Fauna: Pokeshell, Pacu
- Forageables and other spawnables: None found
- Features: features/ocean/BleachLump, features/ocean/CrabPool, features/ocean/DeepPool, features/ocean/SaltCave, features/ocean/SlushPool

Food:
- Farm Waterweed for lettuce and ranch Pacu; use Pokeshell products primarily as industrial support (native, mid, high)

Energy:
- Desalinate or otherwise process water for electrolysis and capture hydrogen; treat this as power-consuming life support with a fuel byproduct, not free energy (native-plus-infrastructure, mid, high)

Oxygen:
- Process Salt Water/Brine to water and run an electrolyzer (native, mid, high)

Radiation:
- Import Wheezewort or Shine Bugs (imported-spaced-out, mid, high)

Attention:
- Large liquid masses and flooding
- Desalinator power and labor
- Waterweed liquid-temperature requirements
- Pokeshell aggression near eggs
- Preserve sedimentary rock if Stone Hatch morphs are desired

Sources: `local-u59-assets`, `wiki-biome-overview`, `wiki-radiation`

### Oily Biome (`OilField`)

Hot Oily terrain with Crude Oil, Lead, Fossil, Diamond features, Slicksters, and dangerous Sporechids.

- DLC scopes seen: Base game, Frosty Planet Pack, Spaced Out!
- Installed variant definitions: 14
- Elements: Carbon, CarbonDioxide, CrudeOil, Diamond, Fossil, Granite, IgneousRock, IronOre, Lead, Methane, Niobium, Obsidian, Sand, SolidCrudeOil
- Flora and seed/propagule resources: Jumping Joya, Jumping Joya Seed, Sporechid, Sporechid Seed
- Fauna: Slickster
- Forageables and other spawnables: Large Fossil Fragment, Small Fossil Fragment, OilWell
- Features: dlc2::features/oilpockets/DiamondCoalClump, features/oilpockets/Cavity, features/oilpockets/CavityOilFloatersTall, features/oilpockets/CavityPond, features/oilpockets/CavityPondFrozen, features/oilpockets/DiamondClump, features/oilpockets/DiamondClumpSmall, features/oilpockets/OilWell

Food:
- Ranch Slicksters for meat while converting colony CO2 to oil (native, mid, high)
- Import a heat-tolerant or insulated crop system (imported, mid, high)

Energy:
- Refine or boil Crude Oil to Petroleum; exploit Natural Gas where generated (native, mid-late, high)

Oxygen:
- Pipe oxygen through an Atmo Suit network; use imported or geyser water for electrolysis (imported, mid, high)

Radiation:
- Import a controlled radiation source (imported-spaced-out, mid-late, high)

Attention:
- Scalding temperatures
- Zombie Spores from Sporechids
- Petroleum/Natural Gas heat and CO2
- Lead overheat limits
- Oil reservoirs and wells require water and pressure management

Sources: `local-u59-assets`, `wiki-biome-overview`, `wiki-radiation`

### Garden Biome (`PrehistoricGarden`)

Temperate Garden terrain with Peat, Nickel Ore, Shale, Snactus, Sweatcorn, Ovagro, Lumbs, and Mimikas.

- DLC scopes seen: Prehistoric Planet Pack
- Installed variant definitions: 6
- Elements: Algae, CarbonDioxide, Dirt, Fertilizer, NickelOre, OxyRock, Oxygen, Peat, Shale, Water, dirt
- Flora and seed/propagule resources: Mimika Bud, Ring Rosebush, Ring Rose Seed, Sweatcorn Stalk, Sweatcorn Seed, Snactus, Ovagro, Ovagro Seed
- Fauna: Mimika, Lumb
- Forageables and other spawnables: Snac Fruit
- Features: dlc4::features/garden/AlgaeBall, dlc4::features/garden/ButterflyHome, dlc4::features/garden/NickelOreBall, dlc4::features/garden/SmallLake, dlc4::features/garden/StegoHome, dlc4::features/garden/Vines

Food:
- Use Snactus forage first, then Sweatcorn and fully developed Ovagro; use Lumb/Mimika effects to improve farms (native, early-mid, high)

Energy:
- Burn native Peat in a Peat Burner while developing a renewable secondary source (native-finite-unless-looped, early, high)

Oxygen:
- Use finite Oxylite/algae as bootstrap, then electrolyze local or connected water (native-bridge, early-mid, high)

Radiation:
- Import Wheezeworts or Shine Bugs (imported-spaced-out, mid, high)

Attention:
- Peat is not automatically renewable
- Mimika pollination layout
- Lumb harvesting/ranching behavior
- Ovagro footprint and full-growth planning
- Avoid consuming all starting Oxylite before replacement oxygen is online

Sources: `local-u59-assets`, `wiki-prehistoric-pack`, `wiki-garden`, `wiki-radiation`

### Feather Biome (`PrehistoricRaptor`)

Cold Feather terrain with Chlorine, Brine Ice, Rhex, Dartle, Megafrond, Dew Dripper, and Wheezewort.

- DLC scopes seen: Prehistoric Planet Pack
- Installed variant definitions: 2
- Elements: BleachStone, BrineIce, Chlorine, ChlorineGas, Granite, IgneousRock, IronOre, Katairite, Oxygen, Phosphorite
- Flora and seed/propagule resources: Wheezewort, Dew Dripper, Megafrond
- Fauna: Dartle, Rhexes
- Forageables and other spawnables: None found
- Features: dlc4::features/raptor/RaptorHabitat

Food:
- Build a Dartle-supported Rhex ranch; process tough Rhex meat before serving (native-complex, mid, high)

Energy:
- Import Peat, ethanol, or electrical supply; treat ranch outputs as food/fiber/resource loops rather than primary power until measured (imported, mid, medium)

Oxygen:
- Pipe oxygen into protected work zones or melt/process ice from connected cold terrain (mixed, mid, high)

Radiation:
- Use native Wheezeworts and collect with a Radbolt Generator (native-spaced-out, mid, high)

Attention:
- Rhex predation and prey delivery
- Overcrowding and hunting pathing
- Cold and chlorine exposure
- Megafrond chlorine conditions
- Beta ranch ratios are version-sensitive

Sources: `local-u59-assets`, `wiki-prehistoric-pack`, `wiki-feather`, `forum-rhex-ranch`, `wiki-wheezewort`

### Wetlands Biome (`PrehistoricWetlands`)

Warm polluted-water Wetlands with Seakomb, Lura Plant, Gnit, Pacu, Jawbo, Gold Amalgam, and organic industrial inputs.

- DLC scopes seen: Prehistoric Planet Pack
- Installed variant definitions: 2
- Elements: Algae, Dirt, DirtyWater, GoldAmalgam, IgneousRock, Obsidian, Oxygen, Sand, ToxicSand
- Flora and seed/propagule resources: Lura Plant, Seakomb, Seakomb Seed
- Fauna: Gnit, Pacu, Jawbo
- Forageables and other spawnables: Large Fossil Fragment, Small Fossil Fragment
- Features: dlc4::features/wetlands/LargeCave, dlc4::features/wetlands/MosquitoCave

Food:
- Ranch Pacu/Jawbo for seafood; protect supporting populations from uncontrolled predation (native, mid, high)

Energy:
- Process polluted water for an electrolyzer/hydrogen system or import Peat power from Garden (mixed, mid, medium)

Oxygen:
- Clean polluted water and electrolyze it; isolate polluted reservoirs and offgassing (native, mid, high)

Radiation:
- Import Wheezeworts or Shine Bugs (imported-spaced-out, mid, high)

Attention:
- Jawbo predation
- Lura Plant consumes flying critters
- Polluted Water and heat
- Seakomb processing chain
- Do not assume Amber/Resin or Phyto Oil is immediate food or power without processing

Sources: `local-u59-assets`, `wiki-prehistoric-pack`, `wiki-wetlands`, `klei-hotfix-737790`, `wiki-radiation`

### Radioactive Biome (`Radioactive`)

Cold Spaced Out terrain with Uranium Ore, Beeta Hives, Wheezeworts, Saturn Critter Traps, Tranquil Toes, and radiation hazards.

- DLC scopes seen: Spaced Out!
- Installed variant definitions: 6
- Elements: BleachStone, CarbonDioxide, Chlorine, ChlorineGas, Dirt, Ice, Rust, Snow, SolidCarbonDioxide, SolidChlorine, Sulfur, UraniumOre, Wolframite
- Flora and seed/propagule resources: Wheezewort, Wheezewort Seed, Saturn Critter Trap, Saturn Critter Trap Seed, Tranquil Toes, Tranquil Toes Seed
- Fauna: Beeta (via Beeta Hive), Shine Bug
- Forageables and other spawnables: None found
- Features: expansion1::features/radioactive/BeeBubble

Food:
- Use native Saturn Critter Traps only with imported or connected renewable Hydrogen and a critter-delivery plan; otherwise import food (native-plant-plus-imported-or-connected-hydrogen-and-critters, mid, medium)

Energy:
- Use Beetas to enrich Uranium and feed a properly cooled Research Reactor (native-spaced-out, late, high)

Oxygen:
- Melt ice and electrolyze water, or pipe oxygen through protected access (native-plus-infrastructure, mid, high)

Radiation:
- Use Wheezeworts for manageable early radbolts; use Beetas/Hives or a reactor only with shielding, access control, and automation (native-spaced-out, mid-late, high)

Attention:
- Beetas are aggressive even around suited workers
- Preserve Hives; they are strategically valuable and not normal replacements
- Natural uranium tiles radiate but debris does not equivalently radiate
- Lead Suit and exposure planning
- Reactor cooling and meltdown risk

Sources: `local-u59-assets`, `wiki-radioactive`, `wiki-radiation`, `wiki-wheezewort`

### Reef Biome (`Reef`)

Aquatic Reef with Salt Water, Coquina, Corallium, Zinc Ore, Flue Coral, Starnacle, Clampum, Waterweed, Beakon, Blowter, Seaquine, Sanishell, Tropical Pacu, and Tidal Springs.

- DLC scopes seen: Aquatic Planet Pack
- Installed variant definitions: 2
- Elements: Coquina, Corallium, Oxygen, Phosphorite, SaltWater, Sand, ZincOre
- Flora and seed/propagule resources: Clampum, Petta Pouf, Flue Coral, Flue Coral Seed, Starnacle, Waterweed
- Fauna: Sanishell, Tropical Pacu, Beakon, Blowter, Seaquine
- Forageables and other spawnables: None found
- Features: None listed

Food:
- Ranch aquatic critters for seafood and use Seaquine Ovolene for Caviar after infrastructure is stable (native, mid, high)

Energy:
- Install Tidal Turbines over native Tidal Springs; retain backup generation because output follows geyser activity (native-feature, mid, high)

Oxygen:
- Choose Flue Coral for direct farmed oxygen or Blowters for a combined oxygen-and-food ranch; measure current U59 inputs and output in game (native, mid, high)

Radiation:
- Import Wheezeworts or Shine Bugs (imported-spaced-out, mid, high)

Attention:
- Flue Coral light requirement was increased in 735589
- Salt Water, Lime/Phosphorite, Pearl and Wall Planter dependencies
- Starnacle uses backwall/Wall Planter mechanics
- Aquatic crowding is based on pool size
- Do not use beta oxygen ratios without current in-game verification
- Preserve natural backwalls until farm plans are final

Sources: `local-u59-assets`, `klei-aquatic-hotfix-735589`, `klei-aquatic-release-736649`, `klei-hotfix-737790`, `forum-flue-vs-blowter`, `forum-starnacle-planting`

### Rust Biome (`Rust`)

Cool Rust terrain with Rust, Salt Water, Iron Ore, Nosh Sprouts, Dasha Saltvines, Dreckos, Squeaky Pufts, and sometimes Wheezeworts/Ethanol features.

- DLC scopes seen: Base game, Spaced Out!
- Installed variant definitions: 8
- Elements: BleachStone, BrineIce, Carbon, CarbonDioxide, ChlorineGas, Cuprite, Dirt, Ethanol, IgneousRock, IronOre, MaficRock, Obsidian, OxyRock, Oxygen, Rust, Salt, SaltWater, Snow, SourGas, Sulfur
- Flora and seed/propagule resources: Nosh Sprout, Nosh Bean, Wheezewort, Dasha Saltvine, Dasha Saltvine Seed
- Fauna: Drecko, Squeaky Puft
- Forageables and other spawnables: None found
- Features: expansion1::features/rust/IceDeposit, features/rust/BigRock, features/rust/EthanolLake, features/rust/MiniBleachBall, features/rust/SaltDeposit, features/rust/SulfurHole

Food:
- Grow Nosh Sprouts only after securing variant-native or imported Ethanol and temperature control; ranch Dreckos for meat as a second path (native-variant-or-imported-ethanol, mid, high)

Energy:
- Use finite Ethanol pockets as a bridge; import lumber/ethanol or another sustainable fuel (native-variant-finite, early-mid, high)

Oxygen:
- Run Rust Deoxidizers using native Rust plus Salt, then plan a replacement before finite stocks run out (native-finite, early-mid, high)

Radiation:
- Use native-variant Wheezeworts where generated; otherwise import them (native-variant-spaced-out, mid, high)

Attention:
- Rust and Salt oxygen is finite without renewal
- Rust Deoxidizer produces Chlorine byproduct
- Nosh Sprouts need Ethanol and cold conditions
- Squeaky Puft and Drecko ranch gases
- Do not count feature Ethanol lakes as renewable

Sources: `local-u59-assets`, `wiki-biome-overview`, `wiki-wheezewort`, `wiki-radiation`

### Sandstone / Temperate Biome (`Sandstone`)

Temperate starting terrain rich in Water, Dirt, Algae, Coal, Copper Ore, Mealwood, Bristle Blossom, Hatches, and Shine Bugs.

- DLC scopes seen: Base game, Spaced Out!
- Installed variant definitions: 33
- Elements: Algae, Carbon, CarbonDioxide, Cuprite, Dirt, Fertilizer, Granite, Ice, IgneousRock, Iron, IronOre, MaficRock, Obsidian, OxyRock, Oxygen, Phosphorite, Sand, SandStone, Snow, Vacuum, Water
- Flora and seed/propagule resources: Buried Muckroot, Mealwood, Mealwood Seed, Bristle Blossom, Bristle Blossom Seed, Bluff Briar, Bluff Briar Seed
- Fauna: Hatch, Shine Bug
- Forageables and other spawnables: Muckroot
- Features: expansion1::features/sedimentary/CoalDeposit, expansion1::features/sedimentary/CoalDepositDense, expansion1::features/sedimentary/CopperBall, expansion1::features/sedimentary/DirtBall, expansion1::features/sedimentary/MetalVacuumBlobDense, expansion1::features/sedimentary/ParchedLake, expansion1::features/sedimentary/SmallAlgaeBall, expansion1::features/sedimentary/SmallDirtBall, expansion1::features/sedimentary/SmallMetalVacuumBlob, expansion1::features/sedimentary/TinyEmptyLake, expansion1::features/sedimentary/TinyLake, features/forest/PhosphoriteLump, features/sedimentary/FlatFrozenLake, features/sedimentary/FlatLake, features/sedimentary/MediumFrozenLake, features/sedimentary/MediumLake, features/sedimentary/MetalVacuumBlob, features/sedimentary/MetalVacuumBlobTall, features/sedimentary/SmallEmptyLake, features/sedimentary/SmallEmptyLakeTall, features/sedimentary/SmallFrozenLake, features/sedimentary/SmallLake, features/sedimentary/SmallLakeTall

Food:
- Use Muckroot briefly, then Mealwood or Bristle Blossom; ranch Hatches for barbecue and renewable Coal while feed lasts (native, early-mid, high)

Energy:
- Burn native Coal and use Hatch ranching to extend supply; transition to hydrogen or another renewable source before feed minerals become limiting (native, early-mid, high)

Oxygen:
- Use Algae Diffusers early, then electrolyze Water for sustained output (native, early-mid, high)

Radiation:
- Ranch native Shine Bugs around a Radbolt Generator (native-spaced-out, mid, high)

Attention:
- Algae, Coal, Dirt and Water are finite unless renewed
- Bristle Blossom water and light demand
- Hatch feed depletion
- Shine Bug crowding/escape
- Heat accumulation from power and oxygen infrastructure

Sources: `local-u59-assets`, `wiki-biome-overview`, `wiki-shine-bug`, `wiki-radiation`

### Space Biome (`Space`)

Most surface variants are vacuum-exposed terrain with regolith/mafic rock, meteors, solar access, Shove Voles, and ambient space radiation in Spaced Out; the installed Space zone union also contains border, Terra-surface, and module-interior definitions that are not all equivalent to open vacuum.

- DLC scopes seen: Base game, Frosty Planet Pack, Prehistoric Planet Pack, Aquatic Planet Pack, Spaced Out!
- Installed variant definitions: 23
- Elements: AluminumOre, CarbonDioxide, Dirt, Granite, IgneousRock, MaficRock, Oxygen, Regolith, Vacuum
- Flora and seed/propagule resources: Mealwood, Mealwood Seed, Hexalent, Arbor Tree, Mirth Leaf, Mirth Leaf Seed, Oxyfern
- Fauna: Ionizing Bug, Shove Vole, Pip
- Forageables and other spawnables: None found
- Features: None listed

Food:
- Ranch Shove Voles in escape-proof enclosures, or build sealed temperature-controlled farms behind backwalls (native-variant-or-imported, mid-late, high)

Energy:
- Use Solar Panels with meteor protection and energy storage (native-location, mid-late, high)

Oxygen:
- Use Atmo Suits and sealed backwalled rooms; pipe oxygen in and prevent space exposure from deleting it (imported, mid-late, high)

Radiation:
- Collect ambient space radiation directly with Radbolt Generators placed according to the planetoid's exposure level (native-spaced-out, mid-late, high)

Attention:
- Exposed gas and liquid deletion
- Meteors and falling regolith
- Solar intermittency
- Radiation exposure varies by planetoid
- Atmo Suit oxygen and airlock failure
- Drywall/backwall coverage

Sources: `local-u59-assets`, `wiki-space`, `wiki-radiation`

### Nectar Biome (`SugarWoods`)

Very cold Nectar terrain with Bonbon Trees, Spigot Seals, Shine Bugs, Ice/Snow, Phosphorite, and low-melting Mercury.

- DLC scopes seen: Frosty Planet Pack
- Installed variant definitions: 2
- Elements: Ice, Oxygen, Phosphorite, Snow, SolidMercury
- Flora and seed/propagule resources: Idylla Flower, Bonbon Tree
- Fauna: Shine Bug, Spigot Seal
- Forageables and other spawnables: None found
- Features: None listed

Food:
- Use Spigot Seal Tallow in supported food chains, but import a simpler staple crop for colony calories (native-plus-imported, mid, medium)

Energy:
- Feed Spigot Seals from Bonbon Trees for Ethanol; use Bonbon wood in a conventional ethanol chain as an alternative (native, mid, high)

Oxygen:
- Melt Ice/Snow and electrolyze Water, or import Alveo Vera from Ice Caves (native-plus-connected, mid, high)

Radiation:
- Ranch native Shine Bugs (native-spaced-out, mid, high)

Attention:
- Extreme cold and liquefiable terrain
- Bonbon Trees require strong light for full production
- Spigot Seal ranch scale and tree access
- Mercury melts at very low temperature
- Ethanol loop output is not free energy

Sources: `local-u59-assets`, `wiki-nectar`, `wiki-shine-bug`, `wiki-radiation`

### Swampy Biome (`Swamp`)

Spaced Out Swampy terrain with Mud, Polluted Water/Oxygen, Bog Buckets, Swamp Chard, Pacu, Plug Slugs, and useful metal/mineral variants.

- DLC scopes seen: Spaced Out!
- Installed variant definitions: 9
- Elements: CarbonDioxide, Cobaltite, ContaminatedOxygen, Dirt, DirtyWater, Fertilizer, Fossil, Graphite, IgneousRock, Mud, OxyRock, Oxygen, Phosphorite, Sand, SedimentaryRock, ToxicMud, ToxicSand, Water
- Flora and seed/propagule resources: Swamp Chard Plant, Bog Bucket, Bog Bucket Seed, Mellow Mallow, Mellow Mallow Seed
- Fauna: Pacu, Plug Slug
- Forageables and other spawnables: Swamp Chard
- Features: expansion1::features/swamp/AirPocket, expansion1::features/swamp/BigAirPocket, expansion1::features/swamp/DirtBall, expansion1::features/swamp/DirtBallSmall, expansion1::features/swamp/DirtyPool, expansion1::features/swamp/FreshwaterWell, expansion1::features/swamp/MetalCavern, expansion1::features/swamp/MetalCavernSmall, expansion1::features/swamp/PacuPool, expansion1::features/swamp/PacuPoolSmall, expansion1::features/swamp/SandClump, expansion1::features/swamp/ShallowPool, expansion1::features/swamp/StaterpillarHome

Food:
- Use Swamp Chard forage briefly, then Bog Bucket farming and Pacu ranching (native, early-mid, high)

Energy:
- Use Plug Slugs as early supplemental power with careful feed economics; do not assume their metal diet is free (native, early, high)

Oxygen:
- Convert Mud with a Sludge Press, use polluted oxygen plus Deodorizers, and later electrolyze cleaned water (native, early-mid, high)

Radiation:
- Import Wheezeworts or Shine Bugs (imported-spaced-out, mid, high)

Attention:
- Polluted oxygen and water
- Plug Slug feed cost and nighttime behavior
- Mud processing labor/power
- Bog Bucket water temperature
- Pacu pool management

Sources: `local-u59-assets`, `wiki-biome-overview`, `wiki-radiation`

### Jungle / Caustic Biome (`ToxicJungle`)

Caustic/Jungle terrain with Hydrogen, Chlorine, Phosphorite, Pincha Pepperplants, Balm Lilies, Dreckos, and Morbs.

- DLC scopes seen: Base game, Spaced Out!
- Installed variant definitions: 12
- Elements: Algae, BleachStone, Carbon, ChlorineGas, Hydrogen, IgneousRock, IronOre, Phosphorite, Sand, SandStone, Unobtanium, Void
- Flora and seed/propagule resources: Mirth Leaf, Mirth Leaf Seed, Pincha Pepperplant, Pincha Peppernut, Balm Lily, Balm Lily Seed
- Fauna: Drecko, Morb
- Forageables and other spawnables: None found
- Features: features/jungle/BleachRoom, features/jungle/SandGeode, features/jungle/SmallRoom

Food:
- Ranch Dreckos for meat and use Pincha Peppernuts as a high-tier food ingredient; import a staple-calorie crop (mixed, mid, high)

Energy:
- Capture finite native Hydrogen for a Hydrogen Generator, then transition to a renewable source (native-finite, early-mid, high)

Oxygen:
- Use Algae where the variant contains it or pipe oxygen through Atmo Suit access; do not open hydrogen/chlorine pockets into the base (native-variant-or-imported, early-mid, high)

Radiation:
- Import Wheezeworts or Shine Bugs (imported-spaced-out, mid, high)

Attention:
- Unbreathable Hydrogen/Chlorine layers
- Gas mixing when breached
- Drecko ranch atmosphere requirements
- Morbs and polluted oxygen
- High temperatures in some variants

Sources: `local-u59-assets`, `wiki-biome-overview`, `wiki-radiation`

### Wasteland Biome (`Wasteland`)

Spaced Out Sulfur/Wasteland terrain with Grubfruit, Sweetles, and mineral-rich but water-poor variants.

- DLC scopes seen: Spaced Out!
- Installed variant definitions: 3
- Elements: Cuprite, IgneousRock, MaficRock, OxyRock, Oxygen, Sand, SandStone, Snow, Sucrose, Sulfur
- Flora and seed/propagule resources: Bliss Burst, Bliss Burst Seed, Spindly Grubfruit Plant, Spindly Grubfruit Seed
- Fauna: Sweetle
- Forageables and other spawnables: None found
- Features: expansion1::features/wasteland/BeetleCave, expansion1::features/wasteland/BeetleCaveFrozen, expansion1::features/wasteland/MetalBlob, expansion1::features/wasteland/OxyliteBlob, expansion1::features/wasteland/SucroseBlob, expansion1::features/wasteland/WormPlantCave

Food:
- Farm Grubfruit and ranch Sweetles; evolve ranching toward Grubgrubs only if the current feed/output chain is sustainable (native, mid, high)

Energy:
- Import fuel or connect solar/geothermal power; native Sulfur supports biology but is not itself a direct generator fuel (imported-or-location-dependent, mid, high)

Oxygen:
- Use finite Oxylite pockets where generated, then import oxygen or water (native-variant-finite-then-imported, early-mid, high)

Radiation:
- Import Wheezeworts or Shine Bugs (imported-spaced-out, mid, high)

Attention:
- Water scarcity
- Sulfur and crop temperature requirements
- Sweetle/Grubgrub morph management
- Finite Oxylite
- Do not mistake Sulfur abundance for direct electrical power

Sources: `local-u59-assets`, `wiki-biome-overview`, `wiki-radiation`

## Known gaps

- Installed dlc/expansion1 moon_barren/DustCore.yaml references expansion1::biomes/Misc/HardDust, but that key is absent from the installed Misc.yaml lookup.
- Worldgen union data shows possible contents; per-seed occurrence and quantity require world or cluster seed evaluation.
- The 26 zoneType taxonomy is narrower than some wiki biome-category counts because game worldgen groups and public biome labels are not one-to-one.
- Exact U59 production rates, critter diets, crop inputs, and building throughput were deliberately omitted where no current primary or cross-checked source was captured.
- Community discussion is uneven across older terrains; it is used for caveats, not canonical resource lists.
- Radiation recommendations are not applicable without Spaced Out radiation mechanics.

## Source registry

- `local-u59-assets` — Locally installed Oxygen Not Included StreamingAssets (primary, current-installed-build): local source
- `klei-aquatic-public-test-731233` — Oxygen Not Included Update 731233 — Aquatic public testing (primary, historical-beta): https://forums.kleientertainment.com/game-updates/oni-alpha/731233-r2738/
- `klei-aquatic-hotfix-735589` — Oxygen Not Included Update 735589 (primary, recent-version-sensitive): https://forums.kleientertainment.com/game-updates/oni-alpha/735589-r2744/
- `klei-aquatic-release-736649` — Oxygen Not Included Update 736649 — Aquatic Planet Pack (primary, current-major-release): https://forums.kleientertainment.com/game-updates/oni-alpha/736649-r2750/
- `klei-hotfix-737790` — Oxygen Not Included Update 737790 (primary, current-version-sensitive): https://forums.kleientertainment.com/game-updates/oni-alpha/737790-r2757/
- `wiki-u59-740622` — Versions/U59-740622 (secondary-with-official-link, current): https://oxygennotincluded.wiki.gg/wiki/Versions/U59-740622
- `wiki-biome-overview` — Biome — Oxygen Not Included Wiki (secondary, mixed): https://oxygennotincluded.wiki.gg/wiki/Biome
- `wiki-ice-cave` — Ice Cave Biome (secondary, current-mechanics): https://oxygennotincluded.wiki.gg/wiki/Ice_Cave_Biome
- `wiki-nectar` — Nectar Biome (secondary, current-mechanics): https://oxygennotincluded.wiki.gg/wiki/Nectar_Biome
- `wiki-prehistoric-pack` — The Prehistoric Planet Pack (secondary, current-content-list): https://oxygennotincluded.wiki.gg/wiki/The_Prehistoric_Planet_Pack
- `wiki-garden` — Garden Biome (secondary, current-mechanics): https://oxygennotincluded.wiki.gg/wiki/Garden_Biome
- `wiki-feather` — Feather Biome (secondary, current-mechanics): https://oxygennotincluded.wiki.gg/wiki/Feather_Biome
- `wiki-wetlands` — Wetlands Biome (secondary, current-mechanics): https://oxygennotincluded.wiki.gg/wiki/Wetlands_Biome
- `wiki-aquatic-pack` — The Aquatic Planet Pack (secondary, current-content-list): https://oxygennotincluded.wiki.gg/wiki/The_Aquatic_Planet_Pack
- `wiki-marinea` — Marinea Asteroid (secondary-cross-checked, current): https://oxygennotincluded.wiki.gg/wiki/Marinea_Asteroid
- `wiki-radiation` — Radiation (secondary, current-mechanics): https://oxygennotincluded.wiki.gg/wiki/Radiation
- `wiki-wheezewort` — Wheezewort (secondary, current-mechanics): https://oxygennotincluded.wiki.gg/wiki/Wheezewort
- `wiki-shine-bug` — Shine Bug (secondary, current-mechanics): https://oxygennotincluded.wiki.gg/wiki/Shine_Bug
- `wiki-space` — Space Biome (secondary, current-mechanics): https://oxygennotincluded.wiki.gg/wiki/Space_Biome
- `wiki-radioactive` — Radioactive Biome (secondary, current-mechanics): https://oxygennotincluded.wiki.gg/wiki/Radioactive_Biome
- `forum-ceres-start` — Ceres start (advisory, older-but-practical): https://forums.kleientertainment.com/forums/topic/158405-ceres-start/
- `forum-flue-vs-blowter` — Blowter vs Flue Coral oxygen discussion (advisory, recent-but-version-sensitive): https://steamcommunity.com/app/457140/discussions/0/562534024812182981/
- `forum-starnacle-planting` — Wild planting Flue Coral, Starnacle and Clampum (advisory-cross-checked, recent): https://forums.kleientertainment.com/forums/topic/171813-wild-planting-flue-coral-starnacle-and-clampum/
- `forum-rhex-ranch` — Early Rhex ranch design and later balancing discussion (advisory, older-version-sensitive): https://forums.kleientertainment.com/forums/topic/165937-early-rhex-ranch-design/
