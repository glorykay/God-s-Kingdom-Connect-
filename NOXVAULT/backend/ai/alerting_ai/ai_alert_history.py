# backend/ai/alerting_ai/ai_alert_history.py

import json
from pathlib import Path
from .ai_alert_model import AIAlert

HISTORY_FILE = Path(__file__).parent / "ai_alert_history.json"

def load_ai_history() -> list[AIAlert]:
    """
    Load AI-generated alert history from JSON file.
    Returns a list of AIAlert objects.
    """

    if not HISTORY_FILE.exists():
        print("[AIAlertHistory] No history file found.")
        return []

    try:
        with open(HISTORY_FILE, "r") as f:
            raw = json.load(f)

        alerts = [AIAlert(**entry) for entry in raw]
        print(f"[AIAlertHistory] Loaded {len(alerts)} AI alerts.")
        return alerts

    except Exception as e:
        print(f"[AIAlertHistory] Error loading history: {e}")
        return []


def save_ai_history(alerts: list[AIAlert]):
    """
    Save a list of AIAlert objects back to JSON.
    """

    try:
        data = [alert.model_dump() for alert in alerts]

        with open(HISTORY_FILE, "w") as f:
            json.dump(data, f, indent=4)

        print(f"[AIAlertHistory] Saved {len(alerts)} AI alerts.")

    except Exception as e:
        print(f"[AIAlertHistory] Error saving history: {e}")
