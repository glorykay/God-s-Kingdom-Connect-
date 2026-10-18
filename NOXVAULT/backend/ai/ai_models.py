from pydantic import BaseModel
from typing import List, Optional


class AIAttackPath(BaseModel):
    source_ip: str
    target_asset: str
    technique: str
    likelihood: str
    description: Optional[str] = None


class AIRecommendation(BaseModel):
    title: str
    severity: str
    category: str
    actions: List[str]


class AIAnalyzeRequest(BaseModel):
    ports: List[int]
    services: List[str]
    cves: List[str]
    firewall_events: List[dict]
    assets: List[dict]
    threat_intel: List[dict]


class AIAnalyzeResponse(BaseModel):
    summary: str
    overall_risk: str
    key_findings: List[str]
    attack_paths: List[AIAttackPath]
    recommendations: List[AIRecommendation]
