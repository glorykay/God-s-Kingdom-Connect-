from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List
from datetime import datetime

# ---------------------------------------------------
# THIS is the line Uvicorn MUST find:
app = FastAPI(title="NOXVAULT Firewall Collector Backend")
# ---------------------------------------------------

# Allow your HTML dashboard to connect
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Firewall event model
class FirewallEvent(BaseModel):
    time: str
    action: str
    src_ip: str
    dst_ip: str
    src_port: int | None = None
    dst_port: int | None = None
    proto: str | None = None
    rule: str | None = None
    firewall: str | None = None

# In‑memory log buffer
FIREWALL_BUFFER: list[FirewallEvent] = []

# Ingest endpoint (Agent → Backend)
@app.post("/firewall/ingest")
async def ingest_firewall(events: List[FirewallEvent]):
    FIREWALL_BUFFER.extend(events)

    # Prevent infinite growth
    if len(FIREWALL_BUFFER) > 5000:
        del FIREWALL_BUFFER[:-2000]

    return {
        "received": len(events),
        "total_cached": len(FIREWALL_BUFFER)
    }

# Dashboard endpoint (Frontend → Backend)
@app.get("/firewall")
def get_firewall():
    return list(reversed(FIREWALL_BUFFER[-500:]))

# Health check
@app.get("/health")
def health():
    return {
        "status": "ok",
        "cached_events": len(FIREWALL_BUFFER),
        "timestamp": datetime.utcnow().isoformat() + "Z"
    }
