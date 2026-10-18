from fastapi import APIRouter, HTTPException
import subprocess
import ipaddress
import nmap

router = APIRouter(prefix="/api/ip-scan", tags=["ip-scan"])

# -----------------------------
# PING SCAN (Single IP)
# -----------------------------
@router.get("/ping/{target_ip}")
def ping_scan(target_ip: str):
    try:
        result = subprocess.run(
            ["ping", "-n", "1", target_ip],
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True
        )
        alive = "TTL=" in result.stdout
        return {
            "target": target_ip,
            "alive": alive,
            "raw": result.stdout
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# -----------------------------
# PORT SCAN (Single IP)
# -----------------------------
@router.get("/ports/{target_ip}")
def port_scan(target_ip: str):
    try:
        nm = nmap.PortScanner()
        nm.scan(target_ip, "1-1024")

        open_ports = []
        for proto in nm[target_ip].all_protocols():
            ports = nm[target_ip][proto].keys()
            for p in ports:
                if nm[target_ip][proto][p]["state"] == "open":
                    open_ports.append(p)

        return {
            "target": target_ip,
            "open_ports": open_ports,
            "total_open": len(open_ports)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# -----------------------------
# RANGE SCAN (Start → End)
# -----------------------------
@router.get("/range")
def range_scan(start: str, end: str):
    try:
        start_ip = ipaddress.IPv4Address(start)
        end_ip = ipaddress.IPv4Address(end)

        if start_ip > end_ip:
            raise HTTPException(status_code=400, detail="Start IP must be <= End IP")

        results = []
        nm = nmap.PortScanner()

        for ip_int in range(int(start_ip), int(end_ip) + 1):
            ip = str(ipaddress.IPv4Address(ip_int))
            nm.scan(ip, "1-1024")

            open_ports = []
            try:
                for proto in nm[ip].all_protocols():
                    ports = nm[ip][proto].keys()
                    for p in ports:
                        if nm[ip][proto][p]["state"] == "open":
                            open_ports.append(p)
            except:
                pass

            results.append({
                "ip": ip,
                "open_ports": open_ports,
                "total_open": len(open_ports)
            })

        return {"range": f"{start} - {end}", "results": results}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# -----------------------------
# CIDR SCAN (e.g. 192.168.1.0/24)
# -----------------------------
@router.get("/cidr/{network}")
def cidr_scan(network: str):
    try:
        net = ipaddress.ip_network(network, strict=False)
        nm = nmap.PortScanner()

        results = []

        for ip in net.hosts():
            ip_str = str(ip)
            nm.scan(ip_str, "1-1024")

            open_ports = []
            try:
                for proto in nm[ip_str].all_protocols():
                    ports = nm[ip_str][proto].keys()
                    for p in ports:
                        if nm[ip_str][proto][p]["state"] == "open":
                            open_ports.append(p)
            except:
                pass

            results.append({
                "ip": ip_str,
                "open_ports": open_ports,
                "total_open": len(open_ports)
            })

        return {
            "network": network,
            "hosts_scanned": len(results),
            "results": results
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
