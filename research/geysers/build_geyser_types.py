#!/usr/bin/env python3
"""Extract the geyser type table from the installed game assembly.

Geyser rates, emitted element and temperature live in
``GeyserGenericConfig.GenerateConfigs()`` rather than in worldgen YAML, so this
decompiles that method with ilspycmd and reads the ``GeyserType`` constructor
arguments.

The ``isGenericGeyser`` flag matters for worldgen: ``geysers/generic`` is the
"Random Geyser Spawner" and can only roll types flagged true. Types flagged
false exist only where a world explicitly places their named template.

Usage:
  ./build_geyser_types.py --assembly <Assembly-CSharp.dll>

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

OUT_PATH = Path(__file__).resolve().parent / "geyser-types.json"
KELVIN_OFFSET = 273.15
DLC_TAGS = {"EXPANSION1": "expansion1", "DLC2": "dlc2", "DLC3": "dlc3", "DLC4": "dlc4", "DLC5": "dlc5"}


def decompile(assembly: Path) -> str:
    ilspycmd = shutil.which("ilspycmd") or str(Path.home() / ".dotnet/tools/ilspycmd")
    if not Path(ilspycmd).exists():
        raise SystemExit("ilspycmd not found; run: dotnet tool install --global ilspycmd")
    env = dict(os.environ)
    env.setdefault("DOTNET_ROOT", "/opt/homebrew/opt/dotnet/libexec")
    env.setdefault("DOTNET_ROLL_FORWARD", "Major")
    result = subprocess.run(
        [ilspycmd, "-t", "GeyserGenericConfig", str(assembly)],
        capture_output=True, text=True, env=env,
    )
    if result.returncode != 0 or "GeyserPrefabParams" not in result.stdout:
        raise SystemExit(f"ilspycmd failed: {result.stderr.strip() or result.stdout.strip()[:400]}")
    return result.stdout


ROW_RE = re.compile(
    r'new GeyserPrefabParams\(\s*"(?P<anim>[^"]+)",\s*(?P<w>\d+),\s*(?P<h>\d+),\s*'
    r'new GeyserConfigurator\.GeyserType\(\s*"(?P<id>[^"]+)",\s*SimHashes\.(?P<element>\w+),\s*'
    r'GeyserConfigurator\.GeyserShape\.(?P<shape>\w+),\s*(?P<temp>-?[\d.]+)f,\s*'
    r'(?P<minrate>-?[\d.]+)f,\s*(?P<maxrate>-?[\d.]+)f,\s*(?P<pressure>-?[\d.]+)f'
    r'(?P<tail>.*?)isGenericGeyser:\s*(?P<generic>true|false)\s*\)',
    re.S,
)


def parse_geyser_types(source: str) -> list[dict[str, Any]]:
    rows: list[dict[str, Any]] = []
    for match in ROW_RE.finditer(source):
        tail = match.group("tail")
        dlc = [DLC_TAGS[name] for name in re.findall(r"DlcManager\.([A-Z0-9_]+)", tail) if name in DLC_TAGS]
        rows.append({
            "id": match.group("id"),
            "element": match.group("element"),
            "shape": match.group("shape").lower(),
            "temperatureC": round(float(match.group("temp")) - KELVIN_OFFSET, 2),
            "rateKgPerCycle": {"min": float(match.group("minrate")), "max": float(match.group("maxrate"))},
            "maxPressureKg": float(match.group("pressure")),
            "isGenericGeyser": match.group("generic") == "true",
            "requiredDlcTags": sorted(set(dlc)),
        })
    return rows


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--assembly", type=Path, default=os.environ.get("ONI_ASSEMBLY"))
    args = parser.parse_args()
    if args.assembly is None:
        parser.error("provide --assembly (or set ONI_ASSEMBLY)")

    rows = parse_geyser_types(decompile(args.assembly.expanduser()))
    if len(rows) < 20:
        raise SystemExit(f"only parsed {len(rows)} geyser types; the assembly layout likely changed")
    if not any(row["isGenericGeyser"] for row in rows):
        raise SystemExit("no geyser joined the random pool; the isGenericGeyser flag was not parsed")

    rows.sort(key=lambda row: row["id"])
    OUT_PATH.write_text(json.dumps({"geysers": rows}, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    generic = sum(1 for row in rows if row["isGenericGeyser"])
    print(f"wrote {len(rows)} geyser types ({generic} in the random pool) to {OUT_PATH}")


if __name__ == "__main__":
    main()
