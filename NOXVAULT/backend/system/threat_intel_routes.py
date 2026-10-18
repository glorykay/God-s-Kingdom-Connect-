from fastapi import APIRouter
from datetime import datetime
import requests

router = APIRouter(
    prefix="/threat-intel",
    tags=["Threat Intelligence"]
)

# ------------------------------------------------------------
# SAMPLE THREAT INTEL SOURCES
# ------------------------------------------------------------

THREAT_SOURCES = {
    "AlienVault OTX": "https://otx.alienvault.com/api/v1/indicators/export",
    "AbuseIPDB": "https://api.abuseipdb.com/api/v2/blacklist",
    "Spamhaus DROP": "https://www.spamhaus.org/drop/drop.txt",
    "Emerging Threats": "https://rules.emergingthreats.net/blockrules/compromised-ips.txt"
}

# ------------------------------------------------------------
# FETCH RAW FEED
# ------------------------------------------------------------

def fetch_feed(url: str):
    try:
        response = requests.get(url, timeout=10)
        response.raise_for_status()
        return response.text.splitlines()
    except Exception as e:
        return [f"Error fetching feed: {e}"]

# ------------------------------------------------------------
# NORMALIZE FEED
# ------------------------------------------------------------

def normalize_feed(lines):
    normalized = []

    for line in lines:
        line = line.strip()
        if not line or line.startswith("#"):
            continue
        normalized.append(line)

    return normalized

# ------------------------------------------------------------
# ROUTES
# ------------------------------------------------------------

@router.get("/")
def list_sources():
    """
    List available threat intelligence sources.
    """
    return {
        "timestamp": datetime.utcnow().isoformat(),
        "sources": list(THREAT_SOURCES.keys())
    }


@router.get("/source/{name}")
def get_source(name: str):
    """
    Fetch and normalize a specific threat intel feed.
    """
    if name not in THREAT_SOURCES:
        return {"error": "Unknown threat intel source"}

    url = THREAT_SOURCES[name]
    raw = fetch_feed(url)
    normalized = normalize_feed(raw)

    return {
        "source": name,
        "count": len(normalized),
        "timestamp": datetime.utcnow().isoformat(),
        "data": normalized
    }


@router.get("/all")
def get_all_sources():
    """
    Fetch and normalize all threat intel feeds.
    """
    results = {}

    for name, url in THREAT_SOURCES.items():
        raw = fetch_feed(url)
        normalized = normalize_feed(raw)
        results[name] = {
            "count": len(normalized),
            "data": normalized
        }

    return {
        "timestamp": datetime.utcnow().isoformat(),
        "feeds": results
    }
