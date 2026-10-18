from fastapi import APIRouter
from datetime import datetime
import random

router = APIRouter()

# ==========================
# NETWORK CAMPAIGNS
# ==========================
@router.get("/api/network-campaigns")
def get_network_campaigns():
    return {
        "timestamp": datetime.utcnow().isoformat(),
        "campaigns": [
            {"name": "ShadowStrike", "severity": "high"},
            {"name": "NightCrawler", "severity": "medium"},
            {"name": "GhostNet", "severity": "critical"},
        ]
    }

# ==========================
# BOTNET ACTIVITY
# ==========================
@router.get("/api/botnet-4")
def get_botnet_activity():
    return {
        "timestamp": datetime.utcnow().isoformat(),
        "botnet_activity": {
            "active_c2_servers": random.randint(1, 10),
            "infected_hosts": random.randint(50, 500),
            "regions": ["US", "EU", "ASIA"]
        }
    }

# ==========================
# IP REPUTATION
# ==========================
@router.get("/api/ip-reputation")
def get_ip_reputation():
    return {
        "timestamp": datetime.utcnow().isoformat(),
        "ip": "192.168.1.55",
        "score": random.randint(1, 100),
        "classification": random.choice(["benign", "suspicious", "malicious"])
    }

# ==========================
# THREAT INTEL SUMMARY
# ==========================
@router.get("/api/threat-intel")
def get_threat_intel_summary():
    return {
        "timestamp": datetime.utcnow().isoformat(),
        "malicious_ips": random.randint(10, 100),
        "malicious_domains": random.randint(5, 50),
        "active_campaigns": random.randint(1, 10),
        "botnet_c2": random.randint(1, 5),
        "darkweb_indicators": random.randint(0, 20)
    }

# ==========================
# ATTACK LEAKS
# ==========================
@router.get("/api/attack-leaks")
def get_attack_leaks():
    return {
        "timestamp": datetime.utcnow().isoformat(),
        "leaks": [
            {"source": "DarkForum", "type": "credential", "count": 1200},
            {"source": "BreachHub", "type": "database", "count": 45000},
        ]
    }

# ==========================
# MALWARE TRAFFIC
# ==========================
@router.get("/api/malware-traffic")
def get_malware_traffic():
    return {
        "timestamp": datetime.utcnow().isoformat(),
        "traffic": {
            "samples_detected": random.randint(1, 50),
            "families": ["AgentTesla", "RedLine", "FormBook"],
            "severity": random.choice(["low", "medium", "high", "critical"])
        }
    }
