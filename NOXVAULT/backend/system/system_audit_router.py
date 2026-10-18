# backend/system_audit_router.py

from fastapi import APIRouter
from datetime import datetime
import sqlite3
import psutil
from typing import Dict, Any, List

router = APIRouter(
    prefix="/system-audit",
    tags=["System Audit"]
)

DB_PATH = "noxvault_console.db"


# =========================================================
# DB HELPERS
# =========================================================
def db_connect():
    return sqlite3.connect(DB_PATH)


def log_system_health(health: Dict[str, Any]):
    conn = db_connect()
    c = conn.cursor()

    c.execute("""
        INSERT INTO system_health (ts, cpu, memory, disk, status)
        VALUES (?, ?, ?, ?, ?)
    """, (
        health["timestamp"],
        health["cpu"],
        health["memory"],
        health["disk"],
        health["status"]
    ))

    conn.commit()
    conn.close()


# =========================================================
# SYSTEM HEALTH COLLECTION
# =========================================================
def collect_system_health() -> Dict[str, Any]:
    cpu = psutil.cpu_percent(interval=1)
    memory = psutil.virtual_memory().percent
    disk = psutil.disk_usage("/").percent

    # Determine system status
    if cpu < 70 and memory < 70 and disk < 80:
        status = "Healthy"
    elif cpu < 85 and memory < 85 and disk < 90:
        status = "Warning"
    else:
        status = "Critical"

    return {
        "timestamp": datetime.utcnow().isoformat(),
        "cpu": cpu,
        "memory": memory,
        "disk": disk,
        "status": status
    }


# =========================================================
# PROCESS AUDIT (ADVANCED)
# =========================================================
def collect_process_audit() -> List[Dict[str, Any]]:
    processes = []
    for proc in psutil.process_iter(["pid", "name", "cpu_percent", "memory_percent", "username"]):
        try:
            info = proc.info
            processes.append({
                "pid": info["pid"],
                "name": info["name"],
                "cpu": info["cpu_percent"],
                "memory": info["memory_percent"],
                "user": info["username"]
            })
        except Exception:
            continue

    # Sort by CPU usage (top offenders)
    processes.sort(key=lambda p: p["cpu"], reverse=True)

    return processes[:15]  # top 15 processes


# =========================================================
# ANOMALY DETECTION
# =========================================================
def detect_anomalies(processes: List[Dict[str, Any]]) -> List[str]:
    anomalies = []

    for p in processes:
        if p["cpu"] > 50:
            anomalies.append(f"High CPU usage detected: {p['name']} (PID {p['pid']})")

        if p["memory"] > 40:
            anomalies.append(f"High memory usage detected: {p['name']} (PID {p['pid']})")

        if p["name"].lower() in ["powershell.exe", "cmd.exe", "bash", "python", "nc", "netcat"]:
            anomalies.append(f"Potential LOLBin activity: {p['name']} (PID {p['pid']})")

    return anomalies


# =========================================================
# MAIN SYSTEM AUDIT ENDPOINT
# =========================================================
@router.get("/snapshot")
def system_audit_snapshot():
    """
    Returns a full system audit snapshot:
        - CPU / Memory / Disk
        - System status
        - Top processes
        - Anomaly detection
        - AI-ready structure
    Logs health to DB.
    """

    health = collect_system_health()
    processes = collect_process_audit()
    anomalies = detect_anomalies(processes)

    # Log system health
    log_system_health(health)

    return {
        "timestamp": health["timestamp"],
        "system_health": health,
        "top_processes": processes,
        "anomalies": anomalies,
        "ai_ready": {
            "cpu": health["cpu"],
            "memory": health["memory"],
            "disk": health["disk"],
            "status": health["status"],
            "anomalies": anomalies
        }
    }


# =========================================================
# LIGHTWEIGHT HEALTH CHECK
# =========================================================
@router.get("/health")
def system_health_only():
    """
    Lightweight system health endpoint.
    """

    health = collect_system_health()
    log_system_health(health)

    return health
