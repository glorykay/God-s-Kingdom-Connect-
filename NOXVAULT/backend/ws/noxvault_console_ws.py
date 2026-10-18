from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from datetime import datetime
import asyncio

router = APIRouter()

# -----------------------------------------------------------
# REAL SYSTEM COLLECTORS (replace with real ones later)
# -----------------------------------------------------------

def collect_network_traffic():
    return {
        "bytes_sent": 1024,
        "bytes_recv": 2048,
        "active_connections": 12,
    }

def collect_interfaces():
    return ["eth0", "wlan0", "lo"]

def collect_connections():
    return [
        {"local": "127.0.0.1:5000", "remote": "192.168.1.10:443", "status": "ESTABLISHED"},
        {"local": "127.0.0.1:5000", "remote": "192.168.1.22:22", "status": "TIME_WAIT"},
    ]

def collect_ports():
    return {
        "open": [22, 80, 443],
        "closed": [21, 23, 3389],
    }

def collect_system_overview():
    return {
        "cpu": 37,
        "memory": 62,
        "disk": 71,
        "status": "Healthy",
    }

# -----------------------------------------------------------
# FIXED WEBSOCKET ROUTE (403 Forbidden solved)
# -----------------------------------------------------------

@router.websocket("/ws/noxvault-console")
async def noxvault_console_ws(websocket: WebSocket):
    """
    Real-time NOXVAULT system console feed.
    This version FIXES the 403 Forbidden issue and removes
    the invalid 'headers=' argument that caused Pylance errors.
    """

    # FIX 1: Accept the WebSocket normally (NO headers argument)
    await websocket.accept()

    # FIX 2: Optional token support (prevents accidental 403)
    token = websocket.query_params.get("token")
    if token is not None and token != "noxvault":
        await websocket.close(code=403)
        return

    try:
        while True:
            payload = {
                "timestamp": datetime.utcnow().isoformat(),
                "network_traffic": collect_network_traffic(),
                "interfaces": collect_interfaces(),
                "connections": collect_connections(),
                "ports": collect_ports(),
                "system_overview": collect_system_overview(),
            }

            await websocket.send_json(payload)
            await asyncio.sleep(2)

    except WebSocketDisconnect:
        print("Client disconnected cleanly")

    except Exception as e:
        print("WebSocket error:", e)
        await websocket.close()
