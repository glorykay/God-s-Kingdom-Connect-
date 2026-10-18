# backend/ai/alerting_ai/ai_alert_agent.py

import asyncio
from datetime import datetime
import random

from .ai_alert_manager import AIAlertManager
from .ai_alert_model import AIAlert
from .ai_alert_rules import evaluate_ai_alert

manager = AIAlertManager()

class AIAlertAgent:
    """
    AI‑powered alert generator for NOXVAULT.
    Uses AI logic to produce enriched alerts with severity scoring.
    """

    def __init__(self, interval: float = 4.0):
        self.interval = interval
        self.running = False

    async def start(self):
        """Start generating AI alerts continuously."""
        self.running = True
        print(f"[AIAlertAgent] Started at {datetime.utcnow().isoformat()}")

        while self.running:
            alert = AIAlert.generate_ai()
            manager.store.add(alert)

            evaluation = evaluate_ai_alert(alert)
            print(f"[AIAlertAgent] AI Alert {alert.id}: {evaluation}")

            await asyncio.sleep(self.interval)

    def stop(self):
        """Stop the AI alert generator."""
        self.running = False
        print(f"[AIAlertAgent] Stopped at {datetime.utcnow().isoformat()}")


# Optional: run once for debugging
async def run_ai_agent_once():
    alert = AIAlert.generate_ai()
    manager.store.add(alert)
    print(f"[AIAlertAgent] Generated single AI alert: {alert.id}")
    return alert
