# backend/dashboard_routes.py

from fastapi import APIRouter
from datetime import datetime
import sqlite3
import random

router = APIRouter(
    prefix="/dashboard",
    tags=["Dashboard"]
)

DB_PATH = "noxvault_console.db"


# =========================================================
# DB HELPERS
# =========================================================
def db_connect():
    return sqlite3.connect(DB_PATH)


def log_dashboard_snapshot(snapshot: dict):
    """
    Logs key dashboard metrics into DB tables.
    """

    conn = db_connect()
    c = conn.cursor()

    # Asset snapshot
    c.execute("""
        INSERT INTO asset_snapshots (ts, total_assets, unmanaged_assets)
        VALUES (?, ?, ?)
    """, (
        snapshot["timestamp"],
        snapshot["asset_total"],
        snapshot["asset_unmanaged"]
    ))

    # Vulnerability summary
    c.execute("""
        INSERT INTO vuln_summary (ts, critical, high, medium, low)
        VALUES (?, ?, ?, ?, ?)
    """, (
        snapshot["timestamp"],
        snapshot["vuln_counts"]["critical"],
        snapshot["vuln_counts"]["high"],
        snapshot["vuln_counts"]["medium"],
        snapshot["vuln_counts"]["low"]
    ))

    # Firewall stats
    c.execute("""
        INSERT INTO firewall_stats (ts, blocked, allowed, suspicious)
        VALUES (?, ?, ?, ?)
    """, (
        snapshot["timestamp"],
        snapshot["firewall_stats"]["blocked"],
        snapshot["firewall_stats"]["allowed"],
        snapshot["firewall_stats"]["suspicious"]
    ))

    # System health
    c.execute("""
        INSERT INTO system_health (ts, cpu, memory, disk, status)
        VALUES (?, ?, ?, ?, ?)
    """, (
        snapshot["timestamp"],
        snapshot["system_health"]["cpu"],
        snapshot["system_health"]["memory"],
        snapshot["system_health"]["disk"],
        snapshot["system_health"]["status"]
    ))

    conn.commit()
    conn.close()


# =========================================================
# COLLECTORS (ADVANCED)
# =========================================================
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


# =========================================================
# DASHBOARD SNAPSHOT (MAIN ENDPOINT)
# =========================================================
@router.get("/snapshot")
def dashboard_snapshot():
    """
    Returns a full dashboard snapshot:
        - Asset inventory
        - Threat intel
        - Vulnerabilities
        - Firewall stats
        - System health
    Logs snapshot to DB.
    """

    snapshot = {
        "timestamp": datetime.utcnow().isoformat(),
        **collect_asset_inventory(),
        **collect_threat_intel(),
        **collect_vulnerabilities(),
        **collect_firewall(),
        **collect_system_health(),
    }

    # Log snapshot to DB
    log_dashboard_snapshot(snapshot)

    return snapshot


# =========================================================
# DASHBOARD SUMMARY (LIGHTWEIGHT)
# =========================================================
@router.get("/summary")
def dashboard_summary():
    """
    Lightweight dashboard summary for fast UI refresh.
    """

    return {
        "timestamp": datetime.utcnow().isoformat(),
        "assets": collect_asset_inventory(),
        "vulnerabilities": collect_vulnerabilities(),
        "firewall": collect_firewall(),
        "system_health": collect_system_health(),
    }
