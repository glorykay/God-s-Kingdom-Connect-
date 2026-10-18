# backend/api/router.py

from fastapi import APIRouter, Query

# Correct imports based on your folder structure
from .ip_reputation import get_ip_reputation
from .malware_campaigns import get_malware_campaigns
from .botnet_c2 import get_botnet_c2
from .darkweb_leaks import get_darkweb_leaks
from .geo_threats import get_geo_threats

router = APIRouter(prefix="/api", tags=["Threat Intelligence API"])


@router.get("/ip-reputation")
def ip_reputation(ip: str = Query(..., description="IP address to check")):
    return get_ip_reputation(ip)


@router.get("/malware-campaigns")
def malware_campaigns():
    return get_malware_campaigns()


@router.get("/botnet-c2")
def botnet_c2():
    return get_botnet_c2()


@router.get("/darkweb-leaks")
def darkweb_leaks(email: str | None = Query(None, description="Optional email to check for leaks")):
    return get_darkweb_leaks(email=email)


@router.get("/geo-threats")
def geo_threats():
    return get_geo_threats()
