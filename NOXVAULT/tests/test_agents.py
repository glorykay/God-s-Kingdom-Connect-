import requests
import time
import json

BACKEND_URL = "http://127.0.0.1:8000/agent/data"   # change if needed
AGENT_TOKEN = "TEST-AGENT-123"                     # fake token for testing

def generate_test_payload():
    """Return a simple test payload to verify backend connectivity."""
    return {
        "agent_id": "TEST_AGENT",
        "timestamp": time.strftime("%Y-%m-%d %H:%M:%S"),
        "system": {
            "cpu": "15%",
            "ram": "42%",
            "disk": "68%",
            "status": "OK"
        },
        "network": {
            "active_connections": 12,
            "bandwidth_in": "120 Mbps",
            "bandwidth_out": "95 Mbps"
        },
        "firewall": {
            "blocked": 3,
            "allowed": 58,
            "status": "secure"
        },
        "malware": {
            "scan_status": "clean",
            "threats_found": 0
        }
    }

def send_test_data():
    payload = generate_test_payload()

    headers = {
        "Content-Type": "application/json",
        "X-AGENT-TOKEN": AGENT_TOKEN
    }

    try:
        res = requests.post(BACKEND_URL, headers=headers, json=payload)
        print(f"[TEST AGENT] Sent → Status {res.status_code}")
        print("Response:", res.text)
    except Exception as e:
        print("[TEST AGENT] ERROR:", e)

if __name__ == "__main__":
    print("[TEST AGENT] Starting test agent…")
    send_test_data()
