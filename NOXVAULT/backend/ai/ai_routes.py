from fastapi import APIRouter, HTTPException
from backend.ai.ai_models import (
    AIAnalyzeRequest,
    AIAnalyzeResponse,
    AIAttackPath,
    AIRecommendation,
)
from backend.ai.ai_service import analyze_security

router = APIRouter(
    prefix="/ai",
    tags=["AI Engine"],
)

@router.post("/analyze", response_model=AIAnalyzeResponse)
async def analyze(payload: AIAnalyzeRequest):
    try:
        result = analyze_security(payload)

        return AIAnalyzeResponse(
            summary=result.get("summary", "No summary provided"),
            overall_risk=result.get("overall_risk", "unknown"),
            key_findings=result.get("key_findings", []),
            attack_paths=[
                AIAttackPath(**ap) for ap in result.get("attack_paths", [])
            ],
            recommendations=[
                AIRecommendation(**rec) for rec in result.get("recommendations", [])
            ],
        )

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"AI analysis failed: {str(e)}",
        )
