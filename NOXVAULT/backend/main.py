from fastapi import FastAPI, APIRouter, WebSocket
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime
import platform
import socket
import psutil
import time
import asyncio
import random

# ============================================================
# FASTAPI APP
# ============================================================

app = FastAPI(title="NOXVAULT Backend", version="5.0.0")

# ============================================================
# CORS
# ============================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============================================================
# IMPORT ROUTERS (MATCH YOUR BACKEND STRUCTURE)
# ============================================================

from backend.ip_scan.router import router as ipscan_router
from backend.vulnerability.router import router as vuln_router
from backend.malware.router import router as malware_router

from backend.alerts.alert_websocket import router as alerts_ws_router
from backend.alerts.alert_router import router as alerts_api_router

from backend.ws.vuln_ws import router as vuln_ws_router
from backend.audit.router import router as audit_router
from backend.network.router import router as network_router
from backend.ws.threat_intel import router as threat_intel_ws_router
from backend.api.router import router as api_router
from backend.ws.attack_events import router as attack_events_router
from backend.ws.firewall_api import router as firewall_api_router
from backend.ws.attack_map_ws import router as attack_map_ws_router
from backend.ws.noxvault_console_ws import router as console_ws_router
from backend.cyber_threat_api import router as cyber_threat_api_router

# ============================================================
# REGISTER ROUTERS (NO DUPLICATES)
# ============================================================

# REST
app.include_router(cyber_threat_api_router)
app.include_router(ipscan_router)
app.include_router(vuln_router)
app.include_router(malware_router)
app.include_router(alerts_api_router)
app.include_router(audit_router)
app.include_router(network_router)
app.include_router(api_router)

# WebSockets
app.include_router(attack_map_ws_router)
app.include_router(firewall_api_router)
app.include_router(console_ws_router)
app.include_router(vuln_ws_router)
app.include_router(threat_intel_ws_router)
app.include_router(attack_events_router)
app.include_router(alerts_ws_router)

# ============================================================
# REAL-TIME VULNERABILITY WEBSOCKET (YOUR CUSTOM ONE)
# ============================================================

ws_router = APIRouter()

VULN_TITLES = [
    "Unpatched CVE",
    "Default Credentials",
    "Outdated Service",
    "Weak Cipher Suite",
    "Exposed Management Interface",
]

SEVERITIES = ["Critical", "High", "Medium", "Low"]

def random_vuln():
    return {
        "title": random.choice(VULN_TITLES),
        "severity": random.choice(SEVERITIES),
        "cve": f"CVE-202{random.randint(0,4)}-{random.randint(1000,9999)}",
    }

def random_summary():
    crit = random.randint(0, 3)
    high = random.randint(0, 3)
    med = random.randint(0, 3)
    low = random.randint(0, 3)
    total = crit + high + med + low or 1
    if total == 1 and crit == 0:
        crit = 1
    return {"critical": crit, "high": high, "medium": med, "low": low, "total": total}

@ws_router.websocket("/ws/vuln-scan")
async def vuln_scan_ws(websocket: WebSocket):
    await websocket.accept()
    target_ip = "174.102.16.90"

    while True:
        summary = random_summary()
        risk_score = random.randint(40, 95)

        payload = {
            "timestamp": datetime.utcnow().isoformat(),
            "target_ip": target_ip,
            "os": "Unknown",
            "summary": summary,
            "risk_score": risk_score,
            "risk_level": (
                "Critical" if risk_score >= 90
                else "High" if risk_score >= 75
                else "Medium" if risk_score >= 50
                else "Low"
            ),
            "top_vulns": [random_vuln() for _ in range(5)],
        }

        await websocket.send_json(payload)
        await asyncio.sleep(3)

app.include_router(ws_router)

# ============================================================
# ROOT ENDPOINT
# ============================================================

@app.get("/")
def root():
    return {"status": "ok", "message": "NOXVAULT backend running"}
