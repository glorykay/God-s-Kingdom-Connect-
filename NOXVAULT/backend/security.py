# backend/system_audit.py

import platform
import psutil
import time
import socket
from datetime import datetime
from typing import Dict, Any, List, Optional

from fastapi import APIRouter, HTTPException, Query


router = APIRouter(prefix="/api/system", tags=["System Audit"])


# ---------------------------------------------------------
# FULL AUDIT (SYSTEM + SECURITY)
# ---------------------------------------------------------

@router.get("/full-audit")
def full_system_audit(
    vuln: bool = Query(False),
    ip: Optional[str] = Query(None)
) -> Dict[str, Any]:

    audit = {
        "timestamp": datetime.utcnow().isoformat(),
        "OS": _get_os_info(),
        "CPU": _get_cpu_info(),
        "Memory": _get_memory_info(),
        "Boot_Time": _get_boot_time(),
        "Uptime": _get_uptime(),
        "Load_Average": _get_load_average(),
        "Battery": _get_battery_status(),
        "Network": _get_network_summary(),
        "Storage": _get_storage(),
        "Installed_Software": _get_installed_software(),
        "Users": _get_user_accounts(),
        "Events": _get_events(),
        "Health_Score": _calculate_health_score(),
    }

    # Firewall summary (always try)
    try:
        fw = get_firewall_summary()
        audit["Firewall"] = {
            "os": fw.get("OS", "Unknown"),
            "status": fw.get("status", "Unknown"),
            "rules": fw.get("rules", [])
        }
    except Exception as e:
        audit["Firewall"] = {"error": f"Firewall summary failed: {e}"}

    # Optional vulnerability scan
    if vuln:
        if not ip:
            raise HTTPException(
                status_code=400,
                detail="ip is required when vuln=true"
            )
        try:
            vuln_result = run_vulnerability_scan(ip)
            audit["Vulnerability_Scan"] = vuln_result["vulnerability"]
        except Exception as e:
            audit["Vulnerability_Scan"] = {
                "error": f"Vulnerability scan failed: {e}"
            }
    else:
        audit["Vulnerability_Scan"] = {
            "enabled": False,
            "message": "Use ?vuln=true&ip=TARGET to run vulnerability scan"
        }

    return {
        "meta": {
            "timestamp": datetime.utcnow().isoformat(),
            "engine": "NOXVAULT Unified Security Engine"
        },
        "audit": audit
    }


# ---------------------------------------------------------
# UI SECTION ENDPOINTS
# ---------------------------------------------------------

@router.get("/overview")
def system_overview():
    return {
        "OS": _get_os_info(),
        "CPU": _get_cpu_info(),
        "Memory": _get_memory_info(),
        "Boot_Time": _get_boot_time(),
        "Uptime": _get_uptime(),
        "Health_Score": _calculate_health_score()
    }


@router.get("/hardware")
def hardware_info():
    return {
        "CPU": _get_cpu_info(),
        "Memory": _get_memory_info(),
        "Storage": _get_storage()
    }


@router.get("/software")
def software_info():
    return {"Installed_Software": _get_installed_software()}


@router.get("/users")
def users_info():
    return {"Users": _get_user_accounts()}


@router.get("/security")
def security_info():
    # lightweight security summary for UI
    try:
        fw = get_firewall_summary()
        return {
            "Firewall": {
                "os": fw.get("OS", "Unknown"),
                "status": fw.get("status", "Unknown"),
                "rules_count": len(fw.get("rules", []))
            }
        }
    except Exception as e:
        return {"Firewall": {"error": str(e)}}


@router.get("/network")
def network_info():
    return {"Network": _get_network_summary()}


@router.get("/processes")
def processes_info():
    try:
        procs = []
        for p in psutil.process_iter(["pid", "name", "cpu_percent", "memory_percent"]):
            procs.append(p.info)
        return {"Processes": procs}
    except:
        return {"Processes": []}


@router.get("/startup")
def startup_info():
    return {"Startup_Programs": ["N/A (OS-specific)"]}


@router.get("/services")
def services_info():
    return {"Services": ["N/A (OS-specific)"]}


@router.get("/integrity")
def integrity_info():
    return {"File_Integrity": "Not implemented"}


@router.get("/events")
def events_info():
    return {"Events": _get_events()}


@router.get("/storage")
def storage_info():
    return {"Storage": _get_storage()}


@router.get("/vulnerabilities")
def vuln_info(ip: Optional[str] = None):
    if not ip:
        return {"message": "Provide ?ip=TARGET to scan"}
    return run_vulnerability_scan(ip)


@router.get("/summary")
def summary_info():
    return {
        "OS": _get_os_info(),
        "CPU": _get_cpu_info(),
        "Memory": _get_memory_info(),
        "Network": _get_network_summary(),
        "Storage": _get_storage(),
        "Health_Score": _calculate_health_score()
    }


# ---------------------------------------------------------
# HELPERS
# ---------------------------------------------------------

def _get_os_info() -> Dict[str, Any]:
    return {
        "system": platform.system(),
        "release": platform.release(),
        "version": platform.version(),
        "machine": platform.machine(),
        "processor": platform.processor(),
        "python_version": platform.python_version()
    }


def _get_cpu_info() -> Dict[str, Any]:
    try:
        return {
            "physical_cores": psutil.cpu_count(logical=False),
            "total_cores": psutil.cpu_count(logical=True),
            "cpu_usage_percent": psutil.cpu_percent(interval=1),
            "cpu_freq": psutil.cpu_freq()._asdict() if psutil.cpu_freq() else None
        }
    except Exception as e:
        return {"error": str(e)}


def _get_memory_info() -> Dict[str, Any]:
    mem = psutil.virtual_memory()
    return {
        "total_gb": round(mem.total / 1e9, 2),
        "used_gb": round(mem.used / 1e9, 2),
        "free_gb": round(mem.available / 1e9, 2),
        "percent_used": mem.percent
    }


def _get_boot_time() -> str:
    return datetime.utcfromtimestamp(psutil.boot_time()).isoformat()


def _get_uptime() -> str:
    uptime_seconds = time.time() - psutil.boot_time()
    return f"{round(uptime_seconds / 3600, 2)} hours"


def _get_load_average() -> Dict[str, Any]:
    if platform.system() in ("Linux", "Darwin"):
        load1, load5, load15 = psutil.getloadavg()
        return {
            "1_min": round(load1, 2),
            "5_min": round(load5, 2),
            "15_min": round(load15, 2)
        }
    return {"supported": False}


def _get_battery_status() -> Dict[str, Any]:
    battery = psutil.sensors_battery()
    if not battery:
        return {"available": False}
    return {
        "available": True,
        "percent": battery.percent,
        "plugged_in": battery.power_plugged
    }


def _get_network_summary() -> Dict[str, Any]:
    return {
        "hostname": socket.gethostname(),
        "primary_ip": socket.gethostbyname(socket.gethostname()),
        "interfaces": list(psutil.net_if_addrs().keys())
    }


def _get_storage() -> Dict[str, Any]:
    disks = {}
    for part in psutil.disk_partitions():
        try:
            usage = psutil.disk_usage(part.mountpoint)
            disks[part.device] = {
                "total_gb": round(usage.total / 1e9, 2),
                "used_gb": round(usage.used / 1e9, 2),
                "free_gb": round(usage.free / 1e9, 2),
                "percent": usage.percent,
            }
        except:
            pass
    return disks


def _get_installed_software() -> List[Dict[str, Any]]:
    return [
        {"name": "Python", "version": platform.python_version()},
        {"name": "OS", "version": platform.version()},
    ]


def _get_user_accounts() -> List[Dict[str, Any]]:
    return [
        {"username": "Administrator", "type": "Admin", "status": "Active"},
        {"username": "Guest", "type": "User", "status": "Disabled"},
    ]


def _get_events() -> List[Dict[str, Any]]:
    now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    return [
        {"time": now, "event_id": "1001", "source": "System", "message": "System started"},
        {"time": now, "event_id": "4624", "source": "Security", "message": "User login successful"},
    ]


def _calculate_health_score() -> Dict[str, Any]:
    cpu = psutil.cpu_percent()
    mem = psutil.virtual_memory().percent

    score = 100
    if cpu > 80:
        score -= 20
    if mem > 80:
        score -= 20

    return {
        "score": score,
        "status": "Good" if score >= 70 else "Warning" if score >= 40 else "Critical"
    }
