import requests

NVD_API = "https://services.nvd.nist.gov/rest/json/cves/2.0"

def lookup_cves(service: str, version: str):
    try:
        if not service or not version:
            return []

        params = {
            "keywordSearch": f"{service} {version}",
            "resultsPerPage": 5
        }

        r = requests.get(NVD_API, params=params, timeout=8)
        data = r.json()

        if "vulnerabilities" not in data:
            return []

        results = []
        for item in data["vulnerabilities"]:
            cve = item["cve"]
            metrics = cve.get("metrics", {})

            cvss = None
            if "cvssMetricV31" in metrics:
                cvss = metrics["cvssMetricV31"][0]["cvssData"]["baseScore"]
            elif "cvssMetricV30" in metrics:
                cvss = metrics["cvssMetricV30"][0]["cvssData"]["baseScore"]
            elif "cvssMetricV2" in metrics:
                cvss = metrics["cvssMetricV2"][0]["cvssData"]["baseScore"]

            results.append({
                "id": cve["id"],
                "description": cve["descriptions"][0]["value"],
                "cvss": cvss
            })

        return results

    except Exception:
        return []
