# nmap_scanner.py

import nmap
from typing import List, Dict, Any

class NmapScanner:
    def __init__(self):
        self.scanner = nmap.PortScanner()

    # ---------------------------------------------------------
    # RUN NMAP SCAN
    # ---------------------------------------------------------
    def scan_target(self, target_ip: str, ports: str = "1-1024") -> Dict[str, Any]:
        """
        Runs an Nmap scan on the target IP.
        Includes:
            - Port scan
            - Service detection
            - Version detection
        """

        try:
            self.scanner.scan(
                hosts=target_ip,
                arguments=f"-sV -p {ports}"
            )
        except Exception as e:
            return {"error": str(e)}

        return self._parse_results(target_ip)

    # ---------------------------------------------------------
    # PARSE NMAP RESULTS
    # ---------------------------------------------------------
    def _parse_results(self, target_ip: str) -> Dict[str, Any]:
        """
        Converts raw Nmap output into clean JSON for NOXVAULT.
        """

        if target_ip not in self.scanner.all_hosts():
            return {"error": "Target not found in scan results"}

        host_data = self.scanner[target_ip]
        ports_output: List[Dict[str, Any]] = []

        if "tcp" in host_data:
            for port, info in host_data["tcp"].items():
                ports_output.append({
                    "port": port,
                    "state": info.get("state", "unknown"),
                    "service": info.get("name", None),
                    "version": info.get("version", None),
                    "product": info.get("product", None),
                    "extrainfo": info.get("extrainfo", None)
                })

        return {
            "target": target_ip,
            "status": host_data.get("status", {}).get("state", "unknown"),
            "ports": ports_output,
            "os_guess": self._extract_os_guess(host_data)
        }

    # ---------------------------------------------------------
    # OS FINGERPRINTING (BASIC)
    # ---------------------------------------------------------
    def _extract_os_guess(self, host_data: Dict[str, Any]) -> str:
        """
        Extracts OS guess if available.
        """
        if "osmatch" in host_data and host_data["osmatch"]:
            return host_data["osmatch"][0].get("name", "Unknown OS")

        return "Unknown OS"


# ---------------------------------------------------------
# STANDALONE TEST
# ---------------------------------------------------------
if __name__ == "__main__":
    scanner = NmapScanner()
    result = scanner.scan_target("127.0.0.1", ports="1-1000")
    print(result)
