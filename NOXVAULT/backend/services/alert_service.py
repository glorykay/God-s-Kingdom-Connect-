"""
alert_service.py
NOXVAULT Alert Processing Service
Handles saving, validating, and normalizing alert data.
"""

import json
import os
from datetime import datetime

ALERT_HISTORY_FILE = "backend/alerts/alert_history.json"


def load_alert_history():
    """Load alert history safely."""
    if not os.path.exists(ALERT_HISTORY_FILE):
        return []

    try:
        with open(ALERT_HISTORY_FILE, "r") as f:
            return json.load(f)
    except Exception:
        return []


def save_alert_history(history):
    """Save alert history safely."""
    with open(ALERT_HISTORY_FILE, "w") as f:
        json.dump(history, f, indent=4)


def normalize_alert(alert: dict):
    """Ensure alert has required fields and consistent formatting."""
    return {
        "id": alert.get("id", f"alert-{int(datetime.utcnow().timestamp())}"),
        "timestamp": alert.get("timestamp", datetime.utcnow().isoformat() + "Z"),
        "source": alert.get("source", "unknown"),
        "severity": alert.get("severity", "info"),
        "message": alert.get("message", "No message provided"),
        "details": alert.get("details", {}),
    }


def process_alert(alert: dict):
    """
    Main function used by alert_manager.py and backend routes.
    Validates, normalizes, saves, and returns the alert.
    """

    # Normalize alert structure
    normalized = normalize_alert(alert)

    # Load existing history
    history = load_alert_history()

    # Append new alert
    history.append(normalized)

    # Save updated history
    save_alert_history(history)

    return {
        "status": "success",
        "stored_alert": normalized,
        "total_alerts": len(history)
    }


if __name__ == "__main__":
    # Manual test
    test_alert = {
        "source": "malware_agent",
        "severity": "high",
        "message": "Suspicious process detected",
        "details": {"process": "mimikatz.exe"}
    }

    print(json.dumps(process_alert(test_alert), indent=4))
