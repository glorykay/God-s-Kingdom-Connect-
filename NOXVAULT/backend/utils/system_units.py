"""
system_utils.py
NOXVAULT System Utility Module
Provides safe helpers for OS info, CPU, RAM, disk, uptime, and logged-in users.
"""

import platform
import psutil
import time
from datetime import datetime


# -----------------------------
# OS Information
# -----------------------------

def get_os_info():
    """Return basic OS information."""
    return {
        "system": platform.system(),
        "release": platform.release(),
        "version": platform.version(),
        "machine": platform.machine(),
        "processor": platform.processor()
    }


# -----------------------------
# CPU Information
# -----------------------------

def get_cpu_info():
    """Return CPU usage and core information."""
    return {
        "physical_cores": psutil.cpu_count(logical=False),
        "total_cores": psutil.cpu_count(logical=True),
        "cpu_usage_percent": psutil.cpu_percent(interval=1),
        "cpu_freq": psutil.cpu_freq()._asdict() if psutil.cpu_freq() else {}
    }


# -----------------------------
# RAM Information
# -----------------------------

def get_ram_info():
    """Return RAM usage information."""
    mem = psutil.virtual_memory()
    return {
        "total": mem.total,
        "available": mem.available,
        "used": mem.used,
        "percent": mem.percent
    }


# -----------------------------
# Disk Information
# -----------------------------

def get_disk_info():
    """Return disk usage for all mounted partitions."""
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


# -----------------------------
# System Uptime
# -----------------------------

def get_uptime():
    """Return system uptime in seconds and human-readable format."""
    boot_time = psutil.boot_time()
    now = time.time()
    uptime_seconds = int(now - boot_time)

    return {
        "uptime_seconds": uptime_seconds,
        "boot_time": datetime.utcfromtimestamp(boot_time).isoformat() + "Z"
    }


# -----------------------------
# Logged-in Users
# -----------------------------

def get_logged_in_users():
    """Return a list of logged-in users."""
    users = []
    for user in psutil.users():
        users.append({
            "name": user.name,
            "terminal": user.terminal,
            "host": user.host,
            "started": datetime.utcfromtimestamp(user.started).isoformat() + "Z"
        })
    return users


# -----------------------------
# Manual Test
# -----------------------------

if __name__ == "__main__":
    print("OS Info:", get_os_info())
    print("CPU Info:", get_cpu_info())
    print("RAM Info:", get_ram_info())
    print("Disk Info:", get_disk_info())
    print("Uptime:", get_uptime())
    print("Logged-in Users:", get_logged_in_users())
