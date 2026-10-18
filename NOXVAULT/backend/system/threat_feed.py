from fastapi import APIRouter
import requests
from datetime import datetime

router = APIRouter(
    prefix="/threat-feed",
    tags=["Threat Intelligence Feed"]
)

# ------------------------------------------------------------
# EXTERNAL THREAT FEED SOURCES
# ------------------------------------------------------------

THREAT_FEEDS = {
    "AlienVault OTX": "https://otx.alienvault.com/api/v1/indicators/export",
    "AbuseIPDB": "https://api.abuseipdb.com/api/v2/blacklist",
    "Spamhaus DROP": "https://www.spamhaus.org/drop/drop.txt",
    "Emerging Threats": "https://rules.emergingthreats.net/blockrules/compromised-ips.txt"
}

# ------------------------------------------------------------
# FETCH FEED
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
# API ROUTES
# ------------------------------------------------------------

@router.get("/")
def list_feeds():
    """
    Returns available threat feed sources.
    """
    return {
        "timestamp": datetime.utcnow().isoformat(),
        "feeds": list(THREAT_FEEDS.keys())
    }


@router.get("/fetch/{feed_name}")
def fetch_specific_feed(feed_name: str):
    """
    Fetches and normalizes a specific threat feed.
    """
    if feed_name not in THREAT_FEEDS:
        return {"error": "Unknown feed name"}

    url = THREAT_FEEDS[feed_name]
    raw_data = fetch_feed(url)
    normalized = normalize_feed(raw_data)

    return {
        "feed": feed_name,
        "count": len(normalized),
        "timestamp": datetime.utcnow().isoformat(),
        "data": normalized
    }


@router.get("/all")
def fetch_all_feeds():
    """
    Fetches and normalizes all threat feeds.
    """
    results = {}

    for name, url in THREAT_FEEDS.items():
        raw_data = fetch_feed(url)
        normalized = normalize_feed(raw_data)

        results[name] = {
            "count": len(normalized),
            "data": normalized
        }

    return {
        "timestamp": datetime.utcnow().isoformat(),
        "feeds": results
    }
