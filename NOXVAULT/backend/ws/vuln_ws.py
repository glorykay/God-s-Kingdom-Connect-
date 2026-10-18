from fastapi import APIRouter, WebSocket

# Router for vuln_ws module
router = APIRouter(
    prefix="/ws",
    tags=["vuln-ws"]
)

# Test endpoint to verify router works
@router.get("/test")
def ws_test():
    return {
        "status": "ok",
        "module": "vuln_ws",
        "message": "vuln_ws router is working"
    }

# Example WebSocket route
@router.websocket("/vuln")
async def vuln_websocket(websocket: WebSocket):
    await websocket.accept()
    await websocket.send_json({"message": "vuln_ws websocket connected"})
    await websocket.close()
