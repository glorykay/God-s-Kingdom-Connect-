from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Literal, List
from datetime import datetime
import asyncio
import random

app = FastAPI(title="NOXVAULT Real-Time Attack Map")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

AttackType = Literal["incoming", "outgoing", "blocked"]

class AttackEvent(BaseModel):
    id: str
    type: AttackType
    src_ip: str
    dst_ip: str
    src_country: str
    dst_country: str
    src_lat: float
    src_lon: float
    dst_lat: float
    dst_lon: float
    severity: Literal["low", "medium", "high", "critical"]
    ts: str

WEBSOCKET_CLIENTS: List[WebSocket] = []
RECENT_EVENTS: List[AttackEvent] = []

def random_coord():
    # rough world spread
    return random.uniform(-70, 70), random.uniform(-170, 170)

def random_country():
    return random.choice(["US", "CN", "RU", "DE", "FR", "BR", "IN", "GB", "JP", "ZA"])

def random_ip():
    return ".".join(str(random.randint(1, 254)) for _ in range(4))

def random_type():
    return random.choice(["incoming", "outgoing", "blocked"])

def random_severity():
    return random.choice(["low", "medium", "high", "critical"])

def build_event(idx: int) -> AttackEvent:
    src_lat, src_lon = random_coord()
    dst_lat, dst_lon = random_coord()
    return AttackEvent(
        id=f"EVT-{int(datetime.utcnow().timestamp())}-{idx}",
        type=random_type(),
        src_ip=random_ip(),
        dst_ip=random_ip(),
        src_country=random_country(),
        dst_country=random_country(),
        src_lat=src_lat,
        src_lon=src_lon,
        dst_lat=dst_lat,
        dst_lon=dst_lon,
        severity=random_severity(),
        ts=datetime.utcnow().isoformat() + "Z",
    )

async def broadcast_event(ev: AttackEvent):
    dead = []
    for ws in WEBSOCKET_CLIENTS:
        try:
            await ws.send_json(ev.model_dump())
        except WebSocketDisconnect:
            dead.append(ws)
        except Exception:
            dead.append(ws)
    for ws in dead:
        if ws in WEBSOCKET_CLIENTS:
            WEBSOCKET_CLIENTS.remove(ws)

@app.get("/attack/events")
def get_recent_events(limit: int = 200):
    return [e.model_dump() for e in RECENT_EVENTS[-limit:]]

@app.websocket("/ws/attack")
async def ws_attack(websocket: WebSocket):
    await websocket.accept()
    WEBSOCKET_CLIENTS.append(websocket)
    try:
        while True:
            await websocket.receive_text()  # keep alive (client can send pings)
    except WebSocketDisconnect:
        if websocket in WEBSOCKET_CLIENTS:
            WEBSOCKET_CLIENTS.remove(websocket)
    except Exception:
        if websocket in WEBSOCKET_CLIENTS:
            WEBSOCKET_CLIENTS.remove(websocket)

async def generator_loop():
    global RECENT_EVENTS
    while True:
        # generate 0–3 events per tick
        for i in range(random.randint(0, 3)):
            ev = build_event(i)
            RECENT_EVENTS.append(ev)
            RECENT_EVENTS = RECENT_EVENTS[-500:]
            await broadcast_event(ev)
        await asyncio.sleep(1.5)

@app.on_event("startup")
async def startup():
    asyncio.create_task(generator_loop())
