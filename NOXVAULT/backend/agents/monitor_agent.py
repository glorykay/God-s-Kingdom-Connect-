import time
import psutil
import platform
from datetime import datetime

# -----------------------------
#   MONITORING FUNCTIONS
# -----------------------------

def get_cpu_usage():
    return psutil.cpu_percent(interval=1)

def get_memory_usage():
    mem = psutil.virtual_memory()
    return {
        "total": mem.total,
        "available": mem.available,
        "used": mem.used,
        "percent": mem.percent
    }

def get_disk_usage():
    disk = psutil.disk_usage("/")
    return {
        "total": disk.total,
        "used": disk.used,
        "free": disk.free,
        "percent": disk.percent
    }

def get_network_usage():
    net = psutil.net_io_counters()
    return {
        "bytes_sent": net.bytes_sent,
        "bytes_recv": net.bytes_recv,
        "packets_sent": net.packets_sent,
        "packets_recv": net.packets_recv
    }

def get_system_info():
    return {
        "platform": platform.system(),
        "platform_version": platform.version(),
        "machine": platform.machine(),
        "processor": platform.processor(),
    }

def run_monitor_scan():
    return {
        "timestamp": datetime.utcnow().isoformat(),
        "cpu": get_cpu_usage(),
        "memory": get_memory_usage(),
        "disk": get_disk_usage(),
        "network": get_network_usage(),
        "system": get_system_info()
    }

# -----------------------------
#   SCHEDULER SECTION
# -----------------------------

def start_monitor_scheduler(interval=10):
    print(f"[NOXVAULT] Monitor scheduler started. Interval: {interval} seconds")

    while True:
        results = run_monitor_scan()
        print(results)
        time.sleep(interval)

if __name__ == "__main__":
    start_monitor_scheduler(10)
