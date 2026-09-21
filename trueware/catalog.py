"""Catalogue initial de Trueware.

Marques et références volontairement fictives. Les prix sont en centimes.
Le semis n'a lieu que si la table `products` est vide : relancer l'application
ne duplique donc rien et ne réécrit pas les modifications faites via l'admin.
"""
from __future__ import annotations

import os
import secrets
import sqlite3
from pathlib import Path

from werkzeug.security import generate_password_hash

from .db import now

CATEGORIES = [
    ("peripheriques", "Périphériques", "Claviers, souris et contrôleurs de précision.", 1),
    ("composants", "Composants", "Cartes, processeurs et mémoire pour machines exigeantes.", 2),
    ("ecrans", "Écrans", "Dalles calibrées, du bureau au studio.", 3),
    ("audio", "Audio", "Casques, micros et interfaces pour écouter juste.", 4),
    ("reseau", "Réseau", "Routeurs, switchs et liaisons fiables.", 5),
    ("stockage", "Stockage", "SSD, NAS et sauvegardes qui tiennent.", 6),
]

# (slug, nom, marque, catégorie, prix, prix barré, stock, résumé, description, specs, badge, mis en avant)
PRODUCTS = [
    (
        "clavier-norvik-k87-tactile", "Clavier Norvik K87 Tactile", "Norvik", "peripheriques",
        13900, 16900, 42,
        "Clavier 87 touches à switchs tactiles, châssis aluminium et câble détachable.",
        "Le K87 vise le compromis rare entre compacité et confort de frappe. Son châssis en "
        "aluminium extrudé de 1,6 mm supprime la flexion centrale des boîtiers plastique, et la "
        "double couche de mousse sous le PCB retire la résonance métallique habituelle de ce "
        "format. Les switchs tactiles se déclenchent à 2 mm pour une course totale de 4 mm, un "
        "réglage confortable pour de longues sessions de frappe comme pour le jeu.",
        "Format|87 touches (TKL)\nSwitchs|Tactiles, 55 g, hot-swap\nChâssis|Aluminium 6063\n"
        "Connexion|USB-C détachable\nFinition|Double injection PBT\nGarantie|3 ans",
        "Best-seller", 1,
    ),
    (
        "souris-axelon-pulse-8k", "Souris Axelon Pulse 8K", "Axelon", "peripheriques",
        8900, None, 67,
        "58 g, capteur 26 000 PPP et interrogation sans fil à 8 000 Hz.",
        "La Pulse 8K descend à 58 g sans coque ajourée : la rigidité vient d'une structure interne "
        "nervurée, pas de trous dans le plastique. Le dongle 8 000 Hz ramène la latence de bout en "
        "bout sous la milliseconde, et l'accumulateur tient 70 heures à 1 000 Hz.",
        "Poids|58 g\nCapteur|26 000 PPP, 650 IPS\nInterrogation|8 000 Hz sans fil\n"
        "Autonomie|70 h à 1 000 Hz\nSwitchs|Optiques, 100 M de clics\nCharge|USB-C",
        "", 1,
    ),
    (
        "tapis-trueware-grid-xl", "Tapis Trueware Grid XL", "Trueware", "peripheriques",
        2900, None, 120,
        "900 × 400 mm, surface tissée fine et base caoutchouc antidérapante.",
        "Un tapis étendu qui couvre clavier et souris d'un seul tenant. La trame serrée offre un "
        "glissement régulier et des bords cousus qui ne s'effilochent pas.",
        "Dimensions|900 × 400 × 4 mm\nSurface|Tissu tissé serré\nBase|Caoutchouc naturel\n"
        "Bords|Coutures renforcées\nEntretien|Lavable à 30 °C",
        "", 0,
    ),
    (
        "clavier-norvik-k65-silence", "Clavier Norvik K65 Silence", "Norvik", "peripheriques",
        11900, None, 28,
        "Format 65 %, switchs linéaires silencieux et amortisseurs intégrés.",
        "Même construction que le K87 dans un format 65 % qui libère de la place pour la souris. "
        "Les switchs linéaires silencieux et les amortisseurs en silicone le rendent utilisable en "
        "bureau partagé ou en visioconférence.",
        "Format|68 touches (65 %)\nSwitchs|Linéaires silencieux, 45 g\nChâssis|Aluminium 6063\n"
        "Connexion|USB-C / Bluetooth 5.2\nAutonomie|140 h\nGarantie|3 ans",
        "", 0,
    ),
    (
        "gpu-kaido-rx-980", "Carte graphique Kaido RX 980", "Kaido", "composants",
        84900, 92900, 9,
        "16 Go GDDR7, triple ventilateur et hauteur deux slots et demi.",
        "La RX 980 cible le 1440p à haute fréquence d'image et le 4K en qualité élevée. Le "
        "dissipateur à six caloducs et chambre à vapeur maintient le GPU sous 72 °C en charge "
        "soutenue, avec un arrêt complet des ventilateurs sous 50 °C.",
        "Mémoire|16 Go GDDR7\nBus|256 bits\nAlimentation|1 × 12V-2x6, 320 W\n"
        "Sorties|3 × DisplayPort 2.1, 1 × HDMI 2.1\nDimensions|304 × 130 × 52 mm\nGarantie|3 ans",
        "Stock limité", 1,
    ),
    (
        "cpu-vertice-c9-16c", "Processeur Vertice C9 16 cœurs", "Vertice", "composants",
        47900, None, 18,
        "16 cœurs, 32 fils, 5,4 GHz en pointe et 120 W de consommation typique.",
        "Un processeur pensé pour les charges mixtes : compilation, rendu et jeu sur la même "
        "machine. Les huit cœurs performants montent à 5,4 GHz tandis que les huit cœurs efficaces "
        "absorbent les tâches de fond sans faire grimper la consommation.",
        "Cœurs|16 (8P + 8E), 32 fils\nFréquence|4,1 / 5,4 GHz\nCache|40 Mo L3\n"
        "TDP|120 W (240 W en pointe)\nSocket|LGA-1851\nGravure|3 nm",
        "", 1,
    ),
    (
        "ram-vertice-flux-32", "Mémoire Vertice Flux 32 Go DDR5-6400", "Vertice", "composants",
        15900, 18900, 34,
        "Kit 2 × 16 Go DDR5-6400 CL30, dissipateur bas profil.",
        "Un kit CL30 qui tient sa fréquence annoncée avec un seul profil à activer dans le BIOS. "
        "Le dissipateur de 33 mm passe sous la grande majorité des ventirads tour.",
        "Capacité|2 × 16 Go\nFréquence|6 400 MT/s\nLatence|CL30-38-38-96\nTension|1,35 V\n"
        "Hauteur|33 mm\nGarantie|À vie",
        "", 0,
    ),
    (
        "carte-mere-kaido-b850-pro", "Carte mère Kaido B850 Pro", "Kaido", "composants",
        22900, None, 22,
        "ATX, quatre emplacements M.2, réseau 2,5 Gb/s et Wi-Fi 7.",
        "Une base solide sans surcoût inutile : étage d'alimentation 14+2 phases correctement "
        "refroidi, quatre M.2 dont deux en PCIe 5.0, et un BIOS qui expose ce qu'il faut sans "
        "noyer l'utilisateur.",
        "Format|ATX\nAlimentation|14+2 phases\nM.2|4 (2 × PCIe 5.0)\nRéseau|2,5 Gb/s + Wi-Fi 7\n"
        "USB|1 × USB4, 6 × USB 3.2\nAudio|ALC1220",
        "", 0,
    ),
    (
        "ventirad-trueware-tower-120", "Ventirad Trueware Tower 120", "Trueware", "composants",
        5900, None, 55,
        "Tour simple, six caloducs et ventilateur 120 mm à roulement fluide.",
        "Dissipation de 220 W pour 28 dB(A) mesurés à 50 cm. Le décalage des ailettes libère le "
        "premier emplacement mémoire, y compris avec des barrettes à dissipateur.",
        "Dissipation|220 W\nCaloducs|6 × 6 mm\nVentilateur|120 mm, 400–1 800 tr/min\n"
        "Bruit|28 dB(A) max\nHauteur|158 mm\nSockets|LGA-1851 / AM5",
        "", 0,
    ),
    (
        "ecran-lumea-27-4k-ips", "Écran Lumea 27\" 4K IPS", "Lumea", "ecrans",
        44900, 49900, 15,
        "27 pouces 4K, 144 Hz, 98 % DCI-P3 et calibrage usine fourni.",
        "Une dalle IPS rapide livrée avec son rapport de calibrage individuel. Le hub intégré "
        "alimente un portable en 96 W et bascule les périphériques USB avec l'entrée vidéo, ce qui "
        "évite un dock séparé.",
        "Dalle|IPS 27\", 3840 × 2160\nFréquence|144 Hz\nCouleur|98 % DCI-P3, ΔE < 2\n"
        "Entrées|2 × DP 1.4, 2 × HDMI 2.1, USB-C 96 W\nHub|3 × USB 3.2\nPied|Hauteur, pivot, rotation",
        "Calibré", 1,
    ),
    (
        "ecran-lumea-34-ultralarge", "Écran Lumea 34\" Ultra-large", "Lumea", "ecrans",
        62900, None, 7,
        "34 pouces incurvé 21:9, 3440 × 1440 à 165 Hz.",
        "Le format 21:9 remplace deux écrans sans la barre centrale. La courbure 1500R reste "
        "discrète et la dalle conserve une uniformité correcte jusqu'aux bords.",
        "Dalle|VA incurvée 1500R\nRésolution|3440 × 1440\nFréquence|165 Hz\n"
        "Couleur|95 % DCI-P3\nEntrées|2 × DP 1.4, 2 × HDMI 2.1\nHaut-parleurs|2 × 5 W",
        "", 0,
    ),
    (
        "ecran-lumea-24-bureau", "Écran Lumea 24\" Bureau", "Lumea", "ecrans",
        16900, None, 48,
        "24 pouces 1920 × 1080, 100 Hz, pied réglable en hauteur.",
        "L'écran de poste de travail sans mauvaise surprise : dalle IPS mate, pied complet livré "
        "de série et fixation VESA 100.",
        "Dalle|IPS 23,8\", 1920 × 1080\nFréquence|100 Hz\nLuminosité|300 cd/m²\n"
        "Entrées|1 × DP, 1 × HDMI\nPied|Hauteur 130 mm, pivot\nVESA|100 × 100",
        "", 0,
    ),
    (
        "bras-trueware-monomast", "Bras d'écran Trueware Monomast", "Trueware", "ecrans",
        7900, None, 40,
        "Bras à gaz pour écrans jusqu'à 32 pouces et 9 kg.",
        "Ressort à gaz réglable sans outil, passage de câbles interne et double fixation étau ou "
        "traversée de plateau.",
        "Charge|2–9 kg\nTaille|17 à 32 pouces\nVESA|75 / 100\nRotation|360°\n"
        "Fixation|Étau ou traversée\nMatière|Acier et aluminium",
        "", 0,
    ),
    (
        "casque-solen-studio-one", "Casque Solen Studio One", "Solen", "audio",
        19900, 23900, 31,
        "Circum-aural fermé, transducteurs 45 mm et câble détachable.",
        "Un casque de monitoring à la courbe volontairement neutre, pensé pour le montage et le "
        "mixage. Les coussinets en mousse à mémoire de forme se remplacent sans outil, et l'arceau "
        "en acier ressort encaisse les déplacements quotidiens.",
        "Type|Fermé, circum-aural\nTransducteurs|45 mm\nImpédance|38 Ω\n"
        "Réponse|10 Hz – 28 kHz\nCâble|Détachable, 3 m\nPoids|295 g",
        "", 1,
    ),
    (
        "micro-solen-cardio-usb", "Micro Solen Cardio USB", "Solen", "audio",
        12900, None, 26,
        "Micro à condensateur cardioïde, USB-C, sortie casque sans latence.",
        "Capsule de 25 mm, convertisseur 24 bits / 96 kHz et molette de gain analogique. La sortie "
        "casque directe permet de s'entendre sans passer par le logiciel.",
        "Capsule|Condensateur 25 mm\nDirectivité|Cardioïde\nRésolution|24 bit / 96 kHz\n"
        "Connexion|USB-C\nCommandes|Gain, mute, retour\nMonture|Filetage 5/8\"",
        "", 0,
    ),
    (
        "enceintes-solen-near-4", "Enceintes Solen Near 4", "Solen", "audio",
        27900, None, 12,
        "Paire de moniteurs actifs 4 pouces, 2 × 50 W, entrées XLR et RCA.",
        "Des moniteurs de proximité compacts qui restent lisibles à faible volume. Le guide d'onde "
        "élargit la zone d'écoute utile, utile sur un bureau où l'on n'est pas toujours centré.",
        "Haut-parleur|4\" + dôme 1\"\nPuissance|2 × 50 W\nEntrées|XLR, TRS, RCA\n"
        "Réponse|52 Hz – 22 kHz\nRéglages|Grave, aigu\nDimensions|235 × 150 × 190 mm",
        "", 0,
    ),
    (
        "routeur-orbite-wr7", "Routeur Orbite WR7", "Orbite", "reseau",
        24900, 27900, 19,
        "Wi-Fi 7 tri-bande, port 10 Gb/s et quatre ports 2,5 Gb/s.",
        "Un routeur pour connexion fibre rapide : liaison amont 10 Gb/s, réseau invité isolé et "
        "mises à jour signées. L'interface locale reste utilisable sans compte en ligne.",
        "Wi-Fi|7 tri-bande, 4×4\nAmont|1 × 10 Gb/s\nLAN|4 × 2,5 Gb/s\n"
        "Processeur|Quad-core 2,2 GHz\nVPN|WireGuard intégré\nAdministration|Web locale ou distante",
        "", 1,
    ),
    (
        "switch-orbite-s8-25g", "Switch Orbite S8 2,5 G", "Orbite", "reseau",
        17900, None, 24,
        "Huit ports 2,5 Gb/s, deux liaisons SFP+ 10 G, boîtier métal sans ventilateur.",
        "Switch administrable simplement : VLAN, agrégation et miroir de port, sans ventilateur "
        "donc silencieux dans un bureau.",
        "Ports|8 × 2,5 Gb/s\nLiaisons|2 × SFP+ 10 G\nRefroidissement|Passif\n"
        "Fonctions|VLAN, LACP, QoS\nConsommation|18 W max\nBoîtier|Acier, rackable",
        "", 0,
    ),
    (
        "adaptateur-orbite-usb-25g", "Adaptateur Orbite USB 2,5 G", "Orbite", "reseau",
        3900, None, 88,
        "Adaptateur USB-C vers Ethernet 2,5 Gb/s, boîtier aluminium.",
        "Pilotes intégrés aux principaux systèmes, sans installation. Le boîtier aluminium dissipe "
        "la chaleur mieux que les modèles plastique de même prix.",
        "Débit|2,5 Gb/s\nConnexion|USB-C 3.2\nCompatibilité|Windows, macOS, Linux\n"
        "Boîtier|Aluminium\nCâble|Intégré, 18 cm",
        "", 0,
    ),
    (
        "ssd-castor-nx-2to", "SSD Castor NX 2 To", "Castor", "stockage",
        17900, 20900, 44,
        "M.2 2280 PCIe 5.0, 14 000 Mo/s en lecture, 1 200 To écrits garantis.",
        "SSD haut débit avec dissipateur graphène fin, compatible avec les emplacements sous "
        "carte graphique. La mémoire tampon dynamique conserve un débit soutenu élevé sur les gros "
        "transferts.",
        "Capacité|2 To\nInterface|PCIe 5.0 ×4, NVMe 2.0\n"
        "Lecture|14 000 Mo/s\nÉcriture|12 000 Mo/s\nEndurance|1 200 To écrits\nGarantie|5 ans",
        "", 1,
    ),
    (
        "ssd-castor-nx-1to", "SSD Castor NX 1 To", "Castor", "stockage",
        9900, None, 73,
        "M.2 2280 PCIe 5.0, 13 000 Mo/s en lecture.",
        "Même contrôleur que la version 2 To pour les configurations où le système et quelques "
        "projets suffisent.",
        "Capacité|1 To\nInterface|PCIe 5.0 ×4\nLecture|13 000 Mo/s\n"
        "Écriture|10 000 Mo/s\nEndurance|600 To écrits\nGarantie|5 ans",
        "", 0,
    ),
    (
        "nas-castor-vault-4", "NAS Castor Vault 4 baies", "Castor", "stockage",
        54900, None, 6,
        "Quatre baies, deux M.2 cache, réseau 2,5 Gb/s, chiffrement matériel.",
        "Boîtier quatre baies avec tiroirs sans outil et alimentation interne. Le chiffrement au "
        "repos est géré par le processeur, sans perte de débit mesurable sur un réseau 2,5 Gb/s.",
        "Baies|4 × 3,5\" SATA\nCache|2 × M.2 NVMe\nProcesseur|Quad-core 2,0 GHz\n"
        "Mémoire|8 Go extensible à 32 Go\nRéseau|2 × 2,5 Gb/s\nRAID|0, 1, 5, 6, 10",
        "", 0,
    ),
    (
        "disque-castor-shield-5to", "Disque externe Castor Shield 5 To", "Castor", "stockage",
        13900, 15900, 37,
        "Disque 2,5 pouces renforcé, USB-C 10 Gb/s, coque antichoc.",
        "Pensé pour le transport : coque moulée résistante aux chutes de 1,5 m et câble rangé dans "
        "la gorge périphérique.",
        "Capacité|5 To\nInterface|USB-C 10 Gb/s\nProtection|Chute 1,5 m\n"
        "Chiffrement|AES-256 logiciel\nPoids|245 g\nGarantie|3 ans",
        "", 0,
    ),
    (
        "dock-trueware-hub-11", "Station d'accueil Trueware Hub 11", "Trueware", "peripheriques",
        15900, None, 29,
        "Onze ports, alimentation 100 W, double affichage 4K à 60 Hz.",
        "Une station qui tient ses promesses d'affichage : deux sorties 4K à 60 Hz simultanées, "
        "Ethernet 2,5 Gb/s et recharge 100 W du portable par un seul câble.",
        "Ports|11 (dont 4 × USB 3.2)\nVidéo|2 × 4K à 60 Hz\nRéseau|2,5 Gb/s\n"
        "Alimentation|100 W en sortie\nLecteur|SD / microSD UHS-II\nBoîtier|Aluminium",
        "", 0,
    ),
    (
        "webcam-lumea-view-4k", "Webcam Lumea View 4K", "Lumea", "ecrans",
        11900, None, 33,
        "Capteur 1/1,8\", 4K à 30 ips, obturateur physique.",
        "Grand capteur pour une image propre en lumière de bureau, sans lissage excessif. "
        "L'obturateur mécanique coulissant évite les caches adhésifs.",
        "Capteur|1/1,8\" 8 Mpx\nVidéo|4K à 30 ips, 1080p à 60 ips\n"
        "Champ|78°\nMise au point|Automatique\nMicros|2, réduction de bruit\nConnexion|USB-C",
        "", 0,
    ),
    (
        "alim-kaido-gold-850", "Alimentation Kaido Gold 850 W", "Kaido", "composants",
        13900, None, 31,
        "850 W, certification 80 Plus Gold, modulaire, ventilateur 135 mm.",
        "Bloc entièrement modulaire avec un câble 12V-2x6 natif. Le ventilateur reste à l'arrêt "
        "sous 35 % de charge, ce qui couvre l'usage bureautique.",
        "Puissance|850 W\nRendement|80 Plus Gold\nCâblage|Entièrement modulaire\n"
        "Connecteur|1 × 12V-2x6 natif\nVentilateur|135 mm, mode semi-passif\nGarantie|10 ans",
        "", 0,
    ),
]


def seed(db: sqlite3.Connection) -> None:
    """Sème catégories, produits et compte administrateur si nécessaire."""
    if db.execute("SELECT COUNT(*) AS n FROM categories").fetchone()["n"] == 0:
        db.executemany(
            "INSERT INTO categories (slug, name, tagline, rank) VALUES (?, ?, ?, ?)",
            CATEGORIES,
        )

    cats = {r["slug"]: r["id"] for r in db.execute("SELECT id, slug FROM categories")}

    if db.execute("SELECT COUNT(*) AS n FROM products").fetchone()["n"] == 0:
        stamp = now()
        db.executemany(
            """INSERT INTO products
               (slug, name, brand, category_id, price_cents, compare_cents, stock,
                summary, description, specs, badge, featured, active, created_at)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)""",
            [
                (slug, name, brand, cats[cat], price, compare, stock,
                 summary, desc, specs, badge, featured, stamp)
                for (slug, name, brand, cat, price, compare, stock,
                     summary, desc, specs, badge, featured) in PRODUCTS
            ],
        )

    _seed_admin(db)
    db.commit()


def _seed_admin(db: sqlite3.Connection) -> None:
    """Crée le compte administrateur initial.

    Aucun mot de passe n'est codé en dur : soit il vient de l'environnement,
    soit il est tiré au hasard et écrit dans data/trueware_admin.txt.
    """
    if db.execute("SELECT COUNT(*) AS n FROM users WHERE is_admin = 1").fetchone()["n"]:
        return

    email = os.environ.get("TRUEWARE_ADMIN_EMAIL", "admin@trueware.local")
    password = os.environ.get("TRUEWARE_ADMIN_PASSWORD")
    generated = password is None
    if generated:
        password = secrets.token_urlsafe(14)

    db.execute(
        """INSERT INTO users (email, name, password_hash, is_admin, country, created_at)
           VALUES (?, ?, ?, 1, 'France', ?)""",
        (email, "Administration", generate_password_hash(password), now()),
    )

    if generated:
        target = Path(os.environ.get("TRUEWARE_DATA_DIR", "data")) / "trueware_admin.txt"
        try:
            target.parent.mkdir(parents=True, exist_ok=True)
            target.write_text(
                "Compte administrateur Trueware créé automatiquement.\n"
                f"Adresse : {email}\nMot de passe : {password}\n"
                "Changez-le après la première connexion, puis supprimez ce fichier.\n",
                encoding="utf-8",
            )
            target.chmod(0o600)
        except OSError:
            pass
