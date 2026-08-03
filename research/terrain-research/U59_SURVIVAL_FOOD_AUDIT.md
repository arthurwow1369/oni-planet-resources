# ONI U59 Survival Food Audit

Status: research-only. Do not implement in the website until Arthur approves this package.

## 1. Evidence and version scope

Primary executable evidence is Arthur's installed macOS build:

- Update family: U59
- App version: 740622
- Steam build ID: 24423041
- Decompiled source: `Assembly-CSharp.dll`, checked against `TUNING/CROPS.cs`, `TUNING/FOOD.cs`, food-building configs and creature configs.

Latest-version check:

- The latest public U59 hotfix found during this audit is `U59-744825` (2026-07-28).
- The 744825 notes are bug-fix/stability focused; no food calorie, crop-duration, recipe-input or generator-rate rebalance was found in its notes.
- Therefore the 740622 executable values below remain the best locally reproducible mechanics baseline, but implementation metadata must say `U59 mechanics; local executable 740622; latest notes checked through 744825` rather than falsely claiming the local binary is 744825.

## 2. Ranking rule

### Early / immediate

Rank in this order:

1. revealed one-time forage;
2. mature or nearly mature wild edible crop;
3. direct hunting/death drop or cracked existing egg;
4. one low-tier food building using a local raw material;
5. domestic crop or ranch requiring only the native biome's temperature/medium;
6. any option requiring active cooling/heating, pressurization, artificial light or imported medium.

### Mid / repeatable

Include wild regrowth, domestic crops, preserved native habitat, ranching and one-building recipes. `Repeatable` does not mean infinite. Do not suppress a method because its Dirt/Water/etc. might be wanted elsewhere; show the direct consumption warning instead.

All wild plant growth is 25% of domestic growth (`CROPS.WILD_GROWTH_RATE_MODIFIER = 0.25`), so wild crop time is normally 4× the listed domestic duration.

## 3. Immediate one-time forage

These are always early-survival entries when their buried/revealed entity is present. They cannot be planted or propagated.

| Source | Food | kcal/unit | Use |
|---|---|---:|---|
| Buried Muckroot | Muckroot | 800 | earliest Sandstone emergency food |
| Hexalent | Hexalent Fruit | 6,400 | exceptionally large one-time Forest/Space cache |
| Swamp Chard Plant | Swamp Chard Heart | 2,400 | strong Swamp bridge food |
| Sherberry Plant | Sherberry | 800 | Frosty Ice Caves bridge food |
| Snactus | Garden forage fruit | 800 | Prehistoric Garden bridge food |
| Mussel Sprout | Mussel Tongue | 2,800 | Aquatic one-time forage; the plant uses `DigOnly` seed production and does not regrow |
| Printed Field Ration / map POI | Field Ration | 800 | non-renewable, very slow spoilage; not a terrain plant |

Attention:

- These must be labelled `finite forage`, never `crop` or `sustainable`.
- Buried-object presence is template/chance dependent; a biome can make the object possible without guaranteeing one in every seed.

## 4. Direct edible and ingredient crops

The following list comes from the U59 crop and food tuning, not from name heuristics.

| Plant / family | Product | Domestic duration and yield | Raw kcal | Native-biome use | Major requirement / warning |
|---|---|---:|---:|---|---|
| Mealwood | 1 Meal Lice | 3 cycles | 600 | easy early/mid temperate crop | consumes Dirt when domesticated; raw quality -1 |
| Bristle Blossom | 1 Bristle Berry | 6 cycles | 1,600 | strong native Sandstone option | requires light and Water |
| Bog Bucket | 1 Bog Jelly | 6.6 cycles | 1,840 | strong native Swamp option | Polluted Water; short 4-cycle spoil threshold |
| Dusk Cap | 1 Mushroom | 7.5 cycles | 2,400 | dark CO2 basin option | Slime fertilization; preserve CO2 atmosphere |
| Sleet Wheat | 18 grains | 18 cycles | ingredient only, 0 raw kcal | wild Frozen/Rust source is valid early/mid ingredient | domestic farm needs sustained sub-zero climate; do not rank high merely because the plant exists |
| Pincha Pepperplant | 4 Peppernuts | 8 cycles | ingredient only | native hot Toxic Jungle/Ocean spice | Polluted Water and hot environment |
| Waterweed | 12 Lettuce | 12 cycles | 400 each | wild/domes­tic Ocean/Reef seafood crop | Salt Water + Bleach Stone; seafood-radiation-resistance effect; spoils quickly |
| Nosh Sprout | 12 Nosh Beans | 21 cycles | ingredient only | cold Rust-biome ingredient | Ethanol and sub-zero environment; advanced as a domestic staple |
| Spindly Grubfruit | 1 Spindly Grubfruit | 4 cycles | 800 | simple Wasteland wild crop | Sulfur when domesticated |
| Grubfruit Plant | 8 Grubfruit | 8 cycles | 250 each | repeatable Wasteland crop | must be tended by Divergents for full plant; Sulfur |
| Saturn Critter Trap | 10 Plant Meat | 30 cycles | 1,200 each | Radioactive-biome specialty food/fuel route | consumes a critter; 4× slower when wild; do not present as quick food |
| Pikeapple Bush | 1 Pikeapple | 3 cycles | 800 | excellent native Frosty early/mid crop | must remain in cold native range; cook for higher quality |
| Plume Squash Plant | 1 Plume Squash | 9 cycles | 4,000 | high-calorie Frosty crop | longer cycle; native cold environment matters |
| Bonbon Tree branch | Nectar | 0.25 cycle, 20 kg per crop tick | not directly edible | power/industrial input, not food | exclude from food recommendations despite crop tuning entry |
| Alveo Vera | 36 kg Oxylite | 2 cycles | not edible | oxygen source | exclude from food; generated profile's `food` role was a false positive |
| Ovagro | 1 Ovagro Fig per producing branch | 3 cycles per branch | 325 | Prehistoric Garden option | multi-branch plant; do not multiply by an assumed branch count when terrain data only proves the mother plant |
| Megafrond | Fern Food | 9 cycles, 36 units | ingredient only | Prehistoric Raptor specialty ingredient | large plant/environment requirement; not immediate raw food |
| Mimika Bud | Mimillet seed/Butterfly interaction | 5-cycle plant event; raw seed has 0 kcal | ingredient only | Prehistoric Garden recipe route | only Toasted Mimillet is 1,500 kcal; do not present the plant or raw seed as immediately edible |
| Pinpoket | Urchin Meat | 16 cycles class | 7,200 | high-value Aquatic crop | slow; seafood radiation resistance |
| Sodicane | Salty Sticks | 4 cycles | 600 | Beach early/mid food | applies Thirsty effect; show hazard prominently |
| Tower Kelp + Kelpole | Kelpoles can be harvested for Nori | branch/organism ecology | Nori is ingredient-only, 0 raw kcal | Aquatic Kelp Forest recipe route | coupled plant-fauna source; the plant itself is not food |

False positives removed from food classification:

- Arbor Tree, Dasha Saltvine, Balm Lily, Bluff Briar, Wheezewort, Starnacle/Plankton Coral, Oxy Coral, Gum Palm, Tublia and Clampum are not edible merely because their code contains a crop or harvest product.
- Starnacle produces Phosphorite; Oxy Coral produces Oxygen; Alveo Vera produces Oxylite; Gum Palm produces Palm Wood; Tublia produces Polypropylene; Clampum produces Pearl. These belong in utilities/industrial guidance.
- Seakomb produces Kelp for Phyto Oil processing. Because using that processed oil in a food machine exceeds the direct one-active-converter policy, Seakomb is not a direct food recommendation.
- Seeds and duplicated planted/unplanted prefab IDs are not separate food methods.

## 5. Fauna food families

### Immediate wild hunting / incidental death

All accepted entries must use the actual death drop, not a generic `critter = Meat` rule.

| Family | Primary edible drop | Early interpretation | Repeatable interpretation |
|---|---|---|---|
| Hatch variants | Meat; Raw Egg from cracked eggs | easy local hunt on Sandstone | ranch for meat/eggs; coal is separately a power route |
| Drecko variants | Meat | wild hunt in Hydrogen/Chlorine jungle zones | ranch when atmosphere/feeding available |
| Pip variants | Meat | finite wild hunt | preserve Arbor Tree habitat/ranch |
| Puft variants | Meat | finite wild hunt | ranch primarily for material output; food is secondary |
| Slickster variants | Meat | hot-biome wild hunt | hot CO2 ranch; Molten Slickster's petroleum is separately a direct-fuel route |
| Pacu variants | Fish Fillet, 1,000 kcal/unit | excellent passive death/drop in existing water | starvation/tank ranching; seafood radiation resistance |
| Pokeshell/Sanishell variants | Shellfish Meat, 1,000 kcal/unit | hunt only if safe | dangerous/aggressive around eggs; ranching is primarily shell material |
| Shove Vole variants | Meat | high-value finite wild hunt | ranch is repeatable but containment is non-trivial |
| Shine Bug variants | Meat plus eggs | low-volume incidental food | ranch primarily for light/radiation; food is secondary |
| Plug Slug variants | Meat plus eggs | incidental Swamp food | ranch primarily for direct power/material; feeding changes output |
| Divergents (Sweetle/Grubgrub) | Meat plus eggs | Wasteland hunt | ranch also boosts Grubfruit growth |
| Gassy Moo | Meat | rare space-source food | no normal reproduction; Natural Gas output is usually the reason to keep it |
| Spigot Seal | Meat | Sugar Woods hunt | ranch for Ethanol; food secondary |
| Bammoth/Flox | Meat | Frosty wild food | ranch provides material/fuel co-products |
| Jawbo/Rhex/Lumb/Dartle | Dinosaur meat or special fillet family | Prehistoric local hunting | ranch only after native ecology is understood; Jawbo fillet has seafood effect |
| Glo Squid | Squid Meat, 800 kcal | Abyss aquatic hunt | ranch for current Aquatic food recipes |
| Blowter | Fish Fillet plus Oxygen output | Reef aquatic hunt | ranch can support both seafood and oxygen |
| Seaquine/Tropical Pacu and other Aquatic fish variants | fish/caviar family where defined | local aquatic food | preserve water chemistry; do not assume every aquatic critter drops generic Fish Fillet |
| Slogo/Orehull and other Aquatic non-fish | species-specific Meat/Shellfish only where prefab defines it | conditional | industrial product may be primary; use exact death drop |

Explicit exclusions:

- Morbs are not a food source; the generated role was a text-classifier false positive.
- Beetas/Beetinies are radiation/uranium workers, not food.
- Critter eggs are not inherently immediate food until cracked or processed. `Raw Egg` is 1,600 kcal and cooked egg is 2,800 kcal, but cracking sacrifices reproduction.
- Do not recommend killing a rare non-reproducing Gassy Moo as an ordinary staple.

## 6. Raw food values and preservation facts

Selected executable values:

| Food | kcal | quality | spoil class / note |
|---|---:|---:|---|
| Muckroot / basic forage | 800 | -1 | cannot rot in tuning |
| Hexalent Fruit | 6,400 | -1 | cannot rot in tuning |
| Swamp Chard Heart | 2,400 | -1 | cannot rot in tuning |
| Sherberry/Snactus | 800 | -1 | cannot rot in tuning |
| Meal Lice | 600 | -1 | normal spoilage |
| Bristle Berry | 1,600 | 0 | normal spoilage |
| Bog Jelly | 1,840 | 0 | quick spoilage |
| Mushroom | 2,400 | 0 | normal spoilage |
| Raw Meat | 1,600 | -1 | normal spoilage |
| Raw Egg | 1,600 | -1 | normal spoilage |
| Fish/Shellfish Fillet | 1,000 | 2 | quick spoilage; seafood radiation resistance |
| Plant Meat | 1,200 | 1 | quick spoilage |
| Pikeapple | 800 | -1 | slow spoilage |
| Plume Squash | 4,000 | 0 | slow spoilage |
| Mussel Tongue | 2,800 | -1 | cannot rot in tuning |
| Urchin Meat | 7,200 | 3 | quick spoilage; seafood radiation resistance |
| Sodicane Salty Sticks | 600 | -1 | slow spoilage; Thirsty effect |

## 7. Direct material-to-food machinery

### Accepted one-building emergency recipe

`Microbe Musher: Dirt + Water/Mucus -> Mush Bar`

Executable values:

- 75 kg Dirt + 75 kg Water or Mucus
- output: 1 Mush Bar, 800 kcal
- 40 s fabrication
- building: 240 W, 2 kDTU/s self heat, 0.5 kDTU/s exhaust heat
- Mush Bar spawns 1,000 Food Poisoning germs

Classification: `early emergency only`, never the preferred normal staple. Warning must mention severe Dirt/Water consumption and disease contamination. It remains visible even though other farms might also need Dirt; no shared-budget optimization is performed.

### Other Microbe Musher recipes

These are valid one-building food recipes but require farmed/animal ingredients rather than terrain material alone:

- 2 Meal Lice + 50 kg Water/Mucus -> 1 Liceloaf, 1,700 kcal
- 6 Nosh Beans + 50 kg Water -> 1 Tofu, 3,600 kcal
- 5 Sleet Wheat Grain or Megafrond Grain + 1 Bristle Berry or 2 Pikeapple -> 1 Berry Sludge, 4,000 kcal
- 1 Meat + 1 Tallow -> 1 Pemmican, 2,600 kcal; Frosty DLC

Fish Food output is not Duplicant food and must not be shown as a survival-food recipe.

### Cooking buildings

Electric Grill, Gas Range, Deep Fryer, Smoker and Sushi Bar improve ingredients or combine them, but they are not independent terrain sources. The website should:

- rank the raw/wild source first;
- show the best directly available one-building preparation as an optional child step;
- never claim cooked kcal without all required ingredients;
- show fuel/power requirement and any DLC restriction.

Important current Aquatic foods present in U59 tuning:

- Edamame: 1,450 kcal, quality 3
- Maki: 3,600 kcal, quality 4, seafood radiation resistance
- Nigiri: 3,600 kcal, quality 5, seafood radiation resistance
- Squid Meat: 800 kcal, quality 2
- Urchin Meat: 7,200 kcal, quality 3
- Mussel Tongue: 2,800 kcal, non-rotting
- Nori and Caviar are ingredient-only (0 raw kcal)

## 8. Terrain-specific recommendation rules

For each terrain/subworld:

1. display finite forage actually present in its template;
2. display natural wild edible plants present, with current maturity unknown until map reveal;
3. display exact fauna death drop and danger;
4. display domestication only if the terrain's native temperature and medium overlap the entity's live/growth range;
5. display material recipes only if the raw input is present locally;
6. mark `one-time`, `wild recurring`, `domestic recurring`, or `ingredient only`;
7. never infer a plant/critter from the overall cluster or another asteroid;
8. Start/Warp/general roles use the same biological mechanics; availability comes from the actual world/subworld templates.

## 9. Latest community-strategy conclusions checked

Steam/Klei/Reddit discussions around U59 reinforce, but do not override executable mechanics:

- wild native crops are useful bridge food even when domestic cultivation is impractical;
- Aquatic starts can use Mussel Sprouts/seafood immediately, but water chemistry and rapid seafood spoilage require attention;
- Tidal/Aquatic critters are often kept for utility outputs, so `edible` must not imply `best to kill`;
- Frosty starts strongly reward using native cold crops and forage before building temperature-controlled imported farms;
- Sleet Wheat being present does not make a Sleet Wheat farm an early recommendation.

Community posts are treated as strategy evidence only. Values are taken from the executable or current wiki.

## 10. Food audit approval questions

Before implementation, Arthur should approve these policy choices:

- use `immediate / wild recurring / domestic recurring / ingredient` badges;
- show all exact death drops but rank rare/non-reproducing critters low;
- show Mush Bar despite its poor efficiency, with a prominent emergency warning;
- show optional cooked recipes as child steps rather than separate terrain resources;
- exclude generated false positives such as Balm Lily, Wheezewort, Morb and Starnacle from the food list.
