# audit.py
from typing import Dict, Any

from system_moduls import get_system_summary
from network_moduls import get_network_summary

# Optional future imports:
# from security_moduls import get_security_summary
# from vuln_moduls import get_vulnerability_summary
# from malware_moduls import get_malware_summary


def run_full_audit() -> Dict[str, Any]:
    """
    Unified NOXVAULT audit engine.
    Collects system, network, and optional security data.
    """

    audit = {
        "system": get_system_summary(),
        "network": get_network_summary(),
        # "security": get_security_summary(),
        # "vulnerabilities": get_vulnerability_summary(),
        # "malware": get_malware_summary()
    }

    return audit


def run_minimal_audit() -> Dict[str, Any]:
    """
    Lightweight audit for fast checks.
    """
    return {
        "system": get_system_summary(),
        "network": {
            "interfaces": get_network_summary().get("interfaces"),
            "traffic": get_network_summary().get("traffic")
        }
    }
