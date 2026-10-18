# dashboard_routes.py
from fastapi import APIRouter
from datetime import datetime
import platform
import socket
import psutil
import random

router = APIRouter(prefix="/dashboard", tags=["NOXVAULT Dashboard"])

# ---------- small helpers ----------

def get_ip() -> str:
    try:
        return socket.gethostbyname(socket.gethostname())
    except:
        return "127.0.0.1"

def security_score() -> int:
    return 78  # you can compute this later

def threat_level(score: int) -> str:
    if score >= 85:
        return "LOW"
    if score >= 65:
        return "MEDIUM"
    return "HIGH"

# ---------- 1) SYSTEM OVERVIEW ----------

@router.get("/overview")
def dashboard_overview():
    score = security_score()
    return {
        "device": platform.node(),
        "ip": get_ip(),
        "last_scan": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "security_score": score,
        "threat_level": threat_level(score),
        "findings": {
            "total": 42,
            "critical": 5,
            "warnings": 12,
            "informational": 25,
        },
        "resources": {
            "cpu_percent": psutil.cpu_percent(interval=0.2),
            "ram_percent": psutil.virtual_memory().percent,
            "disk_percent": psutil.disk_usage("/").percent,
        }
    }

# ---------- 2) FIREWALL DASHBOARD ----------

@router.get("/firewall")
def dashboard_firewall():
    # placeholder – later you can hook into real firewall APIs
    return {
        "status": "Enabled",
        "profile": "Public",
        "default_inbound": "Block",
        "default_outbound": "Allow",
        "last_rule_update": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "open_ports": [
            {"port": 80, "protocol": "TCP", "service": "HTTP", "exposure": "Public", "risk": "Medium"},
            {"port": 3389, "protocol": "TCP", "service": "RDP", "exposure": "Public", "risk": "High"},
            {"port": 445, "protocol": "TCP", "service": "SMB", "exposure": "LAN", "risk": "High"},
        ],
        "rule_hits": [
            {"rule": "Block RDP from Internet", "hits": 124},
            {"rule": "Allow HTTP", "hits": 980},
            {"rule": "Block SMB External", "hits": 37},
        ],
        "events": {
            "allowed": 1520,
            "blocked": 210,
            "top_blocked_ips": [
                {"ip": "185.23.44.10", "count": 45},
                {"ip": "91.200.12.5", "count": 31},
            ]
        }
    }

# ---------- 3) INTRUSION DETECTION ----------

@router.get("/ids")
def dashboard_ids():
    return {
        "total_intrusions_last_24h": 32,
        "by_severity": {
            "critical": 4,
            "high": 10,
            "medium": 12,
            "low": 6,
        },
        "timeline": [
            {"time": "2026-05-17 18:00", "count": 3},
            {"time": "2026-05-17 19:00", "count": 7},
            {"time": "2026-05-17 20:00", "count": 5},
        ],
        "top_signatures": [
            {"name": "Network Trojan Detected", "count": 14},
            {"name": "Attempted Privilege Gain", "count": 5},
            {"name": "Suspicious DNS Query", "count": 3},
        ],
        "mitre_mapping": [
            {"technique": "T1071 – Application Layer Protocol", "count": 9},
            {"technique": "T1021 – Remote Services", "count": 4},
        ]
    }

# ---------- 4) NETWORK TRAFFIC ----------

@router.get("/network-traffic")
def dashboard_network_traffic():
    io = psutil.net_io_counters()
    return {
        "bytes_sent": io.bytes_sent,
        "bytes_recv": io.bytes_recv,
        "packets_sent": io.packets_sent,
        "packets_recv": io.packets_recv,
        "top_protocols": [
            {"protocol": "HTTP", "events": 49},
            {"protocol": "DNS", "events": 8},
            {"protocol": "HTTPS", "events": 5},
            {"protocol": "FTP", "events": 2},
        ],
        "suspicious_spikes": [
            {"time": "2026-05-17 19:15", "description": "Unusual outbound HTTP to rare ASN"},
        ]
    }

# ---------- 5) THREAT INTELLIGENCE ----------

@router.get("/threat-intel")
def dashboard_threat_intel():
    return {
        "blacklisted_ips": [
            {"ip": "45.155.205.10", "reason": "Known C2"},
            {"ip": "103.21.244.15", "reason": "Botnet activity"},
        ],
        "malicious_domains": [
            {"domain": "bad-example.xyz", "reason": "Phishing"},
        ],
        "recent_matches": [
            {"indicator": "45.155.205.10", "type": "IP", "time": "2026-05-17 19:20"},
        ]
    }

# ---------- 6) VULNERABILITY DASHBOARD ----------

@router.get("/vulnerabilities")
def dashboard_vulnerabilities():
    return {
        "total": 5,
        "by_severity": {
            "critical": 1,
            "high": 2,
            "medium": 2,
            "low": 0,
        },
        "items": [
            {"id": "CVE-2024-1234", "severity": "Critical", "service": "RDP", "description": "Remote code execution"},
            {"id": "CVE-2023-9988", "severity": "High", "service": "SMB", "description": "Privilege escalation"},
        ]
    }

# ---------- 7) USER ACTIVITY ----------

@router.get("/users")
def dashboard_users():
    return {
        "total_accounts": 3,
        "logins_last_24h": 21,
        "failed_logins_last_24h": 4,
        "recent_events": [
            {"time": "2026-05-17 19:31", "user": "Glory", "action": "Login success"},
            {"time": "2026-05-17 19:20", "user": "Administrator", "action": "Login success"},
            {"time": "2026-05-17 18:55", "user": "Unknown", "action": "Failed login"},
        ]
    }

# ---------- 8) PROCESSES & SERVICES ----------

@router.get("/processes")
def dashboard_processes():
    procs = []
    for p in psutil.process_iter(["pid", "name", "cpu_percent", "memory_percent"]):
        procs.append({
            "pid": p.info["pid"],
            "name": p.info["name"],
            "cpu": p.info["cpu_percent"],
            "memory": round(p.info["memory_percent"], 2),
        })
    procs = sorted(procs, key=lambda x: x["cpu"], reverse=True)[:10]

    return {
        "top_processes": procs,
        "services_sample": [
            {"name": "WinDefend", "status": "Running"},
            {"name": "W32Time", "status": "Running"},
            {"name": "Spooler", "status": "Stopped"},
        ]
    }

# ---------- 9) STORAGE & INTEGRITY ----------

@router.get("/storage")
def dashboard_storage():
    disks = []
    for part in psutil.disk_partitions():
        try:
            usage = psutil.disk_usage(part.mountpoint)
            disks.append({
                "device": part.device,
                "mount": part.mountpoint,
                "total_gb": round(usage.total / 1e9, 2),
                "used_gb": round(usage.used / 1e9, 2),
                "percent": usage.percent,
            })
        except:
            continue

    return {
        "volumes": disks,
        "integrity_alerts": [
            {"path": "C:/Windows/System32/drivers/etc/hosts", "change": "Modified"},
        ]
    }

# ---------- 10) EVENT LOGS ----------

@router.get("/events")
def dashboard_events():
    return {
        "total": 154,
        "recent": [
            {"time": "19:31", "source": "System", "message": "Service started"},
            {"time": "19:29", "source": "Security", "message": "Login success"},
            {"time": "19:10", "source": "Application", "message": "App crashed"},
        ]
    }

# ---------- 11) AUDIT SUMMARY ----------

@router.get("/summary")
def dashboard_summary():
    score = security_score()
    return {
        "security_score": score,
        "threat_level": threat_level(score),
        "critical_issues": 5,
        "warnings": 12,
        "network_health_score": 82,
        "vulnerability_score": 71,
        "summary_points": [
            "System is moderately secure.",
            "5 critical issues require attention.",
            "Firewall and antivirus are active.",
            "Network shows some unusual traffic.",
        ]
    }
