from fastapi import APIRouter
from pydantic import BaseModel
from typing import List
from datetime import datetime
import random

router = APIRouter()

class FirewallEventIn(BaseModel):
    time: str
    action: str
    src_ip: str
    dst_ip: str
    src_port: int | None = None
    dst_port: int | None = None
    proto: str | None = None
    rule: str | None = None
    firewall: str

FIREWALL_BUFFER: list[FirewallEventIn] = []

@router.post("/firewall/ingest")
def ingest_firewall(events: List[FirewallEventIn]):
    FIREWALL_BUFFER.extend(events)
    if len(FIREWALL_BUFFER) > 5000:
        del FIREWALL_BUFFER[:-5000]
    return {"stored": len(events)}

@router.get("/firewall/events")
def firewall_events():
    out = []
    for ev in FIREWALL_BUFFER[-300:]:
        out.append({
            "type": "blocked",
            "src_lat": random.uniform(-60, 75),
            "src_lon": random.uniform(-180, 180),
            "dst_lat": random.uniform(-60, 75),
            "dst_lon": random.uniform(-180, 180),
            "src_ip": ev.src_ip,
            "dst_ip": ev.dst_ip,
            "src_country": "Unknown",
            "dst_country": "Unknown",
            "severity": "high" if ev.action.lower() in ["block", "deny", "drop"] else "medium",
            "ts": ev.time or datetime.utcnow().isoformat(),
            "src_threat": {},
            "dst_threat": {},
        })
    return out
