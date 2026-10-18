# backend/threat_intel_ws.py

from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from datetime import datetime
import asyncio
import random

router = APIRouter(
    prefix="/ws",
    tags=["Threat Intel"]
)

# =========================================================
# THREAT SOURCES
# =========================================================
THREAT_SOURCES = [
    "CISA KEV",
    "OTX",
    "AbuseIPDB",
    "Internal IDS",
    "Dark Web Monitor"
]

SEVERITY_LEVELS = ["Low", "Medium", "High", "Critical"]

THREAT_TYPES = [
    "Malicious IP",
    "Exploit Attempt",
    "Malware Callback",
    "Botnet C2",
    "Credential Stuffing",
    "SQL Injection",
    "Ransomware Beacon",
    "Suspicious Domain"
]

COUNTRIES = [
    "United States", "China", "Russia", "India", "Brazil",
    "Germany", "France", "United Kingdom", "Japan",
    "Australia", "Canada", "Mexico", "South Africa"
]

COUNTRY_CODES = {
    "United States": "US", "China": "CN", "Russia": "RU", "India": "IN",
    "Brazil": "BR", "Germany": "DE", "France": "FR", "United Kingdom": "UK",
    "Japan": "JP", "Australia": "AU", "Canada": "CA", "Mexico": "MX",
    "South Africa": "ZA"
}


# =========================================================
# GENERATE THREAT INTEL EVENT
# =========================================================
def generate_threat_event() -> dict:
    src_country = random.choice(COUNTRIES)
    threat_type = random.choice(THREAT_TYPES)
    severity = random.choice(SEVERITY_LEVELS)
    source = random.choice(THREAT_SOURCES)

    # Geo coordinates for threat map
    lat = round(random.uniform(-60, 70), 4)
    lon = round(random.uniform(-150, 150), 4)

    # Threat intel match (simulated)
    kev_match = random.choice([True, False, False])  # 33% chance

    return {
        "timestamp": datetime.utcnow().isoformat(),

        # Threat details
        "source": source,
        "type": threat_type,
        "severity": severity,

        # Geo threat mapping
        "country": src_country,
        "country_code": COUNTRY_CODES[src_country],
        "lat": lat,
        "lon": lon,

        # Threat intel correlation
        "kev_match": kev_match,
        "intel_source": source,

        # AI-ready structure
        "ai_event": {
            "type": threat_type,
            "severity": severity,
            "country": src_country,
            "intel_source": source,
            "kev_match": kev_match
        }
    }


# =========================================================
# THREAT INTEL WEBSOCKET STREAM
# =========================================================
@router.websocket("/threat-intel")
async def threat_intel_ws(websocket: WebSocket):
    """
    Real-time threat intelligence stream.
    Sends new threat events every 2 seconds.
    """

    await websocket.accept()

    try:
        while True:
            event = generate_threat_event()
            await websocket.send_json(event)
            await asyncio.sleep(2)

    except WebSocketDisconnect:
        print("Threat intel client disconnected")

    except Exception as e:
        print("Threat intel error:", e)
        await websocket.close()
