# services/ip_reputation.py
from typing import Dict

def get_ip_reputation(ip: str) -> Dict:
    """
    Static IP reputation lookup for NOXVAULT.
    Replace with real threat intelligence providers later:
    - AbuseIPDB
    - VirusTotal
    - GreyNoise
    - AlienVault OTX
    """
    return {
        "ip": ip,
        "reputation": "clean",
        "threat_score": 0,
        "sources": ["NOXVAULT-LOCAL", "Static-Demo"]
    }
