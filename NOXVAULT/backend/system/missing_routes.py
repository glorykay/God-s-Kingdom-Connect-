# backend/missing_routes.py

from fastapi import APIRouter
from datetime import datetime
from typing import List, Dict, Any

router = APIRouter(
    prefix="/missing",
    tags=["Missing Routes"]
)

# =========================================================
# STATIC LIST OF PLANNED / MISSING FEATURES
# =========================================================
MISSING_ENDPOINTS: List[Dict[str, Any]] = [
    {
        "path": "/ai/analyze-attack-path",
        "method": "POST",
        "module": "ai",
        "status": "planned",
        "description": "Advanced attack path simulation using AI and multi-source correlation.",
        "priority": "High"
    },
    {
        "path": "/malware/scan",
        "method": "POST",
        "module": "malware",
        "status": "planned",
        "description": "Deep malware behavior scan and correlation with threat intel.",
        "priority": "High"
    },
    {
        "path": "/assets/discovery",
        "method": "GET",
        "module": "assets",
        "status": "planned",
        "description": "Active asset discovery across subnets and cloud environments.",
        "priority": "Medium"
    },
    {
        "path": "/reports/export",
        "method": "GET",
        "module": "reports",
        "status": "planned",
        "description": "Export NOXVAULT dashboards and audits to PDF/CSV.",
        "priority": "Low"
    },
    {
        "path": "/users/activity",
        "method": "GET",
        "module": "identity",
        "status": "planned",
        "description": "User activity and anomaly detection for identity security.",
        "priority": "Medium"
    }
]


# =========================================================
# LIST ALL MISSING / PLANNED ROUTES
# =========================================================
@router.get("/")
def list_missing_routes():
    """
    Returns a list of missing/planned routes for NOXVAULT.
    Useful for:
        - Roadmap tracking
        - Frontend stubs
        - Documentation
    """

    return {
        "timestamp": datetime.utcnow().isoformat(),
        "count": len(MISSING_ENDPOINTS),
        "missing_endpoints": MISSING_ENDPOINTS
    }


# =========================================================
# FILTER BY MODULE
# =========================================================
@router.get("/module/{module_name}")
def list_missing_by_module(module_name: str):
    """
    Returns missing routes filtered by module name.
    Example:
        /missing/module/ai
        /missing/module/malware
    """

    filtered = [
        ep for ep in MISSING_ENDPOINTS
        if ep["module"].lower() == module_name.lower()
    ]

    return {
        "timestamp": datetime.utcnow().isoformat(),
        "module": module_name,
        "count": len(filtered),
        "missing_endpoints": filtered
    }


# =========================================================
# FILTER BY PRIORITY
# =========================================================
@router.get("/priority/{priority}")
def list_missing_by_priority(priority: str):
    """
    Returns missing routes filtered by priority:
        - High
        - Medium
        - Low
    """

    filtered = [
        ep for ep in MISSING_ENDPOINTS
        if ep["priority"].lower() == priority.lower()
    ]

    return {
        "timestamp": datetime.utcnow().isoformat(),
        "priority": priority,
        "count": len(filtered),
        "missing_endpoints": filtered
    }
