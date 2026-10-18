#!/usr/bin/env python3
"""
test_zaudit.py
Send a full fake audit bundle to the NOXVAULT backend for local testing.

Usage:
    python test_zaudit.py
"""

import requests
import socket
import platform
import time
import json
from datetime import datetime

BASE_URL = "http://127.0.0.1:8000"  # change later when you deploy
HOSTNAME = socket.gethostname()
HOST_ID = HOSTNAME  # or any unique ID per agent/machine


def now_iso():
    return datetime.utcnow().isoformat() + "Z"


def post(endpoint: str, payload: dict):
    url = f"{BASE_URL}{endpoint}"
    try:
        resp = requests.post(url, json=payload, timeout=10)
        print(f"[POST] {url} -> {resp.status_code}")
        try:
            print("Response:", resp.json())
        except Exception:
            print("Raw response:", resp.text)
    except Exception as e:
        print(f"[ERROR] Failed to POST {url}: {e}")


def build_system_audit():
    return {
        "host_id": HOST_ID,
        "hostname": HOSTNAME,
        "os": platform.platform(),
        "os_family": platform.system(),
        "os_version": platform.version(),
        "cpu_usage": 23.5,
        "ram_usage": 58.2,
        "disk_usage": 71.9,
        "uptime_seconds": 123456,
        "running_processes": [
            {"name": "python.exe", "pid": 1234, "cpu": 3.2, "ram_mb": 120},
            {"name": "chrome.exe", "pid": 5678, "cpu": 8.7, "ram_mb": 512},
        ],
        "installed_software": [
            {"name": "Visual Studio Code", "version": "1.96.0"},
            {"name": "Google Chrome", "version": "130.0.0"},
        ],
        "startup_programs": [
            {"name": "OneDrive", "path": "C:\\Program Files\\OneDrive\\onedrive.exe"},
        ],
        "timestamp": now_iso(),
    }


def build_network_audit():
    return {
        "host_id": HOST_ID,
        "hostname": HOSTNAME,
        "active_connections": [
            {
                "local_ip": "192.168.1.10",
                "local_port": 52341,
                "remote_ip": "142.250.190.78",
                "remote_port": 443,
                "protocol": "TCP",
                "state": "ESTABLISHED",
                "process": "chrome.exe",
            },
            {
                "local_ip": "192.168.1.10",
                "local_port": 52342,
                "remote_ip": "8.8.8.8",
                "remote_port": 53,
                "protocol": "UDP",
                "state": "OPEN",
                "process": "svchost.exe",
            },
        ],
        "bandwidth": {
            "bytes_sent": 1234567,
            "bytes_received": 9876543,
        },
        "suspicious_ips": [
            {"ip": "185.203.116.45", "reason": "Known malicious IP", "severity": "high"}
        ],
        "dns_queries": [
            {"query": "api.noxvault.local", "type": "A", "resolved_ip": "192.168.1.5"},
            {"query": "update.microsoft.com", "type": "A", "resolved_ip": "13.107.4.50"},
        ],
        "timestamp": now_iso(),
    }


def build_firewall_audit():
    return {
        "host_id": HOST_ID,
        "hostname": HOSTNAME,
        "blocked_connections": [
            {
                "remote_ip": "45.155.205.10",
                "remote_port": 445,
                "protocol": "TCP",
                "reason": "Inbound SMB blocked",
                "severity": "high",
            }
        ],
        "allowed_connections": [
            {
                "remote_ip": "142.250.190.78",
                "remote_port": 443,
                "protocol": "TCP",
                "reason": "HTTPS allowed",
                "severity": "info",
            }
        ],
        "rules_triggered": [
            {
                "rule_name": "Block SMB from internet",
                "action": "block",
                "hit_count": 3,
            }
        ],
        "suspicious_ports": [
            {"port": 3389, "reason": "RDP exposed", "severity": "medium"}
        ],
        "timestamp": now_iso(),
    }


def build_malware_audit():
    return {
        "host_id": HOST_ID,
        "hostname": HOSTNAME,
        "last_scan_time": now_iso(),
        "scan_type": "quick",
        "threats_found": 1,
        "threats": [
            {
                "name": "Test.EICAR.Demo",
                "path": "C:\\Users\\Public\\eicar_test_file.txt",
                "severity": "high",
                "status": "quarantined",
            }
        ],
        "suspicious_files": [
            {
                "path": "C:\\Temp\\weird_script.ps1",
                "reason": "Obfuscated PowerShell",
                "severity": "medium",
            }
        ],
        "engine_version": "NOXVAULT-AV 0.1.0",
        "timestamp": now_iso(),
    }


def main():
    print("[*] Sending test ZAUDIT bundle to NOXVAULT backend...\n")

    system_payload = build_system_audit()
    network_payload = build_network_audit()
    firewall_payload = build_firewall_audit()
    malware_payload = build_malware_audit()

    print("[*] System audit")
    post("/api/system_audit", system_payload)
    time.sleep(0.3)

    print("\n[*] Network audit")
    post("/api/network_audit", network_payload)
    time.sleep(0.3)

    print("\n[*] Firewall audit")
    post("/api/firewall_audit", firewall_payload)
    time.sleep(0.3)

    print("\n[*] Malware audit")
    post("/api/malware_audit", malware_payload)

    print("\n[*] Done. Check your NOXVAULT dashboard for updated widgets.")


if __name__ == "__main__":
    main()
