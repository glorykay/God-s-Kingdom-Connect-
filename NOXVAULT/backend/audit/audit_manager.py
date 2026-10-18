import json
from datetime import datetime

# Import all audit modules
from .system import run_system_audit
from .network import run_network_audit
from .firewall import run_firewall_audit
from .security import run_security_audit
from .malware import run_malware_audit
from .vulnerability import run_vulnerability_audit
from .traffic import run_traffic_audit


def safe_run(audit_function):
    """
    Safely execute an audit function.
    Prevents crashes and returns a clean error message if something fails.
    """
    try:
        return audit_function()
    except Exception as e:
        return {
            "status": "error",
            "message": str(e)
        }


def run_audits():
    """
    Run all audits and return a unified JSON object.
    This is useful for CLI tools, schedulers, or internal backend tasks.
    """
    return {
        "timestamp": datetime.utcnow().isoformat(),
        "system_audit": safe_run(run_system_audit),
        "network_audit": safe_run(run_network_audit),
        "firewall_audit": safe_run(run_firewall_audit),
        "security_audit": safe_run(run_security_audit),
        "malware_audit": safe_run(run_malware_audit),
        "vulnerability_audit": safe_run(run_vulnerability_audit),
        "traffic_audit": safe_run(run_traffic_audit),
    }


if __name__ == "__main__":
    print(json.dumps(run_audits(), indent=4))
