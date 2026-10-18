# backend/agents/alerts/alert_rules.py

from .alert_model import Alert

def evaluate_alert(alert: Alert) -> str:
    """
    Rule engine for NOXVAULT Agents alert system.
    Evaluates system alerts using severity and type.
    Returns a human-readable evaluation string.
    """

    # Critical threats
    if alert.severity == "Critical":
        return "Immediate action required — critical system threat detected."

    # High severity threats
    if alert.severity == "High":
        return "Urgent investigation recommended."

    # Medium severity threats
    if alert.severity == "Medium":
        return "Monitor and follow up — potential risk detected."

    # Low severity threats
    if alert.severity == "Low":
        return "Low-risk system event — monitoring advised."

    # Type-based logic
    if "Malware" in alert.type:
        return "Malware signature detected — verify system integrity."

    if "Unauthorized Login" in alert.type:
        return "Unauthorized login attempt — check authentication logs."

    if "Suspicious Traffic" in alert.type:
        return "Suspicious network activity — inspect outbound connections."

    if "Firewall Rule" in alert.type:
        return "Firewall rule triggered — review blocked traffic."

    if "High CPU" in alert.type:
        return "High CPU usage detected — inspect running processes."

    # Default fallback
    return "System event logged — no immediate action required."
