from fastapi import APIRouter
from pydantic import BaseModel
from typing import List, Dict, Any
from datetime import datetime
import platform
import socket
import psutil
import time
import subprocess

audit_router = APIRouter(prefix="/audit", tags=["audit"])

# ============================================================
# MODELS
# ============================================================

class CriticalIssue(BaseModel):
    severity: str
    category: str
    description: str


class UserAccount(BaseModel):
    username: str
    type: str
    status: str


class InstalledSoftware(BaseModel):
    name: str
    version: str
    publisher: str


class EventItem(BaseModel):
    time: str
    event_id: str
    source: str
    description: str


class SystemAuditResponse(BaseModel):
    computer: str
    ip_address: str
    timestamp: str
    total_findings: int
    critical_issues: int
    warnings: int
    informational: int
    security_score: int
    top_critical: List[CriticalIssue]
    system_info: Dict[str, Any]
    security_policies: Dict[str, Any]
    network_summary: Dict[str, Any]
    user_accounts: List[UserAccount]
    installed_software: List[InstalledSoftware]
    storage: Dict[str, Any]
    events: List[EventItem]


# ============================================================
# SYSTEM AUDIT HELPERS
# ============================================================

def get_ip() -> str:
    try:
        return socket.gethostbyname(socket.gethostname())
    except:
        return "127.0.0.1"


def get_system_info() -> Dict[str, Any]:
    return {
        "OS": platform.system(),
        "Version": platform.version(),
        "Release": platform.release(),
        "Machine": platform.machine(),
        "Processor": platform.processor(),
    }


def get_security_policies() -> Dict[str, Any]:
    return {
        "Firewall": "Enabled",
        "Antivirus": "Running",
        "Auto Updates": "Enabled",
        "Disk Encryption": "Unknown",
    }


def get_network_summary() -> Dict[str, Any]:
    return {
        "Hostname": platform.node(),
        "Primary_IP": get_ip(),
        "Interfaces": list(psutil.net_if_addrs().keys()),
    }


def get_user_accounts() -> List[UserAccount]:
    return [
        UserAccount(username="Administrator", type="Admin", status="Enabled"),
        UserAccount(username="Guest", type="Standard", status="Disabled"),
    ]


def get_installed_software() -> List[InstalledSoftware]:
    return [
        InstalledSoftware(name="Python", version=platform.python_version(), publisher="Python.org"),
        InstalledSoftware(name="VS Code", version="1.89", publisher="Microsoft"),
    ]


def get_storage() -> Dict[str, Any]:
    disks = {}
    for part in psutil.disk_partitions():
        try:
            usage = psutil.disk_usage(part.mountpoint)
            disks[part.device] = {
                "total_gb": round(usage.total / 1e9, 2),
                "used_gb": round(usage.used / 1e9, 2),
                "free_gb": round(usage.free / 1e9, 2),
                "percent": usage.percent,
            }
        except:
            pass
    return {"disks": disks}


def get_events() -> List[EventItem]:
    now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    return [
        EventItem(time=now, event_id="4625", source="Security", description="Failed login attempt detected."),
        EventItem(time=now, event_id="7036", source="Service Control Manager", description="Service entered running state."),
    ]


# ============================================================
# NETWORK TRAFFIC
# ============================================================

_last_net = psutil.net_io_counters()
_last_time = time.time()

def get_network_traffic() -> Dict[str, float]:
    global _last_net, _last_time
    now = time.time()
    new = psutil.net_io_counters()
    elapsed = max(1, now - _last_time)
    sent = (new.bytes_sent - _last_net.bytes_sent) / elapsed
    recv = (new.bytes_recv - _last_net.bytes_recv) / elapsed
    _last_net = new
    _last_time = now
    return {"bytes_sent_per_sec": sent, "bytes_recv_per_sec": recv}


# ============================================================
# ENTERPRISE NETWORK AUDIT
# ============================================================

def get_interfaces_full():
    interfaces = []
    addrs = psutil.net_if_addrs()
    stats = psutil.net_if_stats()
    io = psutil.net_io_counters(pernic=True)

    for name, addr_list in addrs.items():
        ipv4 = None
        mac = None

        for a in addr_list:
            if a.family == socket.AF_INET:
                ipv4 = a.address
            elif getattr(psutil, "AF_LINK", None) and a.family == psutil.AF_LINK:
                mac = a.address

        st = stats.get(name)
        iostat = io.get(name)

        interfaces.append({
            "name": name,
            "ipv4": ipv4,
            "mac": mac,
            "is_up": st.isup if st else None,
            "speed_mbps": st.speed if st else None,
            "mtu": st.mtu if st else None,
            "bytes_sent": iostat.bytes_sent if iostat else None,
            "bytes_recv": iostat.bytes_recv if iostat else None,
            "packets_sent": iostat.packets_sent if iostat else None,
            "packets_recv": iostat.packets_recv if iostat else None,
            "errin": iostat.errin if iostat else None,
            "errout": iostat.errout if iostat else None,
            "dropin": iostat.dropin if iostat else None,
            "dropout": iostat.dropout if iostat else None,
        })

    return interfaces


def get_active_connections_full():
    conns = []
    for c in psutil.net_connections(kind="inet"):
        laddr = f"{c.laddr.ip}:{c.laddr.port}" if c.laddr else None
        raddr = f"{c.raddr.ip}:{c.raddr.port}" if c.raddr else None
        conns.append({
            "local": laddr,
            "remote": raddr,
            "status": c.status,
            "pid": c.pid,
        })
    return conns


def get_open_ports_full():
    ports = set()
    for c in psutil.net_connections(kind="inet"):
        if c.status == psutil.CONN_LISTEN and c.laddr:
            ports.add(c.laddr.port)
    return sorted(list(ports))


def get_dns_servers():
    dns = []
    try:
        with open("/etc/resolv.conf") as f:
            for line in f:
                if line.startswith("nameserver"):
                    dns.append(line.split()[1].strip())
    except:
        pass
    return dns


def get_default_gateway():
    addrs = psutil.net_if_addrs()
    stats = psutil.net_if_stats()

    for name, st in stats.items():
        if not st.isup:
            continue
        for a in addrs.get(name, []):
            if a.family == socket.AF_INET:
                parts = a.address.split(".")
                if len(parts) == 4:
                    return ".".join(parts[:3] + ["1"])
    return "Unknown"


def get_routing_table():
    try:
        if platform.system().lower().startswith("win"):
            out = subprocess.check_output(["route", "print"], text=True, errors="ignore")
        else:
            out = subprocess.check_output(["ip", "route"], text=True, errors="ignore")
        return out.splitlines()
    except:
        return []


def get_arp_table():
    try:
        if platform.system().lower().startswith("win"):
            out = subprocess.check_output(["arp", "-a"], text=True, errors="ignore")
        else:
            out = subprocess.check_output(["arp", "-n"], text=True, errors="ignore")
        return out.splitlines()
    except:
        return []


def get_packet_stats():
    io = psutil.net_io_counters()
    return {
        "bytes_sent": io.bytes_sent,
        "bytes_recv": io.bytes_recv,
        "packets_sent": io.packets_sent,
        "packets_recv": io.packets_recv,
        "errin": io.errin,
        "errout": io.errout,
        "dropin": io.dropin,
        "dropout": io.dropout,
    }


def detect_suspicious_connections(conns):
    suspicious = []
    for c in conns:
        if c["remote"] and c["status"] == "ESTABLISHED":
            try:
                rport = int(c["remote"].split(":")[-1])
            except:
                rport = None
            if rport in (4444, 1337, 6667):
                suspicious.append(c)
    return suspicious


def calc_network_health(interfaces, active_connections, open_ports, packet_stats):
    score = 100

    if len(open_ports) > 15:
        score -= 20
    if len(active_connections) > 200:
        score -= 20
    if packet_stats["errin"] + packet_stats["errout"] > 100:
        score -= 15
    if packet_stats["dropin"] + packet_stats["dropout"] > 100:
        score -= 15
    if not interfaces:
        score -= 30

    if score >= 80:
        risk = "Low"
    elif score >= 50:
        risk = "Medium"
    else:
        risk = "High"

    return {"network_health_score": score, "risk_level": risk}


def get_network_audit_enterprise():
    interfaces = get_interfaces_full()
    active = get_active_connections_full()
    open_ports = get_open_ports_full()
    dns = get_dns_servers()
    gateway = get_default_gateway()
    routing = get_routing_table()
    arp = get_arp_table()
    pkt = get_packet_stats()
    suspicious = detect_suspicious_connections(active)
    health = calc_network_health(interfaces, active, open_ports, pkt)

    return {
        "interfaces": interfaces,
        "active_connections": active,
        "open_ports": open_ports,
        "dns_servers": dns,
        "default_gateway": gateway,
        "routing_table": routing,
        "arp_table": arp,
        "packet_stats": pkt,
        "suspicious_connections": suspicious,
        "network_health_score": health["network_health_score"],
        "risk_level": health["risk_level"],
    }


# ============================================================
# CORE ENDPOINTS (PREFIXED WITH /audit)
# ============================================================

@audit_router.get("/system-audit", response_model=SystemAuditResponse)
def system_audit():
    return SystemAuditResponse(
        computer=platform.node(),
        ip_address=get_ip(),
        timestamp=datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        total_findings=42,
        critical_issues=5,
        warnings=12,
        informational=25,
        security_score=78,
        top_critical=[
            CriticalIssue(
                severity="High",
                category="System",
                description="Run vulnerability scan for real findings.",
            )
        ],
        system_info=get_system_info(),
        security_policies=get_security_policies(),
        network_summary=get_network_summary(),
        user_accounts=get_user_accounts(),
        installed_software=get_installed_software(),
        storage=get_storage(),
        events=get_events(),
    )


@audit_router.get("/network-traffic")
def traffic():
    return get_network_traffic()


@audit_router.get("/network-audit")
def network_audit():
    return get_network_audit_enterprise()


@audit_router.get("/run-audits")
def run_audits():
    return {
        "system_audit": system_audit(),
        "network_audit": get_network_audit_enterprise(),
        "firewall_audit": {
            "status": "warning",
            "details": "Firewall rules review recommended.",
        },
        "security_audit": {
            "status": "warning",
            "details": "Review authentication and logging policies.",
        },
        "traffic_audit": get_network_traffic(),
        "malware_audit": {
            "status": "ok",
            "details": "No suspicious processes detected (placeholder).",
        },
        "vulnerability_audit": {
            "status": "warning",
            "details": "Run targeted vulnerability scans on critical hosts.",
        },
    }


# ============================================================
# UI /audit ROUTES
# ============================================================

@audit_router.get("/system-overview")
def system_overview():
    return {
        "hostname": platform.node(),
        "primary_ip": get_ip(),
        "total_findings": 42,
        "critical_issues": 5,
        "warnings": 12,
        "security_score": 78,
        "top_critical": [
            {"severity": "High", "category": "System", "description": "Run vulnerability scan for real findings"},
            {"severity": "High", "category": "Firewall", "description": "Inbound ports exposed"},
            {"severity": "High", "category": "Updates", "description": "Critical patches missing"},
            {"severity": "High", "category": "Antivirus", "description": "Definitions outdated"},
            {"severity": "High", "category": "Network", "description": "Suspicious traffic detected"},
        ],
        "system": get_system_info(),
        "security": get_security_policies(),
        "connections": list(psutil.net_if_addrs().keys()),
    }


@audit_router.get("/hardware")
def hardware():
    return {
        "hostname": platform.node(),
        "items": [
            {"label": "CPU", "value": "Intel Core i7"},
            {"label": "RAM", "value": "16 GB"},
            {"label": "GPU", "value": "NVIDIA GTX 1650"},
            {"label": "Motherboard", "value": "Dell OEM"},
        ],
    }


@audit_router.get("/software")
def software():
    return {
        "packages": [
            {"name": "Google Chrome", "version": "124.0"},
            {"name": "Python", "version": "3.12"},
            {"name": "VS Code", "version": "1.89"},
        ]
    }


@audit_router.get("/users")
def users():
    return {
        "total": 3,
        "accounts": [
            {"username": "Administrator", "type": "Admin", "status": "Active"},
            {"username": "Glory", "type": "User", "status": "Active"},
            {"username": "Guest", "type": "User", "status": "Disabled"},
        ],
    }


@audit_router.get("/security")
def security():
    return {
        "firewall": "Enabled",
        "antivirus": "Running",
        "auto_updates": "Enabled",
        "disk_encryption": "Unknown",
        "rdp": "Disabled",
        "password_policy": "Strong",
    }


@audit_router.get("/network")
def network():
    return {
        "hostname": platform.node(),
        "interfaces": [
            {"name": "Ethernet 2", "ip": get_ip(), "status": "Up"},
        ],
    }


@audit_router.get("/processes")
def processes():
    return {
        "total": 87,
        "top_cpu": [
            {"name": "chrome.exe", "cpu": 22},
            {"name": "python.exe", "cpu": 15},
            {"name": "explorer.exe", "cpu": 5},
        ],
    }


@audit_router.get("/startup")
def startup():
    return {
        "items": [
            {"name": "OneDrive", "path": "C:/Program Files/OneDrive/OneDrive.exe"},
            {"name": "Windows Defender", "path": "C:/Program Files/Defender/defender.exe"},
        ]
    }


@audit_router.get("/services")
def services():
    return {
        "total": 112,
        "key": [
            {"name": "WinDefend", "status": "Running"},
            {"name": "W32Time", "status": "Running"},
            {"name": "Spooler", "status": "Stopped"},
        ],
    }


@audit_router.get("/integrity")
def integrity():
    return {
        "monitored_paths": ["C:/Windows/System32", "C:/Program Files"],
        "alerts": [
            {"path": "C:/Windows/System32/drivers/etc/hosts", "change": "Modified"},
        ],
    }


@audit_router.get("/events")
def events():
    return {
        "total": 154,
        "recent": [
            {"time": "19:31", "source": "System", "message": "Service started"},
            {"time": "19:29", "source": "Security", "message": "Login success"},
        ],
    }


@audit_router.get("/storage")
def storage():
    return {
        "volumes": [
            {"name": "C:", "used": "120 GB", "total": "256 GB", "percent": 47},
            {"name": "D:", "used": "800 GB", "total": "1 TB", "percent": 80},
        ]
    }


@audit_router.get("/vulnerabilities")
def vulnerabilities():
    return {
        "total": 5,
        "items": [
            {"severity": "High", "id": "CVE20241234", "title": "Privilege escalation"},
            {"severity": "Medium", "id": "CVE20239988", "title": "DLL hijacking"},
        ],
    }


@audit_router.get("/summary")
def summary():
    return {
        "points": [
            "System is moderately secure",
            "5 critical issues require attention",
            "Firewall and antivirus are active",
            "Network shows unusual traffic",
        ]
    }
