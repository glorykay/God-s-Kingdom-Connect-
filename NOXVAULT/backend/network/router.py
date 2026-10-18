from fastapi import APIRouter

router = APIRouter(prefix="/api", tags=["network"])

@router.get("/network-audit")
def network_audit():
    return {"status": "ok", "message": "Network audit working"}
