# otx.py

import requests
from typing import List, Dict, Any

OTX_API_URL = "https://otx.alienvault.com/api/v1/indicators"

class OTXFeed:
    def __init__(self, api_key: str):
        self.api_key = api_key

    def lookup_ip(self, ip: str) -> List[Dict[str, Any]]:
        """
        Fetches threat intel indicators for an IP.
        Returns:
            [
                {
                    "indicator": "...",
                    "type": "IPv4",
                    "pulse_count": 3,
                    "references": [...],
                    "malicious": True
                }
            ]
        """
        try:
            response = requests.get(
                f"{OTX_API_URL}/IPv4/{ip}/general",
                headers={"X-OTX-API-KEY": self.api_key},
                timeout=10
            )

            if response.status_code != 200:
                return []

            return self._parse_otx(response.json())

        except Exception:
            return []

    def _parse_otx(self, data: Dict[str, Any]) -> List[Dict[str, Any]]:
        pulses = data.get("pulse_info", {}).get("pulses", [])
        results = []

        for pulse in pulses:
            results.append({
                "indicator": data.get("indicator"),
                "type": data.get("type"),
                "pulse_name": pulse.get("name"),
                "pulse_count": len(pulses),
                "references": pulse.get("references", []),
                "malicious": True
            })

        return results


if __name__ == "__main__":
    feed = OTXFeed(api_key="YOUR_API_KEY")
    print(feed.lookup_ip("8.8.8.8"))
