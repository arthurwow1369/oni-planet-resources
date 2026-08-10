#!/usr/bin/env python3
"""Fetch current wiki.gg plaintext for every canonical flora/fauna profile."""

from __future__ import annotations

import json
import time
import urllib.error
import urllib.parse
import urllib.request
from datetime import date
from pathlib import Path

HERE = Path(__file__).resolve().parent
OUTPUT = HERE / "entity-wiki-extracts.json"
API = "https://oxygennotincluded.wiki.gg/api.php"
USER_AGENT = "ONIPlanetResourceResearch/1.0 (personal research; wiki.gg citations)"

TITLES = [
    "Alveo Vera", "Arbor Tree", "Balm Lily", "Bammoth", "Beakon", "Beeta", "Bliss Burst",
    "Blowter", "Bluff Briar", "Bog Bucket", "Bonbon Tree", "Bristle Blossom",
    "Buddy Bud", "Bulbloom", "Muckroot", "Clampum", "Dartle", "Dasha Saltvine",
    "Dew Dripper", "Drecko", "Dusk Cap", "Flox", "Flue Coral", "Gas Grass",
    "Gassy Moo", "Glo Squid", "Gnit", "Gum Palm", "Hatch", "Hexalent",
    "Husha Cups", "Idylla Flower", "Ionizing Bug", "Jawbo", "Jumping Joya", "Kelpole",
    "Lumb", "Lura Plant", "Mealwood", "Megafrond", "Mellow Mallow", "Mimika",
    "Mimika Bud", "Mirth Leaf", "Morb", "Mussel Sprout", "Nosh Sprout", "Orehull",
    "Ovagro Node", "Oxyfern", "Pacu", "Petta Pouf", "Pikeapple Bush", "Pincha Pepperplant",
    "Pinpoket", "Pip", "Plug Slug", "Plume Squash", "Pokeshell", "Puft", "Rhex",
    "Ring Rosebush", "Sanishell", "Saturn Critter Trap", "Seakomb", "Seaquine",
    "Sherberry", "Shine Bug", "Shove Vole", "Sleet Wheat", "Slickster", "Slogo",
    "Snactus", "Sodicane", "Spigot Seal", "Spindly Grubfruit Plant", "Sporechid",
    "Squeaky Puft", "Starnacle", "Swamp Chard", "Sweatcorn", "Sweetle", "Thimble Reed",
    "Tower Kelp", "Tranquil Toes", "Tropical Pacu", "Tublia", "Waterweed", "Wheezewort",
]


def fetch(title: str) -> dict[str, object]:
    query = urllib.parse.urlencode(
        {
            "action": "query",
            "format": "json",
            "formatversion": "2",
            "prop": "extracts",
            "explaintext": "1",
            "redirects": "1",
            "titles": title,
        }
    )
    request = urllib.request.Request(f"{API}?{query}", headers={"User-Agent": USER_AGENT})
    last_error: Exception | None = None
    for attempt in range(3):
        try:
            with urllib.request.urlopen(request, timeout=30) as response:
                payload = json.loads(response.read().decode("utf-8"))
            page = payload["query"]["pages"][0]
            resolved = page.get("title", title)
            return {
                "requested_title": title,
                "resolved_title": resolved,
                "url": "https://oxygennotincluded.wiki.gg/wiki/" + urllib.parse.quote(resolved.replace(" ", "_")),
                "missing": bool(page.get("missing")),
                "extract": page.get("extract", ""),
            }
        except (OSError, ValueError, KeyError, urllib.error.URLError) as exc:
            last_error = exc
            time.sleep(1.5 * (attempt + 1))
    return {
        "requested_title": title,
        "resolved_title": title,
        "url": "https://oxygennotincluded.wiki.gg/wiki/" + urllib.parse.quote(title.replace(" ", "_")),
        "missing": True,
        "extract": "",
        "error": str(last_error),
    }


def main() -> None:
    pages = []
    for index, title in enumerate(TITLES, start=1):
        page = fetch(title)
        pages.append(page)
        print(f"[{index}/{len(TITLES)}] {title}: {'missing' if page['missing'] else 'ok'}")
        time.sleep(0.1)
    output = {
        "schema_version": 1,
        "accessed_at": date.today().isoformat(),
        "source": "Oxygen Not Included Wiki (wiki.gg) MediaWiki API plaintext extracts",
        "pages": pages,
    }
    OUTPUT.write_text(json.dumps(output, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    missing = [page["requested_title"] for page in pages if page["missing"] or not page["extract"]]
    print(f"Wrote {len(pages)} extracts to {OUTPUT}")
    if missing:
        raise SystemExit("Missing extracts: " + ", ".join(str(item) for item in missing))


if __name__ == "__main__":
    main()
