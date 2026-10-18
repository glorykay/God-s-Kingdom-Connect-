import requests
import time
import json

BACKEND_URL = "http://127.0.0.1:8000/api/alerts"   # change if needed
AGENT_TOKEN = "TEST-ALERT-123"                     # fake token for testing

def generate_test_alert():
    """Return a simple test alert payload."""
    return {
        "alert_id": f"TEST-{int(time.time())}",
        "timestamp": time.strftime("%Y-%m-%d %H:%M:%S"),
        "source": "TEST_AGENT",
        "severity": "high",
        "category": "malware",
        "description": "This is a test alert sent from test_alert.py",
        "details": {
            "file": "C:\\Temp\\fake.exe",
            "reason": "Simulated detection",
            "confidence": "95%"
        }
    }

def send_test_alert():
    payload = generate_test_alert()

    headers = {
        "Content-Type": "application/json",
        "X-AGENT-TOKEN": AGENT_TOKEN
    }

    try:
        res = requests.post(BACKEND_URL, headers=headers, json=payload)
        print(f"[TEST ALERT] Sent → Status {res.status_code}")
        print("Response:", res.text)
    except Exception as e:
        print("[TEST ALERT] ERROR:", e)

if __name__ == "__main__":
    print("[TEST ALERT] Starting test alert sender…")
    send_test_alert()
