import psutil
import socket

def get_network_config():
    interfaces = {}
    for name, addrs in psutil.net_if_addrs().items():
        interfaces[name] = []
        for addr in addrs:
            interfaces[name].append({
                "family": str(addr.family),
                "address": addr.address,
                "netmask": addr.netmask,
                "broadcast": addr.broadcast
            })

    connections = []
    for conn in psutil.net_connections():
        try:
            connections.append({
                "fd": conn.fd,
                "family": str(conn.family),
                "type": str(conn.type),
                "local_address": f"{conn.laddr.ip}:{conn.laddr.port}" if conn.laddr else None,
                "remote_address": f"{conn.raddr.ip}:{conn.raddr.port}" if conn.raddr else None,
                "status": conn.status
            })
        except psutil.AccessDenied:
            continue
        except Exception:
            continue

    return {
        "hostname": socket.gethostname(),
        "primary_ip": socket.gethostbyname(socket.gethostname()),
        "interfaces": interfaces,
        "connections": connections
    }
