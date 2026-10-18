from fastapi import APIRouter, Query
import socket
import concurrent.futures

router = APIRouter()

def scan_port(ip: str, port: int) -> bool:
    try:
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        sock.settimeout(0.5)
        result = sock.connect_ex((ip, port))
        sock.close()
        return result == 0
    except Exception:
        return False

@router.get("/ipscan")
def ip_scan(
    ip: str = Query(..., description="Target IP address"),
    start_port: int = Query(1, description="Start of port range"),
    end_port: int = Query(1024, description="End of port range")
):
    open_ports = []

    with concurrent.futures.ThreadPoolExecutor(max_workers=100) as executor:
        futures = {
            executor.submit(scan_port, ip, port): port
            for port in range(start_port, end_port + 1)
        }

        for future in concurrent.futures.as_completed(futures):
            port = futures[future]
            if future.result():
                open_ports.append(port)

    return {
        "ip": ip,
        "open_ports": open_ports,
        "range": f"{start_port}-{end_port}",
        "status": "scan complete"
    }
