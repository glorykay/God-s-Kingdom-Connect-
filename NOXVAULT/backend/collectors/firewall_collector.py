import os
import json
import requests
from datetime import datetime

API = "http://127.0.0.1:8000/firewall/events/ingest"

# Linux log paths
LINUX_LOGS = [
    "/var/log/ufw.log",
    "/var/log/kern.log",
    "/var/log/syslog",
    "/var/log/noxvault_firewall.log",  # your custom log
]

# Windows firewall log path
WINDOWS_LOG = r"C:\Windows\System32\LogFiles\Firewall\pfirewall.log"


def detect_log_file():
    """Detect which firewall log exists on this system."""
    for path in LINUX_LOGS:
        if os.path.exists(path):
            return path

    if os.path.exists(WINDOWS_LOG):
        return WINDOWS_LOG

    return None


def parse_linux_line(line):
    """
    Parse Linux firewall logs (UFW, iptables, kernel).
    Example:
    Sep 23 22:50:01 hostname kernel: [UFW BLOCK] IN=eth0 OUT= MAC=... SRC=185.220.101.4 DST=192.168.1.10
    """
    if "SRC=" not in line or "DST=" not in line:
        return None

    parts = line.split()

    src_ip = None
    dst_ip = None

    for p in parts:
        if p.startswith("SRC="):
            src_ip = p.replace("SRC=", "")
        if p.startswith("DST="):
            dst_ip = p.replace("DST=", "")

    if not src_ip or not dst_ip:
        return None

    event = {
        "ts": datetime.utcnow().isoformat(),
        "type": "BLOCK" if "BLOCK" in line.upper() else "ALLOW",
        "src_ip": src_ip,
        "dst_ip": dst_ip,
        "src_country": "Unknown",
        "dst_country": "Local",
        "severity": "High" if "BLOCK" in line.upper() else "Low",
        "src_threat": {"tags": ["linux-log"]},
    }

    return event


def parse_windows_line(line):
    """
    Parse Windows firewall logs.
    Example:
    2026-09-23 22:50:01 ALLOW TCP 185.220.101.4 192.168.1.10 443
    """
    parts = line.split()

    if len(parts) < 6:
        return None

    try:
        ts = parts[0] + "T" + parts[1]
        action = parts[2]
        src_ip = parts[3]
        dst_ip = parts[4]
    except:
        return None

    event = {
        "ts": ts,
        "type": action,
        "src_ip": src_ip,
        "dst_ip": dst_ip,
        "src_country": "Unknown",
        "dst_country": "Local",
        "severity": "High" if action.upper() == "BLOCK" else "Low",
        "src_threat": {"tags": ["windows-log"]},
    }

    return event


def main():
    log_file = detect_log_file()

    if not log_file:
        print("No firewall log file found.")
        return

    print(f"Using firewall log: {log_file}")

    with open(log_file, "r", errors="ignore") as f:
        for line in f:
            line = line.strip()
            if not line:
                continue

            # Linux
            if "/" in log_file:
                event = parse_linux_line(line)
            # Windows
            else:
                event = parse_windows_line(line)

            if not event:
                continue

            print("Sending event:", json.dumps(event, indent=4))
            r = requests.post(API, json=event)
            print("Response:", r.status_code)


if __name__ == "__main__":
    main()
