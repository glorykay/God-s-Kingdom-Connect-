# vuln_scanner.py

import requests
from typing import List, Dict, Any

CVE_API = "https://services.nvd.nist.gov/rest/json/cves/2.0"

class VulnerabilityScanner:

    # ---------------------------------------------------------
    # MAIN FUNCTION: ENRICH NMAP RESULTS WITH CVE DATA
    # ---------------------------------------------------------
    def analyze_services(self, ports: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Takes Nmap port/service results and enriches them with CVE data.
        Each port entry becomes:
            {
                "port": 22,
                "service": "ssh",
                "version": "OpenSSH 7.9",
                "cves": [ ... ]
            }
        """
        enriched_results = []

        for entry in ports:
            service = entry.get("service")
            version = entry.get("version")

            if not service or not version:
                entry["cves"] = []
                enriched_results.append(entry)
                continue

            cve_list = self.lookup_cves(service, version)
            entry["cves"] = cve_list
            enriched_results.append(entry)

        return enriched_results

    # ---------------------------------------------------------
    # LOOKUP CVEs FROM NVD API
    # ---------------------------------------------------------
    def lookup_cves(self, service: str, version: str) -> List[Dict[str, Any]]:
        """
        Queries NVD for CVEs matching the service + version.
        Example:
            service = "openssh"
            version = "7.9"
        """
        try:
            query = f"{service} {version}"
            response = requests.get(
                CVE_API,
                params={"keywordSearch": query, "resultsPerPage": 20},
                timeout=10
            )

            if response.status_code != 200:
                return []

            data = response.json()
            return self._parse_cve_results(data)

        except Exception:
            return []

    # ---------------------------------------------------------
    # PARSE NVD API RESPONSE
    # ---------------------------------------------------------
    def _parse_cve_results(self, data: Dict[str, Any]) -> List[Dict[str, Any]]:
        """
        Converts NVD JSON into clean CVE entries:
            {
                "cve_id": "CVE-2021-12345",
                "cvss_score": 7.5,
                "description": "...",
                "exploitable": True
            }
        """
        results = []

        for item in data.get("vulnerabilities", []):
            cve = item.get("cve", {})
            metrics = cve.get("metrics", {})
            descriptions = cve.get("descriptions", [])

            # Extract CVSS score
            cvss_score = None
            if "cvssMetricV31" in metrics:
                cvss_score = metrics["cvssMetricV31"][0]["cvssData"]["baseScore"]
            elif "cvssMetricV2" in metrics:
                cvss_score = metrics["cvssMetricV2"][0]["cvssData"]["baseScore"]

            # Extract description
            description = descriptions[0]["value"] if descriptions else "No description available"

            # Exploitability heuristic
            exploitable = (cvss_score or 0) >= 7.0

            results.append({
                "cve_id": cve.get("id"),
                "cvss_score": cvss_score,
                "description": description,
                "exploitable": exploitable
            })

        return results


# ---------------------------------------------------------
# STANDALONE TEST
# ---------------------------------------------------------
if __name__ == "__main__":
    scanner = VulnerabilityScanner()

    sample_ports = [
        {"port": 22, "service": "openssh", "version": "7.9"},
        {"port": 80, "service": "apache", "version": "2.4.54"},
    ]

    enriched = scanner.analyze_services(sample_ports)
    print(enriched)
