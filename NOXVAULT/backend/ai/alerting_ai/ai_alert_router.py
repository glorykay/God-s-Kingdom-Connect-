# backend/ai/alerting_ai/ai_alert_router.py

from fastapi import APIRouter, HTTPException, Query
from typing import Optional

from .ai_alert_manager import AIAlertManager
from .ai_alert_model import AIAlert

router = APIRouter(prefix="/ai-alerts", tags=["AI Alerts"])
manager = AIAlertManager()


@router.get("/")
def list_ai_alerts(
    limit: int = Query(100, ge=1, le=1000),
    offset: int = Query(0, ge=0),
    severity: Optional[str] = None,
    min_confidence: Optional[float] = None,
):
    """
    List AI-generated alerts with optional filtering:
    - severity
    - minimum AI confidence score
    """
    alerts = manager.all()

    if severity:
        alerts = [a for a in alerts if a.severity == severity]

    if min_confidence:
        alerts = [a for a in alerts if a.confidence >= min_confidence]

    return alerts[offset: offset + limit]


@router.get("/{alert_id}")
def get_ai_alert(alert_id: str):
    """
    Retrieve a single AI alert by ID.
    """
    alert = manager.get(alert_id)
    if not alert:
        raise HTTPException(404, "AI alert not found")
    return alert


@router.post("/generate")
def generate_ai_alert():
    """
    Generate a new AI alert using the AIAlert model and AI rule engine.
    """
    alert = manager.generate()
    return alert


@router.delete("/{alert_id}")
def delete_ai_alert(alert_id: str):
    """
    Delete a single AI alert by ID.
    """
    if not manager.delete(alert_id):
        raise HTTPException(404, "AI alert not found")
    return {"deleted": alert_id}


@router.delete("/clear")
def clear_ai_alerts():
    """
    Clear all AI alerts.
    """
    count = manager.clear()
    return {"cleared": count}
