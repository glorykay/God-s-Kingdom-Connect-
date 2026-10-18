# backend/agents/alerts/alert_history.py

import json
from pathlib import Path
from .alert_model import Alert

HISTORY_FILE = Path(__file__).parent / "alert_history.json"


def load_history() -> list[Alert]:
    """
    Load system alert history from JSON file.
    Returns a list of Alert objects.
    """

    if not HISTORY_FILE.exists():
        print("[AlertHistory] No history file found.")
        return []

    try:
        with open(HISTORY_FILE, "r") as f:
            raw = json.load(f)

        alerts = [Alert(**entry) for entry in raw]
        print(f"[AlertHistory] Loaded {len(alerts)} alerts.")
        return alerts

    except Exception as e:
        print(f"[AlertHistory] Error loading history: {e}")
        return []


def save_history(alerts: list[Alert]):
    """
    Save a list of Alert objects back to JSON.
    """

    try:
        data = [alert.model_dump() for alert in alerts]

        with open(HISTORY_FILE, "w") as f:
            json.dump(data, f, indent=4)

        print(f"[AlertHistory] Saved {len(alerts)} alerts.")

    except Exception as e:
        print(f"[AlertHistory] Error saving history: {e}")
