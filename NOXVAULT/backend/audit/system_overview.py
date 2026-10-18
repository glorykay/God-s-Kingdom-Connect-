from datetime import datetime
import platform
import psutil
import socket
import time

BOOT_TIME = psutil.boot_time()

def get_os_info():
    return {
        "system": platform.system(),
        "release": platform.release(),
        "version": platform.version(),
        "machine": platform.machine(),
        "processor": platform.processor(),
        "architecture": platform.architecture()[0],
    }

def get_cpu_summary():
    return {
        "cores_physical": psutil.cpu_count(logical=False),
        "cores_logical": psutil.cpu_count(logical=True),
        "usage_percent": psutil.cpu_percent(interval=0.5),
    }

def get_memory_summary():
    mem = psutil.virtual_memory()
    return {
        "total_gb": round(mem.total / 1e9, 2),
        "used_gb": round(mem.used / 1e9, 2),
        "free_gb": round(mem.available / 1e9, 2),
        "percent_used": mem.percent,
    }

def get_disk_summary():
    disks = {}
    for part in psutil.disk_partitions():
        try:
            usage = psutil.disk_usage(part.mountpoint)
            disks[part.device] = {
                "mount": part.mountpoint,
                "total_gb": round(usage.total / 1e9, 2),
                "used_gb": round(usage.used / 1e9, 2),
                "free_gb": round(usage.free / 1e9, 2),
                "percent_used": usage.percent,
            }
        except Exception:
            continue
    return disks

def get_network_info():
    return {
        "hostname": socket.gethostname(),
        "primary_ip": socket.gethostbyname(socket.gethostname()),
        "interfaces": list(psutil.net_if_addrs().keys()),
    }

def get_uptime():
    uptime_seconds = time.time() - BOOT_TIME
    hours = round(uptime_seconds / 3600, 2)
    return {"uptime_hours": hours}

def calculate_health_score(cpu, mem, disk):
    score = 100
    score -= cpu["usage_percent"] * 0.3
    score -= mem["percent_used"] * 0.3

    avg_disk_usage = sum(d["percent_used"] for d in disk.values()) / max(len(disk), 1)
    score -= avg_disk_usage * 0.2

    return max(1, min(100, int(score)))

def system_overview():
    os_info = get_os_info()
    cpu = get_cpu_summary()
    mem = get_memory_summary()
    disk = get_disk_summary()
    net = get_network_info()
    uptime = get_uptime()

    health_score = calculate_health_score(cpu, mem, disk)

    return {
        "timestamp": datetime.utcnow().isoformat(),
        "os": os_info,
        "cpu": cpu,
        "memory": mem,
        "disk": disk,
        "network": net,
        "uptime": uptime,
        "system_health_score": health_score,
    }
