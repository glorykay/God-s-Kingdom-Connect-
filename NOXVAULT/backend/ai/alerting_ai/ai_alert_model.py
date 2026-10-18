# backend/ai/alerting_ai/ai_alert_model.py

from pydantic import BaseModel, Field
from datetime import datetime
import random

AI_TYPES = [
    "AI Malware Prediction",
    "Anomaly Detection",
    "Behavioral Threat Score",
    "AI Lateral Movement Detection",
    "AI Privilege Escalation Prediction",
]

AI_SEVERITIES = ["Critical", "High", "Medium", "Low"]

class AIAlert(BaseModel):
    id: str = Field(..., description="Unique AI alert ID")
    timestamp: str = Field(..., description="UTC timestamp of alert generation")
    type: str = Field(..., description="AI-generated alert category")
    severity: str = Field(..., description="AI-evaluated severity level")
    description: str = Field(..., description="AI-generated alert description")
    confidence: float = Field(..., description="AI confidence score (0–1)")
    source_ip: str | None = None
    host: str | None = None
    user: str | None = None
    evaluation: str | None = None  # Added by AIAlertManager

    @staticmethod
    def generate_ai() -> "AIAlert":
        """
        Generate an AI-powered alert with confidence scoring.
        """
        return AIAlert(
            id=str(random.randint(100000, 999999)),
            timestamp=datetime.utcnow().isoformat(),
            type=random.choice(AI_TYPES),
            severity=random.choice(AI_SEVERITIES),
            description="AI‑generated security alert from NOXVAULT threat engine",
            confidence=round(random.uniform(0.55, 0.99), 2),
            source_ip=f"10.0.0.{random.randint(10, 200)}",
            host=random.choice(["AI-SENSOR-01", "AI-SENSOR-02", "AI-CORE"]),
            user=random.choice(["system", "svc-ai", "unknown"])
        )
