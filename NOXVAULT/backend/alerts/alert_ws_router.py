from fastapi import APIRouter
from backend.alerts.alert_websocket import router as alerts_ws_router

# This router simply re‑exports the WebSocket router
# so main.py can include it cleanly.

alert_ws_router = APIRouter()
alert_ws_router.include_router(alerts_ws_router)
