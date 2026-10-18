# backend/agents/threat_intel/threat_intel_ws.py

from fastapi import APIRouter, WebSocket, WebSocketDisconnect
import asyncio
import random
from datetime import datetime

router = APIRouter(tags=["Threat Intel WebSocket"])


class ThreatIntelWebSocketManager:
    """
    Handles multiple WebSocket connections for real-time threat intel streaming.
    """

    def __init__(self):
        self.connections: list[WebSocket] = []

    async def connect(self, ws: WebSocket):
        await ws.accept()
        self.connections.append(ws)
        print(f"[ThreatIntelWS] Client connected. Total: {len(self.connections)}")

    def disconnect(self, ws: WebSocket):
        if ws in self.connections:
            self.connections.remove(ws)
            print(f"[ThreatIntelWS] Client disconnected. Total: {len(self.connections)}")

    async def broadcast(self, intel: dict):
        dead = []
        for ws in self.connections:
            try:
                await ws.send_json(intel)
            except WebSocketDisconnect:
                dead.append(ws)

        for ws in dead:
            self.disconnect(ws)


ws_manager = ThreatIntelWebSocketManager()


THREAT_TYPES = [
    "IOC Update",
    "Malicious Domain",
    "Suspicious IP",
    "Exploit Release",
    "Zero-Day Advisory",
    "Ransomware Campaign",
]


def generate_threat_intel() -> dict:
    """
    Generate a realistic threat intel event.
    """
    return {
        "id": str(random.randint(100000, 999999)),
        "timestamp": datetime.utcnow().isoformat() + "Z",
        "type": random.choice(THREAT_TYPES),
        "source": random.choice(["AlienVault", "VirusTotal", "CrowdStrike", "MISP"]),
        "indicator": f"10.0.{random.randint(0, 255)}.{random.randint(1, 254)}",
        "confidence": round(random.uniform(0.50, 0.99), 2),
        "description": "Automated threat intelligence feed update",
    }


@router.websocket("/ws/threat-intel")
async def threat_intel_ws(ws: WebSocket):
    """
    Real-time threat intel stream.
    Generates intel events every 4 seconds and broadcasts them to all clients.
    """
    await ws_manager.connect(ws)

    try:
        while True:
            intel = generate_threat_intel()
            await ws_manager.broadcast(intel)
            await asyncio.sleep(4)

    except WebSocketDisconnect:
        ws_manager.disconnect(ws)
