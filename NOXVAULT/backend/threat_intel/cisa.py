# cisa.py

import requests
from typing import List, Dict, Any

CISA_KEV_URL = "https://www.cisa.gov/sites/default/files/feeds/known_exploited_vulnerabilities.json"

class CISAFeed:

    def fetch_kev(self) -> List[Dict[str, Any]]:
        """
        Fetches the CISA Known Exploited Vulnerabilities (KEV) list.
        Returns a list of:
            {
                "cve_id": "CVE-2021-12345",
                "vendor": "...",
                "product": "...",
                "date_added": "...",
                "short_description": "..."
            }
        """
        try:
            response = requests.get(CISA_KEV_URL, timeout=10)
            response.raise_for_status()
            data = response.json()
            return self._parse_kev(data)
        except Exception:
            return []

    def _parse_kev(self, data: Dict[str, Any]) -> List[Dict[str, Any]]:
        results = []

        for item in data.get("vulnerabilities", []):
            results.append({
                "cve_id": item.get("cveID"),
                "vendor": item.get("vendorProject"),
                "product": item.get("product"),
                "date_added": item.get("dateAdded"),
                "short_description": item.get("shortDescription")
            })

        return results


if __name__ == "__main__":
    feed = CISAFeed()
    print(feed.fetch_kev())
