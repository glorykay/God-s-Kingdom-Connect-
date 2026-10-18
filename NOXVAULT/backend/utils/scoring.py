# backend/services/scoring.py

from typing import Dict, Any


def calculate_score(data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Unified NOXVAULT scoring engine.
    Input: full audit payload (system, firewall, vulnerabilities, malware, etc.)
    Output: numeric score + severity label.
    """

    score = 100  # Start perfect, subtract risk

    # ---------------------------------------------------------
    # IP SCAN RISK
    # ---------------------------------------------------------
    ip_data = data.get("ip_scan", {})
    open_ports = ip_data.get("open_ports", [])
    score -= len(open_ports) * 3  # each open port reduces score

    # High‑risk ports
    high_risk_ports = {22, 3389, 445, 23}
    for p in open_ports:
        if p.get("port") in high_risk_ports:
            score -= 5

    # ---------------------------------------------------------
    # VULNERABILITY RISK
    # ---------------------------------------------------------
    vuln = data.get("vulnerabilities", {})
    risk_score = vuln.get("risk_score", 0)
    score -= min(risk_score, 40)  # cap impact

    # ---------------------------------------------------------
    # MALWARE RISK
    # ---------------------------------------------------------
    malware = data.get("malware", {})
    suspicious_processes = malware.get("suspicious_processes", [])
    suspicious_connections = malware.get("suspicious_connections", [])
    suspicious_files = malware.get("suspicious_files", [])

    score -= len(suspicious_processes) * 10
    score -= len(suspicious_connections) * 8
    score -= len(suspicious_files) * 6

    # ---------------------------------------------------------
    # FIREWALL RISK
    # ---------------------------------------------------------
    fw = data.get("firewall", {})
    fw_status = fw.get("status", {}).get("enabled", None)

    if fw_status is False:
        score -= 20
    elif fw_status is None:
        score -= 5  # unknown

    # ---------------------------------------------------------
    # SECURITY CONFIG RISK
    # ---------------------------------------------------------
    security = data.get("security", {})
    weak_configs = security.get("weak_configurations", [])
    score -= len(weak_configs) * 2

    # ---------------------------------------------------------
    # Normalize score
    # ---------------------------------------------------------
    if score < 0:
        score = 0
    if score > 100:
        score = 100

    # ---------------------------------------------------------
    # Severity label
    # ---------------------------------------------------------
    if score >= 80:
        severity = "Low"
    elif score >= 50:
        severity = "Medium"
    else:
        severity = "High"

    return {
        "score": score,
        "severity": severity
    }
