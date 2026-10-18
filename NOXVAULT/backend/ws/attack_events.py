from fastapi import APIRouter
from datetime import datetime
import random

router = APIRouter()

# ---------------------------------------------
# Realistic country → lat/lon mapping
# ---------------------------------------------
COUNTRY_COORDS = {
    "United States": (37.0902, -95.7129),
    "China": (35.8617, 104.1954),
    "Russia": (61.5240, 105.3188),
    "Germany": (51.1657, 10.4515),
    "Brazil": (-14.2350, -51.9253),
    "France": (46.2276, 2.2137),
    "India": (20.5937, 78.9629),
    "United Kingdom": (55.3781, -3.4360),
    "Japan": (36.2048, 138.2529),
    "South Africa": (-30.5595, 22.9375),
}

ATTACK_TYPES = ["incoming", "outgoing", "blocked"]
SEVERITIES = ["low", "medium", "high", "critical"]

def random_ip():
    return f"{random.randint(1,255)}.{random.randint(0,255)}.{random.randint(0,255)}.{random.randint(1,254)}"

def generate_real_event():
    src_country = random.choice(list(COUNTRY_COORDS.keys()))
    dst_country = random.choice(list(COUNTRY_COORDS.keys()))

    src_lat, src_lon = COUNTRY_COORDS[src_country]
    dst_lat, dst_lon = COUNTRY_COORDS[dst_country]

    return {
        "type": random.choice(ATTACK_TYPES),
        "src_lat": src_lat + random.uniform(-1.5, 1.5),
        "src_lon": src_lon + random.uniform(-1.5, 1.5),
        "dst_lat": dst_lat + random.uniform(-1.5, 1.5),
        "dst_lon": dst_lon + random.uniform(-1.5, 1.5),

        "src_ip": random_ip(),
        "dst_ip": random_ip(),

        "src_country": src_country,
        "dst_country": dst_country,

        "severity": random.choice(SEVERITIES),
        "ts": datetime.utcnow().isoformat(),
    }

@router.get("/attack/events")
def attack_events():
    # Return 25 realistic events
    return [generate_real_event() for _ in range(25)]
