# backend/api/botnet_c2.py

def get_botnet_c2():
    """
    Placeholder Botnet C2 endpoint.
    This will later be upgraded with real intelligence from:
    - FeodoTracker (C2 servers)
    - ThreatFox (malware families + C2 indicators)
    - Abuse.ch botnet feeds
    """

    # Placeholder structure matching your dashboard
    return [
        {
            "id": 1,
            "ip": "185.244.25.12",
            "port": 443,
            "family": "QakBot",
            "status": "Active",
            "last_seen": "2026-09-21 18:30"
        },
        {
            "id": 2,
            "ip": "91.210.47.55",
            "port": 8080,
            "family": "Emotet",
            "status": "Inactive",
            "last_seen": "2026-09-21 17:10"
        }
    ]
