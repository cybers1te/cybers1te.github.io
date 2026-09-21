"""Visuels produits générés.

Aucune image n'est téléchargée : chaque fiche produit reçoit une illustration
SVG déterministe, dérivée de son slug. Le rendu est donc identique à chaque
requête, fonctionne hors ligne et ne casse jamais.
"""
from __future__ import annotations

import math
from hashlib import blake2s
from markupsafe import Markup

# Duos de teintes par famille de produits.
PALETTES = {
    "peripheriques": ("#46e2a8", "#1b6ef3"),
    "composants": ("#ff8a3d", "#ff3d7f"),
    "ecrans": ("#7c6bff", "#22d3ee"),
    "audio": ("#ffd166", "#ef476f"),
    "reseau": ("#22d3ee", "#3b82f6"),
    "stockage": ("#a3e635", "#059669"),
}
FALLBACK = ("#46e2a8", "#7c6bff")


def _digest(slug: str) -> list[int]:
    return list(blake2s(slug.encode("utf-8"), digest_size=16).digest())


def product_art(slug: str, category: str = "", size: int = 400, ratio: float = 1.0) -> Markup:
    """Renvoie un SVG inline, sûr, représentant le produit.

    `ratio` = largeur / hauteur : 1 pour un carré, 1.34 pour les vignettes
    du catalogue. Le motif s'adapte au cadre plutôt que d'être rogné.
    """
    d = _digest(slug)
    w = size
    h = int(round(size / ratio))
    short = min(w, h)
    a, b = PALETTES.get(category, FALLBACK)
    gid = "g" + blake2s(slug.encode("utf-8"), digest_size=5).hexdigest()
    rot = -24 + (d[0] % 48)
    parts = [
        f'<svg viewBox="0 0 {w} {h}" xmlns="http://www.w3.org/2000/svg" '
        f'role="img" aria-hidden="true" class="art">',
        f'<defs><linearGradient id="{gid}" x1="0" y1="0" x2="1" y2="1">'
        f'<stop offset="0" stop-color="{a}"/><stop offset="1" stop-color="{b}"/>'
        f"</linearGradient>"
        f'<radialGradient id="{gid}h" cx="0.5" cy="0.38" r="0.62">'
        f'<stop offset="0" stop-color="{a}" stop-opacity="0.45"/>'
        f'<stop offset="1" stop-color="{a}" stop-opacity="0"/></radialGradient></defs>',
        f'<rect width="{w}" height="{h}" fill="#0d1117"/>',
        f'<rect width="{w}" height="{h}" fill="url(#{gid}h)"/>',
    ]

    # trame technique
    step = short // 10
    for i in range(1, int(w // step) + 1):
        parts.append(f'<line x1="{i * step}" y1="0" x2="{i * step}" y2="{h}" '
                     f'stroke="#ffffff" stroke-opacity="0.045"/>')
    for i in range(1, int(h // step) + 1):
        parts.append(f'<line x1="0" y1="{i * step}" x2="{w}" y2="{i * step}" '
                     f'stroke="#ffffff" stroke-opacity="0.045"/>')

    cx, cy = w / 2, h / 2
    parts.append(f'<g transform="rotate({rot} {cx} {cy})">')
    shape = d[1] % 4
    sw = short * (0.36 + (d[2] % 20) / 100)
    sh = short * (0.30 + (d[3] % 26) / 100)
    if shape == 0:  # bloc plein
        parts.append(
            f'<rect x="{cx - sw / 2:.1f}" y="{cy - sh / 2:.1f}" width="{sw:.1f}" '
            f'height="{sh:.1f}" rx="{10 + d[4] % 26}" fill="url(#{gid})"/>'
        )
    elif shape == 1:  # anneaux concentriques
        r = short * 0.3
        parts.append(f'<circle cx="{cx}" cy="{cy}" r="{r:.1f}" fill="url(#{gid})"/>')
        parts.append(f'<circle cx="{cx}" cy="{cy}" r="{r * 0.55:.1f}" fill="#0d1117"/>')
        parts.append(f'<circle cx="{cx}" cy="{cy}" r="{r * 0.30:.1f}" fill="url(#{gid})"/>')
    elif shape == 2:  # barres
        n = 3 + d[5] % 3
        bw = sw / (n * 1.7)
        for i in range(n):
            bh = sh * (0.55 + ((d[6 + i] % 45) / 100))
            x = cx - sw / 2 + i * bw * 1.7
            parts.append(
                f'<rect x="{x:.1f}" y="{cy - bh / 2:.1f}" width="{bw:.1f}" '
                f'height="{bh:.1f}" rx="{bw / 2:.1f}" fill="url(#{gid})"/>'
            )
    else:  # hexagone
        pts = []
        r = short * 0.29
        for i in range(6):
            ang = math.pi / 6 + i * math.pi / 3
            pts.append(f"{cx + r * math.cos(ang):.1f},{cy + r * math.sin(ang):.1f}")
        parts.append(f'<polygon points="{" ".join(pts)}" fill="url(#{gid})"/>')
    parts.append("</g>")

    # liseré + points de repère
    parts.append(
        f'<rect x="10" y="10" width="{w - 20}" height="{h - 20}" rx="14" '
        f'fill="none" stroke="#ffffff" stroke-opacity="0.10"/>'
    )
    for i in range(3):
        parts.append(
            f'<circle cx="{28 + i * 16}" cy="{h - 26}" r="3.5" fill="{a}" '
            f'fill-opacity="{0.9 - i * 0.28:.2f}"/>'
        )
    parts.append("</svg>")
    return Markup("".join(parts))
