from fastapi import APIRouter
from datetime import datetime
import random

router = APIRouter(prefix="/alerts", tags=["Alerts"])

# Example alert types
ALERT_TYPES = [
    "Malware Detected",
    "Suspicious Traffic",
    "Unauthorized Login",
    "High CPU Usage",
    "Firewall Rule Triggered",
]

SEVERITIES = ["Critical", "High", "Medium", "Low"]

def generate_alert():
    return {
        "id": random.randint(10000, 99999),
        "timestamp": datetime.utcnow().isoformat(),
        "type": random.choice(ALERT_TYPES),
        "severity": random.choice(SEVERITIES),
        "description": "Auto‑generated alert for testing",
    }

@router.get("/")
def list_alerts():
    """Return a list of generated alerts."""
    return [generate_alert() for _ in range(5)]

@router.get("/{alert_id}")
def get_alert(alert_id: int):
    """Return a single alert."""
    return {
        "id": alert_id,
        "timestamp": datetime.utcnow().isoformat(),
        "type": random.choice(ALERT_TYPES),
        "severity": random.choice(SEVERITIES),
        "description": "Detailed alert information",
    }

@router.delete("/{alert_id}")
def delete_alert(alert_id: int):
    """Simulate deleting an alert."""
    return {"status": "deleted", "alert_id": alert_id}
