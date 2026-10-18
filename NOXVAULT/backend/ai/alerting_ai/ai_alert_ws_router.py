# backend/ai/alerting_ai/ai_alert_ws_router.py

from fastapi import APIRouter
from .ai_alert_websocket import router as ai_alerts_ws_router

router = APIRouter()
router.include_router(ai_alerts_ws_router)
