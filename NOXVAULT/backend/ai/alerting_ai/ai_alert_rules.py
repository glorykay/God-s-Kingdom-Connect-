# backend/ai/alerting_ai/ai_alert_rules.py

from .ai_alert_model import AIAlert

def evaluate_ai_alert(alert: AIAlert) -> str:
    """
    AI rule engine for NOXVAULT.
    Evaluates AI-generated alerts using severity, confidence, and type.
    Returns a human-readable evaluation string.
    """

    # High-confidence critical threats
    if alert.severity == "Critical" and alert.confidence >= 0.85:
        return "AI flags this as a severe threat requiring immediate action."

    # High-confidence high severity
    if alert.severity == "High" and alert.confidence >= 0.80:
        return "AI recommends urgent investigation."

    # Medium severity with strong confidence
    if alert.severity == "Medium" and alert.confidence >= 0.75:
        return "AI suggests monitoring and follow-up."

    # Low severity but high confidence
    if alert.severity == "Low" and alert.confidence >= 0.90:
        return "Low-risk anomaly detected with high AI certainty."

    # Behavioral threat types
    if "Behavioral" in alert.type:
        return "AI behavioral model detected unusual activity."

    # Privilege escalation predictions
    if "Privilege Escalation" in alert.type:
        return "AI predicts possible privilege escalation attempt."

    # Lateral movement predictions
    if "Lateral Movement" in alert.type:
        return "AI detects potential lateral movement behavior."

    # Default fallback
    return "AI recommends monitoring this alert."
