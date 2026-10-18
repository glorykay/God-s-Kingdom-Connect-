from fastapi import APIRouter, HTTPException
import subprocess
import socket
import ipaddress

router = APIRouter(prefix="/api/ip-scan")

# -----------------------------
# PING SCAN
# -----------------------------
@router.get("/ping/{ip}")
def ping_ip(ip: str):
    try:
        result = subprocess.run(
            ["ping", "-c", "1", ip],
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True
        )
        return {
            "ip": ip,
            "reachable": result.returncode == 0,
            "output": result.stdout
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# -----------------------------
# PORT SCAN (1–1024)
# -----------------------------
@router.get("/ports/{ip}")
def port_scan(ip: str):
    open_ports = []
    for port in range(1, 1025):
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        sock.settimeout(0.3)
        result = sock.connect_ex((ip, port))
        if result == 0:
            open_ports.append(port)
        sock.close()

    return {
        "ip": ip,
        "open_ports": open_ports
    }


# -----------------------------
# RANGE SCAN
# -----------------------------
@router.get("/range")
def range_scan(start: str, end: str):
    try:
        start_ip = ipaddress.ip_address(start)
        end_ip = ipaddress.ip_address(end)

        results = []
        for ip in range(int(start_ip), int(end_ip) + 1):
            ip_str = str(ipaddress.ip_address(ip))
            sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            sock.settimeout(0.2)
            result = sock.connect_ex((ip_str, 80))
            reachable = (result == 0)
            results.append({"ip": ip_str, "reachable": reachable})
            sock.close()

        return {"results": results}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# -----------------------------
# CIDR SCAN
# -----------------------------
@router.get("/cidr/{cidr}")
def cidr_scan(cidr: str):
    try:
        network = ipaddress.ip_network(cidr, strict=False)
        results = []

        for ip in network.hosts():
            ip_str = str(ip)
            sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            sock.settimeout(0.2)
            result = sock.connect_ex((ip_str, 80))
            reachable = (result == 0)
            results.append({"ip": ip_str, "reachable": reachable})
            sock.close()

        return {"network": cidr, "results": results}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
