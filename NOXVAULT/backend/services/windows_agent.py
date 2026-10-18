import os
import time
import json
import socket
import psutil
import requests
from datetime import datetime

# Import audit modules
from app.audit.system import get_system_summary
from app.audit.network import get_network_summary
from app.audit.traffic import get_network_traffic
from app.audit.security import get_security_summary
from app.audit.software import get_installed_software
from app.audit.users import get_user_summary
from app.audit.firewall import get_firewall_summary
from app.audit.vuln import get_vulnerability_summary
from app.audit.malware import get_malware_summary
from app.audit.events import get_event_logs


# ---------------------------------------------------------
# CONFIGURATION
# ---------------------------------------------------------

NOXVAULT_API = "https://your-cloud-api-url.com/agent/report"
AGENT_ID = socket.gethostname()
INTERVAL_SECONDS = 60  # How often to send audit data


# ---------------------------------------------------------
# COLLECT FULL AUDIT PAYLOAD
# ---------------------------------------------------------

def collect_full_audit() -> dict:
    return {
        "agent_id": AGENT_ID,
        "timestamp": datetime.utcnow().isoformat(),

        "system": get_system_summary(),
        "network": get_network_summary(),
        "traffic": get_network_traffic(),
        "security": get_security_summary(),
        "software": get_installed_software(),
        "users": get_user_summary(),
        "firewall": get_firewall_summary(),
        "vulnerabilities": get_vulnerability_summary(),
        "malware": get_malware_summary(),
        "events": get_event_logs()
    }


# ---------------------------------------------------------
# SEND TO NOXVAULT CLOUD API
# ---------------------------------------------------------

def send_to_cloud(payload: dict):
    try:
        response = requests.post(
            NOXVAULT_API,
            json=payload,
            timeout=10
        )
        return response.status_code, response.text
    except Exception as e:
        return None, str(e)


# ---------------------------------------------------------
# MAIN LOOP
# ---------------------------------------------------------

def run_agent():
    print(f"[NOXVAULT] Windows Agent started on {AGENT_ID}")

    while True:
        try:
            audit = collect_full_audit()
            status, msg = send_to_cloud(audit)

            if status:
                print(f"[OK] Sent audit → {status}")
            else:
                print(f"[ERROR] Failed to send audit → {msg}")

        except Exception as e:
            print(f"[AGENT ERROR] {e}")

        time.sleep(INTERVAL_SECONDS)


if __name__ == "__main__":
    run_agent()
