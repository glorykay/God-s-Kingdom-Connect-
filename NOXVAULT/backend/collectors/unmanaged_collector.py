import subprocess
import psutil
import requests
import socket
import json

API = "http://127.0.0.1:8000/unmanaged/ingest"


def get_local_network_prefix():
    """
    Detect the local network prefix automatically.
    Example: 192.168.1. → returns "192.168.1."
    """
    for iface, addrs in psutil.net_if_addrs().items():
        for addr in addrs:
            if addr.family == socket.AF_INET:
                ip = addr.address
                parts = ip.split(".")
                if len(parts) == 4:
                    return f"{parts[0]}.{parts[1]}.{parts[2]}."
    return "192.168.1."


def ping_host(ip):
    """
    Ping a host once. Works on Windows, Linux, macOS.
    """
    try:
        result = subprocess.run(
            ["ping", "-c", "1", "-W", "1", ip],
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL
        )
        return result.returncode == 0
    except:
        return False


def arp_scan():
    """
    Perform ARP scan to detect live hosts.
    """
    try:
        output = subprocess.check_output("arp -a", shell=True).decode()
        hosts = []
        for line in output.split("\n"):
            if "(" in line and ")" in line:
                ip = line.split("(")[1].split(")")[0]
                hosts.append(ip)
        return hosts
    except:
        return []


def ping_sweep(prefix):
    """
    Ping sweep 1–254 on the detected network prefix.
    """
    alive = []
    for i in range(1, 255):
        ip = f"{prefix}{i}"
        if ping_host(ip):
            alive.append(ip)
    return alive


def main():
    prefix = get_local_network_prefix()
    print(f"Detected network prefix: {prefix}")

    print("Running ARP scan...")
    arp_hosts = arp_scan()

    print("Running ping sweep...")
    ping_hosts = ping_sweep(prefix)

    # Combine results
    unmanaged = sorted(list(set(arp_hosts + ping_hosts)))

    payload = {
        "count": len(unmanaged),
        "devices": unmanaged,
        "note": f"Discovered {len(unmanaged)} unmanaged devices.",
    }

    print("Sending REAL unmanaged device data:")
    print(json.dumps(payload, indent=4))

    r = requests.post(API, json=payload)
    print("Response:", r.status_code, r.text)


if __name__ == "__main__":
    main()
