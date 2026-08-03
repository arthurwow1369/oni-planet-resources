#!/usr/bin/env python3
"""Generate a U59 world-size/cluster-role audit from the installed ONI YAML."""
from __future__ import annotations

import csv
import json
import re
from collections import defaultdict
from pathlib import Path
from typing import cast

import yaml

ROOT = Path(
    "/Volumes/APP_SSD/SteamLibrary/steamapps/common/OxygenNotIncluded/"
    "OxygenNotIncluded.app/Contents/Resources/Data/StreamingAssets"
)
OUT = Path(__file__).resolve().parent


def namespace_for(path: Path) -> str:
    parts = path.parts
    if "dlc" in parts:
        index = parts.index("dlc")
        return parts[index + 1]
    return "base"


def world_ref_for(path: Path) -> str:
    namespace = namespace_for(path)
    relative = path.relative_to(
        ROOT / "worldgen" / "worlds"
        if namespace == "base"
        else ROOT / "dlc" / namespace / "worldgen" / "worlds"
    ).with_suffix("")
    ref = f"worlds/{relative.as_posix()}"
    return ref if namespace == "base" else f"{namespace}::{ref}"


def parse_world_size(text: str) -> tuple[int, int] | None:
    match = re.search(
        r"(?ms)^worldsize:\s*\n\s*X:\s*(\d+)\s*\n\s*Y:\s*(\d+)", text
    )
    if not match:
        return None
    return int(match.group(1)), int(match.group(2))


def iter_world_files() -> list[Path]:
    roots = [ROOT / "worldgen" / "worlds"]
    roots.extend(sorted((ROOT / "dlc").glob("*/worldgen/worlds")))
    files: list[Path] = []
    for root in roots:
        if root.exists():
            files.extend(root.rglob("*.yaml"))
    return sorted(files)


def iter_cluster_files() -> list[Path]:
    roots = [ROOT / "worldgen" / "clusters"]
    roots.extend(sorted((ROOT / "dlc").glob("*/worldgen/clusters")))
    files: list[Path] = []
    for root in roots:
        if root.exists():
            files.extend(root.rglob("*.yaml"))
    return sorted(files)


def cluster_id(path: Path) -> str:
    namespace = namespace_for(path)
    base = (
        ROOT / "worldgen" / "clusters"
        if namespace == "base"
        else ROOT / "dlc" / namespace / "worldgen" / "clusters"
    )
    stem = path.relative_to(base).with_suffix("").as_posix()
    return stem if namespace == "base" else f"{namespace}::{stem}"


def parse_cluster_refs(path: Path) -> list[dict[str, str]]:
    text = path.read_text(encoding="utf-8-sig")
    data = yaml.safe_load(text) or {}
    if data.get("skip"):
        return []
    start_world_index = data.get("startWorldIndex")
    lines = text.splitlines()
    refs: list[dict[str, str]] = []
    for index, line in enumerate(lines):
        match = re.match(r"\s*-\s+world:\s+([^\s#]+)(?:\s*#\s*(.*))?", line)
        if not match:
            continue
        world = match.group(1)
        comment = (match.group(2) or "").lower()
        block: list[str] = []
        for following in lines[index + 1 :]:
            if re.match(r"\s*-\s+world:\s+", following):
                break
            block.append(following)
        block_text = "\n".join(block)
        basename = world.rsplit("/", 1)[-1].lower()
        if re.search(r"locationType:\s*StartWorld", block_text) or len(refs) == start_world_index:
            role = "start"
        elif "warp" in basename or "warp world" in comment or "warp destination" in comment:
            role = "warp"
        else:
            role = "general"
        refs.append({"world": world, "role": role, "cluster": cluster_id(path)})
    return refs


def main() -> None:
    refs_by_world: dict[str, list[dict[str, str]]] = defaultdict(list)
    for path in iter_cluster_files():
        for ref in parse_cluster_refs(path):
            refs_by_world[ref["world"]].append(ref)

    rows: list[dict[str, object]] = []
    skipped: list[str] = []
    for path in iter_world_files():
        if "test" in path.as_posix().lower() or "debug" in path.as_posix().lower():
            continue
        size = parse_world_size(path.read_text(encoding="utf-8-sig"))
        if size is None:
            skipped.append(str(path))
            continue
        ref = world_ref_for(path)
        references = refs_by_world.get(ref, [])
        roles = sorted({item["role"] for item in references})
        x, y = size
        if x <= 96:
            size_band = "extremely-small"
        elif x <= 128:
            size_band = "moonlet-mini-width"
        elif x <= 160:
            size_band = "spaced-out-standard-width"
        elif x <= 240:
            size_band = "classic-large-width"
        else:
            size_band = "base-game-extra-large-width"
        rows.append(
            {
                "world_ref": ref,
                "namespace": namespace_for(path),
                "x": x,
                "y": y,
                "area": x * y,
                "size_band": size_band,
                "roles": roles or ["unreferenced"],
                "clusters": sorted({item["cluster"] for item in references}),
                "source_file": str(path),
            }
        )

    rows.sort(key=lambda row: (str(row["namespace"]), str(row["world_ref"])))
    payload = {
        "source": str(ROOT),
        "world_count": len(rows),
        "cluster_file_count": len(iter_cluster_files()),
        "skipped_without_worldsize": skipped,
        "worlds": rows,
    }
    json_path = OUT / "u59-world-size-role-audit.json"
    json_path.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n")

    csv_path = OUT / "u59-world-size-role-audit.csv"
    with csv_path.open("w", newline="", encoding="utf-8") as handle:
        writer = csv.writer(handle, lineterminator="\n")
        writer.writerow(
            ["world_ref", "namespace", "x", "y", "area", "size_band", "roles", "clusters"]
        )
        for row in rows:
            writer.writerow(
                [
                    row["world_ref"],
                    row["namespace"],
                    row["x"],
                    row["y"],
                    row["area"],
                    row["size_band"],
                    ";".join(cast(list[str], row["roles"])),
                    ";".join(cast(list[str], row["clusters"])),
                ]
            )
    print(f"worlds={len(rows)} clusters={len(iter_cluster_files())} json={json_path} csv={csv_path}")


if __name__ == "__main__":
    main()
