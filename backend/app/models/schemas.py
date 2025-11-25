from typing import Union, List
from pydantic import BaseModel, Field


class AnalysisRequest(BaseModel):
    """Request model for stock analysis."""

    ticker: str = Field(..., description="Stock ticker symbol", example="NVDA")


class StockData(BaseModel):
    """Model for retrieved stock data."""

    price: Union[float, str]
    news: List[str]


class AnalysisResponse(BaseModel):
    """Response model for stock analysis."""

    ticker: str = Field(..., description="Stock ticker symbol")
    analysis: str = Field(..., description="AI-generated risk assessment")


class HealthResponse(BaseModel):
    """Response model for health check."""

    status: str = Field(..., description="API status")
    message: str = Field(..., description="Status message")
    version: str = Field(..., description="API version")
