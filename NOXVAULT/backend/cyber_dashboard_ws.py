from fastapi import FastAPI, WebSocket
from fastapi.middleware.cors import CORSMiddleware
import asyncio
import random
from datetime import datetime

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.websocket("/ws/noxvault-console")
async def websocket_stream(websocket: WebSocket):
    await websocket.accept()

    while True:

        # ==========================
        # ASSET INVENTORY
        # ==========================
        asset_os_distribution = {
            "Windows": random.randint(50, 200),
            "Linux": random.randint(30, 150),
            "macOS": random.randint(20, 100),
            "Android": random.randint(40, 120),
            "iOS": random.randint(30, 90)
        }

        asset_geo_distribution = {
            "US": random.randint(50, 200),
            "EU": random.randint(40, 150),
            "Asia": random.randint(30, 120),
            "Africa": random.randint(10, 60),
            "South America": random.randint(20, 80)
        }

        asset_hardware = [
            {"name": "Dell Latitude", "models": 12, "assets": random.randint(20, 80)},
            {"name": "HP ProBook", "models": 8, "assets": random.randint(15, 60)},
            {"name": "MacBook Pro", "models": 5, "assets": random.randint(10, 40)},
        ]

        asset_endpoint_assignment = {
            "Workstations": random.randint(50, 200),
            "Servers": random.randint(20, 80),
            "Mobile Devices": random.randint(40, 150)
        }

        asset_unmanaged = random.randint(5, 25)

        # ==========================
        # THREAT INTELLIGENCE
        # ==========================
        threat_events = [
            {
                "ts": datetime.utcnow().isoformat(),
                "source": f"IP-{random.randint(10, 255)}.{random.randint(10, 255)}",
                "severity": random.choice(["Critical", "High", "Medium", "Low"]),
                "description": random.choice([
                    "Suspicious login attempt",
                    "Malware signature detected",
                    "Firewall rule triggered",
                    "Unauthorized access attempt"
                ])
            }
            for _ in range(5)
        ]

        threat_summary = {
            "critical": random.randint(0, 5),
            "high": random.randint(1, 10),
            "medium": random.randint(5, 15),
            "low": random.randint(10, 20)
        }

        # ==========================
        # VULNERABILITY MANAGEMENT
        # ==========================
        vuln_counts = {
            "critical": random.randint(0, 10),
            "high": random.randint(5, 20),
            "medium": random.randint(10, 30),
            "low": random.randint(20, 40)
        }

        vuln_trend = {
            "last_7_days": [random.randint(5, 20) for _ in range(7)]
        }

        # ==========================
        # FIREWALL ANALYTICS
        # ==========================
        firewall_stats = {
            "blocked": random.randint(50, 200),
            "allowed": random.randint(200, 500),
            "suspicious": random.randint(20, 80)
        }

        firewall_top_rules = [
            {"rule": "Block SSH Brute Force", "hits": random.randint(50, 200)},
            {"rule": "Allow HTTPS", "hits": random.randint(200, 500)},
            {"rule": "Block TOR Exit Nodes", "hits": random.randint(30, 120)}
        ]

        # ==========================
        # SYSTEM HEALTH
        # ==========================
        system_health = {
            "cpu": random.randint(10, 90),
            "memory": random.randint(20, 95),
            "disk": random.randint(30, 90),
            "status": random.choice(["Healthy", "Warning", "Critical"])
        }

        # ==========================
        # FINAL PAYLOAD
        # ==========================
        payload = {
            "timestamp": datetime.utcnow().isoformat(),

            # Assets
            "asset_os_distribution": asset_os_distribution,
            "asset_geo_distribution": asset_geo_distribution,
            "asset_hardware": asset_hardware,
            "asset_endpoint_assignment": asset_endpoint_assignment,
            "asset_unmanaged": asset_unmanaged,

            # Threats
            "threat_events": threat_events,
            "threat_summary": threat_summary,

            # Vulnerabilities
            "vuln_counts": vuln_counts,
            "vuln_trend": vuln_trend,

            # Firewall
            "firewall_stats": firewall_stats,
            "firewall_top_rules": firewall_top_rules,

            # System Health
            "system_health": system_health,
        }

        await websocket.send_json(payload)
        await asyncio.sleep(5)
