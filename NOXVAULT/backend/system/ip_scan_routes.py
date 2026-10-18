# backend/ip_scan_routes.py

from fastapi import APIRouter, HTTPException
from datetime import datetime
import sqlite3
from typing import Dict, Any

from backend.scanners.nmap_scanner import NmapScanner

router = APIRouter(
    prefix="/ip-scan",
    tags=["IP Scanner"]
)

DB_PATH = "noxvault_console.db"

scanner = NmapScanner()


# =========================================================
# DB HELPERS
# =========================================================
def log_ip_scan(ip: str, result: Dict[str, Any]):
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()

    c.execute("""
        INSERT INTO threat_events (ts, source, severity, description)
        VALUES (?, ?, ?, ?)
    """, (
        datetime.utcnow().isoformat(),
        "IP Scanner",
        result.get("severity", "Medium"),
        f"IP Scan completed for {ip}"
    ))

    conn.commit()
    conn.close()


# =========================================================
# ADVANCED IP SCAN ENDPOINT
# =========================================================
@router.get("/scan/{ip}")
def scan_ip(ip: str):
    """
    Runs an advanced IP scan using NmapScanner.
    Includes:
        - Port scan
        - Service detection
        - Version detection
        - OS guess
        - Risk scoring
        - AI-ready structure
    Logs results to DB.
    """

    result = scanner.scan_target(ip)

    if "error" in result:
        raise HTTPException(status_code=500, detail=result["error"])

    # -----------------------------------------------------
    # RISK SCORE (simple but expandable)
    # -----------------------------------------------------
    open_ports = result.get("ports", [])
    risk_score = len(open_ports) * 10

    severity = (
        "Low" if risk_score <= 20 else
        "Medium" if risk_score <= 50 else
        "High" if risk_score <= 80 else
        "Critical"
    )

    # -----------------------------------------------------
    # AI-READY STRUCTURE
    # -----------------------------------------------------
    ai_ready = {
        "ip": ip,
        "timestamp": datetime.utcnow().isoformat(),
        "open_ports": open_ports,
        "os_guess": result.get("os_guess", "Unknown"),
        "risk_score": risk_score,
        "severity": severity,
        "issues": []
    }

    # Add common security issues
    port_list = [p["port"] for p in open_ports]

    if 22 in port_list:
        ai_ready["issues"].append("SSH port open — brute-force risk")

    if 3389 in port_list:
        ai_ready["issues"].append("RDP exposed — ransomware risk")

    if 445 in port_list:
        ai_ready["issues"].append("SMB open — lateral movement risk")

    # -----------------------------------------------------
    # LOG TO DB
    # -----------------------------------------------------
    log_ip_scan(ip, ai_ready)

    return ai_ready


# =========================================================
# BULK IP SCAN ENDPOINT
# =========================================================
@router.post("/bulk")
def bulk_scan(ips: Dict[str, Any]):
    """
    Runs IP scans on multiple targets.
    Useful for asset inventory scanning.
    """

    targets = ips.get("targets", [])
    results = []

    for ip in targets:
        try:
            scan = scan_ip(ip)
            results.append(scan)
        except Exception as e:
            results.append({"ip": ip, "error": str(e)})

    return {
        "timestamp": datetime.utcnow().isoformat(),
        "results": results
    }
