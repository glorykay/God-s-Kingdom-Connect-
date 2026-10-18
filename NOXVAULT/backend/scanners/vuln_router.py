from fastapi import APIRouter
from backend.scanners.vuln_scanner import VulnerabilityScanner

router = APIRouter(prefix="/vuln", tags=["Vulnerability Scanner"])

@router.post("/analyze")
def analyze_ports(ports: list):
    """
    Accepts Nmap port results and enriches them with CVE data.
    Example input:
    [
        {"port": 22, "service": "openssh", "version": "7.9"},
        {"port": 80, "service": "apache", "version": "2.4.54"}
    ]
    """
    scanner = VulnerabilityScanner()
    return scanner.analyze_services(ports)
