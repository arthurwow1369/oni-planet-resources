#!/usr/bin/env python3
"""Extract terrain facts from the locally installed ONI worldgen assets.

This is a research-only extractor. It does not write website production data.
"""

from __future__ import annotations

import argparse
import ast
import json
import os
import re
from collections import defaultdict
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

import yaml

ZONE_NAMES = {
    "Abyss": "Abyss Biome",
    "Barren": "Barren / Regolith Biomes",
    "Beach": "Beach Biome",
    "BoggyMarsh": "Marsh Biome",
    "CarrotQuarry": "Carrot Quarry Biome",
    "Forest": "Forest Biome",
    "FrozenWastes": "Tundra / Frozen Biome",
    "IceCaves": "Ice Cave Biome",
    "KelpForest": "Kelp Forest Biome",
    "MagmaCore": "Magma Biome",
    "Metallic": "Metallic Biome",
    "Moo": "Moo Biome",
    "Ocean": "Ocean / Tide Pool Biome",
    "OilField": "Oily Biome",
    "PrehistoricGarden": "Garden Biome",
    "PrehistoricRaptor": "Feather Biome",
    "PrehistoricWetlands": "Wetlands Biome",
    "Radioactive": "Radioactive Biome",
    "Reef": "Reef Biome",
    "Rust": "Rust Biome",
    "Sandstone": "Sandstone / Temperate Biome",
    "Space": "Space Biome",
    "SugarWoods": "Nectar Biome",
    "Swamp": "Swampy Biome",
    "ToxicJungle": "Jungle / Caustic Biome",
    "Wasteland": "Wasteland Biome",
}

DLC_LABELS = {
    "base": "Base game",
    "expansion1": "Spaced Out!",
    "dlc2": "Frosty Planet Pack",
    "dlc3": "Bionic Booster Pack",
    "dlc4": "Prehistoric Planet Pack",
    "dlc5": "Aquatic Planet Pack",
}

CRITTER_IDS = {
    "Bee", "Butterfly", "Chameleon", "Crab", "CrabFreshWater",
    "DivergentBeetle", "Drecko", "Glom", "Hatch", "IceBelly", "LightBug",
    "LightBugRadioactive", "Mole", "Moo", "Mosquito", "OilFloater", "Pacu",
    "PacuTropical", "ParrotFish", "PrehistoricPacu", "PufferFish", "Puft",
    "PuftBleachstone", "Raptor", "SeaFairy", "SeaHorse", "SeaTurtle", "Seal",
    "Snail", "Squid", "Squirrel", "Staterpillar", "Stego", "WoodDeer",
}

OTHER_IDS = {
    "BasicForagePlant",
    "FossilBitsLarge",
    "FossilBitsSmall",
    "GardenForagePlant",
    "IceCavesForagePlant",
    "OilWell",
    "PinkRock",
    "SwampForagePlant",
}

DISPLAY_OVERRIDES = {
    "BasicFabricMaterialPlantSeed": "Thimble Reed Seed",
    "BasicFabricPlant": "Thimble Reed",
    "BasicForagePlant": "Muckroot",
    "BasicForagePlantPlanted": "Buried Muckroot",
    "BasicSingleHarvestPlant": "Mealwood",
    "BasicSingleHarvestPlantSeed": "Mealwood Seed",
    "Bee": "Beeta (via Beeta Hive)",
    "BeanPlant": "Nosh Sprout",
    "BeanPlantSeed": "Nosh Bean",
    "BlueGrass": "Alveo Vera",
    "BlueGrassSeed": "Alveo Vera Seed",
    "Bulbloom": "Bulbloom",
    "BulbPlant": "Buddy Bud",
    "BulbPlantSeed": "Buddy Bud Seed",
    "Butterfly": "Mimika",
    "CactusPlant": "Jumping Joya",
    "CactusPlantSeed": "Jumping Joya Seed",
    "CarrotPlantSeed": "Plume Squash Seed",
    "CarrotPlant": "Plume Squash Plant",
    "Chameleon": "Dartle",
    "Clam": "Clampum",
    "ColdBreather": "Wheezewort",
    "ColdBreatherSeed": "Wheezewort Seed",
    "ColdWheat": "Sleet Wheat",
    "ColdWheatSeed": "Sleet Wheat Grain",
    "Crab": "Pokeshell",
    "CrabFreshWater": "Sanishell",
    "CritterTrapPlant": "Saturn Critter Trap",
    "CritterTrapPlantSeed": "Saturn Critter Trap Seed",
    "CylindricaSeed": "Bliss Burst Seed",
    "DivergentBeetle": "Sweetle",
    "DewDripperPlant": "Dew Dripper",
    "DewPalm": "Gum Palm",
    "Dinofern": "Megafrond",
    "Drecko": "Drecko",
    "EvilFlower": "Sporechid",
    "EvilFlowerSeed": "Sporechid Seed",
    "ForestForagePlantPlanted": "Hexalent",
    "ForestTree": "Arbor Tree",
    "ForestTreeSeed": "Arbor Acorn",
    "FossilBitsLarge": "Large Fossil Fragment",
    "FossilBitsSmall": "Small Fossil Fragment",
    "GardenDecorPlantSeed": "Ring Rose Seed",
    "GardenFoodPlantSeed": "Sweatcorn Seed",
    "GardenForagePlant": "Snac Fruit",
    "GardenForagePlantPlanted": "Snactus",
    "GardenDecorPlant": "Ring Rosebush",
    "GardenFoodPlant": "Sweatcorn Stalk",
    "GasGrass": "Gas Grass",
    "Glom": "Morb",
    "HardSkinBerryPlantSeed": "Pikeapple Bush Seed",
    "IceCavesForagePlant": "Sherberry",
    "IceCavesForagePlantPlanted": "Sherberry Plant",
    "IceFlowerSeed": "Idylla Seed",
    "HardSkinBerryPlant": "Pikeapple Bush",
    "Hatch": "Hatch",
    "IceBelly": "Bammoth",
    "IceFlower": "Idylla Flower",
    "KelpPlantSeed": "Seakomb Seed",
    "LeafyPlant": "Mirth Leaf",
    "LeafyPlantSeed": "Mirth Leaf Seed",
    "LightBug": "Shine Bug",
    "LightBugRadioactive": "Ionizing Bug",
    "KelpPlant": "Seakomb",
    "Mole": "Shove Vole",
    "Mosquito": "Gnit",
    "Moo": "Gassy Moo",
    "MushroomPlant": "Dusk Cap",
    "MushroomSeed": "Dusk Cap Spore",
    "MusselSprout": "Mussel Sprout",
    "OilFloater": "Slickster",
    "OxyCoralSeed": "Flue Coral Seed",
    "OxyCoral": "Flue Coral",
    "Oxyfern": "Oxyfern",
    "OxyfernSeed": "Oxyfern Seed",
    "Pacu": "Pacu",
    "PacuTropical": "Tropical Pacu",
    "ParrotFish": "Beakon",
    "PinkRock": "Lumen Quartz",
    "PrickleFlower": "Bristle Blossom",
    "PrickleFlowerSeed": "Bristle Blossom Seed",
    "PrickleGrass": "Bluff Briar",
    "PrickleGrassSeed": "Bluff Briar Seed",
    "PrehistoricPacu": "Jawbo",
    "PufferFish": "Blowter",
    "Puft": "Puft",
    "PuftBleachstone": "Squeaky Puft",
    "SaltPlant": "Dasha Saltvine",
    "SaltPlantSeed": "Dasha Saltvine Seed",
    "SaltySticksPlantSeed": "Sodicane Seed",
    "SaltySticksPlant": "Sodicane",
    "SeaLettuce": "Waterweed",
    "SeaLettuceSeed": "Waterweed Seed",
    "SeaFairy": "Kelpole",
    "SeaHorse": "Seaquine",
    "SeaTree": "Tower Kelp",
    "SeaTurtle": "Orehull",
    "Seal": "Spigot Seal",
    "Snail": "Slogo",
    "SpaceTree": "Bonbon Tree",
    "SpiceVine": "Pincha Pepperplant",
    "SpiceVineSeed": "Pincha Peppernut",
    "Squirrel": "Pip",
    "Staterpillar": "Plug Slug",
    "Stego": "Lumb",
    "Squid": "Glo Squid",
    "SwampForagePlant": "Swamp Chard",
    "SwampForagePlantPlanted": "Swamp Chard Plant",
    "SwampHarvestPlant": "Bog Bucket",
    "SwampHarvestPlantSeed": "Bog Bucket Seed",
    "SwampLily": "Balm Lily",
    "SwampLilySeed": "Balm Lily Seed",
    "ToePlant": "Tranquil Toes",
    "ToePlantSeed": "Tranquil Toes Seed",
    "TubeWorm": "Tublia",
    "UrchinPlant": "Pinpoket",
    "VineMotherSeed": "Ovagro Seed",
    "VineMother": "Ovagro",
    "WaterCups": "Husha Cups",
    "WineCups": "Mellow Mallow",
    "WineCupsSeed": "Mellow Mallow Seed",
    "WoodDeer": "Flox",
    "WormPlant": "Spindly Grubfruit Plant",
    "WormPlantSeed": "Spindly Grubfruit Seed",
    "Cylindrica": "Bliss Burst",
}

FEATURE_ENTITY_ALIASES = {"AnyLiquidPacu": "Pacu", "BeeHive": "Bee"}


def relative(path: Path, root: Path) -> str:
    return path.relative_to(root).as_posix()


def namespace_for(path: Path, root: Path) -> str:
    parts = Path(relative(path, root)).parts
    if len(parts) > 2 and parts[0] == "dlc":
        return parts[1]
    return "base"


def load_yaml(path: Path) -> dict[str, Any]:
    with path.open(encoding="utf-8", errors="replace") as handle:
        return yaml.safe_load(handle) or {}


def parse_pot_titles(root: Path) -> dict[str, str]:
    text = (root / "strings/strings_template.pot").read_text(
        encoding="utf-8", errors="replace"
    )
    entries: dict[str, str] = {}
    for block in text.split("\n\n"):
        context = re.search(r'^msgctxt "([^"]+)"$', block, re.MULTILINE)
        msgid = re.search(r'^msgid "(.*)"$', block, re.MULTILINE)
        if not context or not msgid:
            continue
        try:
            value = ast.literal_eval('"' + msgid.group(1).replace('"', '\\"') + '"')
        except (SyntaxError, ValueError):
            value = msgid.group(1)
        entries[context.group(1)] = re.sub(r"<[^>]+>", "", value)

    titles: dict[str, str] = {}
    for context, value in entries.items():
        match = re.match(r"STRINGS\.CODEX\.([A-Z0-9_]+)\.(?:SPECIES_)?TITLE$", context)
        if match:
            titles.setdefault(match.group(1), value)
    return titles


def build_mob_lookup(root: Path) -> dict[str, dict[str, str]]:
    result: dict[str, dict[str, str]] = {}
    paths = sorted(root.glob("**/worldgen/mobs.yaml"), key=lambda p: relative(p, root))
    for path in paths:
        table = load_yaml(path).get("MobLookupTable", {}) or {}
        for tag in table.get("remove", []) or []:
            result.pop(str(tag), None)
        for tag, details in (table.get("add", {}) or {}).items():
            details = details or {}
            result[str(tag)] = {
                "prefab_id": str(details.get("prefabName", tag)),
                "source": relative(path, root),
            }
    return result


def build_biome_index(root: Path) -> dict[tuple[str, str], dict[str, Any]]:
    result: dict[tuple[str, str], dict[str, Any]] = {}
    for path in root.glob("**/worldgen/biomes/*.yaml"):
        namespace = namespace_for(path, root)
        table = load_yaml(path).get("TerrainBiomeLookupTable", {}) or {}
        result[(namespace, path.stem)] = {
            "keys": table.get("add", {}) or {},
            "source": relative(path, root),
        }
    return result


def resolve_biome(
    reference: str,
    index: dict[tuple[str, str], dict[str, Any]],
) -> tuple[list[str], str | None, str | None]:
    if "::" in reference:
        namespace, tail = reference.split("::", 1)
    else:
        namespace, tail = "base", reference
    parts = tail.split("/")
    if len(parts) < 3:
        return [], None, "invalid biome reference shape"
    file_name, key = parts[-2], parts[-1]
    record = index.get((namespace, file_name))
    if not record:
        return [], None, f"missing biome table {namespace}::{file_name}"
    rows = record["keys"].get(key)
    if rows is None:
        return [], record["source"], f"missing biome key {reference}"
    elements = [
        str(row["content"])
        for row in rows
        if isinstance(row, dict) and row.get("content")
    ]
    return elements, record["source"], None


def resolve_feature(
    reference: str,
    root: Path,
    current_namespace: str,
) -> tuple[set[str], list[str], str | None, str | None]:
    if "::" in reference:
        namespace, tail = reference.split("::", 1)
        path = root / "dlc" / namespace / "worldgen" / f"{tail}.yaml"
    else:
        path = root / "worldgen" / f"{reference}.yaml"
        if not path.exists() and current_namespace != "base":
            path = (
                root / "dlc" / current_namespace / "worldgen" / f"{reference}.yaml"
            )
    if not path.exists():
        return set(), [], None, f"missing feature definition {reference}"

    data = load_yaml(path)
    elements: set[str] = set()
    for group in (data.get("ElementChoiceGroups", {}) or {}).values():
        for choice in (group or {}).get("choices", []) or []:
            if isinstance(choice, dict) and choice.get("element"):
                elements.add(str(choice["element"]))
    entities = [
        FEATURE_ENTITY_ALIASES.get(str(mob["type"]), str(mob["type"]))
        for mob in data.get("internalMobs", []) or []
        if isinstance(mob, dict) and mob.get("type")
    ]
    return elements, entities, relative(path, root), None


def classify(prefab_id: str) -> str:
    if prefab_id in CRITTER_IDS:
        return "fauna"
    if prefab_id in OTHER_IDS:
        return "other"
    return "flora"


def display_name(prefab_id: str, pot_titles: dict[str, str]) -> str:
    return DISPLAY_OVERRIDES.get(
        prefab_id,
        pot_titles.get(prefab_id.upper(), prefab_id),
    )


def extract(root: Path) -> dict[str, Any]:
    biome_index = build_biome_index(root)
    mob_lookup = build_mob_lookup(root)
    pot_titles = parse_pot_titles(root)
    zones: dict[str, dict[str, Any]] = defaultdict(
        lambda: {
            "subworld_sources": set(),
            "dlc_scopes": set(),
            "temperature_ranges": set(),
            "biome_references": set(),
            "biome_sources": set(),
            "feature_sources": set(),
            "elements": set(),
            "features": set(),
            "tags": defaultdict(lambda: {"raw_tags": set(), "sources": set()}),
            "warnings": set(),
        }
    )

    for path in root.glob("**/worldgen/subworlds/**/*.yaml"):
        try:
            data = load_yaml(path)
        except yaml.YAMLError as error:
            continue
        zone_type = data.get("zoneType")
        if not zone_type:
            continue
        zone = zones[str(zone_type)]
        source = relative(path, root)
        zone["subworld_sources"].add(source)
        zone["dlc_scopes"].add(namespace_for(path, root))
        if data.get("temperatureRange"):
            zone["temperature_ranges"].add(str(data["temperatureRange"]))

        for biome in data.get("biomes", []) or []:
            if not isinstance(biome, dict) or not biome.get("name"):
                continue
            reference = str(biome["name"])
            zone["biome_references"].add(reference)
            elements, biome_source, warning = resolve_biome(reference, biome_index)
            zone["elements"].update(elements)
            if biome_source:
                zone["biome_sources"].add(biome_source)
            if warning:
                zone["warnings"].add(f"{source}: {warning}")
            for raw_tag in biome.get("tags", []) or []:
                raw_tag = str(raw_tag)
                lookup = mob_lookup.get(raw_tag, {})
                prefab_id = lookup.get("prefab_id", raw_tag)
                zone["tags"][prefab_id]["raw_tags"].add(raw_tag)
                if lookup.get("source"):
                    zone["tags"][prefab_id]["sources"].add(lookup["source"])

        for feature in data.get("features", []) or []:
            if isinstance(feature, dict) and feature.get("type"):
                reference = str(feature["type"])
                zone["features"].add(reference)
                elements, entities, feature_source, warning = resolve_feature(
                    reference, root, namespace_for(path, root)
                )
                zone["elements"].update(elements)
                if feature_source:
                    zone["feature_sources"].add(feature_source)
                for prefab_id in entities:
                    zone["tags"][prefab_id]["raw_tags"].add(
                        f"feature:{reference}"
                    )
                    if feature_source:
                        zone["tags"][prefab_id]["sources"].add(feature_source)
                if warning:
                    zone["warnings"].add(f"{source}: {warning}")

    records = []
    for zone_type in sorted(zones):
        zone = zones[zone_type]
        entities = []
        for prefab_id in sorted(zone["tags"]):
            details = zone["tags"][prefab_id]
            entities.append(
                {
                    "prefab_id": prefab_id,
                    "name": display_name(prefab_id, pot_titles),
                    "kind": classify(prefab_id),
                    "spawn_tags": sorted(details["raw_tags"]),
                    "mob_lookup_sources": sorted(details["sources"]),
                }
            )
        records.append(
            {
                "zone_type": zone_type,
                "name": ZONE_NAMES.get(zone_type, zone_type),
                "dlc_scopes": [
                    {"id": scope, "name": DLC_LABELS.get(scope, scope)}
                    for scope in sorted(zone["dlc_scopes"])
                ],
                "source_definition_count": len(zone["subworld_sources"]),
                "temperature_ranges": sorted(zone["temperature_ranges"]),
                "elements": sorted(zone["elements"]),
                "flora": [item for item in entities if item["kind"] == "flora"],
                "fauna": [item for item in entities if item["kind"] == "fauna"],
                "other_spawns": [item for item in entities if item["kind"] == "other"],
                "features": sorted(zone["features"]),
                "biome_references": sorted(zone["biome_references"]),
                "sources": {
                    "subworlds": sorted(zone["subworld_sources"]),
                    "biomes": sorted(zone["biome_sources"]),
                    "features": sorted(zone["feature_sources"]),
                },
                "warnings": sorted(zone["warnings"]),
            }
        )

    return {
        "schema_version": 1,
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "source": {
            "kind": "local-installed-game-assets",
            "root": "StreamingAssets",
            "steam_app_id": 457140,
            "installed_steam_build_id": "24423041",
            "version_baseline": "U59-740622",
            "version_release_date": "2026-07-07",
        },
        "scope_notes": [
            "This is a union across all subworld definitions in the installed base game and DLC assets.",
            "An item in a zone union is possible in at least one variant; it is not guaranteed on every asteroid or every variant.",
            "source_definition_count counts YAML definitions, including DLC-specific variants and overrides; it is not a count of visible website terrain cards.",
            "Flora/fauna classification is based on game codex semantics plus explicit prefab overrides; seed spawn forms remain listed as flora resources, while harvested forage items are listed under other_spawns.",
        ],
        "zone_count": len(records),
        "source_definition_count": sum(item["source_definition_count"] for item in records),
        "zones": records,
    }


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--root",
        type=Path,
        default=os.environ.get("ONI_STREAMING_ASSETS"),
        help="ONI StreamingAssets directory (or set ONI_STREAMING_ASSETS)",
    )
    parser.add_argument(
        "--output",
        type=Path,
        default=Path(__file__).with_name("game-data.json"),
    )
    args = parser.parse_args()
    if args.root is None:
        parser.error("provide --root or set ONI_STREAMING_ASSETS")
    args.root = args.root.expanduser()
    if not args.root.is_dir():
        parser.error("the StreamingAssets root does not exist or is not a directory")
    payload = extract(args.root)
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(
        json.dumps(payload, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    print(
        f"Wrote {args.output}: {payload['zone_count']} zones, "
        f"{payload['source_definition_count']} source definitions"
    )


if __name__ == "__main__":
    main()
