"""
network_utils.py
NOXVAULT Network Utility Module
Provides safe helpers for IP detection, interface listing, port scanning,
public IP lookup, and connectivity checks.
"""

import socket
import psutil
import requests


# -----------------------------
# Local IP Address
# -----------------------------

def get_local_ip():
    """Return the primary local IP address."""
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        ip = s.getsockname()[0]
        s.close()
        return ip
    except Exception:
        return "0.0.0.0"


# -----------------------------
# Public IP Address
# -----------------------------

def get_public_ip():
    """Return the public IP address using a safe external service."""
    try:
        res = requests.get("https://api.ipify.org?format=json", timeout=3)
        return res.json().get("ip", "unknown")
    except Exception:
        return "unknown"


# -----------------------------
# Network Interfaces
# -----------------------------

def list_interfaces():
    """Return all network interfaces and their addresses."""
    interfaces = {}

    for name, addrs in psutil.net_if_addrs().items():
        interfaces[name] = []
        for addr in addrs:
            interfaces[name].append({
                "family": str(addr.family),
                "address": addr.address,
                "netmask": addr.netmask,
                "broadcast": addr.broadcast
            })

    return interfaces


# -----------------------------
# Port Scanning (SAFE)
# -----------------------------

def is_port_open(host: str, port: int) -> bool:
    """Check if a port is open on a host (non-intrusive)."""
    try:
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        sock.settimeout(0.5)
        result = sock.connect_ex((host, port))
        sock.close()
        return result == 0
    except Exception:
        return False


def scan_common_ports(host: str):
    """Scan a host for common ports (SAFE)."""
    common_ports = [22, 80, 443, 3389, 8080]
    results = {}

    for port in common_ports:
        results[port] = is_port_open(host, port)

    return results


# -----------------------------
# Connectivity Check
# -----------------------------

def can_reach(host: str, port: int = 80):
    """Check if a host is reachable."""
    return is_port_open(host, port)


# -----------------------------
# Manual Test
# -----------------------------

if __name__ == "__main__":
    print("Local IP:", get_local_ip())
    print("Public IP:", get_public_ip())
    print("Interfaces:", list_interfaces())
    print("Scan localhost:", scan_common_ports("127.0.0.1"))
    print("Reach google.com:", can_reach("google.com", 80))
