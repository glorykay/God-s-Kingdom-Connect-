# backend/audit_routes.py

from fastapi import APIRouter
from datetime import datetime
import sqlite3
from typing import Dict, Any, List

router = APIRouter(
    prefix="/audit",
    tags=["System Audit"]
)

DB_PATH = "noxvault_console.db"


# =========================================================
# DB HELPERS
# =========================================================
def db_connect():
    return sqlite3.connect(DB_PATH)


def log_asset_snapshot(total: int, unmanaged: int):
    conn = db_connect()
    c = conn.cursor()

    c.execute("""
        INSERT INTO asset_snapshots (ts, total_assets, unmanaged_assets)
        VALUES (?, ?, ?)
    """, (datetime.utcnow().isoformat(), total, unmanaged))

    conn.commit()
    conn.close()


def log_vuln_summary(critical: int, high: int, medium: int, low: int):
    conn = db_connect()
    c = conn.cursor()

    c.execute("""
        INSERT INTO vuln_summary (ts, critical, high, medium, low)
        VALUES (?, ?, ?, ?, ?)
    """, (datetime.utcnow().isoformat(), critical, high, medium, low))

    conn.commit()
    conn.close()


def log_threat_event(source: str, severity: str, description: str):
    conn = db_connect()
    c = conn.cursor()

    c.execute("""
        INSERT INTO threat_events (ts, source, severity, description)
        VALUES (?, ?, ?, ?)
    """, (datetime.utcnow().isoformat(), source, severity, description))

    conn.commit()
    conn.close()


# =========================================================
# ASSET AUDIT
# =========================================================
@router.get("/assets")
def audit_assets():
    """
    Returns asset inventory audit:
        - OS distribution
        - Geo distribution
        - Total assets
        - Unmanaged assets
    Logs snapshot to DB.
    """

    audit = {
        "timestamp": datetime.utcnow().isoformat(),
        "asset_os_distribution": {
            "Windows": 28000,
            "Linux": 12000,
            "Mac": 6000,
        },
        "asset_geo_distribution": {
            "United States": 15000,
            "India": 8000,
            "United Kingdom": 5000,
        },
        "asset_total": 46000,
        "asset_unmanaged": 90
    }

    # Log snapshot
    log_asset_snapshot(
        total=audit["asset_total"],
        unmanaged=audit["asset_unmanaged"]
    )

    return audit


# =========================================================
# VULNERABILITY AUDIT
# =========================================================
@router.get("/vulnerabilities")
def audit_vulnerabilities():
    """
    Returns vulnerability audit summary:
        - Critical
        - High
        - Medium
        - Low
    Logs summary to DB.
    """

    vuln = {
        "timestamp": datetime.utcnow().isoformat(),
        "vuln_counts": {
            "critical": 80,
            "high": 200,
            "medium": 450,
            "low": 300,
        }
    }

    # Log summary
    log_vuln_summary(
        critical=vuln["vuln_counts"]["critical"],
        high=vuln["vuln_counts"]["high"],
        medium=vuln["vuln_counts"]["medium"],
        low=vuln["vuln_counts"]["low"]
    )

    return vuln


# =========================================================
# THREAT AUDIT
# =========================================================
@router.get("/threats")
def audit_threats():
    """
    Returns threat audit events:
        - Source (OTX, CISA KEV, IDS)
        - Severity
        - Description
    Logs each event to DB.
    """

    events = [
        {
            "source": "OTX",
            "severity": "High",
            "description": "Malicious IP detected",
            "ts": datetime.utcnow().isoformat()
        },
        {
            "source": "CISA KEV",
            "severity": "Critical",
            "description": "Known exploited vulnerability",
            "ts": datetime.utcnow().isoformat()
        },
        {
            "source": "Internal IDS",
            "severity": "Medium",
            "description": "Suspicious outbound connection",
            "ts": datetime.utcnow().isoformat()
        }
    ]

    # Log events
    for e in events:
        log_threat_event(
            source=e["source"],
            severity=e["severity"],
            description=e["description"]
        )

    return {
        "timestamp": datetime.utcnow().isoformat(),
        "events": events
    }


# =========================================================
# FULL SYSTEM AUDIT (ALL-IN-ONE)
# =========================================================
@router.get("/full")
def full_system_audit():
    """
    Returns a full audit bundle:
        - Asset audit
        - Vulnerability audit
        - Threat audit
    Perfect for dashboard + AI analysis.
    """

    assets = audit_assets()
    vulns = audit_vulnerabilities()
    threats = audit_threats()

    return {
        "timestamp": datetime.utcnow().isoformat(),
        "audit": {
            "assets": assets,
            "vulnerabilities": vulns,
            "threats": threats
        }
    }
