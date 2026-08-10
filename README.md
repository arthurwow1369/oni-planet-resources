# ONI Planet Resource Planner

A bilingual React + TypeScript planning tool for **Oxygen Not Included**. It defaults to Traditional Chinese (`正體中文`) and can switch to English.

This is an unofficial, noncommercial fan project. See [NOTICE.md](NOTICE.md) for provenance, attribution, and licensing boundaries.

## What it does

- Select a world and any subset of its terrains.
- Aggregate possible terrain resources while preserving terrain provenance.
- Browse plants and fauna in dedicated, color-coded views.
- Show deterministic planning candidates for food, oxygen, power, and radiation.
- Present curated terrain research, hazards, and industrial or late-game uses.
- Cover installed base-game and DLC worldgen definitions represented by the bundled data.

## Limitations

The planner reports **possible worldgen content**, not a seed guarantee. Actual presence and abundance vary with the world, seed, traits, DLC combination, and world mixing.

It does not model exact quantities, geyser or vent output rates, recipe ratios, trait mutations, or renewal rates. Recommendation rules are planning aids, not simulations or claims of an optimal design. Unknown resources remain visible as uncategorized instead of being guessed. Radiation advice applies only when *Spaced Out!* radiation mechanics are enabled.

## Install and run

Requirements: Node.js and npm compatible with Vite 8.

```bash
git clone https://github.com/arthurwow1369/oni-planet-resources.git
cd oni-planet-resources
npm ci
npm run dev
```

Open the URL printed by Vite.

## Quality checks

```bash
npm test
npm run lint
npm run build
```

To inspect the production build locally:

```bash
npm run preview
```

## Re-extract game data

Extraction requires Python 3.9+, PyYAML, a legally installed copy of *Oxygen Not Included*, and the user-installed DolphinWing `strings.po` used for the bilingual dataset. Game and translation assets are not provided by this project.

```bash
python3 -m pip install PyYAML
ONI_STREAMING_ASSETS="/path/to/StreamingAssets" \
DOLPHINWING_PO_PATH="/path/to/strings.po" \
  python3 scripts/extract_data.py
```

The extractor reads world, subworld, and biome YAML and writes:

- `public/data/worlds.json`
- `public/data/subworlds.json`
- `public/data/resources.json`
- `public/data/stats.json`
- `public/data/space-pois.json`

Both input paths can also be supplied as explicit CLI arguments:

```bash
python3 scripts/extract_data.py \
  --assets "/path/to/StreamingAssets" \
  --translations "/path/to/strings.po"
```

`DOLPHINWING_PO_PATH` is an input path, not an alternative license for the translations. The extractor requires an accessible `strings.po` from the user's own installation.

### Refreshing the space-POI composition table

The starmap POI table is compiled into `Assembly-CSharp.dll` instead of shipping as worldgen YAML, so its outputs, ratios, capacity and refill ranges are extracted separately into `research/space-pois/poi-types.json`. That file is checked in, so a normal re-extraction does not need this step — rerun it only after a game update changes the POI table:

```bash
dotnet tool install --global ilspycmd
python3 research/space-pois/build_poi_types.py \
  --assembly "/path/to/Managed/Assembly-CSharp.dll" \
  --assets "/path/to/StreamingAssets"
```

Output ratios are normalized from the raw element weights the way `HarvestModule.HarvestFromPOI` does, and output temperatures are each element's `defaultTemperature`, which is what `StarmapHexCellInventory.ExtractAndSpawn` spawns the harvested mass at. Prose guidance for each POI lives alongside it in `research/space-pois/space-pois.json`.

Exact starmap coordinates are deliberately absent from this dataset: the game rolls each site's axial position, capacity and refill rate per world seed, so only the ring range a cluster allows is published, which is identical for every player of that cluster.

## Data and research provenance

### Local wiki icon cache

Resource, Space POI, world, and named geyser/volcano icons are downloaded locally from the Oxygen Not Included wiki.gg MediaWiki API. The checked-in `public/data/icon-index.json` records every verified local path, exact `File:` title, and wiki source page; its separate `misses` lists record entities with no exact PNG or a download failure. World and geyser lookups are exact-name only (world aliases require a documented one-to-one naming difference); a generic vent image is never presented as a specific geyser variant. Refresh them without accessing a game installation with:

```bash
node scripts/download_oni_icons.mjs
```

The artwork remains Klei-owned game artwork, downloaded from wiki.gg for personal planner use. Source links are retained in the icon index and relevant detail views; no license grant for the artwork is implied.

The checked-in app data was extracted from a locally installed Steam build using `scripts/extract_data.py`. Its current `public/data/stats.json` records 94 worlds, 186 referenced subworld variants, and 126 resources. These counts describe that extraction snapshot, not every possible future game version.

The terrain research baseline is **U59-740622, Steam build 24423041, as of 2026-08-01**. It groups 232 installed base-game/DLC subworld definitions into 26 `zoneType` unions. A union entry means that content appeared in at least one installed variant; it does not guarantee the content on every map.

Research uses this evidence order:

1. locally installed worldgen YAML for generated terrain contents;
2. official Klei release notes for version-sensitive changes;
3. wiki pages as secondary references, cross-checked where possible;
4. forum and Steam discussions as advisory player experience only.

Source metadata, URLs, version scope, reliability labels, and research caveats live in [`research/terrain-research/sources.json`](research/terrain-research/sources.json). The readable terrain report is [`research/terrain-research/terrain-research.md`](research/terrain-research/terrain-research.md). Traditional Chinese terminology is attributed in [NOTICE.md](NOTICE.md).

## Deployment

Deployments use isolated Cloudflare Pages projects while preserving the same application path:

| Branch | Environment | URL | Access |
| --- | --- | --- | --- |
| `dev` | Development | `https://game-dev.kingdom-innovator.com/tools/oni-planet-resources/` | Google SSO allowlist |
| `main` | Production | `https://game.kingdom-innovator.com/tools/oni-planet-resources/` | Public |

`.github/workflows/deploy.yml` verifies and builds every deployment, creates or validates the matching Pages project, deploys `dist/` as the hosting root, and verifies the custom domain and proxied DNS record. The build places the application beneath `dist/tools/oni-planet-resources/`, matching the configured URL path. Development Access policies cover the custom hostname, the project `pages.dev` hostname, and wildcard deployment-preview hostnames so the development artifact cannot bypass Google SSO.

The workflow uses four GitHub Actions secrets: `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_ZONE_ID`, and `CLOUDFLARE_ACCESS_EMAIL`. Production is deployed only from `main`; opening or updating a pull request does not publish production.

## Branch policy

`dev` is the integration branch. Changes are reviewed through a pull request from `dev` into `main`; do not push directly to `main`.

```text
dev → pull request → main
```

## License and attribution

The MIT license applies to original project code only. It does **not** place Klei game names or data, DolphinWing translations, or cited third-party material under MIT. See [NOTICE.md](NOTICE.md) for the full boundary and acknowledgements.
