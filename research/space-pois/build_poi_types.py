#!/usr/bin/env python3
"""Extract harvestable space-POI definitions from the installed game assembly.

The starmap POI table is compiled into Assembly-CSharp.dll rather than shipped
as worldgen YAML, so this script decompiles ``HarvestablePOIConfig`` with
ilspycmd and reads the ``HarvestablePOIType`` constructor arguments.

Harvest mechanics established from the same assembly (U59):

* ``HarvestModule.HarvestFromPOI`` normalizes ``harvestableElements`` by the sum
  of its weights, so a weight is a share of harvested mass, not a percentage.
* ``StarmapHexCellInventory.ExtractAndSpawn`` spawns each element at
  ``element.defaultValues.temperature``, so output temperature is the element's
  default temperature from StreamingAssets/elements.

Usage:
  ./build_poi_types.py --assembly <Assembly-CSharp.dll> --assets <StreamingAssets>

Requires ilspycmd (``dotnet tool install --global ilspycmd``).
"""
from __future__ import annotations

import argparse
import json
import os
import re
import shutil
import subprocess
from pathlib import Path
from typing import Any

import yaml

OUT_PATH = Path(__file__).resolve().parent / "poi-types.json"
KELVIN_OFFSET = 273.15
DLC_TAGS = {"EXPANSION1": "expansion1", "DLC2": "dlc2", "DLC3": "dlc3", "DLC4": "dlc4", "DLC5": "dlc5"}
DLC_PRECEDENCE = {"expansion1": 1, "dlc2": 2, "dlc3": 3, "dlc4": 4, "dlc5": 5}
STATE_PHASE = {"Solid": "solid", "Liquid": "liquid", "Gas": "gas"}


def decompile(assembly: Path) -> str:
    ilspycmd = shutil.which("ilspycmd") or str(Path.home() / ".dotnet/tools/ilspycmd")
    if not Path(ilspycmd).exists():
        raise SystemExit("ilspycmd not found; run: dotnet tool install --global ilspycmd")
    env = dict(os.environ)
    env.setdefault("DOTNET_ROOT", "/opt/homebrew/opt/dotnet/libexec")
    env.setdefault("DOTNET_ROLL_FORWARD", "Major")
    result = subprocess.run(
        [ilspycmd, "-t", "HarvestablePOIConfig", str(assembly)],
        capture_output=True, text=True, env=env,
    )
    if result.returncode != 0 or "HarvestablePOIType" not in result.stdout:
        raise SystemExit(f"ilspycmd failed: {result.stderr.strip() or result.stdout.strip()[:400]}")
    return result.stdout


def balanced_args(source: str, open_index: int) -> tuple[str, int]:
    """Return the argument text inside the parentheses starting at open_index."""
    depth = 0
    for index in range(open_index, len(source)):
        char = source[index]
        if char in "([{":
            depth += 1
        elif char in ")]}":
            depth -= 1
            if depth == 0:
                return source[open_index + 1:index], index
    raise SystemExit("unbalanced parentheses in decompiled source")


def strip_generic_arguments(text: str) -> str:
    """Drop `<SimHashes, float>` style type arguments so their commas do not split args."""
    previous = None
    while previous != text:
        previous = text
        text = re.sub(r"<[^<>]*>", "", text)
    return text


def split_top_level(text: str) -> list[str]:
    parts: list[str] = []
    depth = 0
    current: list[str] = []
    in_string = False
    for char in text:
        if char == '"':
            in_string = not in_string
        if not in_string:
            if char in "([{":
                depth += 1
            elif char in ")]}":
                depth -= 1
            elif char == "," and depth == 0:
                parts.append("".join(current).strip())
                current = []
                continue
        current.append(char)
    if "".join(current).strip():
        parts.append("".join(current).strip())
    return parts


def parse_weight_dictionary(text: str) -> dict[str, float]:
    """Read a `new Dictionary<SimHashes, float> { { SimHashes.X, 1f }, ... }` literal."""
    return {
        match.group(1): float(match.group(2))
        for match in re.finditer(r"SimHashes\.(\w+)\s*,\s*(-?[\d.]+)f?", text)
    }


def parse_poi_types(source: str) -> list[dict[str, Any]]:
    entries: list[dict[str, Any]] = []
    marker = "new HarvestablePOIConfigurator.HarvestablePOIType("
    for match in re.finditer(re.escape(marker), source):
        args_text, _ = balanced_args(source, match.end() - 1)
        args = split_top_level(strip_generic_arguments(args_text))
        poi_id = args[0].strip().strip('"')
        weights = parse_weight_dictionary(args[1])
        if not weights:
            raise SystemExit(f"{poi_id}: no harvestable elements parsed")

        # Two overloads exist. The longer one inserts initialDatabanks (an int)
        # and initialLiberatedResources (a dictionary or null) before capacity.
        rest = args[2:]
        if rest and re.fullmatch(r"\d+", rest[0].strip()):
            rest = rest[2:]

        numbers: list[float] = []
        for arg in rest:
            stripped = arg.strip()
            if re.fullmatch(r"-?[\d.]+f?", stripped):
                numbers.append(float(stripped.rstrip("f")))
            else:
                break
        if len(numbers) < 4:
            raise SystemExit(f"{poi_id}: expected capacity and recharge bounds, got {numbers}")

        # DLC-gated POIs read `DlcManager.EXPANSION1.Append(DlcManager.DLC4)`,
        # so the most specific required DLC is the last one listed.
        required = [DLC_TAGS[name] for name in re.findall(r"DlcManager\.([A-Z0-9_]+)", args_text) if name in DLC_TAGS]
        dlc_tag = max(required, key=lambda tag: DLC_PRECEDENCE[tag]) if required else "expansion1"
        entries.append({
            "id": poi_id,
            "prefabId": f"HarvestableSpacePOI_{poi_id}",
            "dlcTag": dlc_tag,
            "weights": weights,
            "capacityRangeKg": {"min": numbers[0], "max": numbers[1]},
            "rechargeRangeKgPerCycle": {"min": numbers[2], "max": numbers[3]},
        })
    return entries


def load_element_states(assets: Path) -> dict[str, tuple[str, float]]:
    """Map element id to its phase and default temperature in Celsius."""
    states: dict[str, tuple[str, float]] = {}
    for path in sorted(assets.glob("elements/*.yaml")):
        data = yaml.safe_load(path.read_text(encoding="utf-8-sig")) or {}
        for element in data.get("elements", []) or []:
            element_id = element.get("elementId")
            state = STATE_PHASE.get(str(element.get("state", "")).split(",")[0].strip())
            temperature = element.get("defaultTemperature")
            if element_id and state and temperature is not None:
                states[element_id] = (state, round(float(temperature) - KELVIN_OFFSET, 2))
    return states


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--assembly", type=Path, default=os.environ.get("ONI_ASSEMBLY"), required=False)
    parser.add_argument("--assets", type=Path, default=os.environ.get("ONI_STREAMING_ASSETS"), required=False)
    args = parser.parse_args()
    if args.assembly is None or args.assets is None:
        parser.error("provide --assembly and --assets (or set ONI_ASSEMBLY / ONI_STREAMING_ASSETS)")

    element_states = load_element_states(args.assets.expanduser())
    entries = parse_poi_types(decompile(args.assembly.expanduser()))
    if len(entries) < 30:
        raise SystemExit(f"only parsed {len(entries)} POI types; the assembly layout likely changed")

    catalog: list[dict[str, Any]] = []
    for entry in entries:
        total = sum(entry["weights"].values())
        outputs = []
        for element_id, weight in entry["weights"].items():
            if element_id not in element_states:
                raise SystemExit(f"{entry['id']}: no element data for {element_id}")
            phase, temperature = element_states[element_id]
            outputs.append({
                "id": element_id,
                "phase": phase,
                "ratio": round(weight / total * 100, 2),
                "temperatureC": temperature,
            })
        outputs.sort(key=lambda output: (-output["ratio"], output["id"]))
        catalog.append({
            "id": entry["prefabId"],
            "dlcTag": entry["dlcTag"],
            "cargo": sorted({output["phase"] for output in outputs}),
            "capacityRangeKg": entry["capacityRangeKg"],
            "rechargeRangeKgPerCycle": entry["rechargeRangeKgPerCycle"],
            "outputs": outputs,
        })

    catalog.sort(key=lambda entry: entry["id"])
    OUT_PATH.write_text(json.dumps({"pois": catalog}, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"wrote {len(catalog)} POI types to {OUT_PATH}")


if __name__ == "__main__":
    main()
