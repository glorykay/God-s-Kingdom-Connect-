from fastapi import APIRouter

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
from backend.audit.summary import get_summary

router = APIRouter(prefix="/audit", tags=["Audit"])

@router.get("/system-overview")
def audit_system_overview():
    return system_overview()

@router.get("/hardware")
def audit_hardware():
    return get_hardware_info()

@router.get("/software")
def audit_software():
    return get_installed_software()

@router.get("/users")
def audit_users():
    return get_user_summary()

@router.get("/security")
def audit_security():
    return get_security_info()

@router.get("/network")
def audit_network():
    return get_network_config()

@router.get("/processes")
def audit_processes():
    return list_processes()

@router.get("/startup")
def audit_startup():
    return get_startup_programs()

@router.get("/services")
def audit_services():
    return get_services()

@router.get("/integrity")
def audit_integrity():
    return check_integrity()

@router.get("/events")
def audit_events():
    return get_event_logs()

@router.get("/storage")
def audit_storage():
    return get_storage_info()

@router.get("/vulnerabilities")
def audit_vulnerabilities():
    return scan_vulnerabilities()

@router.get("/summary")
def audit_summary():
    return get_summary()
