#!/usr/bin/env python3
"""Merge and validate cleaned ONI terrain research artifacts."""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any

HERE = Path(__file__).resolve().parent
GAME_PATH = HERE / "game-data.json"
STRATEGY_PATH = HERE / "strategies.json"
SOURCES_PATH = HERE / "sources.json"
OUT_JSON = HERE / "terrain-research.json"
OUT_MD = HERE / "terrain-research.md"
VALIDATION_PATH = HERE / "validation-report.json"


def load(path: Path) -> dict[str, Any]:
    return json.loads(path.read_text(encoding="utf-8"))


def bullet_methods(methods: list[dict[str, Any]]) -> list[str]:
    lines: list[str] = []
    for method in methods:
        qualifiers = ", ".join(
            str(method[key])
            for key in ("dependency", "stage", "confidence")
            if key in method
        )
        lines.append(f"- {method['method']} ({qualifiers})")
    return lines


def main() -> None:
    game = load(GAME_PATH)
    strategies = load(STRATEGY_PATH)
    sources_doc = load(SOURCES_PATH)

    game_by_zone = {zone["zone_type"]: zone for zone in game["zones"]}
    strategy_by_zone = {zone["zone_type"]: zone for zone in strategies["zones"]}
    sources = {source["id"]: source for source in sources_doc["sources"]}

    errors: list[str] = []
    warnings: list[str] = []

    if len(game_by_zone) != game["zone_count"]:
        errors.append("game-data zone_count does not match unique zone_type count")
    if set(game_by_zone) != set(strategy_by_zone):
        errors.append("game-data and strategy zone sets differ")

    merged_zones: list[dict[str, Any]] = []
    for zone_type in sorted(game_by_zone):
        game_zone = game_by_zone[zone_type]
        strategy = strategy_by_zone[zone_type]

        for category in ("food", "energy", "oxygen", "radiation"):
            if not strategy.get(category):
                errors.append(f"{zone_type}: no {category} recommendation")
        if not strategy.get("attention"):
            errors.append(f"{zone_type}: no attention flags")
        if "local-u59-assets" not in strategy.get("source_ids", []):
            errors.append(f"{zone_type}: local game-data citation missing")
        for source_id in strategy.get("source_ids", []):
            if source_id not in sources:
                errors.append(f"{zone_type}: unknown source id {source_id}")

        for category in ("flora", "fauna", "other_spawns"):
            for entity in game_zone[category]:
                if not entity.get("name"):
                    errors.append(
                        f"{zone_type}: {category} entity {entity['prefab_id']} has no name"
                    )

        for warning in game_zone.get("warnings", []):
            warnings.append(f"{zone_type}: {warning}")

        merged_zones.append(
            {
                "zone_type": zone_type,
                "friendly_name": game_zone["name"],
                "summary": strategy["summary"],
                "dlc_scopes": game_zone["dlc_scopes"],
                "variant_count": game_zone["source_definition_count"],
                "worldgen": {
                    "elements": game_zone["elements"],
                    "flora": game_zone["flora"],
                    "fauna": game_zone["fauna"],
                    "other_spawnables": game_zone["other_spawns"],
                    "features": game_zone["features"],
                    "temperature_range_ids": game_zone["temperature_ranges"],
                    "source_files": game_zone["sources"],
                    "worldgen_warnings": game_zone["warnings"],
                },
                "recommendations": {
                    "food": strategy["food"],
                    "energy": strategy["energy"],
                    "oxygen": strategy["oxygen"],
                    "radiation": strategy["radiation"],
                },
                "attention": strategy["attention"],
                "source_ids": strategy["source_ids"],
                "confidence": {
                    "worldgen": "high-with-union-caveat",
                    "strategy": "high unless a method is marked medium",
                },
            }
        )

    # Semantic regression checks added after independent review found that a
    # structurally valid recommendation could still overstate native inputs.
    barren_oxygen = " ".join(
        item["method"] for item in strategy_by_zone["Barren"]["oxygen"]
    )
    if "Oxylite" in barren_oxygen:
        errors.append("Barren: unsupported native Oxylite recommendation")

    frozen = strategy_by_zone["FrozenWastes"]
    if any("Oxylite" in item["method"] for item in frozen["oxygen"]):
        errors.append("FrozenWastes: unsupported native Oxylite recommendation")
    if any("hydrogen" in item["method"].lower() for item in frozen["energy"]):
        errors.append("FrozenWastes: unsupported native Hydrogen energy claim")
    if "Dirt" not in game_by_zone["FrozenWastes"]["elements"] and not any(
        "imported-or-connected-dirt" in item["dependency"]
        for item in frozen["food"]
        if "Dirt" in item["method"]
    ):
        errors.append("FrozenWastes: farmed Sleet Wheat does not disclose external Dirt")

    if any(
        "Hydrogen" in item["method"]
        and not any(word in item["dependency"] for word in ("imported", "connected"))
        for item in strategy_by_zone["Radioactive"]["food"]
    ):
        errors.append("Radioactive: Saturn Critter Trap Hydrogen source is overstated")

    if any(
        "Ethanol" in item["method"]
        and not any(word in item["dependency"] for word in ("variant", "imported"))
        for item in strategy_by_zone["Rust"]["food"]
    ):
        errors.append("Rust: Nosh Sprout Ethanol availability is overstated")

    if "wiki-u59-740622" not in strategy_by_zone["KelpForest"]["source_ids"]:
        errors.append("KelpForest: current U59 grooming-fix citation missing")
    if "not present in the extracted zone-element union" not in strategy_by_zone[
        "MagmaCore"
    ]["summary"]:
        errors.append("MagmaCore: Abyssalite boundary caveat missing")
    if "not all equivalent to open vacuum" not in strategy_by_zone["Space"][
        "summary"
    ]:
        errors.append("Space: mixed subworld-variant caveat missing")

    output = {
        "schema_version": 1,
        "generated_at": strategies["baseline"]["as_of"],
        "accessed_at": sources_doc["accessed_at"],
        "baseline": strategies["baseline"],
        "scope_note": (
            "This research follows the existing website's 26 zoneType terrain groups. "
            "It merges all 232 installed base/DLC subworld definitions into per-zone unions. "
            "A listed resource is possible in at least one installed variant, not guaranteed "
            "on every asteroid, seed, or DLC combination."
        ),
        "interpretation_rules": strategies["interpretation_rules"],
        "cleaning_policy": sources_doc["cleaning_policy"],
        "zones": merged_zones,
        "sources": sources_doc["sources"],
        "known_gaps": [
            "Installed dlc/expansion1 moon_barren/DustCore.yaml references expansion1::biomes/Misc/HardDust, but that key is absent from the installed Misc.yaml lookup.",
            "Worldgen union data shows possible contents; per-seed occurrence and quantity require world or cluster seed evaluation.",
            "The 26 zoneType taxonomy is narrower than some wiki biome-category counts because game worldgen groups and public biome labels are not one-to-one.",
            "Exact U59 production rates, critter diets, crop inputs, and building throughput were deliberately omitted where no current primary or cross-checked source was captured.",
            "Community discussion is uneven across older terrains; it is used for caveats, not canonical resource lists.",
            "Radiation recommendations are not applicable without Spaced Out radiation mechanics."
        ],
    }

    report = {
        "status": "pass" if not errors else "fail",
        "zone_count": len(merged_zones),
        "source_count": len(sources),
        "source_definition_count": game["source_definition_count"],
        "errors": errors,
        "warnings": warnings,
        "checks": {
            "zone_sets_match": set(game_by_zone) == set(strategy_by_zone),
            "every_zone_has_four_recommendation_categories": not any(
                f"no {category} recommendation" in error
                for error in errors
                for category in ("food", "energy", "oxygen", "radiation")
            ),
            "every_zone_has_attention_flags": not any(
                "no attention flags" in error for error in errors
            ),
            "all_citations_resolve": not any(
                "unknown source id" in error for error in errors
            ),
            "all_entities_named": not any(
                "has no name" in error for error in errors
            ),
            "reviewed_native_dependencies_are_qualified": not any(
                any(
                    marker in error
                    for marker in (
                        "unsupported native",
                        "does not disclose external",
                        "availability is overstated",
                        "source is overstated",
                    )
                )
                for error in errors
            ),
            "reviewed_version_and_variant_caveats_present": not any(
                any(marker in error for marker in ("citation missing", "caveat missing"))
                for error in errors
            ),
        },
    }

    OUT_JSON.write_text(
        json.dumps(output, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )
    VALIDATION_PATH.write_text(
        json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )

    md: list[str] = [
        "# Oxygen Not Included Terrain Research",
        "",
        f"Baseline: {output['baseline']['game_version']} as of {output['generated_at']}",
        "",
        output["scope_note"],
        "",
        "## How to read this",
        "",
    ]
    md.extend(f"- {rule}" for rule in output["interpretation_rules"])
    md.extend(["", "## Terrain matrix", ""])

    for zone in merged_zones:
        worldgen = zone["worldgen"]
        md.extend(
            [
                f"### {zone['friendly_name']} (`{zone['zone_type']}`)",
                "",
                zone["summary"],
                "",
                "- DLC scopes seen: "
                + ", ".join(scope["name"] for scope in zone["dlc_scopes"]),
                f"- Installed variant definitions: {zone['variant_count']}",
                f"- Elements: {', '.join(worldgen['elements'])}",
                "- Flora and seed/propagule resources: "
                + (
                    ", ".join(entity["name"] for entity in worldgen["flora"])
                    or "None found in installed worldgen"
                ),
                "- Fauna: "
                + (
                    ", ".join(entity["name"] for entity in worldgen["fauna"])
                    or "None found in installed worldgen"
                ),
                "- Forageables and other spawnables: "
                + (
                    ", ".join(
                        entity["name"] for entity in worldgen["other_spawnables"]
                    )
                    or "None found"
                ),
                "- Features: "
                + (", ".join(worldgen["features"]) or "None listed"),
                "",
                "Food:",
            ]
        )
        md.extend(bullet_methods(zone["recommendations"]["food"]))
        md.extend(["", "Energy:"])
        md.extend(bullet_methods(zone["recommendations"]["energy"]))
        md.extend(["", "Oxygen:"])
        md.extend(bullet_methods(zone["recommendations"]["oxygen"]))
        md.extend(["", "Radiation:"])
        md.extend(bullet_methods(zone["recommendations"]["radiation"]))
        md.extend(
            [
                "",
                "Attention:",
                *[f"- {item}" for item in zone["attention"]],
                "",
                "Sources: " + ", ".join(f"`{sid}`" for sid in zone["source_ids"]),
                "",
            ]
        )

    md.extend(["## Known gaps", ""])
    md.extend(f"- {gap}" for gap in output["known_gaps"])
    md.extend(["", "## Source registry", ""])
    for source in sources_doc["sources"]:
        location = source.get("url") or source.get("local_root") or "local source"
        md.append(
            f"- `{source['id']}` — {source['title']} ({source['reliability']}, "
            f"{source['freshness']}): {location}"
        )
    md.append("")
    OUT_MD.write_text("\n".join(md), encoding="utf-8")

    print(
        f"{report['status'].upper()}: {len(merged_zones)} zones, "
        f"{len(sources)} sources, {len(errors)} errors, {len(warnings)} warnings"
    )
    if errors:
        raise SystemExit(1)


if __name__ == "__main__":
    main()
