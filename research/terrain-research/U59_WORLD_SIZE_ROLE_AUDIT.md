# U59 World Size, Role and Surface Identification Audit

Status: approved implementation baseline. Generated from Arthur's installed U59 world and cluster YAML.

Machine-readable outputs:

- `u59-world-size-role-audit.json`
- `u59-world-size-role-audit.csv`
- reproducible generator: `audit_world_sizes_roles.py`

Execution result:

- 94 world YAMLs with valid `worldsize`
- 51 cluster YAMLs inspected; `skip: EditorOnly` clusters excluded from player-facing role evidence
- 0 world YAMLs skipped for missing size

## 1. Key correction: role is not size

These are separate dimensions:

- role: `start`, `warp`, `general`, or currently unreferenced/internal;
- physical size: exact `worldsize.X × worldsize.Y`;
- display category: a player-facing comparison band derived from width.

`Start`, `Warp` and `Mini` must never be inferred from one another. A world can be Start and 240 tiles wide, Start and 160 wide, or Start and 128 wide. Warp worlds in the current data are usually 160×176 or 128×153, but role does not guarantee that size.

A world can also serve more than one role in different cluster definitions. The generated audit stores a role set, not a single hard-coded role.

## 2. U59 size distribution

| Exact X × Y | World count | Interpretation |
|---|---:|---|
| 128 × 153 | 24 | common Moonlet/Mini family geometry, but also used by landing/warp worlds without `Mini` in the name |
| 256 × 384 | 15 | base-game extra-large geometry |
| 240 × 380 | 15 | Classic Spaced Out start geometry |
| 160 × 274 | 6 | standard Spaced Out start geometry |
| 160 × 176 | 6 | common medium Warp/secondary geometry |
| 64 × 128 | 4 | small special/outer world |
| 64 × 96 | 4 | small special world |
| 32 × 32 | 3 | internal/test/special; not a normal selectable survival asteroid |
| 96 × 96 | 3 | Mini Regolith plus internal/special maps |
| 64 × 64 | 3 | small special world |
| 384 × 384 | 2 | oversized/special geometry |
| 380 × 240 | 2 | wide special geometry |
| 96 × 128 | 2 | small special world |
| 96 × 80 | 1 | small special world |
| 160 × 96 | 1 | wide shallow special world |
| 128 × 96 | 1 | special/internal |
| 96 × 160 | 1 | narrow tall special world |
| 80 × 174 | 1 | Water Moonlet: important narrow/tall exception |

The data proves that a binary `Mini / Regular` label is insufficient.

## 3. Role audit

Across non-skipped shipping cluster definitions, using both `locationType` and `startWorldIndex`:

- 43 world configs are used as Start in at least one cluster;
- 12 are used as Warp by explicit Warp identity/comment;
- 18 are used as general/secondary placements;
- 21 installed world configs are not referenced by the shipping cluster YAML set;
- these sets do not overlap in the current shipping data, although the generated schema preserves a role array for future multi-role configurations.

Representative role/size families:

| Family | Start | Warp | General | Size behavior |
|---|---|---|---|---|
| Mini Flipped | `MiniFlippedStart` | `MiniFlippedWarp` | `MiniFlipped` | all 128×153 |
| Mini Badlands | Start/Warp/general variants | yes | yes | all 128×153 |
| Mini Forest Frozen | Start/Warp/general variants | yes | yes | all 128×153 |
| Mini Radioactive Ocean | Start/Warp/general variants | yes | yes | all 128×153 |
| Mini Metallic Swampy | Start/general; Warp file exists but currently unreferenced | file exists | yes | all 128×153 |
| Frosty Shattered | Start/Warp/Geo variants | yes | yes | all 128×153 |
| Standard Spaced Out starts | Terra, Forest, Swamp, Ceres, Prehistoric, Aquatic | role-specific | secondary worlds elsewhere | 160×274 starts |
| Classic starts | Vanilla and DLC Classic variants | separate warp/secondary configs | general elsewhere | 240×380 starts |
| Medium warp worlds | several Forest/Radioactive/Wasteland combinations | yes | sometimes | 160×176 |

## 4. Important exceptions

- `MiniRegolithMoonlet` is 96×96, not 128×153.
- `WaterMoonlet` is 80×174: very narrow but taller than the common Mini family.
- `IdealLandingSite`, `MetalHeavyLandingSite`, `SwampyLandingSite`, `OilRichWarpTarget` and `WarpOily*` use 128×153 even without a `Mini` name.
- `MiniMetallicSwampyWarp` exists as YAML but is not referenced by the currently installed cluster YAMLs.
- `Moon_Barren` and `SpaceshipInterior` are 96×96 but are not normal Mini Regolith asteroids.
- Current `public/data/worlds.json` also contains 94 records, including internal/special worlds such as tiny/empty/test-like configurations. Before implementation, display eligibility needs an explicit filter; a valid world YAML does not automatically mean a normal player-selectable asteroid.

## 5. Can the player choose the size?

Vanilla U59 does not provide an independent width/height slider.

The player selects a cluster/start scenario and may use supported remix options. That selection resolves to fixed world YAMLs whose X/Y values are predefined. Remix can indirectly choose another world configuration, but it still does not freely set X and Y. Mods or YAML edits are the way to set arbitrary dimensions.

Therefore website text should say:

- `This scenario uses a 160×274 start world`, not `choose the 160×274 size`;
- `Cluster Remix may replace the world`, not `resize the world`.

## 6. Surface identification before opening the whole map

`worldsize.X` is the authoritative horizontal grid width. It corresponds to the full left-boundary-to-right-boundary cell span, not the number of solid surface rocks.

Player-facing guidance:

1. use the revealed surface/map boundaries, not the Starmap's round planet icon;
2. compare the full horizontal boundary span, not the irregular rock contour;
3. use exact X as a reference where coordinate/grid counting is possible;
4. never promise that the vanilla UI prints the YAML width directly;
5. do not ask the player to infer Y from an unopened underground map.

The Starmap icon is not reliable for physical scale because icons are normalized for the UI. A revealed surface can give a relative sense of 80 vs 128 vs 160 vs 240 tiles, but the website should supply the authoritative width rather than claiming visual estimation is exact.

## 7. Proposed display model

### Role badge

- 起始星球 / Start
- 傳送目的星球 / Warp
- 一般目的星球 / General
- 未由標準 Cluster 使用 / Unreferenced or internal

### Exact dimensions

Always show:

- `水平寬度: 128 格`
- `完整尺寸: 128 × 153`

### Comparison band

The generated audit currently uses these neutral width bands:

| Band | X rule | Recommended Chinese label |
|---|---:|---|
| `extremely-small` | X ≤ 96 | 極窄／特殊 |
| `moonlet-mini-width` | 97–128 | Moonlet／迷你寬度 |
| `spaced-out-standard-width` | 129–160 | Spaced Out 標準寬度 |
| `classic-large-width` | 161–240 | Classic 大型寬度 |
| `base-game-extra-large-width` | X > 240 | Base Game／特大型寬度 |

The exact number is authoritative; the band is explanatory only. `80×174 Water Moonlet` demonstrates why width and area/aspect ratio should also be visible.

### Surface hover text example

`角色：Warp｜水平寬度：128 格｜完整尺寸：128×153｜Moonlet／迷你寬度。以已揭露地圖的左、右邊界比較；Starmap 圖示比例不代表實際大小。`

## 8. Required filtering before implementation

Do not expose every YAML as an ordinary playable option without classification. Proposed eligibility states:

- `standard-cluster`: referenced by a normal shipping cluster;
- `remix/reference`: valid world used by remix or special placement;
- `event/challenge`: KleiFest or explicit challenge content;
- `internal/test`: Tiny/Empty/SpaceshipInterior and other development maps;
- `orphaned-current-build`: valid config not referenced by current clusters.

This filtering work must be approved and completed before changing the current selector.

## 9. Approval decisions requested

Arthur should approve:

- exact X/Y plus separate role and width-band badges;
- `Regular` removed as a physical-size label;
- Starmap icon explicitly described as non-scale;
- internal/unreferenced worlds hidden or moved into an advanced section;
- Water Moonlet and other unusual aspect ratios shown with exact width and height instead of forced into a generic Mini category.
