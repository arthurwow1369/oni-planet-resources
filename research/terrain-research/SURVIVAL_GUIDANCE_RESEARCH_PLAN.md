# U59 Survival Guidance Research Plan

Status: research-only; website implementation and deployment are explicitly out of scope until Arthur reviews and approves the research package.

## Evidence baseline

- Installed Steam build ID: `24423041`
- Local game data under `OxygenNotIncluded.app/Contents/Resources/Data/StreamingAssets`
- Local game/worldgen/tuning data is the primary authority for values and availability.
- Klei release notes are the primary authority for current design intent and changes.
- `oxygennotincluded.wiki.gg` is a secondary reference and cross-check.
- Klei Forum, Steam, and Reddit discussions are advisory sources for practical difficulty, side effects, and player-visible behavior; they do not override local U59 mechanics.
- Every published statement must record source, version/date when available, confidence, and DLC applicability.

## Product purpose

The guidance is a reference for players choosing ways to survive quickly and continue through the mid-game. It lists the available possibilities and their basic values; it does not optimize colony-wide resource allocation or choose a strategy for the player.

## Explicit non-goals

- Do not budget one stockpile across competing strategies.
- Do not estimate duplicant labor or staffing.
- Do not claim that a finite stock is sufficient for a colony.
- Do not add a permanent/infinite strategy tier.
- Do not include source-to-target chains with more than one transformation.
- Do not modify website source, generated public data, or deployment configuration during research.

## Guidance sections

### Early survival

Rank by time to first useful output and setup simplicity:

1. Existing harvestable/output available immediately.
2. Wild plant harvest or locally present edible critter.
3. Passive natural mechanism in an already suitable environment.
4. One low-tier building with no active environmental control.
5. One direct mechanism needing simple enclosure or routing.
6. Active temperature, pressure, lighting, or liquid control.
7. Advanced technology or multiple mandatory support systems.

### Mid-game continuity

List recurring options without requiring permanence:

- Preserve native habitat and repeatedly harvest wild plants.
- Repeatedly gather naturally recurring output.
- Cultivate or ranch in an already suitable local environment.
- Run a direct one-machine conversion.
- Use recurring environmental sources such as vents, geysers, volcanoes, sunlight, meteors, or surface radiation where applicable.

The same entity may appear in both sections with different modes. Example: wild Nosh Sprout harvest can be early food; preserved wild regrowth can be mid-game continuity; domesticated cultivation is a separate, harder mode because of cooling and farm requirements.

## Direct-path rule

A candidate qualifies when the local source reaches the target through no more than one active converter:

- Include: Water -> Electrolyzer -> Oxygen.
- Include: Hydrogen -> Hydrogen Generator -> Power.
- Include: Oxylite -> direct oxygen release.
- Include: edible plant harvest or critter food drop.
- Include: direct-radiation plant/critter/material.
- Exclude: Water -> Electrolyzer -> Hydrogen -> Hydrogen Generator.
- Exclude: Crude Oil -> Oil Refinery -> Petroleum -> Petroleum Generator.
- Exclude: Salt Water -> Desalinator -> Water -> Electrolyzer.

Harvesting a plant/critter output is not counted as a transformation. Cooking is displayed as an optional use of the direct food output, not as a separate source chain.

## Environmental suitability

Evaluate only conditions that affect whether and how quickly the candidate can operate:

- Temperature and native-biome temperature compatibility.
- Required atmosphere and pressure.
- Light/lux and darkness requirements.
- Liquid submersion/irrigation requirements.
- Plant substrate and critter habitat/feed requirements.
- Radiation exposure or shielding.
- Surface exposure, meteors, vacuum, heat source temperature, dormancy, and buffering.
- Required DLC and technology tier.

Do not reduce rank because the same input has another use. Retain static severe warnings such as rapid Dirt depletion, heat accumulation, food poisoning, slimelung/polluted oxygen, destructive byproducts, or finite heat/fuel.

## Candidate record schema

Each researched candidate must include:

- `id`
- `domain`: `food | oxygen | power | radiation`
- `sourceKind`: `critter | plant | material | building | environment`
- `sourceIds`
- `directProcess`
- `directOutput`
- `pathDepth`
- `phaseModes`: one or both of `early`, `mid`
- `wildOrManaged`: `wild | managed | both | not-applicable`
- `firstOutputBasis`
- `rawRates`: input/output/growth/reproduction values with units
- `technologyTier`
- `mandatorySystems`
- `environmentRequirements`
- `nativeEnvironmentAssessment`
- `renewalMode`: recurring/finite/periodic/unknown, without claiming permanence
- `severeWarnings`
- `dlcIds`
- `availabilityEvidence`
- `mechanicsEvidence`
- `communityNotes`
- `confidence`
- `exclusionReason` when rejected

## Food inclusion policy

### Fauna

Include only critters with a verified useful edible drop or direct edible output and a practical in-game acquisition mode. Record raw yield, reproduction/growth values, diet/habitat conditions, and wild versus managed use. Exclude entities that are only technically killable but do not provide useful edible output.

### Plants

Include edible harvests and direct recipe ingredients. Keep wild harvest, preserved wild regrowth, and domesticated farming as distinct modes. Record growth cycle, yield, temperature, atmosphere, pressure, illumination, irrigation/fertilization, and severe resource-consumption warnings.

### Direct material recipes

Include one-building food production such as material inputs used directly in a food machine. Record all mandatory inputs and static depletion/health/quality warnings, but do not determine whether a specific map has enough stock.

## Oxygen inclusion policy

Research direct release, plants, critters, and one-machine conversion from a local source. Verify every mandatory direct input. Record clean/polluted oxygen, output rate, pressure shutoff, temperature, germs, byproducts, and environmental requirements.

## Power inclusion policy

Research direct fuels, generating critters/plants, sunlight, and one-machine conversions. Record rated and average output where authoritative data permits, fuel/input rate, byproducts, heat, environmental constraints, and periodicity.

Steam Turbine candidates require a verified heat source with sufficient temperature. Classify renewable/periodic sources separately from long-lived finite magma. Do not present ordinary hot terrain or an unverified possible volcano as a stable source.

## Radiation inclusion policy

Research direct-radiation plants, critters, materials, space/environmental exposure, and one-machine sources. Record radiation rate/shape/range where verifiable, environmental requirements, fuel/input, and exposure hazards. Radiation-only content must be marked for Spaced Out or the relevant DLC.

## World role and size policy

Separate two axes:

- Role: starting world, teleporter destination, or other world.
- Physical size: exact `worldsize.X` by `worldsize.Y`, horizontal width, area, and a descriptive size band.

Never interpret the current `general` role as a physical regular size. The primary player-facing comparison is horizontal map width (`worldsize.X`), corresponding to left-to-right map cells. Research must verify what can actually be observed from an unlocked/revealed surface before landing; starmap icon scale must not be treated as physical scale.

## Deliverables before implementation approval

1. Source registry update.
2. Complete accepted-candidate dataset.
3. Rejected/excluded candidate list with reasons.
4. World role/width audit.
5. English research summary.
6. Traditional Chinese research summary and terminology validation.
7. Coverage and contradiction report.
8. Independent mechanics and product review.

Only after Arthur approves these deliverables may website implementation begin.
