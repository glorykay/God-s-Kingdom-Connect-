from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List
from datetime import datetime, timedelta
import random
import socket

app = FastAPI(title="NOXVAULT Network Security Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------- MODELS ----------

class FirewallEvent(BaseModel):
    time: str
    action: str
    src_ip: str
    dst_ip: str
    port: int
    proto: str
    rule: str

class IDSAlert(BaseModel):
    time: str
    severity: str
    signature: str
    src_ip: str
    dst_ip: str
    proto: str

class TopTalker(BaseModel):
    ip: str
    direction: str
    throughput_mbps: float
    flows: int
    tags: list[str]

class SuspiciousPort(BaseModel):
    port: int
    proto: str
    hits: int
    severity: str
    notes: str

class NetworkHealth(BaseModel):
    blocked_connections: int
    critical_alerts: int
    status: str
    status_detail: str

# --- SYSTEM HEALTH ---

class SystemHealth(BaseModel):
    cpu_usage: int
    mem_usage: int
    disk_usage: int
    process_count: int
    status: str
    detail: str

# --- CYBER THREAT ---

class ThreatIntel(BaseModel):
    time: str
    type: str
    indicator: str
    severity: str
    source: str

class Vulnerability(BaseModel):
    cve: str
    severity: str
    asset: str
    status: str

# --- SOC CONSOLE ---

class Alert(BaseModel):
    time: str
    severity: str
    message: str

class SocStatus(BaseModel):
    open_incidents: int
    active_analysts: int

# ---------- HELPERS ----------

def rand_ip(private=True):
    if private:
        return f"10.{random.randint(0, 20)}.{random.randint(0, 255)}.{random.randint(1, 254)}"
    return f"{random.randint(1, 255)}.{random.randint(0, 255)}.{random.randint(0, 255)}.{random.randint(1, 254)}"

def now_minus(seconds: int) -> str:
    return (datetime.utcnow() - timedelta(seconds=seconds)).strftime("%H:%M:%S")

# ---------- NETWORK ENDPOINTS ----------

@app.get("/firewall", response_model=List[FirewallEvent])
def get_firewall_events():
    actions = ["ALLOW", "BLOCK"]
    rules = ["Allow-HTTPS", "Block-Tor", "Allow-DNS", "Block-RDP", "Block-GeoIP"]
    protos = ["TCP", "UDP"]
    ports = [22, 80, 443, 3389, 53, 8080, 445]

    events: list[FirewallEvent] = []
    for _ in range(15):
        action = random.choice(actions)
        events.append(
            FirewallEvent(
                time=now_minus(random.randint(0, 900)),
                action=action,
                src_ip=rand_ip(True),
                dst_ip=rand_ip(False),
                port=random.choice(ports),
                proto=random.choice(protos),
                rule=random.choice(rules),
            )
        )
    return events

@app.get("/ids", response_model=List[IDSAlert])
def get_ids_alerts():
    severities = ["Critical", "High", "Medium", "Low"]
    sigs = [
        "ET TROJAN Possible RDP Brute Force",
        "ET POLICY Suspicious DNS Query",
        "ET EXPLOIT Apache Struts Attempt",
        "ET MALWARE Possible C2 Beacon",
        "ET SCAN Nmap Scripting Engine",
    ]
    protos = ["TCP", "UDP", "ICMP"]

    alerts: list[IDSAlert] = []
    for _ in range(12):
        alerts.append(
            IDSAlert(
                time=now_minus(random.randint(0, 1800)),
                severity=random.choice(severities),
                signature=random.choice(sigs),
                src_ip=rand_ip(True),
                dst_ip=rand_ip(False),
                proto=random.choice(protos),
            )
        )
    return alerts

@app.get("/top-talkers", response_model=List[TopTalker])
def get_top_talkers():
    dirs = ["Inbound", "Outbound"]
    tag_sets = [
        ["web-server", "dmz"],
        ["db-server", "internal"],
        ["vpn-gateway"],
        ["workstation"],
        ["unknown"],
    ]
    talkers: list[TopTalker] = []
    for _ in range(8):
        talkers.append(
            TopTalker(
                ip=rand_ip(True),
                direction=random.choice(dirs),
                throughput_mbps=round(random.uniform(10, 900), 1),
                flows=random.randint(50, 3000),
                tags=random.choice(tag_sets),
            )
        )
    return talkers

@app.get("/suspicious-ports", response_model=List[SuspiciousPort])
def get_suspicious_ports():
    ports = [22, 23, 445, 3389, 5900, 8080, 1433, 3306, 53, 123]
    protos = ["TCP", "UDP"]
    notes = [
        "Brute force attempts",
        "Unusual volume",
        "Exposed service",
        "Legacy protocol",
        "High scan activity",
    ]
    severities = ["Critical", "High", "Medium", "Low"]

    rows: list[SuspiciousPort] = []
    for _ in range(10):
        rows.append(
            SuspiciousPort(
                port=random.choice(ports),
                proto=random.choice(protos),
                hits=random.randint(20, 5000),
                severity=random.choice(severities),
                notes=random.choice(notes),
            )
        )
    return rows

@app.get("/health", response_model=NetworkHealth)
def get_network_health():
    blocked = random.randint(50, 800)
    critical = random.randint(0, 15)
    if critical >= 10:
        status = "Degraded"
        detail = "Multiple critical alerts active. Investigate immediately."
    elif critical >= 4:
        status = "Elevated"
        detail = "Some high‑severity alerts present. Monitor closely."
    else:
        status = "Normal"
        detail = "No major anomalies detected."
    return NetworkHealth(
        blocked_connections=blocked,
        critical_alerts=critical,
        status=status,
        status_detail=detail,
    )

@app.get("/sensor-name")
def sensor_name():
    return {"sensor": socket.gethostname()}

# ---------- SYSTEM HEALTH ENDPOINT ----------

@app.get("/system-health", response_model=SystemHealth)
def get_system_health():
    cpu = random.randint(5, 95)
    mem = random.randint(10, 90)
    disk = random.randint(20, 95)
    procs = random.randint(80, 300)

    if cpu > 85 or mem > 90 or disk > 90:
        status = "Degraded"
        detail = "Resource usage is high. Investigate performance bottlenecks."
    elif cpu > 70 or mem > 75 or disk > 80:
        status = "Elevated"
        detail = "Moderate resource pressure. Monitor closely."
    else:
        status = "Normal"
        detail = "System operating within normal parameters."

    return SystemHealth(
        cpu_usage=cpu,
        mem_usage=mem,
        disk_usage=disk,
        process_count=procs,
        status=status,
        detail=detail,
    )

# ---------- CYBER THREAT ENDPOINTS ----------

@app.get("/threats", response_model=List[ThreatIntel])
def get_threat_intel():
    severities = ["Critical", "High", "Medium", "Low"]
    types = ["Malware", "Phishing", "C2", "Exploit", "Recon"]
    sources = ["OSINT", "Commercial Feed", "Internal Sensor", "Darkweb"]
    indicators = [
        "malicious-domain.com",
        "192.0.2.10",
        "phishing-campaign-#42",
        "C2 beacon pattern",
        "Exploit kit landing page",
    ]

    items: list[ThreatIntel] = []
    for _ in range(8):
        sev = random.choice(severities)
        items.append(
            ThreatIntel(
                time=datetime.utcnow().isoformat(),
                type=random.choice(types),
                indicator=random.choice(indicators),
                severity=sev,
                source=random.choice(sources),
            )
        )
    return items

@app.get("/vulns", response_model=List[Vulnerability])
def get_vulns():
    severities = ["Critical", "High", "Medium", "Low"]
    assets = ["web-01", "db-02", "vpn-gw", "app-frontend", "legacy-host"]
    statuses = ["Unpatched", "In Progress", "Patched", "Accepted Risk"]

    vulns: list[Vulnerability] = []
    for _ in range(10):
        sev = random.choice(severities)
        vulns.append(
            Vulnerability(
                cve=f"CVE-202{random.randint(0,4)}-{random.randint(1000,9999)}",
                severity=sev,
                asset=random.choice(assets),
                status=random.choice(statuses),
            )
        )
    return vulns

# ---------- SOC CONSOLE ENDPOINTS ----------

@app.get("/alerts", response_model=List[Alert])
def get_alerts():
    severities = ["Critical", "High", "Medium", "Low"]
    messages = [
        "Multiple failed logins from external IP",
        "Suspicious PowerShell activity detected",
        "Outbound connection to known C2 domain",
        "Unusual data exfiltration pattern",
        "New admin account created outside change window",
    ]

    alerts: list[Alert] = []
    for _ in range(12):
        sev = random.choice(severities)
        alerts.append(
            Alert(
                time=now_minus(random.randint(0, 1800)),
                severity=sev,
                message=random.choice(messages),
            )
        )
    return alerts

@app.get("/soc-status", response_model=SocStatus)
def get_soc_status():
    open_incidents = random.randint(0, 25)
    active_analysts = random.randint(1, 8)
    return SocStatus(
        open_incidents=open_incidents,
        active_analysts=active_analysts,
    )
