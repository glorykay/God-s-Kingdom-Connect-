from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from datetime import datetime
import asyncio
import random
import httpx

from .firewall_api import FIREWALL_BUFFER

router = APIRouter()

SEVERITIES = ["low", "medium", "high", "critical"]

async def geolocate_ip(ip: str):
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            r = await client.get(f"https://ipapi.co/{ip}/json/")
            data = r.json()
            return {
                "lat": data.get("latitude") or random.uniform(-60, 75),
                "lon": data.get("longitude") or random.uniform(-180, 180),
                "country": data.get("country_name") or "Unknown",
            }
    except:
        return {
            "lat": random.uniform(-60, 75),
            "lon": random.uniform(-180, 180),
            "country": "Unknown",
        }

async def generate_live_event():
    if FIREWALL_BUFFER:
        ev = FIREWALL_BUFFER[-1]
        src_ip = ev.src_ip
        dst_ip = ev.dst_ip
        blocked = ev.action.lower() in ["block", "deny", "drop"]
        direction = "blocked" if blocked else random.choice(["incoming", "outgoing"])
        src_geo = await geolocate_ip(src_ip)
        dst_geo = await geolocate_ip(dst_ip)
    else:
        src_ip = f"{random.randint(1,255)}.{random.randint(0,255)}.{random.randint(0,255)}.{random.randint(1,254)}"
        dst_ip = f"{random.randint(1,255)}.{random.randint(0,255)}.{random.randint(0,255)}.{random.randint(1,254)}"
        direction = random.choice(["incoming", "outgoing"])
        src_geo = await geolocate_ip(src_ip)
        dst_geo = await geolocate_ip(dst_ip)

    return {
        "type": direction,
        "src_lat": src_geo["lat"],
        "src_lon": src_geo["lon"],
        "dst_lat": dst_geo["lat"],
        "dst_lon": dst_geo["lon"],
        "src_ip": src_ip,
        "dst_ip": dst_ip,
        "src_country": src_geo["country"],
        "dst_country": dst_geo["country"],
        "severity": random.choice(SEVERITIES),
        "ts": datetime.utcnow().isoformat(),
        "src_threat": {},
        "dst_threat": {},
    }

@router.websocket("/ws/attack-map")
async def attack_map_ws(websocket: WebSocket):
    await websocket.accept()
    try:
        while True:
            event = await generate_live_event()
            await websocket.send_json(event)
            await asyncio.sleep(1.5)
    except WebSocketDisconnect:
        print("Attack map client disconnected")
    except Exception as e:
        print("Attack map WebSocket error:", e)
        await websocket.close()
