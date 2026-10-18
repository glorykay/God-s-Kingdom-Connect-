# backend/api/ip_reputation.py

from fastapi import Query

def get_ip_reputation(ip: str = Query(...)):
    """
    Placeholder IP Reputation endpoint.
    This prevents import errors in router.py.
    Later this will be upgraded with real intelligence from:
    - AbuseIPDB (IP reputation score)
    - GreyNoise (IP behavior classification)
    - IP2Location (country + ASN)
    """

    return {
        "ip": ip,
        "score": 0,
        "reputation": "unknown",
        "country": "unknown",
        "asn": "unknown",
        "tags": [],
        "last_seen": None,
        "details": "Real IP reputation upgrade pending"
    }
