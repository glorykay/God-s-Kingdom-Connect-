# shodan.py

import requests
from typing import Dict, Any, List

SHODAN_API_URL = "https://api.shodan.io/shodan/host/"

class ShodanScanner:
    def __init__(self, api_key: str):
        self.api_key = api_key

    def lookup_host(self, ip: str) -> Dict[str, Any]:
        """
        Queries Shodan for host exposure.
        Returns:
            {
                "ip": "...",
                "ports": [...],
                "hostnames": [...],
                "org": "...",
                "data": [... raw banners ...]
            }
        """
        try:
            response = requests.get(
                f"{SHODAN_API_URL}{ip}",
                params={"key": self.api_key},
                timeout=10
            )
            if response.status_code != 200:
                return {"error": response.text}

            return self._parse_shodan(response.json())

        except Exception as e:
            return {"error": str(e)}

    def _parse_shodan(self, data: Dict[str, Any]) -> Dict[str, Any]:
        return {
            "ip": data.get("ip_str"),
            "ports": data.get("ports", []),
            "hostnames": data.get("hostnames", []),
            "org": data.get("org"),
            "data": [
                {
                    "port": item.get("port"),
                    "product": item.get("product"),
                    "version": item.get("version"),
                    "banner": item.get("data")
                }
                for item in data.get("data", [])
            ]
        }


if __name__ == "__main__":
    scanner = ShodanScanner(api_key="YOUR_API_KEY")
    print(scanner.lookup_host("8.8.8.8"))
