# backend/agents/alerts/alert_agent.py

import asyncio
from datetime import datetime

from .alert_manager import AlertManager
from .alert_model import Alert

manager = AlertManager()

class AlertAgent:
    """
    Background alert generator for NOXVAULT (Agents System).
    Produces system alerts at fixed intervals and stores them.
    """

    def __init__(self, interval: float = 5.0):
        self.interval = interval
        self.running = False

    async def start(self):
        """Start generating alerts continuously."""
        self.running = True
        print(f"[AlertAgent] Started at {datetime.utcnow().isoformat()}")

        while self.running:
            alert = Alert.generate()
            manager.store.add(alert)
            print(f"[AlertAgent] Generated alert: {alert.id} ({alert.severity})")
            await asyncio.sleep(self.interval)

    def stop(self):
        """Stop the alert generator."""
        self.running = False
        print(f"[AlertAgent] Stopped at {datetime.utcnow().isoformat()}")


# Optional: run once for debugging
async def run_agent_once():
    alert = Alert.generate()
    manager.store.add(alert)
    print(f"[AlertAgent] Generated single alert: {alert.id}")
    return alert
