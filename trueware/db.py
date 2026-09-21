"""Accès SQLite pour Trueware.

Une seule connexion par requête Flask, rangée dans `g`. Le schéma est appliqué
au démarrage (idempotent) et le catalogue est semé si la base est vide.
"""
from __future__ import annotations

import os
import sqlite3
from datetime import datetime, timezone
from pathlib import Path

from flask import current_app, g

SCHEMA_PATH = Path(__file__).with_name("schema.sql")


def now() -> str:
    """Horodatage UTC en ISO 8601, à la seconde."""
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat()


def get_db() -> sqlite3.Connection:
    if "db" not in g:
        path = current_app.config["DATABASE"]
        if path != ":memory:":
            Path(path).parent.mkdir(parents=True, exist_ok=True)
        # isolation_level=None : pas de transaction implicite, ce qui laisse
        # place_order() ouvrir son BEGIN IMMEDIATE sans conflit.
        conn = sqlite3.connect(path, isolation_level=None)
        conn.row_factory = sqlite3.Row
        conn.execute("PRAGMA foreign_keys = ON")
        conn.execute("PRAGMA busy_timeout = 4000")
        if path != ":memory:":
            conn.execute("PRAGMA journal_mode = WAL")
        g.db = conn
    return g.db


def close_db(_exc=None) -> None:
    conn = g.pop("db", None)
    if conn is not None:
        conn.close()


def query(sql: str, args=(), one: bool = False):
    cur = get_db().execute(sql, args)
    rows = cur.fetchall()
    cur.close()
    return (rows[0] if rows else None) if one else rows


def execute(sql: str, args=()) -> sqlite3.Cursor:
    db = get_db()
    cur = db.execute(sql, args)
    db.commit()
    return cur


def init_db(app) -> None:
    """Crée le schéma puis sème le catalogue si besoin."""
    from .catalog import seed

    with app.app_context():
        db = get_db()
        db.executescript(SCHEMA_PATH.read_text(encoding="utf-8"))
        db.commit()
        seed(db)
        close_db()


def secret_key(data_dir: Path) -> bytes:
    """Clé de signature des sessions, persistée pour survivre aux redémarrages.

    En production, on préfère la variable d'environnement TRUEWARE_SECRET_KEY.
    """
    env = os.environ.get("TRUEWARE_SECRET_KEY")
    if env:
        return env.encode("utf-8")
    data_dir.mkdir(parents=True, exist_ok=True)
    key_file = data_dir / "trueware_secret.key"
    if not key_file.exists():
        key_file.write_bytes(os.urandom(48))
        try:
            key_file.chmod(0o600)
        except OSError:  # systèmes de fichiers sans permissions POSIX
            pass
    return key_file.read_bytes()
