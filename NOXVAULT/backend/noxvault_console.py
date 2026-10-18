from fastapi import WebSocket, WebSocketDisconnect
import asyncio
from datetime import datetime

def collect_network_traffic():
    return {"recv_kbps": 0.5, "sent_kbps": 0.8}

def collect_interfaces():
    return ["eth0", "wlan0"]

def collect_connections():
    return [{"ip": "192.168.1.10", "port": 443}]

def collect_ports():
    return [22, 80, 443]

def collect_system_overview():
    return {"cpu": 12, "memory": 45, "disk": 70}

def register_console_ws(app):
    @app.websocket("/ws/noxvault-console")
    async def noxvault_console(websocket: WebSocket):
        await websocket.accept()
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
