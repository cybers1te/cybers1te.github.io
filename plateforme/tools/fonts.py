#!/usr/bin/env python3
"""marketbuss — fabrique les deux fichiers de police du site à partir de Recursive.

Recursive (https://github.com/arrowtype/recursive) est sous licence libre
OFL 1.1, sans nom réservé. Le fichier d'origine pèse 2,4 Mo ; le site n'en
garde que les caractères et les axes dont il se sert :

  site/fonts/recursive-sans.woff2   textes et titres (axes CASL et wght)
  site/fonts/recursive-mono.woff2   lignes de calcul, à chasse fixe (axe wght)

Usage (à refaire seulement si un caractère manque) :

  pip install fonttools brotli
  python3 plateforme/tools/fonts.py chemin/vers/Recursive_VF_1.085.ttf
"""
import io
import os
import sys

from fontTools import subset
from fontTools.ttLib import TTFont
from fontTools.varLib import instancer

SRC = sys.argv[1]
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'site', 'fonts')

# Latin de base et accentué, ponctuation, euro, signes de calcul et flèches.
CHARS = set(range(0x20, 0x7F)) | set(range(0xA0, 0x100)) | {0x131, 0x152, 0x153, 0x160, 0x161, 0x178, 0x17D, 0x17E, 0x2C6, 0x2DC}
CHARS |= set(range(0x2000, 0x2070)) | {0x20AC, 0x2122, 0x2190, 0x2191, 0x2192, 0x2193, 0x2212, 0x2215, 0x221E, 0x2248, 0x2260, 0x2264, 0x2265, 0x2713, 0x25CF}


def make(name, limits, features):
    font = instancer.instantiateVariableFont(TTFont(SRC), limits)
    # Relire la police figée : le découpage a besoin d'une table gvar complète.
    buffer = io.BytesIO()
    font.save(buffer)
    buffer.seek(0)
    font = TTFont(buffer)
    options = subset.Options()
    options.layout_features = features
    options.name_IDs = [0, 1, 2, 3, 4, 5, 6, 13, 14]  # dont le copyright et la licence
    options.notdef_outline = True
    options.glyph_names = False
    options.hinting = False
    options.desubroutinize = True
    cutter = subset.Subsetter(options)
    cutter.populate(unicodes=CHARS)
    cutter.subset(font)
    font.flavor = 'woff2'
    path = os.path.join(OUT, name)
    font.save(path)
    print(name, os.path.getsize(path), 'octets')


make('recursive-sans.woff2', {'MONO': 0, 'slnt': 0, 'CRSV': 0.5, 'wght': (300, 900)},
     ['kern', 'liga', 'locl', 'ccmp', 'mark', 'mkmk', 'case', 'tnum', 'pnum', 'zero', 'calt', 'rvrn'])
make('recursive-mono.woff2', {'MONO': 1, 'CASL': 0, 'slnt': 0, 'CRSV': 0.5, 'wght': (300, 800)},
     ['kern', 'locl', 'ccmp', 'mark', 'mkmk', 'case', 'zero', 'rvrn'])
