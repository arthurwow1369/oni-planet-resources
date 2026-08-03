#!/usr/bin/env python3
"""Build ONI U59 category and seed/egg representative data from decompiled game code.

The decompiled source is a local research input, not a runtime dependency. The generated
JSON is committed so normal extraction remains reproducible without a decompiler.
"""
from __future__ import annotations

import argparse
import ast
import json
import os
import re
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[2]
PROFILES = ROOT / "research/terrain-research/entity-profiles.json"
CATALOG = ROOT / "research/resource-catalog/resource-catalog.json"
OUTPUT = ROOT / "research/resource-catalog/game-taxonomy.json"
DEFAULT_ASSETS = Path(
    "/Volumes/APP_SSD/SteamLibrary/steamapps/common/OxygenNotIncluded/"
    "OxygenNotIncluded.app/Contents/Resources/Data/StreamingAssets"
)
DEFAULT_PO = Path(
    "/Users/arthurwow/Library/Application Support/unity.Klei.Oxygen Not Included/"
    "mods/Steam/2906930548/strings.po"
)

MATERIAL_CATEGORIES = [
    "Alloy", "Metal", "RefinedMetal", "BuildableRaw", "BuildableProcessed", "Filter",
    "Liquifiable", "Liquid", "Breathable", "Unbreathable", "ConsumableOre", "Sublimating",
    "Organics", "Farmable", "Agriculture", "Other", "ManufacturedMaterial",
    "CookingIngredient", "RareMaterials",
]
CALORIE_CATEGORIES = ["Edible"]
UNIT_CATEGORIES = [
    "Medicine", "MedicalSupplies", "Seed", "Egg", "Clothes", "IndustrialIngredient",
    "IndustrialProduct", "TechComponents", "Compostable", "HighEnergyParticle",
    "StoryTraitResource", "Dehydrated", "ChargedPortableBattery", "BionicUpgrade",
]
# Neutronium uses this localized element category even though the game hides it
# from ordinary resource-management filters.
ELEMENT_ONLY_CATEGORIES = ["Special"]
CATEGORY_NAME_FALLBACKS = {
    "HighEnergyParticle": ("Radbolts", "輻射粒子"),
}

TAG_RE = re.compile(r"<[^>]+>")
CONSTANT_RE = re.compile(
    r"(?:public|private|protected)?\s*(?:static\s+)?(?:readonly\s+)?(?:const\s+)?string\s+"
    r"(\w+)\s*=\s*\"([^\"]+)\""
)


def clean(value: str) -> str:
    return TAG_RE.sub("", value).replace("\\n", " ").strip()


def decode_po_value(line: str) -> str:
    try:
        return ast.literal_eval(line[line.index('"'):])
    except Exception:
        return line.split('"', 1)[-1].rsplit('"', 1)[0]


def parse_po(path: Path) -> dict[str, tuple[str, str]]:
    result: dict[str, tuple[str, str]] = {}
    current: dict[str, list[str]] = {}
    active: str | None = None
    for raw in path.read_text(encoding="utf-8", errors="replace").splitlines() + [""]:
        line = raw.strip()
        if line.startswith("msgctxt "):
            active = "msgctxt"; current[active] = [decode_po_value(line)]
        elif line.startswith("msgid "):
            active = "msgid"; current[active] = [decode_po_value(line)]
        elif line.startswith("msgstr "):
            active = "msgstr"; current[active] = [decode_po_value(line)]
        elif line.startswith('"') and active:
            current.setdefault(active, []).append(decode_po_value(line))
        elif not line and current:
            context = "".join(current.get("msgctxt", []))
            if context:
                result[context] = (
                    clean("".join(current.get("msgid", []))),
                    clean("".join(current.get("msgstr", []))),
                )
            current = {}; active = None
    return result


def localized(strings_en: dict[str, tuple[str, str]], strings_zh: dict[str, tuple[str, str]], key: str) -> tuple[str, str]:
    en = strings_en.get(key, ("", ""))[0]
    zh = strings_zh.get(key, ("", ""))[1]
    return en, zh or en


def profile_index() -> dict[str, dict[str, Any]]:
    payload = json.loads(PROFILES.read_text())
    return {item["prefab_id"]: item for item in payload["profiles"]}


def catalog_entries() -> dict[str, dict[str, Any]]:
    return json.loads(CATALOG.read_text())["entries"]


def constants(text: str) -> dict[str, str]:
    return dict(CONSTANT_RE.findall(text))


def localization_key(text: str, *, egg: bool) -> str | None:
    suffix = "EGG_NAME" if egg else "NAME"
    keys = re.findall(r"(?:STRINGS\.)?CREATURES\.SPECIES\.([A-Z0-9_.]+)\." + suffix, text)
    if not keys:
        return None
    if not egg:
        seed_keys = [key for key in keys if ".SEEDS." in f".{key}."]
        if seed_keys:
            keys = seed_keys
    return f"STRINGS.CREATURES.SPECIES.{keys[-1]}.{suffix}"


def plant_definitions(source: Path) -> list[dict[str, str]]:
    records: list[dict[str, str]] = []
    for path in source.glob("*Config.cs"):
        text = path.read_text(encoding="utf-8", errors="replace")
        if "CreateAndRegisterSeedForPlant" not in text:
            continue
        values = constants(text)
        adult_id = values.get("ID")
        seed_id = values.get("SEED_ID") or values.get("SEEDID")
        if not seed_id:
            seed_ids = re.findall(r'"([A-Za-z0-9_]+Seed)"', text)
            seed_id = seed_ids[0] if seed_ids else None
        if not adult_id or not seed_id:
            continue
        records.append({
            "adult_id": adult_id,
            "seed_id": seed_id,
            "source": path.name,
            "name_key": localization_key(text, egg=False) or "",
        })
    return records


def critter_definitions(source: Path) -> list[dict[str, str]]:
    records: list[dict[str, str]] = []
    for path in source.glob("*Config.cs"):
        text = path.read_text(encoding="utf-8", errors="replace")
        if "ExtendEntityToFertileCreature" not in text:
            continue
        values = constants(text)
        adult_id = values.get("ID")
        egg_id = values.get("EGG_ID")
        if not egg_id:
            egg_ids = re.findall(r'"([A-Za-z0-9_]+Egg)"', text)
            egg_id = egg_ids[0] if egg_ids else None
        if not adult_id or not egg_id:
            continue
        records.append({
            "adult_id": adult_id,
            "egg_id": egg_id,
            "source": path.name,
            "name_key": localization_key(text, egg=True) or "",
        })
    return records


def prefab_categories(source: Path) -> dict[str, str]:
    """Derive prefab filter categories from the U59 entity construction helpers."""
    entity_templates = (source / "EntityTemplates.cs").read_text(encoding="utf-8", errors="replace")
    if "component.AddTag(GameTags.Edible)" not in entity_templates:
        raise SystemExit("U59 ExtendEntityToFood no longer adds GameTags.Edible")

    result: dict[str, str] = {}
    for path in source.glob("*Config.cs"):
        text = path.read_text(encoding="utf-8", errors="replace")
        if "EntityTemplates.ExtendEntityToFood" not in text:
            continue
        prefab_id = constants(text).get("ID")
        if prefab_id:
            result[prefab_id] = "Edible"
    return dict(sorted(result.items()))


def entity_details(entity_id: str, raw_profile: dict[str, Any], catalog: dict[str, dict[str, Any]]) -> dict[str, str]:
    entry = catalog.get(entity_id, catalog.get(raw_profile["prefab_id"], {}))
    return {
        "id": entity_id,
        "type": "plant" if raw_profile["kind"] == "flora" else "critter",
        "name_en": entry.get("name_en", raw_profile["name_en"]),
        "name_zh": entry.get("name_zh", raw_profile["name_zh"]),
        "use_en": entry.get("use_en", raw_profile["summary_en"]),
        "use_zh": entry.get("use_zh", raw_profile["summary_zh"]),
    }


def virtual_record(raw_profile: dict[str, Any], catalog: dict[str, dict[str, Any]], source: str) -> dict[str, Any]:
    entity_id = raw_profile["prefab_id"]
    entity = entity_details(entity_id, raw_profile, catalog)
    is_plant = raw_profile["kind"] == "flora"
    return {
        "id": f"virtual:{entity_id}:spawn",
        "kind": "spawn",
        "is_virtual": True,
        "name_en": f"{entity['name_en']} Spawn Mechanism",
        "name_zh": f"{entity['name_zh']}生成機制",
        "entity": entity,
        "mechanism_en": (
            "World generation places this plant directly; the game defines no collectible seed for it."
            if is_plant else
            "World generation or a world feature spawns this critter directly; the game defines no egg for it."
        ),
        "mechanism_zh": (
            "世界生成會直接放置此植物；遊戲沒有為它定義可收集種子。"
            if is_plant else
            "世界生成或地圖特徵會直接生成此小動物；遊戲沒有為它定義蛋。"
        ),
        "evidence": source,
    }


def build(source: Path, assets: Path, po_path: Path) -> dict[str, Any]:
    profiles = profile_index()
    catalog = catalog_entries()
    strings_en = parse_po(assets / "strings/strings_template.pot")
    strings_zh = parse_po(po_path)
    plants = plant_definitions(source)
    critters = critter_definitions(source)
    prefab_category_map = prefab_categories(source)

    categories = []
    for category_id in MATERIAL_CATEGORIES + CALORIE_CATEGORIES + UNIT_CATEGORIES + ELEMENT_ONLY_CATEGORIES:
        en, zh = localized(strings_en, strings_zh, f"STRINGS.MISC.TAGS.{category_id.upper()}")
        if not en:
            en, zh = CATEGORY_NAME_FALLBACKS[category_id]
        categories.append({"id": category_id, "name_en": en, "name_zh": zh})

    representatives: dict[str, dict[str, Any]] = {}
    for raw_id, profile in profiles.items():
        if profile["kind"] == "flora":
            match = next((record for record in plants if raw_id.lower() in {record["adult_id"].lower(), record["seed_id"].lower()}), None)
            category = "Seed"
            if match:
                en, zh = localized(strings_en, strings_zh, match["name_key"])
                seed_entry = catalog.get(match["seed_id"], {})
                representatives[raw_id] = {
                    "id": match["seed_id"], "kind": "seed", "is_virtual": False,
                    "name_en": en or seed_entry.get("name_en", f"{profile['name_en']} Seed"),
                    "name_zh": zh if en else seed_entry.get("name_zh", f"{profile['name_zh']}種子"),
                    "entity": entity_details(match["adult_id"], profile, catalog),
                    "evidence": match["source"],
                }
            else:
                representatives[raw_id] = virtual_record(profile, catalog, f"{raw_id}Config.cs")
        elif profile["kind"] == "fauna":
            match = next((record for record in critters if raw_id.lower() == record["adult_id"].lower()), None)
            category = "Egg"
            if match:
                en, zh = localized(strings_en, strings_zh, match["name_key"])
                representatives[raw_id] = {
                    "id": match["egg_id"], "kind": "egg", "is_virtual": False,
                    "name_en": en or f"{profile['name_en']} Egg",
                    "name_zh": zh if en else f"{profile['name_zh']}蛋",
                    "entity": entity_details(match["adult_id"], profile, catalog),
                    "evidence": match["source"],
                }
            else:
                representatives[raw_id] = virtual_record(profile, catalog, f"{raw_id}Config.cs")
        else:
            continue
        representatives[raw_id]["primary_category"] = category

    return {
        "schema_version": 1,
        "baseline": "ONI U59-740622 / Steam build 24423041",
        "category_source": "GameTags.cs + AllResourcesScreen.cs (localized alphabetical display)",
        "prefab_category_source": "*Config.cs ExtendEntityToFood + EntityTemplates.cs GameTags.Edible",
        "representative_source": "Installed U59 Assembly-CSharp decompilation + installed strings + Dolphinwing strings.po",
        "categories": categories,
        "prefab_categories": prefab_category_map,
        "representatives": dict(sorted(representatives.items())),
    }


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--decompiled-source", type=Path, default=Path(os.environ.get("ONI_DECOMPILED_SOURCE", "/tmp/oni-u59-src")))
    parser.add_argument("--assets", type=Path, default=Path(os.environ.get("ONI_STREAMING_ASSETS", DEFAULT_ASSETS)))
    parser.add_argument("--po", type=Path, default=Path(os.environ.get("DOLPHINWING_PO_PATH", DEFAULT_PO)))
    parser.add_argument("--output", type=Path, default=OUTPUT)
    args = parser.parse_args()
    payload = build(args.decompiled_source, args.assets, args.po)
    args.output.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n")
    virtual = sum(item["is_virtual"] for item in payload["representatives"].values())
    print(f"wrote {len(payload['categories'])} categories and {len(payload['representatives'])} mappings ({virtual} virtual)")


if __name__ == "__main__":
    main()
