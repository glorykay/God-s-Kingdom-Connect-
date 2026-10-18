import psutil
import platform
import requests
import socket
import time
from datetime import datetime

API = "http://127.0.0.1:8000/system-health/ingest"


def get_uptime_hours():
    boot_ts = psutil.boot_time()
    uptime_seconds = time.time() - boot_ts
    return round(uptime_seconds / 3600, 2)


def get_temperatures():
    try:
        temps = psutil.sensors_temperatures()
        if not temps:
            return "No sensors"
        cpu_temps = temps.get("coretemp") or temps.get("cpu-thermal")
        if cpu_temps:
            return cpu_temps[0].current
        return "Unknown"
    except:
        return "Unsupported"


def get_battery():
    try:
        battery = psutil.sensors_battery()
        if battery:
            return {
                "percent": battery.percent,
                "plugged_in": battery.power_plugged
            }
        return {"percent": None, "plugged_in": None}
    except:
        return {"percent": None, "plugged_in": None}


def get_network_stats():
    stats = psutil.net_io_counters()
    return {
        "bytes_sent": stats.bytes_sent,
        "bytes_recv": stats.bytes_recv,
        "packets_sent": stats.packets_sent,
        "packets_recv": stats.packets_recv,
    }


def get_status(cpu, mem, disk):
    if cpu > 85 or mem > 85 or disk > 90:
        return "Critical"
    if cpu > 70 or mem > 70 or disk > 80:
        return "Warning"
    return "Healthy"


def main():
    cpu = psutil.cpu_percent(interval=1)
    mem = psutil.virtual_memory().percent
    disk = psutil.disk_usage("/").percent
    uptime = get_uptime_hours()
    temp = get_temperatures()
    battery = get_battery()
    net = get_network_stats()

    payload = {
        "timestamp": datetime.utcnow().isoformat(),
        "hostname": socket.gethostname(),
        "os": f"{platform.system()} {platform.release()}",
        "cpu": cpu,
        "memory": mem,
        "disk": disk,
        "uptime_hours": uptime,
        "temperature": temp,
        "battery": battery,
        "network": net,
        "status": get_status(cpu, mem, disk),
    }

    print("Sending REAL system health data:")
    for k, v in payload.items():
        print(f"{k}: {v}")

    r = requests.post(API, json=payload)
    print("Response:", r.status_code, r.text)


if __name__ == "__main__":
    main()
