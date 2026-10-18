from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from fastapi.responses import JSONResponse
import asyncio
import random
from datetime import datetime, timedelta
from typing import List

router = APIRouter()

EVENT_BUFFER: List[dict] = []
MAX_EVENTS = 1000

COUNTRIES = [
    ("US", 37.77, -122.41),
    ("CN", 39.90, 116.40),
    ("RU", 55.75, 37.61),
    ("BR", -23.55, -46.63),
    ("IN", 28.61, 77.20),
    ("DE", 52.52, 13.40),
    ("FR", 48.85, 2.35),
    ("UK", 51.50, -0.12),
    ("JP", 35.68, 139.69),
    ("AU", -33.86, 151.21),
    ("ZA", -26.20, 28.04),
]

SERVICES = [
    ("SSH", 22),
    ("HTTPS", 443),
    ("HTTP", 80),
    ("RDP", 3389),
    ("SMTP", 25),
    ("DNS", 53),
    ("VPN", 1194),
]

MALWARE_FAMILIES = [
    "LockBit", "Emotet", "TrickBot", "QakBot",
    "CobaltStrike", "Conti", "Ryuk", "BlackCat",
]

SEVERITIES = ["low", "medium", "high", "critical"]
TYPES = ["incoming", "outgoing", "blocked"]

def random_ip():
    return ".".join(str(random.randint(1, 254)) for _ in range(4))

def pick_country():
    return random.choice(COUNTRIES)

def pick_service():
    return random.choice(SERVICES)

def generate_attack_event():
    src_country, src_lat, src_lon = pick_country()
    dst_country, dst_lat, dst_lon = pick_country()
    service_name, service_port = pick_service()

    ev = {
        "src_lat": src_lat,
        "src_lon": src_lon,
        "dst_lat": dst_lat,
        "dst_lon": dst_lon,

        "src_ip": random_ip(),
        "dst_ip": random_ip(),

        "src_country": src_country,
        "dst_country": dst_country,

        "type": random.choice(TYPES),
        "severity": random.choices(
            SEVERITIES,
            weights=[2, 3, 3, 1],
        )[0],

        "service": service_name,
        "port": service_port,

        "malware_family": random.choice(MALWARE_FAMILIES),
        "attack_vector": random.choice([
            "brute_force",
            "credential_stuffing",
            "exploit_attempt",
            "lateral_movement",
            "data_exfiltration",
            "command_and_control",
        ]),

        "ts": datetime.utcnow().isoformat() + "Z",
    }

    EVENT_BUFFER.append(ev)
    if len(EVENT_BUFFER) > MAX_EVENTS:
        EVENT_BUFFER.pop(0)

    return ev

@router.websocket("/ws/attack-map")
async def attack_map_ws(websocket: WebSocket):
    await websocket.accept()
    try:
        while True:
            burst_size = random.randint(1, 5)
            for _ in range(burst_size):
                event = generate_attack_event()
                await websocket.send_json(event)
                await asyncio.sleep(random.uniform(0.1, 0.5))

            await asyncio.sleep(random.uniform(0.5, 2.0))

    except WebSocketDisconnect:
        print("Attack map client disconnected")

@router.get("/attack/events")
async def get_recent_events():
    cutoff = datetime.utcnow() - timedelta(minutes=5)

    def parse_ts(ev):
        try:
            return datetime.fromisoformat(ev["ts"].replace("Z", ""))
        except Exception:
            return cutoff

    recent = [ev for ev in EVENT_BUFFER if parse_ts(ev) >= cutoff]
    return JSONResponse(recent)
