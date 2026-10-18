# backend/api/geo_threats.py

def get_geo_threats(country: str | None = None):
    """
    Placeholder Geo-Threats endpoint.
    This prevents import errors in router.py.
    Later this will be upgraded with real intelligence from:
    - IP2Location (geolocation + ASN)
    - ThreatFox (threat types + malware families)
    - OTX (geo-tagged threat indicators)
    """

    return {
        "country": country,
        "threats": [],
        "status": "ok"
    }
