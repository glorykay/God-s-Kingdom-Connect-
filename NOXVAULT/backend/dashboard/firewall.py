from fastapi import APIRouter
from datetime import datetime
import random

router = APIRouter(prefix="/api/malware", tags=["Malware - Firewall"])

# Simulated firewall rules
FIREWALL_RULES = [
    {"id": 1, "action": "ALLOW", "protocol": "TCP", "port": 22, "description": "SSH"},
    {"id": 2, "action": "ALLOW", "protocol": "TCP", "port": 80, "description": "HTTP"},
    {"id": 3, "action": "ALLOW", "protocol": "TCP", "port": 443, "description": "HTTPS"},
    {"id": 4, "action": "BLOCK", "protocol": "TCP", "port": 3389, "description": "RDP Block"},
    {"id": 5, "action": "BLOCK", "protocol": "UDP", "port": 1900, "description": "SSDP Flood Prevention"},
]

# Simulated blocked IPs
BLOCKED_IPS = [
    "185.244.25.11",
    "103.91.45.77",
    "212.83.190.22",
    "45.155.205.9",
]

# Simulated suspicious activity
SUSPICIOUS_EVENTS = [
    "Multiple failed SSH login attempts",
    "Port scanning detected",
    "Outbound connection to known malware domain",
    "Unusual DNS query volume",
]

def generate_firewall_status():
    """Generate a simulated firewall status."""
    return {
        "enabled": True,
        "mode": "Active",
        "last_updated": datetime.utcnow().isoformat(),
        "health_score": random.randint(70, 100),
    }

def generate_suspicious_event():
    """Generate a random suspicious firewall event."""
    return {
        "timestamp": datetime.utcnow().isoformat(),
        "event": random.choice(SUSPICIOUS_EVENTS),
        "source_ip": f"192.168.1.{random.randint(10, 200)}",
        "severity": random.choice(["Low", "Medium", "High", "Critical"]),
    }

@router.get("/firewall")
def firewall_overview():
    """Return firewall status, rules, blocked IPs, and suspicious events."""
    return {
        "timestamp": datetime.utcnow().isoformat(),
        "status": generate_firewall_status(),
        "rules": FIREWALL_RULES,
        "blocked_ips": BLOCKED_IPS,
        "recent_suspicious_events": [
            generate_suspicious_event() for _ in range(5)
        ],
    }
