import sqlite3
from pathlib import Path

DB_PATH = Path("backend/noxvault.db")

def get_conn():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_conn()
    cur = conn.cursor()

    # Assets (single latest snapshot)
    cur.execute("""
        CREATE TABLE IF NOT EXISTS assets (
            id INTEGER PRIMARY KEY,
            data TEXT NOT NULL,
            ts TEXT NOT NULL
        )
    """)

    # Threat intel (single latest snapshot)
    cur.execute("""
        CREATE TABLE IF NOT EXISTS threat_intel (
            id INTEGER PRIMARY KEY,
            data TEXT NOT NULL,
            ts TEXT NOT NULL
        )
    """)

    # Firewall events (append-only)
    cur.execute("""
        CREATE TABLE IF NOT EXISTS firewall_events (
            id INTEGER PRIMARY KEY,
            ts TEXT NOT NULL,
            data TEXT NOT NULL
        )
    """)

    # System health (latest only)
    cur.execute("""
        CREATE TABLE IF NOT EXISTS system_health (
            id INTEGER PRIMARY KEY,
            data TEXT NOT NULL,
            ts TEXT NOT NULL
        )
    """)

    # Unmanaged devices (latest only)
    cur.execute("""
        CREATE TABLE IF NOT EXISTS unmanaged (
            id INTEGER PRIMARY KEY,
            data TEXT NOT NULL,
            ts TEXT NOT NULL
        )
    """)

    conn.commit()
    conn.close()
