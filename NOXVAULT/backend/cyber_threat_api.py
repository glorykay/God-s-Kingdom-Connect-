import json
from datetime import datetime
from fastapi import APIRouter
from backend.db import get_conn

router = APIRouter()

# ASSETS
@router.post("/assets/ingest")
def ingest_assets(data: dict):
    conn = get_conn()
    cur = conn.cursor()
    cur.execute("DELETE FROM assets")
    cur.execute(
        "INSERT INTO assets (data, ts) VALUES (?, ?)",
        (json.dumps(data), datetime.utcnow().isoformat())
    )
    conn.commit()
    conn.close()
    return {"status": "ok"}

@router.get("/assets")
def get_assets():
    conn = get_conn()
    cur = conn.cursor()
    row = cur.execute("SELECT data FROM assets ORDER BY id DESC LIMIT 1").fetchone()
    conn.close()
    return json.loads(row["data"]) if row else {}

# THREAT INTEL
@router.post("/threat-intel/ingest")
def ingest_threat_intel(data: dict):
    conn = get_conn()
    cur = conn.cursor()
    cur.execute("DELETE FROM threat_intel")
    cur.execute(
        "INSERT INTO threat_intel (data, ts) VALUES (?, ?)",
        (json.dumps(data), datetime.utcnow().isoformat())
    )
    conn.commit()
    conn.close()
    return {"status": "ok"}

@router.get("/threat-intel")
def get_threat_intel():
    conn = get_conn()
    cur = conn.cursor()
    row = cur.execute("SELECT data FROM threat_intel ORDER BY id DESC LIMIT 1").fetchone()
    conn.close()
    return json.loads(row["data"]) if row else {}

# FIREWALL EVENTS
@router.post("/firewall/events/ingest")
def ingest_firewall_event(event: dict):
    conn = get_conn()
    cur = conn.cursor()
    cur.execute(
        "INSERT INTO firewall_events (data, ts) VALUES (?, ?)",
        (json.dumps(event), event.get("ts") or datetime.utcnow().isoformat())
    )
    conn.commit()
    conn.close()
    return {"status": "ok"}

@router.get("/firewall/events")
def get_firewall_events():
    conn = get_conn()
    cur = conn.cursor()
    rows = cur.execute("SELECT data FROM firewall_events ORDER BY id DESC LIMIT 50").fetchall()
    conn.close()
    return [json.loads(r["data"]) for r in rows]

# SYSTEM HEALTH
@router.post("/system-health/ingest")
def ingest_system_health(data: dict):
    conn = get_conn()
    cur = conn.cursor()
    cur.execute("DELETE FROM system_health")
    cur.execute(
        "INSERT INTO system_health (data, ts) VALUES (?, ?)",
        (json.dumps(data), datetime.utcnow().isoformat())
    )
    conn.commit()
    conn.close()
    return {"status": "ok"}

@router.get("/system-health")
def get_system_health():
    conn = get_conn()
    cur = conn.cursor()
    row = cur.execute("SELECT data FROM system_health ORDER BY id DESC LIMIT 1").fetchone()
    conn.close()
    return json.loads(row["data"]) if row else {}

# UNMANAGED
@router.post("/unmanaged/ingest")
def ingest_unmanaged(data: dict):
    conn = get_conn()
    cur = conn.cursor()
    cur.execute("DELETE FROM unmanaged")
    cur.execute(
        "INSERT INTO unmanaged (data, ts) VALUES (?, ?)",
        (json.dumps(data), datetime.utcnow().isoformat())
    )
    conn.commit()
    conn.close()
    return {"status": "ok"}

@router.get("/unmanaged")
def get_unmanaged():
    conn = get_conn()
    cur = conn.cursor()
    row = cur.execute("SELECT data FROM unmanaged ORDER BY id DESC LIMIT 1").fetchone()
    conn.close()
    return json.loads(row["data"]) if row else {}
