"""
audit_service.py
NOXVAULT Unified Audit Service
Runs all audit modules and returns a combined JSON result.
"""

import json
from datetime import datetime

# ⭐ Correct imports based on your actual folder structure
from audit.system import run_system_audit
from audit.network import run_network_audit
from audit.firewall import run_firewall_audit
from audit.security import run_security_audit


def run_all_audits():
    """
    Runs all enabled audit modules and returns a unified JSON result.
    This is the main function used by FastAPI and test scripts.
    """

    results = {
        "timestamp": datetime.utcnow().isoformat() + "Z",
        "system": {},
        "network": {},
        "firewall": {},
        "security": {},
        "total_checks": 0
    }

    # Run each audit safely
    try:
        results["system"] = run_system_audit()
    except Exception as e:
        results["system"] = {"error": str(e)}

    try:
        results["network"] = run_network_audit()
    except Exception as e:
        results["network"] = {"error": str(e)}

    try:
        results["firewall"] = run_firewall_audit()
    except Exception as e:
        results["firewall"] = {"error": str(e)}

    try:
        results["security"] = run_security_audit()
    except Exception as e:
        results["security"] = {"error": str(e)}

    # Count total checks
    results["total_checks"] = (
        len(results["system"]) +
        len(results["network"]) +
        len(results["firewall"]) +
        len(results["security"])
    )

    return results


if __name__ == "__main__":
    # Manual test
    print(json.dumps(run_all_audits(), indent=4))
