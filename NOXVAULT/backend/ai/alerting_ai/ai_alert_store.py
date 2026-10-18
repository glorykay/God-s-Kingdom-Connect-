# backend/ai/alerting_ai/ai_alert_store.py

from typing import Dict, List
from .ai_alert_model import AIAlert

class AIAlertStore:
    """
    In-memory store for AI-generated alerts.
    Clean, fast, and conflict-free.
    """

    def __init__(self):
        self.alerts: Dict[str, AIAlert] = {}

    def add(self, alert: AIAlert):
        """Store a new AI alert."""
        self.alerts[alert.id] = alert

    def get(self, alert_id: str) -> AIAlert | None:
        """Retrieve a single AI alert by ID."""
        return self.alerts.get(alert_id)

    def get_all(self) -> List[AIAlert]:
        """Return all AI alerts."""
        return list(self.alerts.values())

    def delete(self, alert_id: str) -> bool:
        """Delete an AI alert by ID."""
        return self.alerts.pop(alert_id, None) is not None

    def clear(self) -> int:
        """Clear all AI alerts and return count removed."""
        count = len(self.alerts)
        self.alerts.clear()
        return count
