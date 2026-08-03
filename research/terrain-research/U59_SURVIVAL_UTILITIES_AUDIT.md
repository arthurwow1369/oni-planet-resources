# ONI U59 Oxygen, Power and Radiation Audit

Status: research-only. No website implementation, commit or deployment is authorized.

Evidence baseline and latest-version policy are the same as `U59_SURVIVAL_FOOD_AUDIT.md`: locally reproducible U59-740622 executable mechanics, latest public U59 notes checked through 744825.

## A. Oxygen

### A1. Immediate breathable resources

Rank before machinery when locally exposed:

| Source | Output/use | Early rank | Attention |
|---|---|---|---|
| Existing Oxygen pocket | breathable Oxygen | highest | finite gas mass; pressure may be too low |
| Existing Polluted Oxygen pocket | directly breathable | high emergency | Yucky Lungs/debuff and germ risk; Deodorizer is optional improvement, not required to breathe |
| Oxylite tile/debris | sublimates to Oxygen | high | executable sublimation values: 0.01 kg/s upper emission, 0.005 kg trigger class; overpressure control around 1.8 kg/cell |
| Polluted Water surface | naturally emits Polluted Oxygen | high/conditional | emission requires exposed surface and low enough gas pressure; germ risk |
| Polluted Dirt | naturally emits Polluted Oxygen | high/conditional | executable sublimation rate class `0.00002`, capped/pressured by surrounding gas; many small piles expose more surface than one large pile |
| Slime | naturally emits Polluted Oxygen | conditional | much stronger sublimation class (`0.025`, cap class `0.125`) but may carry Slimelung |
| Dissolving Algae submerged in water | releases Oxygen bubbles | conditional | direct environmental process; quantity and accessibility are map-dependent |

Do not confuse `breathable` with `clean`. Polluted Oxygen is a valid emergency oxygen entry with a hazard badge.

### A2. Direct plants and critters

| Source | Direct output | Exact executable fact | Environment/attention |
|---|---|---|---|
| Oxyfern | Oxygen | 31.25 g/s domestic; consumes 0.625 g/s CO2, 31.667 g/s Water and 6.667 g/s Dirt | 0-40°C preferred, CO2 atmosphere, pressure sensitive; wild output is lower through wild plant scaling |
| Alveo Vera | Oxylite crop | 36 kg Oxylite every 2 domestic cycles; consumes Ice and CO2 | Frosty DLC; -80 to 0°C viable range; harvested Oxylite then sublimates without a building |
| Oxy Coral | Oxygen bubbles | 150 g/s, enough in tuning for 1.5 standard dupes | Aquatic DLC; 2,500 lux; submerged in Water/Salt Water/Polluted Water/Brine/Murky Brine; domestic input 33.333 g/s Salt Water + 8.333 g/s Lime; preferred 25-45°C |
| Blowter | Oxygen packets | 15 kg/cycle per standard adult, two output events/cycle | Aquatic DLC; water critter; consumes Waterweed growth/food; do not assume one Blowter continuously supports one dupe (a dupe uses 60 kg/cycle) |
| Morb | Polluted Oxygen | direct critter output | intermittent and dirty; not food; ecology/contamination warning |

Oxy Coral is the strongest direct plant source by nominal rate, but not an early recommendation unless the terrain already supplies the required marine medium, light and crop inputs.

### A3. One-building converters

| Building | Input | Output | Power | Critical values/warnings |
|---|---|---|---:|---|
| Oxygen Diffuser | 550 g/s Algae | 500 g/s Oxygen | 120 W | 2.5 kDTU/s heat; overpressures at 1.8 kg/cell; best simple algae route |
| Algae Terrarium | 30 g/s Algae + 300 g/s Water + 0.333 g/s CO2 | 40 g/s Oxygen + Polluted Water | 0 W | manual supply/emptying; standing Polluted Water can offgas; low per-building rate |
| Electrolyzer | 1 kg/s Water | 888 g/s Oxygen + 112 g/s Hydrogen | 120 W | 1.25 kDTU/s self heat; gas separation and heat handling needed; Hydrogen can offset power through a generator |
| Rust Deoxidizer | 750 g/s Rust + 250 g/s Salt | 570 g/s Oxygen + 400 g/s Iron Ore + 30 g/s Chlorine | 60 W | solid delivery and Chlorine handling; output heat 2.5 kDTU/s |
| Sublimation Station | 1 kg/s Polluted Dirt | 660 g/s Polluted Oxygen | 60 W | 1.5 kDTU/s heat; still dirty oxygen |
| Deodorizer | Polluted Oxygen + Filtration Medium | clean Oxygen + Clay | 5 W | cleanup, not net oxygen creation; only suggest when Polluted Oxygen is already present |

Path policy:

- Include `Slime/Polluted Water/Polluted Dirt -> Polluted Oxygen` directly.
- Include `Polluted Oxygen -> Deodorizer` as an optional one-building cleanup child.
- Exclude `Slime -> Algae Distiller -> Algae -> Oxygen Diffuser` from direct terrain guidance because it uses two active converters.
- Exclude `Water -> Electrolyzer -> Hydrogen Generator` from the oxygen list's direct path; show Hydrogen as a useful by-product under power instead.

## B. Power

### B1. Direct and one-generator methods

| Local source/mechanism | Generator/use | Output | Input rate | Main warning |
|---|---|---:|---:|---|
| Duplicant operation | Manual Generator | 400 W | operation | universal early fallback; user asked not to rank by labour, but label manual operation |
| Coal / Hatch coal | Coal Generator | 600 W | 1 kg/s Coal | 20 g/s hot CO2, 8 kDTU/s exhaust; use automation to prevent waste |
| Lumber / Arbor Tree / Lumb-type direct lumber | Wood Burner | 300 W | 1.2 kg/s Lumber | 170 g/s hot CO2, 8 kDTU/s exhaust; Arbor -> Lumber -> one generator is accepted |
| Peat | Peat Generator | 480 W | 1 kg/s Peat | 40 g/s CO2 + 200 g/s Polluted Water |
| Hydrogen / Hydrogen Vent / Saturn Trap output | Hydrogen Generator | 800 W | 100 g/s Hydrogen | source must be direct; plant -> Hydrogen -> generator is accepted as one active conversion |
| Natural Gas / Natural Gas Geyser / Gassy Moo | Natural Gas Generator | 800 W | 90 g/s combustible gas | 67.5 g/s Polluted Water + 22.5 g/s CO2; gas piping |
| Petroleum/Ethanol/Nectar-like combustible liquid present directly | Petroleum Generator | 2,000 W | 2 kg/s | 750 g/s Polluted Water + 500 g/s CO2, 16 kDTU/s self heat |
| Molten Slickster petroleum | Petroleum Generator | 2,000 W max | 2 kg/s fuel | accepted direct critter fuel; maintaining hot CO2 ranch is not early |
| Spigot Seal ethanol | Petroleum Generator | 2,000 W max | 2 kg/s fuel | accepted direct critter output; needs Bonbon ecology |
| Sunlight | Solar Panel | up to 380 W/panel | 0.00053 W/lux, capped | surface only; meteor/light obstruction and day/night cycle; Glass required |
| Wild Plug Slug | exposed wire | nominal 400 W at full stomach | nocturnal | base generator 1,600 W with -75% wild modifier; hungry/starved output falls further |
| Tame/fed Plug Slug | exposed wire | up to 1,600 W | refined/raw metal feed | nocturnal; very high metal consumption; do not claim 1,600 W for a wild unfed slug |
| Tidal Spring | Tidal Turbine | 300 W while attached/active | direct environmental | Aquatic DLC; spring periodically submerges/operates; gasket + metal construction; cyclic rather than flat 300 W forever |

### B2. Steam power and stable heat

Steam Turbine executable/current-wiki facts:

- maximum 850 W;
- up to 2 kg/s Steam through five inlets;
- requires at least 125°C Steam below it;
- outputs the same mass as 95°C Water;
- turbine body must remain below 100°C;
- at 2 kg/s, 125°C Steam produces about 242 W; 200°C+ reaches the 850 W cap;
- practical self-cooled operation should normally stay around or below 135°C (about 330 W); 140°C is an unstable theoretical equilibrium.

Terrain heat-source ranking:

1. active Steam Vent producing 500°C Steam: direct and strong, but eruption/dormancy and overheat control are mandatory;
2. Magma/volcano/geothermal core coupled through a steam chamber: strong repeatable mid-game source if heat can be controlled;
3. hot metal volcano or other high-temperature eruption heating a steam chamber: usable but output is intermittent and depends on average eruption heat;
4. Ceres Geothermal Heat Pump system: local geothermal route, but it is a multi-building infrastructure system and should be labelled advanced rather than a direct terrain option;
5. Cool Steam Vent at 110°C: **not sufficient by itself** for a Steam Turbine; requires added heat or mixing with hotter steam;
6. Thermo Aquatuner/Metal Refinery heat: player-created recycling/heat-deletion system, not a terrain resource source.

Stable-heat rule:

- Never mark `steam power available` merely because a geyser or volcano exists.
- Require source temperature above the turbine threshold, enough average thermal output, a steam medium/water supply, turbine cooling and eruption/dormancy buffering.
- Display `intermittent` for all geysers/volcanoes unless an analysis uses their inspected active/dormant timings.

### B3. Direct biological/terrain fuel routes accepted

- Hatch -> Coal -> Coal Generator.
- Arbor Tree/Lumb direct Lumber -> Wood Burner.
- Saturn Critter Trap -> Hydrogen -> Hydrogen Generator.
- Gassy Moo -> Natural Gas -> Natural Gas Generator.
- Molten Slickster -> Petroleum -> Petroleum Generator.
- Spigot Seal -> Ethanol -> Petroleum Generator.
- Plug Slug -> electricity directly.
- Tidal Spring -> Tidal Turbine directly.

Rejected from `direct` recommendations:

- Arbor Tree -> Lumber -> Ethanol Distiller -> Ethanol -> Petroleum Generator (two active converters).
- Slickster -> Crude Oil -> Oil Refinery -> Petroleum Generator (two active converters); only Molten Slickster's direct Petroleum qualifies.
- Slime -> Algae -> Electrolyzer chain.
- Nuclear Reactor -> Steam -> Steam Turbine as a simple terrain route; it is an advanced engineered system.
- Any generator fuel imported from another asteroid; availability must be asteroid-local.

## C. Radiation and radbolts

The UI must distinguish:

- `ambient radiation` measured in rads/cycle;
- `radbolt production`, which consumes ambient radiation or uranium and outputs radbolts.

### C1. Direct ambient sources

| Source | Executable value / role | Setup | Warning |
|---|---|---|---|
| Wheezewort | 480 rads/cycle emitter, radius 6 | wild works directly; domestic uses 4 kg/cycle Phosphorite | strong localized source; also cools gas; plant survival temperature and fertilization |
| Shine Bug family | variant-dependent ambient radiation/light | preserve or ranch | moving source; breeding to high-rad morphs is not an immediate terrain option |
| Ionizing Bug | high-radiation Shine Bug morph/source | space/ranch | do not infer presence from base Shine Bugs |
| Space radiation | map/cluster-dependent background | expose collector to sky | varies by asteroid and shielding; gases/tiles attenuate it |
| Uranium Ore natural tiles | low ambient emission | leave natural tile near collector | radioactive only as natural tile, not ordinary debris |
| Nuclear Waste natural/liquid tile | high ambient source | containment | severe radiation and phase/containment hazard |
| Research Reactor | strong engineered emission | advanced | not a terrain-native early source; nuclear waste/heat hazards |
| Radiation Lamp | 240-rad directional emitter | 60 W + Uranium Ore | consumes 10 kg Uranium Ore/cycle, outputs 5 kg/cycle Depleted Uranium; 16×4 directional field |

### C2. Radbolt machines

Manual Radbolt Generator:

- 1 kg Uranium Ore -> 5 radbolts + 0.5 kg Depleted Uranium;
- 1 kg Enriched Uranium -> 25 radbolts + 0.8 kg Depleted Uranium;
- 40 s manual fabrication;
- emits 120 rads locally while present/operating per config;
- accepted as direct material-to-radbolt machinery;
- labour is labelled but not used in ranking.

Radbolt Generator:

- 480 W;
- samples ambient radiation every 0.2 s;
- conversion constant: 0.1 radbolt per collected rad unit in config;
- storage/launch slider 50-500 radbolts;
- does not create radiation—it converts an existing field into radbolts.

Accepted one-machine pairings:

- wild Wheezewort + Radbolt Generator;
- native space radiation + Radbolt Generator;
- natural Uranium/Nuclear Waste tile + Radbolt Generator;
- naturally present Shine/Ionizing Bug + Radbolt Generator.

Do not list the collector itself as a radiation source.

### C3. Radiation hazards

- Lead Suit absorption is 34% of unprotected exposure (66% protection), not complete immunity.
- Seafood effect reduces radiation absorption by 20% for two cycles; with a Lead Suit, current mechanics produce 14% net absorption.
- Natural tiles and debris can differ in radioactivity; do not infer a debris pile has the same field as a natural tile.
- Ordinary walls, gases and liquids attenuate radiation; mesh/airflow-style openings differ.
- Radioactive biome presence does not guarantee a collector-ready field at the intended building cell.

## D. Terrain applicability logic

For every displayed terrain:

1. map exact local entities/elements/geysers from U59 worldgen;
2. present immediate exposed gas/material before machinery;
3. add native plants/critters only when the exact prefab can spawn there;
4. add one-building methods when their direct local input exists;
5. show environment fit: temperature, medium, pressure, light, submersion and phase;
6. show `finite`, `wild recurring`, `cyclic/geyser`, or `domestic/engineered`;
7. do not aggregate resources from another asteroid in the same cluster;
8. do not rank by labour or shared-resource budgeting;
9. retain depletion, contamination, heat, flooding, overpressure and radiation warnings.

## E. Latest discussion findings

Recent Klei/Steam/Reddit discussions checked during this audit were used to identify practical caveats:

- Aquatic players report Tidal Turbine usefulness is gated by spring state/attachment and is cyclic, so 300 W must not be displayed as a flat continuous average.
- Flue/Oxy Coral and Blowter can contribute oxygen, but community strategies still stress light, marine conditions, crop/feeding support and buffering rather than treating nominal output as free oxygen.
- Cool Steam Vents remain a common Steam Turbine misconception: 110°C is below the 125°C operating threshold.
- Community Steam Turbine guidance consistently treats stable heat, turbine cooling and dormancy buffering as prerequisites.
- Plug Slug screenshots frequently show the 1,600 W tame rating; the executable confirms wild animals receive a -75% modifier, so a wild find should be advertised around 400 W before hunger penalties.

Forum advice is strategy evidence only; executable values and official update notes take precedence.

## F. Approval decisions requested

Before implementation Arthur should approve:

- Polluted Oxygen shown as a valid emergency breathable source with a health warning;
- one-active-converter path rule and the accepted critter/plant fuel pairings above;
- Tidal Turbine labelled cyclic rather than continuous;
- Steam power shown only when the source crosses 125°C and all system prerequisites are disclosed;
- separate ambient-radiation and radbolt sections;
- Wild Plug Slug shown at the wild modifier rather than the 1,600 W domestic rating.
