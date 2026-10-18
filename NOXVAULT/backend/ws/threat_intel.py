from fastapi import APIRouter, WebSocket

router = APIRouter()

@router.websocket("/ws/threat-intel")
async def threat_intel_ws(websocket: WebSocket):
    await websocket.accept()

    await websocket.send_text("Threat intel feed connected")

    # Example live feed loop
    while True:
        await websocket.send_json({
            "source": "NOXVAULT Threat Engine",
            "severity": "High",
            "indicator": "Suspicious outbound traffic",
            "timestamp": "live"
        })
