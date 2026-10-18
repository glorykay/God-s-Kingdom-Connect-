from fastapi import APIRouter, WebSocket
from datetime import datetime
import random
import asyncio

# FIX: Pylance requires this exact variable name
router = APIRouter()

INTEL_EVENTS = [
    "Suspicious Domain Contact",
    "Malware Beacon Detected",
    "Threat Actor Communication",
    "Encrypted C2 Traffic",
    "Unauthorized API Access",
    "Dark Web Mention",
]

SEVERITIES = ["Low", "Medium", "High", "Critical"]

ACTORS = ["APT29", "Lazarus", "Conti", "DarkSide", "Unknown"]

def generate_intel_event():
    """Generate a random threat intelligence event."""
    return {
        "timestamp": datetime.utcnow().isoformat(),
        "event": random.choice(INTEL_EVENTS),
        "severity": random.choice(SEVERITIES),
        "source_ip": f"10.0.{random.randint(1, 50)}.{random.randint(10, 200)}",
        "actor": random.choice(ACTORS),
        "confidence": random.randint(50, 100),
        "details": "Automated threat intelligence feed update.",
    }

@router.websocket("/ws/threat-intel")
async def threat_intel_ws(websocket: WebSocket):
    """Real-time threat intelligence WebSocket stream."""
    await websocket.accept()

    try:
        while True:
            event = generate_intel_event()
            await websocket.send_json(event)
            await asyncio.sleep(2)
    except Exception:
        await websocket.close()
