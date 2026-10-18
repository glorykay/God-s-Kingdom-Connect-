import platform
import psutil

def get_hardware_info():
    cpu_freq = psutil.cpu_freq()
    mem = psutil.virtual_memory()

    return {
        "system": {
            "machine": platform.machine(),
            "processor": platform.processor(),
            "architecture": platform.architecture()[0],
        },
        "cpu": {
            "cores_physical": psutil.cpu_count(logical=False),
            "cores_logical": psutil.cpu_count(logical=True),
            "frequency_mhz": cpu_freq.current if cpu_freq else None,
            "min_frequency_mhz": cpu_freq.min if cpu_freq else None,
            "max_frequency_mhz": cpu_freq.max if cpu_freq else None,
            "usage_percent": psutil.cpu_percent(interval=0.5),
        },
        "memory": {
            "total_gb": round(mem.total / 1e9, 2),
            "used_gb": round(mem.used / 1e9, 2),
            "free_gb": round(mem.available / 1e9, 2),
            "percent_used": mem.percent,
        }
    }
