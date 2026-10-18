# backend/services/ip_geo.py
from typing import Dict

def get_geo_ip(ip: str) -> Dict:
    """
    Static Geo-IP lookup for NOXVAULT.
    Replace with a real provider later (MaxMind, ipinfo, ipapi, etc.)
    """
    return {
        "ip": ip,
        "country": "United States",
        "city": "Static City",
        "latitude": 37.7749,
        "longitude": -122.4194
    }
