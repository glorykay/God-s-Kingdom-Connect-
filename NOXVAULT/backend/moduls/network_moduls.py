import psutil
import socket
import platform
from typing import Dict, Any


def get_interfaces() -> Dict[str, Any]:
    interfaces = {}
    addrs = psutil.net_if_addrs()
    stats = psutil.net_if_stats()

    for iface, addr_list in addrs.items():
        iface_info = {
            "mac": None,
            "ipv4": None,
            "ipv6": None,
            "is_up": stats[iface].isup if iface in stats else False,
            "speed_mbps": stats[iface].speed if iface in stats else None
        }

        for addr in addr_list:
            if addr.family == socket.AF_INET:
                iface_info["ipv4"] = addr.address
            elif addr.family == socket.AF_INET6:
                iface_info["ipv6"] = addr.address
            elif addr.family == psutil.AF_LINK:
                iface_info["mac"] = addr.address

        interfaces[iface] = iface_info

    return interfaces


def get_network_connections() -> Dict[str, Any]:
    connections = []
    for conn in psutil.net_connections(kind="inet"):
        try:
            connections.append({
                "local_address": f"{conn.laddr.ip}:{conn.laddr.port}" if conn.laddr else None,
                "remote_address": f"{conn.raddr.ip}:{conn.raddr.port}" if conn.raddr else None,
                "status": conn.status,
                "pid": conn.pid
            })
        except Exception:
            continue
    return {"connections": connections}


def get_network_traffic() -> Dict[str, Any]:
    counters = psutil.net_io_counters(pernic=True)
    traffic = {}

    for iface, data in counters.items():
        traffic[iface] = {
            "bytes_sent": data.bytes_sent,
            "bytes_recv": data.bytes_recv,
            "packets_sent": data.packets_sent,
            "packets_recv": data.packets_recv,
            "errin": data.errin,
            "errout": data.errout,
            "dropin": data.dropin,
            "dropout": data.dropout
        }

    return traffic


def get_default_gateway() -> Dict[str, Any]:
    try:
        gws = psutil.net_if_stats()
        return {"gateway": gws}
    except Exception:
        return {"gateway": None}


def get_dns_servers() -> Dict[str, Any]:
    dns = []
    try:
        if platform.system() == "Windows":
            import subprocess
            output = subprocess.check_output("ipconfig /all", shell=True).decode()
            for line in output.splitlines():
                if "DNS Servers" in line or line.strip().startswith(tuple("0123456789")):
                    dns.append(line.split(":")[-1].strip())
        else:
            with open("/etc/resolv.conf") as f:
                for line in f:
                    if line.startswith("nameserver"):
                        dns.append(line.split()[1])
    except Exception:
        pass

    return {"dns_servers": dns}


def get_network_summary() -> Dict[str, Any]:
    return {
        "interfaces": get_interfaces(),
        "connections": get_network_connections(),
        "traffic": get_network_traffic(),
        "dns": get_dns_servers(),
        "gateway": get_default_gateway()
    }
