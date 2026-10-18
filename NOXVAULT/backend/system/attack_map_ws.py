# backend/attack_map_ws.py

from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from datetime import datetime
import asyncio
import random

router = APIRouter(
    prefix="/ws",
    tags=["Attack Map"]
)

# ---------------------------------------------------------
# GEO DATA FOR REALISTIC ATTACK MAP
# ---------------------------------------------------------
COUNTRIES = [
    "United States", "China", "Russia", "Brazil", "India", "Germany",
    "France", "United Kingdom", "Japan", "Australia", "South Africa",
    "Canada", "Mexico", "Italy", "Spain", "Netherlands", "Singapore"
]

COUNTRY_CODES = {
    "United States": "US", "China": "CN", "Russia": "RU", "Brazil": "BR",
    "India": "IN", "Germany": "DE", "France": "FR", "United Kingdom": "UK",
    "Japan": "JP", "Australia": "AU", "South Africa": "ZA", "Canada": "CA",
    "Mexico": "MX", "Italy": "IT", "Spain": "ES", "Netherlands": "NL",
    "Singapore": "SG"
}

ATTACK_TYPES = [
    "DDoS", "Brute Force", "Port Scan", "SQL Injection",
    "Ransomware Beacon", "Exploit Attempt", "Malware Callback"
]

SEVERITY_LEVELS = ["Low", "Medium", "High", "Critical"]


# ---------------------------------------------------------
# GENERATE ADVANCED ATTACK EVENT
# ---------------------------------------------------------
def generate_attack_event() -> dict:
    """
    Generates a realistic cyber attack event for the NOXVAULT Attack Map.
    Includes:
        - Geo source/destination
        - Attack type
        - Severity
        - Lat/Long coordinates
        - Threat intel correlation
        - AI-ready structure
    """

    src_country = random.choice(COUNTRIES)
    dst_country = random.choice(COUNTRIES)

    attack_type = random.choice(ATTACK_TYPES)
    severity = random.choice(SEVERITY_LEVELS)

    # Simulated coordinates (for map animation)
    src_lat = round(random.uniform(-60, 70), 4)
    src_lon = round(random.uniform(-150, 150), 4)
    dst_lat = round(random.uniform(-60, 70), 4)
    dst_lon = round(random.uniform(-150, 150), 4)

    # Threat intel correlation (simulated)
    threat_intel_match = random.choice([True, False, False])  # 33% chance

    return {
        "timestamp": datetime.utcnow().isoformat(),

        # GEO DATA
        "src_country": src_country,
        "src_code": COUNTRY_CODES[src_country],
        "src_lat": src_lat,
        "src_lon": src_lon,

        "dst_country": dst_country,
        "dst_code": COUNTRY_CODES[dst_country],
        "dst_lat": dst_lat,
        "dst_lon": dst_lon,

        # ATTACK DETAILS
        "attack_type": attack_type,
        "severity": severity,

        # THREAT INTEL
        "threat_intel_match": threat_intel_match,
        "intel_source": random.choice(["OTX", "CISA KEV", "AbuseIPDB", "None"]),

        # AI READY STRUCTURE
        "ai_event": {
            "src": src_country,
            "dst": dst_country,
            "type": attack_type,
            "severity": severity,
            "intel_match": threat_intel_match
        }
    }


# ---------------------------------------------------------
# WEBSOCKET STREAM
# ---------------------------------------------------------
@router.websocket("/attack-map")
async def attack_map_ws(websocket: WebSocket):
    """
    Real-time attack map stream.
    Sends a new attack event every second.
    """

    await websocket.accept()

    try:
        while True:
            event = generate_attack_event()
            await websocket.send_json(event)
            await asyncio.sleep(1)

    except WebSocketDisconnect:
        print("Attack map client disconnected")

    except Exception as e:
        print("Attack map error:", e)
        await websocket.close()
