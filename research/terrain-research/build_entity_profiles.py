#!/usr/bin/env python3
"""Build bilingual source-linked profiles for every displayed flora/fauna prefab."""

from __future__ import annotations

import json
import importlib.util
import re
from datetime import date
from pathlib import Path
from typing import Any

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[1]


def load_local_module(name: str, path: Path) -> Any:
    spec = importlib.util.spec_from_file_location(name, path)
    if spec is None or spec.loader is None:
        raise SystemExit(f"cannot load local module: {path}")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


extract_module = load_local_module("extract_data", ROOT / "scripts/extract_data.py")
localized_module = load_local_module(
    "build_localized_dataset", HERE / "build_localized_dataset.py"
)
clean = extract_module.clean
parse_po = extract_module.parse_po
translated_entity = localized_module.translated_entity

GAME_DATA = HERE / "game-data.json"
WIKI_DATA = HERE / "entity-wiki-extracts.json"
GLOSSARY = HERE / "dolphinwing-glossary.zh-TW.json"
OUTPUT = HERE / "entity-profiles.json"
DEFAULT_PO = Path(
    "~/Library/Application Support/unity.Klei.Oxygen Not Included/"
    "mods/Steam/2906930548/strings.po"
).expanduser()

PAGE_TITLE_OVERRIDES = {
    "Arbor Acorn": "Arbor Tree",
    "Beeta (via Beeta Hive)": "Beeta",
    "Buried Muckroot": "Muckroot",
    "Dusk Cap Spore": "Dusk Cap",
    "Idylla Seed": "Idylla Flower",
    "Ionizing Bug": "Ionizing Bug",
    "Nosh Bean": "Nosh Sprout",
    "Ovagro": "Ovagro Node",
    "Ovagro Seed": "Ovagro Node",
    "Pincha Peppernut": "Pincha Pepperplant",
    "Plume Squash Plant": "Plume Squash",
    "Plume Squash Seed": "Plume Squash",
    "Rhexes": "Rhex",
    "Ring Rose Seed": "Ring Rosebush",
    "Sherberry Plant": "Sherberry",
    "Snac Fruit": "Snactus",
    "Spindly Grubfruit Seed": "Spindly Grubfruit Plant",
    "Sweatcorn Seed": "Sweatcorn",
    "Sweatcorn Stalk": "Sweatcorn",
    "Swamp Chard Plant": "Swamp Chard",
}

PARENT_PREFABS = {
    "ForestTreeSeed": "ForestTree",
    "IceFlowerSeed": "IceFlower",
    "LightBugRadioactive": "LightBug",
    "BeanPlantSeed": "BeanPlant",
    "SpiceVineSeed": "SpiceVine",
    "CarrotPlantSeed": "CarrotPlant",
    "GardenDecorPlantSeed": "GardenDecorPlant",
    "GardenFoodPlantSeed": "GardenFoodPlant",
    "WormPlantSeed": "WormPlant",
}

ZH_SUMMARY_OVERRIDES = {
    "LightBugRadioactive": "電離發光蟲是發光蟲的高輻射變種，可提供光照、裝飾與大量輻射。適合輻射粒子生產，但必須控制牧場數量、飼料及複製人的輻射暴露。",
    "DivergentBeetle": "甜素甲蟲會食用硫並照料蟲果植物，可產生蔗糖與蛋；適合把可再生硫轉成食物及蔗糖火箭燃料。牧場效率取決於植物、溫度與種群管理。",
}


def normalized_title(name: str) -> str:
    if name in PAGE_TITLE_OVERRIDES:
        return PAGE_TITLE_OVERRIDES[name]
    return re.sub(r" (?:Seed|Grain|Spore)$", "", name)


def build_name_keys(po: dict[str, tuple[str, str]]) -> dict[str, list[str]]:
    result: dict[str, list[str]] = {}
    for context, (english, _) in po.items():
        match = re.match(r"STRINGS\.CODEX\.([A-Z0-9_]+)\.(?:SPECIES_)?TITLE$", context)
        if match:
            result.setdefault(clean(english).casefold(), []).append(match.group(1))
        match = re.match(r"STRINGS\.CREATURES\.SPECIES\.([A-Z0-9_]+)\.NAME$", context)
        if match:
            result.setdefault(clean(english).casefold(), []).append(match.group(1))
    return result


def description_for(
    prefab_id: str,
    display_name: str,
    po: dict[str, tuple[str, str]],
    name_keys: dict[str, list[str]],
    entity_names: dict[str, str],
) -> tuple[str, str, str]:
    parent_id = PARENT_PREFABS.get(prefab_id)
    if not parent_id and prefab_id.endswith("Seed"):
        possible = prefab_id[:-4]
        if possible in entity_names:
            parent_id = possible
    parent_name = entity_names.get(parent_id or "", display_name)
    page_title = normalized_title(parent_name if parent_id else display_name)
    candidates = (
        name_keys.get(page_title.casefold(), [])
        + name_keys.get(normalized_title(display_name).casefold(), [])
        + [
            (parent_id or prefab_id).upper(),
            re.sub(r"[^A-Z0-9]", "", (parent_id or prefab_id).upper()),
        ]
    )
    seen: set[str] = set()
    for key in candidates:
        if key in seen:
            continue
        seen.add(key)
        for context in (
            f"STRINGS.CODEX.{key}.BODY.CONTAINER1",
            f"STRINGS.CREATURES.SPECIES.{key}.DESC",
        ):
            if context not in po:
                continue
            english, chinese = po[context]
            english = clean(english)
            chinese = clean(chinese)
            if english and chinese:
                return english, chinese, context
    return "", "", ""


def main() -> None:
    game = json.loads(GAME_DATA.read_text(encoding="utf-8"))
    wiki = json.loads(WIKI_DATA.read_text(encoding="utf-8"))
    glossary = json.loads(GLOSSARY.read_text(encoding="utf-8"))
    po = parse_po(DEFAULT_PO)
    name_keys = build_name_keys(po)
    wiki_by_title = {
        page["requested_title"].casefold(): page
        for page in wiki["pages"]
    }

    entity_records: dict[str, dict[str, Any]] = {}
    for zone in game["zones"]:
        for kind in ("flora", "fauna"):
            for item in zone[kind]:
                entity_records.setdefault(
                    item["prefab_id"],
                    {"name": item["name"], "kind": kind, "zones": set()},
                )["zones"].add(zone["zone_type"])
    entity_names = {prefab_id: item["name"] for prefab_id, item in entity_records.items()}

    profiles = []
    errors = []
    for prefab_id, item in sorted(entity_records.items(), key=lambda row: row[1]["name"]):
        name_en = item["name"]
        name_zh = translated_entity(name_en, glossary["terms"])
        summary_en, summary_zh, local_context = description_for(
            prefab_id, name_en, po, name_keys, entity_names
        )
        page_title = normalized_title(name_en)
        page = wiki_by_title.get(page_title.casefold())
        if page is None and prefab_id in PARENT_PREFABS:
            page = wiki_by_title.get(
                normalized_title(entity_names[PARENT_PREFABS[prefab_id]]).casefold()
            )
        extract = page.get("extract", "") if page else ""
        if not summary_en:
            summary_en = extract.split("\n\n", 1)[0].strip()
        if not summary_zh:
            summary_zh = ZH_SUMMARY_OVERRIDES.get(prefab_id, "")
        if not summary_en or not summary_zh:
            errors.append(f"{prefab_id}: missing bilingual description")
        if not page:
            errors.append(f"{prefab_id}: missing wiki mechanics page")
        profiles.append(
            {
                "prefab_id": prefab_id,
                "name_en": name_en,
                "name_zh": name_zh,
                "kind": item["kind"],
                "summary_en": summary_en,
                "summary_zh": summary_zh,
                "mechanics_url": page["url"] if page else "",
                "zones": sorted(item["zones"]),
                "sources": {
                    "mechanics": "wiki.gg current plaintext extract",
                    "description_localization": local_context or "manual Dolphinwing-aligned override",
                },
            }
        )
    if errors:
        raise SystemExit("entity profile validation failed:\n" + "\n".join(errors))
    output = {
        "schema_version": 2,
        "updated_at": date.today().isoformat(),
        "baseline": game["source"]["version_baseline"],
        "accessed_at": wiki["accessed_at"],
        "profile_count": len(profiles),
        "canonical_mechanics_pages": len({profile["mechanics_url"] for profile in profiles}),
        "profiles": profiles,
    }
    OUTPUT.write_text(json.dumps(output, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(
        f"Wrote {len(profiles)} bilingual entity profiles "
        f"using {output['canonical_mechanics_pages']} mechanics pages to {OUTPUT}"
    )


if __name__ == "__main__":
    main()
