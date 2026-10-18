# backend/agents/alerts/alert_manager.py

from .alert_store import AlertStore
from .alert_model import Alert
from .alert_rules import evaluate_alert

class AlertManager:
    """
    Core manager for NOXVAULT Agents alert system.
    Handles creation, evaluation, storage, and retrieval of system alerts.
    """

    def __init__(self):
        self.store = AlertStore()

    def generate(self) -> Alert:
        """
        Generate a new system alert using the Alert model.
        Evaluate it using the rule engine.
        Store it in the alert store.
        """
        alert = Alert.generate()
        evaluation = evaluate_alert(alert)

        # Attach evaluation result to alert metadata
        alert.evaluation = evaluation

        self.store.add(alert)
        return alert

    def all(self) -> list[Alert]:
        """Return all stored alerts."""
        return self.store.get_all()

    def get(self, alert_id: str) -> Alert | None:
        """Retrieve a single alert by ID."""
        return self.store.get(alert_id)

    def delete(self, alert_id: str) -> bool:
        """Delete a single alert by ID."""
        return self.store.delete(alert_id)

    def clear(self) -> int:
        """Clear all alerts and return number removed."""
        return self.store.clear()
