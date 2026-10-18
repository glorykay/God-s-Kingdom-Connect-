# backend/firewall_routes.py

from fastapi import APIRouter

router = APIRouter(prefix="/api/firewall", tags=["firewall"])

# ------------------------------------------------------------
# STATIC FIREWALL RULES (UI CONSOLE)
# ------------------------------------------------------------

@router.get("/rules")
def firewall_rules():
    return {
        "rules": [
            {
                "id": 1,
                "action": "allow",
                "direction": "inbound",
                "port": 80,
                "protocol": "TCP",
                "description": "HTTP"
            },
            {
                "id": 2,
                "action": "allow",
                "direction": "inbound",
                "port": 443,
                "protocol": "TCP",
                "description": "HTTPS"
            },
            {
                "id": 3,
                "action": "deny",
                "direction": "inbound",
                "port": 3389,
                "protocol": "TCP",
                "description": "Block RDP"
            },
            {
                "id": 4,
                "action": "deny",
                "direction": "inbound",
                "port": 23,
                "protocol": "TCP",
                "description": "Block Telnet"
            },
            {
                "id": 5,
                "action": "allow",
                "direction": "outbound",
                "port": 53,
                "protocol": "UDP",
                "description": "DNS"
            }
        ]
    }

# ------------------------------------------------------------
# FIREWALL STATUS (OPTIONAL UI PANEL)
# ------------------------------------------------------------

@router.get("/status")
def firewall_status():
    return {
        "firewall_enabled": True,
        "default_policy_inbound": "deny",
        "default_policy_outbound": "allow",
        "last_updated": "auto"
    }

# ------------------------------------------------------------
# FIREWALL LOGS (OPTIONAL UI PANEL)
# ------------------------------------------------------------

@router.get("/logs")
def firewall_logs():
    return {
        "logs": [
            {"time": "2026-05-19 02:10", "action": "blocked", "port": 23, "reason": "Telnet blocked"},
            {"time": "2026-05-19 02:12", "action": "allowed", "port": 443, "reason": "HTTPS allowed"},
            {"time": "2026-05-19 02:15", "action": "blocked", "port": 3389, "reason": "RDP blocked"},
        ]
    }
