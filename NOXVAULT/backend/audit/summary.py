import platform

from backend.audit.system_overview import system_overview
from backend.audit.hardware import get_hardware_info
from backend.audit.software import get_installed_software
from backend.audit.users import get_user_summary
from backend.audit.security import get_security_info
from backend.audit.network import get_network_config
from backend.audit.processes import list_processes
from backend.audit.startup import get_startup_programs
from backend.audit.services import get_services
from backend.audit.integrity import check_integrity
from backend.audit.events import get_event_logs
from backend.audit.storage import get_storage_info
from backend.audit.vulnerability import scan_vulnerabilities


def get_summary():
    """
    Unified audit summary combining all audit modules.
    """

    return {
        "os": platform.system(),
        "system_overview": system_overview(),
        "hardware": get_hardware_info(),
        "software": get_installed_software(),
        "users": get_user_summary(),
        "security": get_security_info(),
        "network": get_network_config(),
        "processes": list_processes(),
        "startup_programs": get_startup_programs(),
        "services": get_services(),
        "integrity": check_integrity(),
        "events": get_event_logs(),
        "storage": get_storage_info(),
        "vulnerabilities": scan_vulnerabilities()
    }
