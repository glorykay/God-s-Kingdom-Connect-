# backend/vuln_scan_ws.py

from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from datetime import datetime
import asyncio
import random

router = APIRouter(
    prefix="/ws",
    tags=["Vulnerability Scanner"]
)

# =========================================================
# VULNERABILITY DATA SOURCES
# =========================================================
SEVERITIES = ["Low", "Medium", "High", "Critical"]

EXPLOIT_TYPES = [
    "Remote Code Execution",
    "Privilege Escalation",
    "SQL Injection",
    "Authentication Bypass",
    "Buffer Overflow",
    "Directory Traversal",
    "Weak Encryption",
    "Command Injection"
]

AFFECTED_SYSTEMS = [
    "Windows Server",
    "Linux Kernel",
    "Ubuntu",
    "macOS",
    "Cisco ASA",
    "Apache HTTPD",
    "Nginx",
    "MySQL",
    "PostgreSQL"
]

# Simulated KEV (Known Exploited Vulnerabilities)
def is_kev():
    return random.choice([True, False, False])  # ~33% chance


# =========================================================
# GENERATE VULNERABILITY EVENT
# =========================================================
def generate_vuln_event() -> dict:
    cve_id = f"CVE-2024-{random.randint(1000, 9999)}"
    severity = random.choice(SEVERITIES)
    exploit_type = random.choice(EXPLOIT_TYPES)
    system = random.choice(AFFECTED_SYSTEMS)
    kev_flag = is_kev()

    return {
        "timestamp": datetime.utcnow().isoformat(),
        "cve": cve_id,
        "severity": severity,
        "exploit_type": exploit_type,
        "affected_system": system,
        "cvss_score": round(random.uniform(3.0, 9.8), 1),
        "kev": kev_flag,

        # AI-ready structure
        "ai_event": {
            "cve": cve_id,
            "severity": severity,
            "exploit_type": exploit_type,
            "system": system,
            "kev": kev_flag
        }
    }


# =========================================================
# VULNERABILITY SCAN WEBSOCKET STREAM
# =========================================================
@router.websocket("/vuln-scan")
async def vuln_scan_ws(websocket: WebSocket):
    """
    Real-time vulnerability scan stream.
    Sends new vulnerability events every 3 seconds.
    """

    await websocket.accept()

    try:
        while True:
            event = generate_vuln_event()
            await websocket.send_json(event)
            await asyncio.sleep(3)

    except WebSocketDisconnect:
        print("Vulnerability scan client disconnected")

    except Exception as e:
        print("Vulnerability scan error:", e)
        await websocket.close()
