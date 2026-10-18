# backend/agents/alerts/alert_store.py

from typing import Dict, List
from threading import Lock
from .alert_model import Alert

class AlertStore:
    """
    In-memory store for system alerts (Agents System).
    Thread-safe and optimized for real-time dashboards + WebSocket streaming.
    """

    def __init__(self):
        self._alerts: Dict[str, Alert] = {}
        self._lock = Lock()

    def add(self, alert: Alert):
        """Store a new alert."""
        with self._lock:
            self._alerts[alert.id] = alert

    def get(self, alert_id: str) -> Alert | None:
        """Retrieve a single alert by ID."""
        with self._lock:
            return self._alerts.get(alert_id)

    def get_all(self) -> List[Alert]:
        """Return all stored alerts."""
        with self._lock:
            return list(self._alerts.values())

    def delete(self, alert_id: str) -> bool:
        """Delete a single alert by ID."""
        with self._lock:
            if alert_id in self._alerts:
                del self._alerts[alert_id]
                return True
            return False

    def clear(self) -> int:
        """Clear all alerts and return number removed."""
        with self._lock:
            count = len(self._alerts)
            self._alerts.clear()
            return count
