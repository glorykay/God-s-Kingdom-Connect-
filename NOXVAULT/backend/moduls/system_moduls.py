import platform
import psutil
import time
from typing import Dict


def get_os_info() -> Dict:
    return {
        "system": platform.system(),
        "node": platform.node(),
        "release": platform.release(),
        "version": platform.version(),
        "machine": platform.machine(),
        "processor": platform.processor()
    }


def get_cpu_info() -> Dict:
    return {
        "physical_cores": psutil.cpu_count(logical=False),
        "total_cores": psutil.cpu_count(logical=True),
        "cpu_usage_percent": psutil.cpu_percent(interval=1),
        "cpu_freq": psutil.cpu_freq()._asdict() if psutil.cpu_freq() else None
    }


def get_memory_info() -> Dict:
    mem = psutil.virtual_memory()
    return {
        "total": mem.total,
        "available": mem.available,
        "used": mem.used,
        "percent": mem.percent
    }


def get_disk_info() -> Dict:
    disks = {}
    for part in psutil.disk_partitions():
        try:
            usage = psutil.disk_usage(part.mountpoint)
            disks[part.mountpoint] = {
                "total": usage.total,
                "used": usage.used,
                "free": usage.free,
                "percent": usage.percent
            }
        except PermissionError:
            continue
    return disks


def get_uptime() -> float:
    return time.time() - psutil.boot_time()


def get_system_summary() -> Dict:
    return {
        "os": get_os_info(),
        "cpu": get_cpu_info(),
        "memory": get_memory_info(),
        "disk": get_disk_info(),
        "uptime_seconds": get_uptime()
    }
