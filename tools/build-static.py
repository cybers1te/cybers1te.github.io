#!/usr/bin/env python3
"""Génère les fichiers statiques de Trueware servis par GitHub Pages.

Le catalogue et la feuille de style n'ont qu'une seule source de vérité :
le paquet `trueware/`. Ce script en dérive les fichiers racine que Pages
publie, pour qu'une modification du catalogue Python se répercute sur le
site statique sans recopie manuelle.

    python3 tools/build-static.py
"""
from __future__ import annotations

import hashlib
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))

from trueware.catalog import CATEGORIES, PRODUCTS  # noqa: E402


def art_seed(slug: str) -> list[int]:
    """Mêmes octets que imagery.py : l'illustration est identique des deux côtés."""
    return list(hashlib.blake2s(slug.encode("utf-8"), digest_size=16).digest())


def parse_specs(raw: str) -> list[list[str]]:
    out = []
    for line in raw.splitlines():
        if "|" in line:
            key, _, value = line.partition("|")
            out.append([key.strip(), value.strip()])
    return out


def build_catalog() -> dict:
    return {
        "categories": [
            {"slug": slug, "name": name, "tagline": tagline, "rank": rank}
            for slug, name, tagline, rank in CATEGORIES
        ],
        "products": [
            {
                "slug": slug,
                "name": name,
                "brand": brand,
                "category": cat,
                "price": price,
                "compare": compare,
                "stock": stock,
                "summary": summary,
                "description": description,
                "specs": parse_specs(specs),
                "badge": badge,
                "featured": bool(featured),
                "seed": art_seed(slug),
            }
            for (slug, name, brand, cat, price, compare, stock,
                 summary, description, specs, badge, featured) in PRODUCTS
        ],
    }


def main() -> None:
    catalog = build_catalog()
    banner = "/* Fichier généré par tools/build-static.py — ne pas modifier à la main. */\n"

    target = ROOT / "trueware-catalog.js"
    target.write_text(
        banner + "window.TRUEWARE_CATALOG = "
        + json.dumps(catalog, ensure_ascii=False, separators=(",", ":"))
        + ";\n",
        encoding="utf-8",
    )
    print(f"{target.name:24} {len(catalog['products'])} produits, "
          f"{len(catalog['categories'])} familles, {target.stat().st_size // 1024} Kio")

    css_src = ROOT / "trueware" / "static" / "trueware.css"
    css_dst = ROOT / "trueware.css"
    css_dst.write_text(
        "/* Copié depuis trueware/static/trueware.css par tools/build-static.py. */\n"
        + css_src.read_text(encoding="utf-8"),
        encoding="utf-8",
    )
    print(f"{css_dst.name:24} {css_dst.stat().st_size // 1024} Kio")

    ico_src = ROOT / "trueware" / "static" / "favicon.svg"
    ico_dst = ROOT / "favicon.svg"
    ico_dst.write_text(ico_src.read_text(encoding="utf-8"), encoding="utf-8")
    print(f"{ico_dst.name:24} copié")


if __name__ == "__main__":
    main()
