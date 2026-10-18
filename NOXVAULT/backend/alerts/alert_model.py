# backend/agents/alerts/alert_model.py

from pydantic import BaseModel, Field
from datetime import datetime
import random

ALERT_TYPES = [
    "Malware Detected",
    "Unauthorized Login",
    "Suspicious Traffic",
    "Firewall Rule Triggered",
    "High CPU Usage",
    "Configuration Change",
]

SEVERITIES = ["Critical", "High", "Medium", "Low"]

class Alert(BaseModel):
    id: str = Field(..., description="Unique alert ID")
    timestamp: str = Field(..., description="UTC timestamp of alert generation")
    type: str = Field(..., description="Alert category")
    severity: str = Field(..., description="Severity level")
    description: str = Field(..., description="Alert description")
    source_ip: str | None = None
    host: str | None = None
    user: str | None = None
    evaluation: str | None = None  # Added by AlertManager

    @staticmethod
    def generate() -> "Alert":
        """
        Generate a system alert with realistic fields.
        """
        return Alert(
            id=str(random.randint(10000, 99999)),
            timestamp=datetime.utcnow().isoformat() + "Z",
            type=random.choice(ALERT_TYPES),
            severity=random.choice(SEVERITIES),
            description="System-generated alert from NOXVAULT engine",
            source_ip=f"192.168.10.{random.randint(10, 200)}",
            host=random.choice(["WIN-SERVER-01", "AUTH-SERVER", "WEB-GATEWAY", "APP-SERVER-02"]),
            user=random.choice(["SYSTEM", "svc-app", "proxy", "unknown"])
        )
