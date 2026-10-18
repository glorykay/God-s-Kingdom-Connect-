import platform
import psutil
import os

def check_integrity():
    """
    Performs basic system integrity checks:
    - OS info
    - CPU load sanity
    - Memory sanity
    - Disk health
    - Critical file presence (placeholder)
    """

    os_name = platform.system()

    return {
        "os": os_name,
        "cpu_integrity": _check_cpu_integrity(),
        "memory_integrity": _check_memory_integrity(),
        "disk_integrity": _check_disk_integrity(),
        "critical_files": _check_critical_files()
    }


# ---------------------------------------------------------
# CPU INTEGRITY CHECK
# ---------------------------------------------------------

def _check_cpu_integrity():
    try:
        cpu_usage = psutil.cpu_percent(interval=0.5)
        return {
            "cpu_usage_percent": cpu_usage,
            "status": "OK" if cpu_usage < 95 else "High CPU load"
        }
    except Exception as e:
        return {"error": str(e)}


# ---------------------------------------------------------
# MEMORY INTEGRITY CHECK
# ---------------------------------------------------------

def _check_memory_integrity():
    try:
        mem = psutil.virtual_memory()
        return {
            "total_gb": round(mem.total / 1e9, 2),
            "used_gb": round(mem.used / 1e9, 2),
            "percent_used": mem.percent,
            "status": "OK" if mem.percent < 95 else "Low memory available"
        }
    except Exception as e:
        return {"error": str(e)}


# ---------------------------------------------------------
# DISK INTEGRITY CHECK
# ---------------------------------------------------------

def _check_disk_integrity():
    disks = {}

    try:
        for part in psutil.disk_partitions():
            try:
                usage = psutil.disk_usage(part.mountpoint)
                disks[part.mountpoint] = {
                    "total_gb": round(usage.total / 1e9, 2),
                    "used_gb": round(usage.used / 1e9, 2),
                    "percent_used": usage.percent,
                    "status": "OK" if usage.percent < 95 else "Disk almost full"
                }
            except Exception:
                continue

        return disks

    except Exception as e:
        return {"error": str(e)}


# ---------------------------------------------------------
# CRITICAL FILE CHECK (placeholder)
# ---------------------------------------------------------

def _check_critical_files():
    """
    Placeholder for checking important system files.
    You can expand this later.
    """

    critical_paths = [
        "/etc/passwd",
        "/etc/shadow",
        "/etc/hosts"
    ]

    results = {}

    for path in critical_paths:
        results[path] = os.path.exists(path)

    return results
