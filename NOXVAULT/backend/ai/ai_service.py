from typing import Dict, Any, List
from backend.ai.ai_models import AIAnalyzeRequest




def analyze_security(payload: AIAnalyzeRequest) -> Dict[str, Any]:
    """
    Core AI analysis logic for NOXVAULT.
    Replace this with your real ML / correlation engine later.
    """

    high_risk_ports = {22, 3389, 445}
    risky_open = [p for p in payload.ports if p in high_risk_ports]

    key_findings: List[str] = []

    if risky_open:
        key_findings.append(
            f"High-risk ports exposed: {', '.join(str(p) for p in risky_open)}"
        )

    if payload.cves:
        key_findings.append(f"{len(payload.cves)} CVEs detected.")

    summary = "Environment analyzed. Initial AI risk assessment generated."
    overall_risk = "high" if risky_open or payload.cves else "low"

    return {
        "summary": summary,
        "overall_risk": overall_risk,
        "key_findings": key_findings,
        "attack_paths": [],
        "recommendations": [],
    }
