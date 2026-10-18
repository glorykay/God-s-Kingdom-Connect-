from fastapi import APIRouter, WebSocket, WebSocketDisconnect
import asyncio
from datetime import datetime

router = APIRouter()

state = {
    "malicious_ips": 0,
    "malicious_domains": 0,
    "malware_campaigns": 0,
    "botnet_c2": 0,
    "darkweb_indicators": 0,
    "kev_total": 0,
    "kev_critical": 0,
    "last_refresh": None,
    "geo_threats": {},
}

@router.websocket("/ws/threat-intel")
async def threat_intel_ws(websocket: WebSocket):
    await websocket.accept()
    try:
        while True:
            payload = {
                "timestamp": datetime.utcnow().isoformat() + "Z",
                "malicious_ips": state["malicious_ips"],
                "malicious_domains": state["malicious_domains"],
                "malware_campaigns": state["malware_campaigns"],
                "botnet_c2": state["botnet_c2"],
                "darkweb_indicators": state["darkweb_indicators"],
                "exploits_in_the_wild": state["kev_total"],
                "kev_critical": state["kev_critical"],
                "kev_last_refresh": state["last_refresh"],
                "geo_threats": state["geo_threats"],
            }

            await websocket.send_json(payload)
            await asyncio.sleep(5)

    except WebSocketDisconnect:
        print("Client disconnected cleanly")

    except Exception as e:
        print("WebSocket error:", e)
        await websocket.close()
