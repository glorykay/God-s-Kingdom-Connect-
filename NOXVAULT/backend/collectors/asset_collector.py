import platform
import socket
import uuid
import psutil
import requests
import subprocess
import json

API = "http://127.0.0.1:8000/assets/ingest"


def get_local_ips():
    ips = []
    for iface, addrs in psutil.net_if_addrs().items():
        for addr in addrs:
            if addr.family == socket.AF_INET:
                ips.append(addr.address)
    return ips


def get_mac_addresses():
    macs = []
    for iface, addrs in psutil.net_if_addrs().items():
        for addr in addrs:
            if addr.family == psutil.AF_LINK:
                macs.append(addr.address)
    return macs


def get_cpu_model():
    try:
        output = subprocess.check_output("cat /proc/cpuinfo", shell=True).decode()
        for line in output.split("\n"):
            if "model name" in line:
                return line.split(":")[1].strip()
    except:
        return platform.processor()
    return "Unknown CPU"


def get_disk_model():
    try:
        output = subprocess.check_output("lsblk -o NAME,MODEL", shell=True).decode()
        lines = output.split("\n")
        models = []
        for line in lines:
            parts = line.split()
            if len(parts) > 1:
                models.append(" ".join(parts[1:]))
        return list(set(models))
    except:
        return ["Unknown Disk"]


def main():
    os_name = platform.system()
    os_version = platform.release()
    hostname = socket.gethostname()
    ips = get_local_ips()
    macs = get_mac_addresses()
    cpu_model = get_cpu_model()
    disk_models = get_disk_model()
    ram_gb = round(psutil.virtual_memory().total / (1024**3), 2)

    payload = {
        "os_distribution": {
            f"{os_name} {os_version}": 1
        },
        "geo_distribution": {
            "LocalLab": 1
        },
        "hardware": [
            {"name": "CPU", "model": cpu_model, "assets": 1},
            {"name": "RAM", "model": f"{ram_gb} GB", "assets": 1},
            {"name": "Disk", "model": ", ".join(disk_models), "assets": 1},
        ],
        "endpoint_assignment": {
            "Hostname": hostname,
            "IPs": ips,
            "MACs": macs,
        },
        "unmanaged": 0
    }

    print("Sending real asset data:")
    print(json.dumps(payload, indent=4))

    r = requests.post(API, json=payload)
    print("Response:", r.status_code, r.text)


if __name__ == "__main__":
    main()
