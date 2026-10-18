from fastapi import FastAPI, WebSocket
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime
import asyncio
import random
import sqlite3

# ==========================
# FASTAPI APP
# ==========================
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
    )

# ==========================
# IMPORT ROUTERS
# ==========================
from backend.firewall_router import router as firewall_router
from backend.system_audit_router import router as system_audit_router
from backend.dashboard_routes import router as dashboard_router
from backend.audit_routes import audit_router
from backend.threat_intel_ws import router as threat_intel_ws_router
from backend.missing_routes import router as missing_routes_router
from backend.attack_map_ws import router as attack_map_ws_router
from backend.vuln_scan_ws import router as vuln_scan_ws_router
from backend.ip_scan_routes import router as ip_scan_router
from backend.ai.ai_routes import router as ai_router

# ⭐ IMPORTANT: Your folder is "audits", not "audit"
from audit.network import get_network_summary
from audit.traffic import get_network_traffic

# ==========================
# INCLUDE ROUTERS
# ==========================
app.include_router(firewall_router)
app.include_router(system_audit_router)
app.include_router(dashboard_router)
app.include_router(audit_router)
app.include_router(threat_intel_ws_router)
app.include_router(attack_map_ws_router)
app.include_router(vuln_scan_ws_router)
app.include_router(ip_scan_router)
app.include_router(missing_routes_router)
app.include_router(ai_router, prefix="/ai")

# ==========================
# NETWORK ROUTES
# ==========================
@app.get("/api/network-audit")
def network_audit():
    return get_network_summary()

@app.get("/api/network-traffic")
def network_traffic():
    return get_network_traffic()

# ==========================
# DATABASE INIT
# ==========================
DB_PATH = "noxvault_console.db"

def init_db():
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()

    c.execute("""
    CREATE TABLE IF NOT EXISTS asset_snapshots (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        ts TEXT,
        total_assets INTEGER,
        unmanaged_assets INTEGER
    )
    """)

    c.execute("""
    CREATE TABLE IF NOT EXISTS threat_events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        ts TEXT,
        source TEXT,
        severity TEXT,
        description TEXT
    )
    """)

    c.execute("""
    CREATE TABLE IF NOT EXISTS vuln_summary (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        ts TEXT,
        critical INTEGER,
        high INTEGER,
        medium INTEGER,
        low INTEGER
    )
    """)

    c.execute("""
    CREATE TABLE IF NOT EXISTS firewall_stats (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        ts TEXT,
        blocked INTEGER,
        allowed INTEGER,
        suspicious INTEGER
    )
    """)

    c.execute("""
    CREATE TABLE IF NOT EXISTS system_health (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        ts TEXT,
        cpu REAL,
        memory REAL,
        disk REAL,
        status TEXT
    )
    """)

    conn.commit()
    conn.close()

init_db()

# ==========================
# COLLECTORS
# ==========================
def collect_asset_inventory():
    return {
        "asset_os_distribution": {
            "Windows": random.randint(25000, 30000),
            "Linux": random.randint(10000, 13000),
            "Mac": random.randint(5000, 7000),
        },
        "asset_geo_distribution": {
            "United States": random.randint(13000, 16000),
            "India": random.randint(7000, 9000),
            "United Kingdom": random.randint(4500, 5500),
        },
        "asset_unmanaged": random.randint(40, 120),
        "asset_total": random.randint(40000, 50000),
    }

def collect_threat_intel():
    events = [
        {
            "source": random.choice(["OTX", "AbuseIPDB", "CISA KEV", "Internal IDS"]),
            "severity": random.choice(["Low", "Medium", "High", "Critical"]),
            "description": "Threat event detected",
            "ts": datetime.utcnow().isoformat()
        }
        for _ in range(5)
    ]

    return {
        "threat_events": events,
        "threat_summary": {
            "critical": sum(e["severity"] == "Critical" for e in events),
            "high": sum(e["severity"] == "High" for e in events),
            "medium": sum(e["severity"] == "Medium" for e in events),
            "low": sum(e["severity"] == "Low" for e in events),
        }
    }

def collect_vulnerabilities():
    return {
        "vuln_counts": {
            "critical": random.randint(40, 120),
            "high": random.randint(120, 260),
            "medium": random.randint(300, 600),
            "low": random.randint(200, 500),
        }
    }

def collect_firewall():
    return {
        "firewall_stats": {
            "blocked": random.randint(5000, 15000),
            "allowed": random.randint(20000, 40000),
            "suspicious": random.randint(300, 1200),
        }
    }

def collect_system_health():
    return {
        "system_health": {
            "cpu": random.randint(10, 90),
            "memory": random.randint(10, 90),
            "disk": random.randint(10, 90),
            "status": random.choice(["Healthy", "Warning", "Critical"])
        }
    }

# ==========================
# UNIFIED WEBSOCKET STREAM
# ==========================
@app.websocket("/ws/noxvault-console")
async def noxvault_console_ws(websocket: WebSocket):
    await websocket.accept()

    while True:
        payload = {
            "timestamp": datetime.utcnow().isoformat(),
            **collect_asset_inventory(),
            **collect_threat_intel(),
            **collect_vulnerabilities(),
            **collect_firewall(),
            **collect_system_health(),
        }

        print("Sending payload...")
        await websocket.send_json(payload)
        await asyncio.sleep(5)

# ==========================
# ROOT ENDPOINT
# ==========================
@app.get("/")
def root():
    return {"message": "NOXVAULT backend running"}
