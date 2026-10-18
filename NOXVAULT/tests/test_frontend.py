#!/usr/bin/env python3
"""
test_frontend.py
Simulates the frontend by fetching data from NOXVAULT backend endpoints.

Usage:
    python test_frontend.py
"""

import requests

BASE_URL = "http://127.0.0.1:8000"  # change if needed


def get(endpoint: str):
    url = f"{BASE_URL}{endpoint}"
    print(f"\n[GET] {url}")
    try:
        resp = requests.get(url, timeout=10)
        print("Status:", resp.status_code)
        try:
            print("JSON:", resp.json())
        except:
            print("Raw:", resp.text)
    except Exception as e:
        print(f"[ERROR] {e}")


def main():
    print("[*] Testing NOXVAULT frontend API endpoints...\n")

    # Adjust these if your backend uses different paths
    get("/api/system_audit/latest")
    get("/api/network_audit/latest")
    get("/api/firewall_audit/latest")
    get("/api/malware_audit/latest")
    get("/api/alerts")
    get("/api/agent_status")

    print("\n[*] Done. If all endpoints returned JSON, your frontend will work.")


if __name__ == "__main__":
    main()
