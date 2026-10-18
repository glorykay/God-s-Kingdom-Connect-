# backend/ai/alerting_ai/ai_alert_websocket.py

from fastapi import APIRouter, WebSocket, WebSocketDisconnect
import asyncio

from .ai_alert_manager import AIAlertManager

router = APIRouter(tags=["AI Alerts WebSocket"])
manager = AIAlertManager()


class AIAlertWebSocketManager:
    """
    Handles multiple WebSocket connections for AI alert streaming.
    """

    def __init__(self):
        self.connections: list[WebSocket] = []

    async def connect(self, ws: WebSocket):
        await ws.accept()
        self.connections.append(ws)
        print(f"[AIAlertWS] Client connected. Total: {len(self.connections)}")

    def disconnect(self, ws: WebSocket):
        if ws in self.connections:
            self.connections.remove(ws)
            print(f"[AIAlertWS] Client disconnected. Total: {len(self.connections)}")

    async def broadcast(self, alert):
        dead = []
        for ws in self.connections:
            try:
                await ws.send_json(alert.model_dump())
            except WebSocketDisconnect:
                dead.append(ws)

        for ws in dead:
            self.disconnect(ws)


ws_manager = AIAlertWebSocketManager()


@router.websocket("/ws/ai-alerts")
async def ai_alerts_ws(ws: WebSocket):
    """
    Real-time AI alert stream.
    Generates AI alerts every 3 seconds and broadcasts them to all clients.
    """
    await ws_manager.connect(ws)

    try:
        while True:
            alert = manager.generate()
            await ws_manager.broadcast(alert)
            await asyncio.sleep(3)

    except WebSocketDisconnect:
        ws_manager.disconnect(ws)
