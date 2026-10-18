# backend/ai/alerting_ai/ai_alert_manager.py

from .ai_alert_store import AIAlertStore
from .ai_alert_model import AIAlert
from .ai_alert_rules import evaluate_ai_alert

class AIAlertManager:
    """
    AI Alert Manager for NOXVAULT.
    Handles creation, evaluation, storage, and retrieval of AI-generated alerts.
    """

    def __init__(self):
        self.store = AIAlertStore()

    def generate(self) -> AIAlert:
        """
        Generate a new AI alert using the AIAlert model.
        Evaluate it using the AI rule engine.
        Store it in the AI alert store.
        """
        alert = AIAlert.generate_ai()
        evaluation = evaluate_ai_alert(alert)

        # Attach evaluation result to alert metadata
        alert.evaluation = evaluation

        self.store.add(alert)
        return alert

    def all(self) -> list[AIAlert]:
        """Return all AI alerts."""
        return self.store.get_all()

    def get(self, alert_id: str) -> AIAlert | None:
        """Return a single AI alert by ID."""
        return self.store.get(alert_id)

    def delete(self, alert_id: str) -> bool:
        """Delete an AI alert by ID."""
        return self.store.delete(alert_id)

    def clear(self) -> int:
        """Clear all AI alerts."""
        return self.store.clear()
