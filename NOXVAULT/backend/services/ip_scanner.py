import socket
from typing import Dict

def scan_ip_ports(ip: str) -> Dict:
    open_ports = []
    filtered_ports = []
    closed_ports = []

    common_ports = {
        21: "FTP",
        22: "SSH",
        23: "Telnet",
        25: "SMTP",
        53: "DNS",
        80: "HTTP",
        110: "POP3",
        135: "RPC",
        139: "NetBIOS",
        143: "IMAP",
        443: "HTTPS",
        445: "SMB",
        3389: "RDP"
    }

    for port in common_ports:
        try:
            sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            sock.settimeout(0.5)
            result = sock.connect_ex((ip, port))

            if result == 0:
                open_ports.append(port)
            elif result == 10060:
                filtered_ports.append(port)
            else:
                closed_ports.append(port)

            sock.close()
        except:
            filtered_ports.append(port)

    return {
        "open_ports": open_ports,
        "filtered_ports": filtered_ports,
        "closed_ports": closed_ports
    }
    
