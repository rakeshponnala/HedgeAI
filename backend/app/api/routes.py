from fastapi import APIRouter, HTTPException

from app.core.config import settings
from app.models.schemas import AnalysisResponse, HealthResponse
from app.services.analysis_service import AnalysisService

router = APIRouter()

# Initialize service
try:
    analysis_service = AnalysisService()
    print("[API] Analysis service loaded successfully")
except Exception as e:
    print(f"[API] Failed to initialize analysis service: {e}")
    analysis_service = None


@router.get("/", response_model=HealthResponse, tags=["Health"])
async def health_check():
    """
    Health check endpoint.

    Returns the current status of the API.
    """
    return HealthResponse(
        status="active",
        message="HedgeAI API is online",
        version=settings.API_VERSION
    )


@router.get(
    "/api/analyze/{ticker}",
    response_model=AnalysisResponse,
    tags=["Analysis"]
)
async def analyze_stock(ticker: str):
    """
    Analyze a stock for investment risks.

    Args:
        ticker: Stock ticker symbol (e.g., NVDA, TSLA, AAPL)

    Returns:
        AI-generated risk assessment memo
    """
    if not analysis_service:
        raise HTTPException(
            status_code=503,
            detail="Analysis service unavailable. Check API key configuration."
        )

    ticker = ticker.upper().strip()

    if not ticker or len(ticker) > 10:
        raise HTTPException(
            status_code=400,
            detail="Invalid ticker symbol"
        )

    print(f"[API] Analysis request received: {ticker}")

    try:
        report = analysis_service.analyze(ticker)
        return AnalysisResponse(ticker=ticker, analysis=report)

    except RuntimeError as e:
        raise HTTPException(status_code=500, detail=str(e))

    except Exception as e:
        print(f"[API] Unexpected error: {e}")
        raise HTTPException(
            status_code=500,
            detail="An unexpected error occurred during analysis"
        )
