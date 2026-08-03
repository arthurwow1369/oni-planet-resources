#!/usr/bin/env python3
"""Extract ONI world, terrain and resource data for the planet-resource planner.

Environment overrides:
  ONI_STREAMING_ASSETS  Oxygen Not Included StreamingAssets directory
  DOLPHINWING_PO_PATH   Dolphinwing Traditional Chinese strings.po
"""
from __future__ import annotations

import argparse
import ast
import json
import os
import re
from collections import defaultdict
from pathlib import Path
from typing import Any

import yaml

ASSETS: Path
PO_PATH: Path
OUT = Path(__file__).resolve().parents[1] / "public/data"
CATALOG_PATH = (
    Path(__file__).resolve().parents[1]
    / "research/resource-catalog/resource-catalog.json"
)
ENTITY_PROFILES_PATH = (
    Path(__file__).resolve().parents[1]
    / "research/terrain-research/entity-profiles.json"
)
GAME_TAXONOMY_PATH = (
    Path(__file__).resolve().parents[1]
    / "research/resource-catalog/game-taxonomy.json"
)
SPECIAL_RESOURCE_RESEARCH_PATH = (
    Path(__file__).resolve().parents[1]
    / "research/special-resources/special-resources.json"
)
RESOURCE_CATALOG: dict[str, dict[str, Any]] = {}
ENTITY_REPRESENTATIVES: dict[str, dict[str, Any]] = {}
PREFAB_CATEGORIES: dict[str, str] = {}
ELEMENT_CATEGORIES: dict[str, str] = {}
GAME_CATEGORIES: list[dict[str, str]] = []
FEATURE_ENTITY_ALIASES = {"AnyLiquidPacu": "Pacu", "BeeHive": "Bee"}
RESOURCE_ID_ALIASES = {"dirt": "Dirt"}
NON_RESOURCE_FEATURE_ENTITIES = {"Vacuum"}
UNCATALOGUED_CANDIDATES: set[str] = set()
UNRESOLVED_FEATURES: set[str] = set()

LINK_RE = re.compile(r"</?link(?:=\"[^\"]*\")?>", re.I)
TAG_RE = re.compile(r"<[^>]+>")

CATEGORY_MAP: dict[str, list[str]] = {
    # Food and agricultural inputs
    "MealLice": ["food"], "ColdWheatSeed": ["food"], "SpiceNut": ["food"],
    "PrickleFruit": ["food"], "BeanPlantSeed": ["food"], "Lettuce": ["food"],
    "Mushroom": ["food"], "ForestTree": ["food", "power"], "Dirt": ["food", "industrial"],
    "Phosphorite": ["food", "industrial"], "Fertilizer": ["food", "industrial"],
    # Oxygen chains
    "Algae": ["oxygen", "food"], "SlimeMold": ["oxygen", "industrial"],
    "DirtyWater": ["oxygen", "liquid"], "Water": ["oxygen", "food", "liquid"],
    "Rust": ["oxygen", "industrial"], "OxyRock": ["oxygen", "industrial"],
    "Oxygen": ["oxygen", "gas"], "ContaminatedOxygen": ["oxygen", "gas"],
    # Power
    "Carbon": ["power", "industrial"], "Methane": ["power", "gas"],
    "Hydrogen": ["power", "gas"], "Petroleum": ["power", "liquid"],
    "CrudeOil": ["power", "liquid", "industrial"], "Steam": ["power", "gas"],
    "UraniumOre": ["power", "radiation", "industrial"],
    "EnrichedUranium": ["power", "radiation"], "DepletedUranium": ["radiation", "industrial"],
    # Radiation
    "Radium": ["radiation"], "Corium": ["radiation"],
    # Late game
    "Niobium": ["lateGame", "industrial"], "TempConductorSolid": ["lateGame", "industrial"],
    "Isoresin": ["lateGame"], "IsoSap": ["lateGame", "liquid"], "Resin": ["lateGame", "liquid"],
    "Fullerene": ["lateGame"], "SuperCoolant": ["lateGame", "liquid"],
    "Polypropylene": ["lateGame", "industrial"], "ViscoGel": ["lateGame", "liquid"],
    "Graphite": ["lateGame", "industrial"], "Graphene": ["lateGame", "industrial"],
    "Brackwax": ["lateGame", "industrial"], "Plastium": ["lateGame", "industrial"],
    "Katairite": ["lateGame", "industrial"],
    # Industrial solids
    "BasicFabric": ["industrial"], "IronOre": ["industrial"], "CopperOre": ["industrial"],
    "GoldAmalgam": ["industrial", "decoration"], "AluminumOre": ["industrial"],
    "Cobaltite": ["industrial"], "Wolframite": ["lateGame", "industrial"], "Lead": ["industrial"],
    "Iron": ["industrial"], "Copper": ["industrial"], "Gold": ["industrial", "decoration"],
    "Aluminum": ["industrial"], "Cobalt": ["industrial"], "Tungsten": ["lateGame", "industrial"],
    "Steel": ["industrial"], "Diamond": ["industrial", "decoration"],
    "Sand": ["industrial"], "SedimentaryRock": ["industrial"], "IgneousRock": ["industrial"],
    "Granite": ["industrial", "decoration"], "Obsidian": ["industrial"],
    "BleachStone": ["industrial"], "Sulfur": ["food", "industrial"], "Salt": ["food", "industrial"],
    "Fossil": ["industrial"], "Lime": ["industrial"], "Ceramic": ["lateGame", "industrial"],
    # Decor
    "Bismuth": ["decoration", "industrial"], "Bismuthinite": ["decoration", "industrial"],
    "Diamond": ["industrial", "decoration"],
    # Utility fluids/gases
    "SaltWater": ["liquid", "food"], "Brine": ["liquid", "food"],
    "Ethanol": ["power", "liquid"], "Naphtha": ["liquid", "industrial"],
    "CarbonDioxide": ["gas"], "ChlorineGas": ["gas", "industrial"],
    "SourGas": ["power", "gas"], "Helium": ["gas", "radiation"],
    "Magma": ["power", "liquid"], "LiquidOxygen": ["oxygen", "liquid"],
    "LiquidHydrogen": ["power", "liquid"],
}

USE_EN = {
    "Algae": "Convert directly to oxygen; also supports Pacu ranching.",
    "SlimeMold": "Off-gasses polluted oxygen and can be distilled into algae.",
    "DirtyWater": "Off-gasses polluted oxygen; sieve into clean water.",
    "Water": "Electrolyze into oxygen and hydrogen; supports many crops.",
    "Rust": "Rust Deoxidizer feedstock for oxygen and iron ore.",
    "OxyRock": "Portable oxygen source that off-gasses oxygen.",
    "Carbon": "Fuel for Coal Generators and industrial carbon feedstock.",
    "Methane": "Fuel for Natural Gas Generators.",
    "Hydrogen": "Fuel for Hydrogen Generators and advanced rockets.",
    "Petroleum": "High-output generator and rocket fuel.",
    "UraniumOre": "Refine for research-reactor fuel and radiation systems.",
    "Niobium": "Alloy with tungsten into Thermium for extreme-temperature machinery.",
    "Wolframite": "Refine into tungsten, then alloy with niobium into Thermium.",
    "Isoresin": "Rare ingredient for Insulation; sourced through Experiment 52B.",
    "Fullerene": "Rare ingredient used for Super Coolant production.",
    "Graphite": "Late-game carbon material associated with Fullerene production.",
    "BasicFabric": "Reed Fiber for Atmo Suits, clothing and insulation recipes.",
    "Diamond": "Drillcone consumable and high-conductivity/decor material.",
}
USE_ZH = {
    "Algae": "可直接製氧；也能支援帕庫養殖。",
    "SlimeMold": "會釋放汙氧，也可蒸餾成藻類。",
    "DirtyWater": "會釋放汙氧；過濾後可得淨水。",
    "Water": "電解成氧氣與氫氣，也可灌溉多種作物。",
    "Rust": "除鏽機的原料，可產生氧氣及鐵礦。",
    "OxyRock": "會釋放氧氣的可攜式氧源。",
    "Carbon": "煤炭發電機燃料及工業碳原料。",
    "Methane": "天然氣發電機燃料。",
    "Hydrogen": "氫氣發電機及進階火箭燃料。",
    "Petroleum": "高輸出發電及火箭燃料。",
    "UraniumOre": "精煉後供研究反應爐及輻射系統使用。",
    "Niobium": "與鎢製成導熱質，用於極端溫度機械。",
    "Wolframite": "精煉成鎢，再與鈮製成導熱質。",
    "Isoresin": "製作隔熱質的稀有原料；來源鏈始於實驗體 52B。",
    "Fullerene": "製作超級冷卻液的稀有原料。",
    "Graphite": "與富勒烯生產鏈相關的後期碳材料。",
    "BasicFabric": "頂針蘆葦纖維，可製太空服、衣物及隔熱配方。",
    "Diamond": "鑽頭消耗品，也可作高導熱及裝飾材料。",
}

GAS = {"Oxygen", "ContaminatedOxygen", "CarbonDioxide", "Hydrogen", "Methane", "ChlorineGas", "Steam", "SourGas", "Helium"}
LIQUID = {"Water", "DirtyWater", "SaltWater", "Brine", "Petroleum", "CrudeOil", "Ethanol", "Naphtha", "Magma", "LiquidOxygen", "LiquidHydrogen", "IsoSap", "Resin", "SuperCoolant", "ViscoGel"}
PLANT_WORDS = ("Plant", "Seed", "Mushroom", "Wheat", "Tree", "Grass", "Vine", "Flower", "Lily", "Reed", "Fern", "Lettuce")
CRITTER_WORDS = ("Puft", "Pacu", "Hatch", "Drecko", "Morb", "Moo", "Bee", "Beeta", "Bug", "Crab", "Pip", "Vole", "Squirrel", "Worm")

KNOWN_NAMES = {
    "SlimeMold": ("Slime", "軟泥"), "DirtyWater": ("Polluted Water", "汙水"),
    "ContaminatedOxygen": ("Polluted Oxygen", "汙氧"), "Carbon": ("Coal", "煤炭"),
    "Methane": ("Natural Gas", "天然氣"), "Katairite": ("Abyssalite", "深淵晶石"),
    "Unobtanium": ("Neutronium", "零號元素"), "OxyRock": ("Oxylite", "氧石"),
    "BasicFabric": ("Reed Fiber", "蘆葦纖維"), "TempConductorSolid": ("Thermium", "導熱質"),
}

ZONE_NAMES = {
    "Space": ("Space Biome", "太空生態"), "MagmaCore": ("Magma Biome", "岩漿生態"),
    "BoggyMarsh": ("Marsh Biome", "草澤生態"), "Jungle": ("Jungle Biome", "叢林生態"),
    "FrozenWastes": ("Frozen Biome", "冰凍生態"), "Ocean": ("Ocean Biome", "海洋生態"),
    "Rust": ("Rust Biome", "鏽蝕生態"), "Forest": ("Forest Biome", "森林生態"),
    "OilField": ("Oil Biome", "原油生態"), "Barren": ("Barren Biome", "貧瘠生態"),
}


def clean(s: str | None) -> str:
    if not s:
        return ""
    return TAG_RE.sub("", LINK_RE.sub("", s)).replace("\\n", " ").strip()


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
            current[active].append(decode_po_value(line))
        elif not line:
            if "msgctxt" in current:
                key = "".join(current["msgctxt"])
                result[key] = ("".join(current.get("msgid", [])), "".join(current.get("msgstr", [])))
            current = {}; active = None
    return result


def load_yaml(path: Path) -> dict[str, Any]:
    try:
        data = yaml.safe_load(path.read_text(encoding="utf-8", errors="replace"))
        return data if isinstance(data, dict) else {}
    except Exception:
        return {}


def namespace_for(path: Path) -> str:
    parts = path.parts
    if "dlc" in parts:
        i = parts.index("dlc")
        if i + 1 < len(parts):
            return parts[i + 1]
    return "base"


def build_index(kind: str) -> dict[tuple[str, str], Path]:
    index: dict[tuple[str, str], Path] = {}
    for path in ASSETS.glob(f"**/worldgen/{kind}/**/*.yaml"):
        ns = namespace_for(path)
        rel = path.relative_to(next(p for p in path.parents if p.name == "worldgen") / kind).with_suffix("").as_posix()
        index[(ns, rel)] = path
        index.setdefault(("any", rel), path)
    return index


def apply_mob_overlay(result: dict[str, str], paths: list[Path]) -> None:
    for path in sorted(paths, key=lambda item: item.relative_to(ASSETS).as_posix()):
        table = load_yaml(path).get("MobLookupTable", {}) or {}
        for tag in table.get("remove", []) or []:
            result.pop(str(tag), None)
        for tag, details in (table.get("add", {}) or {}).items():
            details = details or {}
            result[str(tag)] = str(details.get("prefabName", tag))


def build_mob_lookups() -> dict[str, dict[str, str]]:
    by_namespace: dict[str, list[Path]] = defaultdict(list)
    for path in ASSETS.glob("**/worldgen/mobs.yaml"):
        by_namespace[namespace_for(path)].append(path)

    base: dict[str, str] = {}
    apply_mob_overlay(base, by_namespace.get("base", []))
    result = {"base": base}
    for namespace, paths in by_namespace.items():
        if namespace == "base":
            continue
        overlay = dict(base)
        apply_mob_overlay(overlay, paths)
        result[namespace] = overlay
    return result


def split_ref(ref: str, prefix: str) -> tuple[str, str]:
    if "::" in ref:
        ns, rest = ref.split("::", 1)
    else:
        ns, rest = "base", ref
    marker = prefix + "/"
    if marker in rest:
        rest = rest.split(marker, 1)[1]
    return ns, rest


def resolve_ref(index: dict[tuple[str, str], Path], ref: str, prefix: str, preferred_ns: str = "base") -> Path | None:
    ns, rel = split_ref(ref, prefix)
    for key in ((ns, rel), (preferred_ns, rel), ("base", rel), ("any", rel)):
        if key in index:
            return index[key]
    return None


def translated(strings: dict[str, tuple[str, str]], string_id: str, fallback: str) -> tuple[str, str]:
    en, zh = strings.get(string_id, (fallback, ""))
    en = clean(en) or fallback
    zh = clean(zh) or en
    return en, zh


def element_name(strings: dict[str, tuple[str, str]], simhash: str) -> tuple[str, str]:
    if simhash in KNOWN_NAMES:
        return KNOWN_NAMES[simhash]
    sid = f"STRINGS.ELEMENTS.{simhash.upper()}.NAME"
    en, zh = translated(strings, sid, re.sub(r"(?<!^)(?=[A-Z])", " ", simhash))
    return en, zh


def resource_type(simhash: str) -> str:
    if simhash in GAS: return "gas"
    if simhash in LIQUID: return "liquid"
    if any(w.lower() in simhash.lower() for w in PLANT_WORDS): return "plant"
    if any(w.lower() in simhash.lower() for w in CRITTER_WORDS): return "critter"
    return "solid"


def load_resource_catalog(path: Path = CATALOG_PATH) -> dict[str, dict[str, Any]]:
    payload = json.loads(path.read_text(encoding="utf-8"))
    entries = payload.get("entries")
    if not isinstance(entries, dict):
        raise SystemExit(f"invalid resource catalog: {path}")
    profiles = json.loads(ENTITY_PROFILES_PATH.read_text(encoding="utf-8"))["profiles"]
    for profile in profiles:
        prefab_id = profile["prefab_id"]
        if prefab_id in entries:
            continue
        entries[prefab_id] = {
            "name_en": profile["name_en"],
            "name_zh": profile["name_zh"],
            "type": "critter" if profile["kind"] == "fauna" else "plant",
            "categories": [
                "decoration" if role == "decor" else role
                for role in profile.get("roles", [])
            ],
            "use_en": profile["summary_en"],
            "use_zh": profile["summary_zh"],
        }
    incomplete = sorted(
        simhash
        for simhash, entry in entries.items()
        if not isinstance(entry, dict)
        or not entry.get("name_en")
        or not entry.get("name_zh")
        or not entry.get("use_en")
        or not entry.get("use_zh")
    )
    if incomplete:
        raise SystemExit(f"incomplete resource catalog entries: {incomplete}")
    return entries


def load_game_taxonomy(path: Path = GAME_TAXONOMY_PATH) -> tuple[list[dict[str, str]], dict[str, dict[str, Any]], dict[str, str]]:
    payload = json.loads(path.read_text(encoding="utf-8"))
    categories = payload.get("categories")
    representatives = payload.get("representatives")
    prefab_categories = payload.get("prefab_categories")
    if not isinstance(categories, list) or not isinstance(representatives, dict) or not isinstance(prefab_categories, dict):
        raise SystemExit(f"invalid game taxonomy: {path}")
    return categories, representatives, prefab_categories


def load_element_categories() -> dict[str, str]:
    result: dict[str, str] = {}
    for path in sorted((ASSETS / "elements").glob("*.yaml")):
        for entry in load_yaml(path).get("elements", []):
            if not isinstance(entry, dict) or not entry.get("elementId"):
                continue
            result[str(entry["elementId"])] = str(entry.get("materialCategory") or entry.get("state") or "Other")
    return result


def representative_for_output(record: dict[str, Any]) -> dict[str, Any]:
    return {
        "id": record["id"],
        "kind": record["kind"],
        "isVirtual": record["is_virtual"],
        "name_en": record["name_en"],
        "name_zh": record["name_zh"],
        "entity": record["entity"],
        "mechanism_en": record.get("mechanism_en", ""),
        "mechanism_zh": record.get("mechanism_zh", ""),
        "sourceEvidence": record.get("evidence", ""),
    }


def add_resource(bucket: dict[str, dict[str, Any]], strings: dict[str, tuple[str, str]], simhash: str, weight: float = 0, source: str = "terrain") -> None:
    if not simhash or simhash in {"Vacuum", "Void"}: return
    simhash = str(simhash)
    if simhash.startswith("med_"):
        simhash = simhash[4:]
    en, zh = element_name(strings, simhash)
    catalog = RESOURCE_CATALOG.get(simhash, {})
    representative = ENTITY_REPRESENTATIVES.get(simhash)
    primary_category = (
        representative["primary_category"]
        if representative
        else PREFAB_CATEGORIES.get(simhash, ELEMENT_CATEGORIES.get(simhash, "Other"))
    )
    item = bucket.setdefault(simhash, {
        "simhash": simhash,
        "name_en": catalog.get("name_en", en),
        "name_zh": catalog.get("name_zh", zh),
        "type": catalog.get("type", resource_type(simhash)),
        "categories": catalog.get("categories", CATEGORY_MAP.get(simhash, [])),
        "primaryCategory": primary_category,
        **({"representative": representative_for_output(representative)} if representative else {}),
        "use_en": catalog.get("use_en", USE_EN.get(simhash, "")),
        "use_zh": catalog.get("use_zh", USE_ZH.get(simhash, "")),
        "weight": 0.0, "sources": [],
    })
    item["weight"] = round(item["weight"] + float(weight or 0), 4)
    if source not in item["sources"]: item["sources"].append(source)


def biome_resources(ref: str, ns: str, biome_index: dict[tuple[str, str], Path], strings: dict[str, tuple[str, str]]) -> dict[str, dict[str, Any]]:
    result: dict[str, dict[str, Any]] = {}
    _, rel = split_ref(ref, "biomes")
    bits = rel.split("/")
    file_rel = bits[0]
    section = bits[1] if len(bits) > 1 else None
    # DLC biome files are overlays: the runtime first loads the base lookup table,
    # then applies the DLC's add/remove operations. Merge both sources here so a
    # DLC-local file that only adds one section does not hide base sections.
    paths: list[Path] = []
    for key in (("base", file_rel), (ns, file_rel), ("any", file_rel)):
        candidate = biome_index.get(key)
        if candidate and candidate not in paths:
            paths.append(candidate)
    sections: dict[str, list[Any]] = {}
    for path in paths:
        table = load_yaml(path).get("TerrainBiomeLookupTable", {})
        if not isinstance(table, dict):
            continue
        for removed in table.get("remove", []) or []:
            sections.pop(str(removed), None)
        for key, values in (table.get("add", {}) or {}).items():
            sections[str(key)] = values if isinstance(values, list) else []
    chosen = sections.get(section, []) if section else [x for values in sections.values() for x in values]
    if not isinstance(chosen, list): return result
    for row in chosen:
        if isinstance(row, dict) and row.get("content"):
            add_resource(result, strings, str(row["content"]), row.get("bandSize", 0), "biome")
    return result


def terrain_record(
    path: Path,
    ref_id: str,
    strings: dict[str, tuple[str, str]],
    biome_index: dict[tuple[str, str], Path],
    feature_index: dict[tuple[str, str], Path],
    mob_lookups: dict[str, dict[str, str]],
) -> dict[str, Any]:
    data = load_yaml(path)
    ns = namespace_for(path)
    mob_lookup = mob_lookups.get(ns, mob_lookups["base"])
    resources: dict[str, dict[str, Any]] = {}

    def add_spawn_tag(tag: object, weight: float = 0, source: str = "spawn-tag") -> None:
        raw_tag = str(tag)
        prefab_id = mob_lookup.get(raw_tag)
        if prefab_id in RESOURCE_CATALOG:
            add_resource(resources, strings, prefab_id, weight, source)
        elif prefab_id:
            UNCATALOGUED_CANDIDATES.add(prefab_id)
        elif raw_tag.startswith("med_") and raw_tag[4:] in RESOURCE_CATALOG:
            add_resource(resources, strings, raw_tag[4:], weight, source)
        elif raw_tag.startswith("med_"):
            UNCATALOGUED_CANDIDATES.add(raw_tag[4:])

    for biome in data.get("biomes", []) or []:
        if not isinstance(biome, dict) or not biome.get("name"): continue
        for simhash, item in biome_resources(str(biome["name"]), ns, biome_index, strings).items():
            add_resource(resources, strings, simhash, item.get("weight", 0), "biome")
        for tag in biome.get("tags", []) or []:
            add_spawn_tag(tag, float(biome.get("weight", 0) or 0))
    for tag in data.get("tags", []) or []:
        add_spawn_tag(tag)

    feature_references = [
        str(item["type"])
        for item in data.get("features", []) or []
        if isinstance(item, dict) and item.get("type")
    ]
    for reference in feature_references:
        feature_path = resolve_ref(feature_index, reference, "features", ns)
        if feature_path is None:
            UNRESOLVED_FEATURES.add(f"{ns}:{reference}")
            continue
        feature_source = feature_path.relative_to(ASSETS).as_posix()
        feature = load_yaml(feature_path)
        for tag in feature.get("biomeTags", []) or []:
            add_spawn_tag(tag, source=feature_source)
        for group in (feature.get("ElementChoiceGroups", {}) or {}).values():
            for choice in (group or {}).get("choices", []) or []:
                if not isinstance(choice, dict) or not choice.get("element"):
                    continue
                raw_resource_id = str(choice["element"])
                if raw_resource_id in NON_RESOURCE_FEATURE_ENTITIES:
                    continue
                resource_id = RESOURCE_ID_ALIASES.get(raw_resource_id, raw_resource_id)
                if resource_id in RESOURCE_CATALOG:
                    add_resource(
                        resources,
                        strings,
                        resource_id,
                        float(choice.get("weight", 1) or 1),
                        feature_source,
                    )
                else:
                    UNCATALOGUED_CANDIDATES.add(resource_id)
        for mob in feature.get("internalMobs", []) or []:
            if not isinstance(mob, dict) or not mob.get("type"):
                continue
            prefab_id = FEATURE_ENTITY_ALIASES.get(str(mob["type"]), str(mob["type"]))
            if prefab_id not in RESOURCE_CATALOG:
                UNCATALOGUED_CANDIDATES.add(prefab_id)
                continue
            count = mob.get("count", {}) or {}
            weight = float(count.get("max", count.get("min", 1)) or 1)
            add_resource(resources, strings, prefab_id, weight, feature_source)

    zone = str(data.get("zoneType", "Unknown"))
    fallback = path.stem.replace("med_", "")
    sid = f"STRINGS.SUBWORLDS.{zone.upper()}.NAME"
    name_en, name_zh = translated(strings, sid, ZONE_NAMES.get(zone, (fallback, fallback))[0])
    if zone in ZONE_NAMES and name_zh == name_en:
        name_zh = ZONE_NAMES[zone][1]
    return {
        "id": ref_id, "name_en": name_en, "name_zh": name_zh,
        "variant_en": fallback, "variant_zh": fallback,
        "zoneType": zone, "dlcTag": ns,
        "resources": sorted(resources.values(), key=lambda x: x["name_en"]),
        "features": sorted(feature_references),
    }


def attach_special_resource_routes(
    worlds: list[dict[str, Any]],
    subworlds: list[dict[str, Any]],
    source_path: Path,
) -> dict[str, Any]:
    data = json.loads(source_path.read_text(encoding="utf-8"))
    routes = data.get("routes", [])
    sources = data.get("sources", [])
    route_ids = [route["id"] for route in routes]
    if len(route_ids) != len(set(route_ids)):
        raise ValueError("Special-resource route IDs must be unique")
    source_ids = {source["id"] for source in sources}
    for route in routes:
        missing_sources = sorted(set(route.get("source_ids", [])) - source_ids)
        if missing_sources:
            raise ValueError(f"Special-resource route {route['id']} has unknown sources: {missing_sources}")

    resources_by_subworld = {
        subworld["id"]: {resource["simhash"] for resource in subworld.get("resources", [])}
        for subworld in subworlds
    }
    for world in worlds:
        world_resource_ids: set[str] = set()
        subworld_ids = world.get("subworldIds", []) + world.get("clusterExtensionSubworldIds", [])
        for subworld_id in subworld_ids:
            world_resource_ids.update(resources_by_subworld.get(subworld_id, set()))
        world_guarantees = set(world.get("guarantees", []))
        matched_ids: list[str] = []
        for route in routes:
            match = route.get("match", {})
            resource_match = bool(world_resource_ids.intersection(match.get("resource_ids", [])))
            guarantee_match = bool(world_guarantees.intersection(match.get("guarantees", [])))
            world_match = world["id"] in match.get("world_ids", [])
            if resource_match or guarantee_match or world_match:
                matched_ids.append(route["id"])
        world["specialResourceIds"] = matched_ids

    public_routes = [
        {key: value for key, value in route.items() if key != "match"}
        for route in routes
    ]
    return {
        "schema_version": data["schema_version"],
        "baseline": data["baseline"],
        "routes": public_routes,
        "sources": sources,
    }


def main() -> None:
    global ASSETS, PO_PATH, RESOURCE_CATALOG, ENTITY_REPRESENTATIVES, PREFAB_CATEGORIES, ELEMENT_CATEGORIES, GAME_CATEGORIES
    UNCATALOGUED_CANDIDATES.clear()
    UNRESOLVED_FEATURES.clear()
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--assets",
        type=Path,
        default=os.environ.get("ONI_STREAMING_ASSETS"),
        help="ONI StreamingAssets directory (or set ONI_STREAMING_ASSETS)",
    )
    parser.add_argument(
        "--translations",
        type=Path,
        default=os.environ.get("DOLPHINWING_PO_PATH"),
        help="Dolphinwing strings.po file (or set DOLPHINWING_PO_PATH)",
    )
    args = parser.parse_args()
    if args.assets is None:
        parser.error("provide --assets or set ONI_STREAMING_ASSETS")
    if args.translations is None:
        parser.error("provide --translations or set DOLPHINWING_PO_PATH")
    ASSETS = args.assets.expanduser()
    PO_PATH = args.translations.expanduser()
    if not ASSETS.exists(): raise SystemExit(f"StreamingAssets not found: {ASSETS}")
    if not PO_PATH.exists(): raise SystemExit(f"Dolphinwing strings.po not found: {PO_PATH}")
    RESOURCE_CATALOG = load_resource_catalog()
    GAME_CATEGORIES, ENTITY_REPRESENTATIVES, PREFAB_CATEGORIES = load_game_taxonomy()
    ELEMENT_CATEGORIES = load_element_categories()
    OUT.mkdir(parents=True, exist_ok=True)
    strings = parse_po(PO_PATH)
    world_index = build_index("worlds")
    subworld_index = build_index("subworlds")
    biome_index = build_index("biomes")
    feature_index = build_index("features")
    mob_lookups = build_mob_lookups()

    # Cluster-level additions and guaranteed templates, keyed by world reference.
    cluster_extra: dict[str, set[str]] = defaultdict(set)
    cluster_rules: dict[str, set[str]] = defaultdict(set)
    cluster_roles: dict[str, set[str]] = defaultdict(set)
    for path in ASSETS.glob("**/worldgen/clusters/**/*.yaml"):
        data = load_yaml(path)
        if data.get("skip"):
            continue
        placements = data.get("worldPlacements", []) or []
        raw_placements = [
            (match.group(1), (match.group(2) or "").lower())
            for line in path.read_text(encoding="utf-8-sig").splitlines()
            if (match := re.match(r"\s*-\s+world:\s+([^\s#]+)(?:\s*#\s*(.*))?", line))
        ]
        if len(raw_placements) != len(placements):
            raise SystemExit(f"cluster placement parse mismatch: {path}")
        start_world_index = data.get("startWorldIndex")
        for index, placement in enumerate(placements):
            if not isinstance(placement, dict) or not placement.get("world"): continue
            wid = str(placement["world"])
            raw_wid, comment = raw_placements[index]
            if raw_wid != wid:
                raise SystemExit(f"cluster placement order mismatch: {path}: {raw_wid} != {wid}")
            leaf = wid.rsplit("/", 1)[-1]
            role = (
                "start"
                if placement.get("locationType") == "StartWorld" or index == start_world_index
                else "warp"
                if "warp" in leaf.lower() or "warp world" in comment or "warp destination" in comment
                else "general"
            )
            cluster_roles[wid].add(role)
            mixing = placement.get("worldMixing", {}) or {}
            for row in mixing.get("additionalSubworldFiles", []) or []:
                if isinstance(row, dict) and row.get("name"): cluster_extra[wid].add(str(row["name"]))
            for rule in mixing.get("additionalWorldTemplateRules", []) or []:
                if isinstance(rule, dict):
                    for name in rule.get("names", []) or []: cluster_rules[wid].add(str(name))

    terrains: dict[str, dict[str, Any]] = {}
    worlds: list[dict[str, Any]] = []
    global_resources: dict[str, dict[str, Any]] = {}

    for (ns, rel), path in sorted(world_index.items()):
        if ns == "any": continue
        data = load_yaml(path)
        if not data.get("name"): continue
        refs: list[str] = []
        for key in ("subworldFiles", "unknownCellsAllowedSubworlds"):
            for row in data.get(key, []) or []:
                ref = row.get("name") if isinstance(row, dict) else row
                if ref: refs.append(str(ref))
        world_ref = f"{ns}::worlds/{rel}" if ns != "base" else f"worlds/{rel}"
        extras = sorted(cluster_extra.get(world_ref, set()) | cluster_extra.get(f"expansion1::worlds/{rel}", set()) | cluster_extra.get(f"dlc5::worlds/{rel}", set()))
        refs.extend(extras)
        normalized_ids: list[str] = []
        for ref in refs:
            sw_path = resolve_ref(subworld_index, ref, "subworlds", ns)
            if not sw_path: continue
            sw_ns = namespace_for(sw_path)
            sw_rel = sw_path.relative_to(next(p for p in sw_path.parents if p.name == "subworlds")).with_suffix("").as_posix()
            sw_id = f"{sw_ns}::subworlds/{sw_rel}" if sw_ns != "base" else f"subworlds/{sw_rel}"
            if sw_id not in terrains:
                terrains[sw_id] = terrain_record(
                    sw_path,
                    sw_id,
                    strings,
                    biome_index,
                    feature_index,
                    mob_lookups,
                )
            if sw_id not in normalized_ids: normalized_ids.append(sw_id)
            for item in terrains[sw_id]["resources"]:
                if item["simhash"] not in global_resources:
                    global_resources[item["simhash"]] = {k: v for k, v in item.items() if k not in {"weight", "sources"}}
        name_en, name_zh = translated(strings, str(data["name"]), path.stem)
        desc_en, desc_zh = translated(strings, str(data.get("description", "")), "") if data.get("description") else ("", "")
        own_rules = []
        for rule in data.get("worldTemplateRules", []) or []:
            if isinstance(rule, dict): own_rules.extend(str(x) for x in (rule.get("names", []) or []))
        guarantees = sorted(set(own_rules) | cluster_rules.get(world_ref, set()) | cluster_rules.get(f"expansion1::worlds/{rel}", set()) | cluster_rules.get(f"dlc5::worlds/{rel}", set()))
        roles = sorted(
            cluster_roles.get(world_ref, set()),
            key={"start": 0, "warp": 1, "general": 2}.__getitem__,
        )
        worldsize = data.get("worldsize", {}) or {}
        width = int(worldsize.get("X", 0))
        height = int(worldsize.get("Y", 0))
        if width <= 0 or height <= 0:
            raise SystemExit(f"world is missing a valid worldsize: {world_ref}")
        worlds.append({
            "id": world_ref, "name_en": name_en, "name_zh": name_zh,
            "desc_en": desc_en, "desc_zh": desc_zh, "dlcTag": ns,
            "subworldIds": normalized_ids, "clusterExtensionSubworldIds": [x for x in normalized_ids if any(e.split('/')[-1] in x for e in extras)],
            "guarantees": guarantees,
            "width": width, "height": height,
            "clusterRoles": roles, "referencedByCluster": bool(roles),
            "internal": bool(data.get("skip")),
        })

    worlds.sort(key=lambda x: (x["dlcTag"], x["name_en"]))
    terrain_list = sorted(terrains.values(), key=lambda x: (x["dlcTag"], x["name_en"], x["variant_en"]))
    resource_list = sorted(global_resources.values(), key=lambda x: x["name_en"])
    special_resources = attach_special_resource_routes(worlds, terrain_list, SPECIAL_RESOURCE_RESEARCH_PATH)
    if UNRESOLVED_FEATURES:
        raise SystemExit("unresolved worldgen features: " + ", ".join(sorted(UNRESOLVED_FEATURES)))
    if UNCATALOGUED_CANDIDATES:
        raise SystemExit(
            "feature/spawn resources require catalog entries: "
            + ", ".join(sorted(UNCATALOGUED_CANDIDATES))
        )
    missing_catalog = sorted(
        item["simhash"] for item in resource_list
        if item["simhash"] not in RESOURCE_CATALOG
    )
    if missing_catalog:
        raise SystemExit(
            "new worldgen resources require catalog entries: "
            + ", ".join(missing_catalog)
        )
    missing_uses = sorted(
        item["simhash"] for item in resource_list
        if not item.get("use_en") or not item.get("use_zh")
    )
    if missing_uses:
        raise SystemExit("resources missing curated uses: " + ", ".join(missing_uses))
    for name, payload in (
        ("worlds.json", worlds),
        ("subworlds.json", terrain_list),
        ("resources.json", resource_list),
        ("game-categories.json", GAME_CATEGORIES),
        ("special-resources.json", special_resources),
    ):
        (OUT / name).write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")

    mapped = sum(bool(x.get("categories")) for x in resource_list)
    translated_count = sum(1 for en, zh in strings.values() if clean(zh) and clean(zh) != clean(en))
    stats = {
        "worlds": len(worlds), "subworlds": len(terrain_list), "resources": len(resource_list),
        "categorizedResources": mapped,
        "describedResources": len(resource_list) - len(missing_uses),
        "translations": translated_count,
        "uncataloguedCandidates": sorted(UNCATALOGUED_CANDIDATES),
        "unresolvedFeatures": sorted(UNRESOLVED_FEATURES),
    }
    (OUT / "stats.json").write_text(json.dumps(stats, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps(stats, ensure_ascii=False, indent=2))

if __name__ == "__main__":
    main()
