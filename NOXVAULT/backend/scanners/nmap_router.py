from fastapi import APIRouter
from backend.scanners.nmap_scanner import NmapScanner

router = APIRouter(prefix="/nmap", tags=["Nmap Scanner"])

@router.get("/scan")
def scan_target(target: str, ports: str = "1-1024"):
    scanner = NmapScanner()
    return scanner.scan_target(target, ports)
