from fastapi import APIRouter, WebSocket
from datetime import datetime
import asyncio
import nmap
import requests

router = APIRouter()

NVD_API = "https://services.nvd.nist.gov/rest/json/cves/2.0?keywordSearch="

def lookup_cves(service_name, version):
    try:
        query = f"{service_name} {version}"
        url = NVD_API + query
        res = requests.get(url, timeout=5).json()

        cves = []
        for item in res.get("vulnerabilities", []):
            cve_id = item["cve"]["id"]
            metrics = item["cve"].get("metrics", {})
            cvss_list = metrics.get("cvssMetricV31") or metrics.get("cvssMetricV30") or []
            base_score = cvss_list[0]["cvssData"]["baseScore"] if cvss_list else 0.0

            cves.append({
                "cve": cve_id,
                "cvss": base_score,
                "exploitable": False  # will be updated
            })

        return cves

    except:
        return []

def lookup_exploits(cve_id: str) -> bool:
    """
    Placeholder exploit detection.

    In a real setup you would:
    - Call ExploitDB / Vulners / Metasploit API
    - Search by CVE ID
    - Return True if exploit exists
    """
    # Simple heuristic: treat some CVEs as exploitable
    high_risk_prefixes = ("CVE-2024-1", "CVE-2023-1", "CVE-2022-1")
    return cve_id.startswith(high_risk_prefixes)

@router.websocket("/ws/vuln-scan")
async def vuln_scan_ws(websocket: WebSocket):
    await websocket.accept()

    nm = nmap.PortScanner()

    while True:
        target_ip = "192.168.1.122"  # later: make this dynamic from frontend

        await websocket.send_json({
            "status": "starting",
            "target_ip": target_ip,
            "timestamp": datetime.utcnow().isoformat()
        })

        # Run Nmap scan with service + OS detection
        nm.scan(target_ip, arguments="-sV -O")

        host_data = nm[target_ip]

        open_ports = []
        all_cves = []

        if "tcp" in host_data:
            for port, info in host_data["tcp"].items():
                if info["state"] != "open":
                    continue

                service = info.get("name", "unknown")
                version = info.get("version", "unknown")

                open_ports.append({
                    "port": port,
                    "service": service,
                    "version": version
                })

                cves = lookup_cves(service, version)

                # Mark exploitable CVEs
                for cve in cves:
                    cve["exploitable"] = lookup_exploits(cve["cve"])

                all_cves.extend(cves)

                await websocket.send_json({
                    "status": "port_detected",
                    "port": port,
                    "service": service,
                    "version": version,
                    "cves_found": len(cves),
                    "exploitable_count": sum(1 for c in cves if c["exploitable"])
                })

        # OS detection
        os_match = host_data.get("osmatch", [])
        os_name = os_match[0]["name"] if os_match else "Unknown"

        # Risk score: CVSS + exploit weighting
        risk_score = 0.0
        for cve in all_cves:
            base = cve["cvss"]
            if cve["exploitable"]:
                base *= 1.5  # boost exploitable CVEs
            risk_score += base

        risk_level = (
            "Critical" if risk_score >= 60 else
            "High" if risk_score >= 35 else
            "Medium" if risk_score >= 15 else
            "Low"
        )

        final_payload = {
            "timestamp": datetime.utcnow().isoformat(),
            "target_ip": target_ip,
            "os": os_name,
            "open_ports": open_ports,
            "cves": all_cves,
            "risk_score": risk_score,
            "risk_level": risk_level,
            "exploitable_count": sum(1 for c in all_cves if c["exploitable"])
        }

        await websocket.send_json(final_payload)
        await asyncio.sleep(10)
