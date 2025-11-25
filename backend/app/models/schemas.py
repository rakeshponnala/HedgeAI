from typing import Union, List, Optional
from pydantic import BaseModel, Field


class AnalysisRequest(BaseModel):
    """Request model for stock analysis."""

    ticker: str = Field(..., description="Stock ticker symbol", example="NVDA")


class StockMetrics(BaseModel):
    """Model for stock market metrics."""

    # Price metrics
    price: Union[float, str] = Field(..., description="Current stock price")
    price_change: Union[float, str] = Field(..., description="Price change today")
    price_change_pct: Union[float, str] = Field(..., description="Price change percentage")
    prev_close: Union[float, str] = Field(..., description="Previous close price")
    week_52_high: Union[float, str] = Field(..., description="52-week high")
    week_52_low: Union[float, str] = Field(..., description="52-week low")
    pct_from_high: Union[float, str] = Field(..., description="Percentage from 52-week high")

    # Valuation metrics
    market_cap: str = Field(..., description="Market capitalization")
    pe_ratio: Union[float, str] = Field(..., description="Trailing P/E ratio")
    forward_pe: Union[float, str] = Field(..., description="Forward P/E ratio")

    # Volume & Volatility
    volume_vs_avg: Union[float, str] = Field(..., description="Volume vs average percentage")
    beta: Union[float, str] = Field(..., description="Beta (volatility vs market)")

    # Risk indicators
    short_percent: Union[float, str] = Field(..., description="Short interest as % of float")
    debt_to_equity: Union[float, str] = Field(..., description="Debt to equity ratio")
    current_ratio: Union[float, str] = Field(..., description="Current ratio (liquidity)")

    # Growth metrics
    profit_margin: Union[float, str] = Field(..., description="Profit margin percentage")
    revenue_growth: Union[float, str] = Field(..., description="Revenue growth percentage")
    earnings_growth: Union[float, str] = Field(..., description="Earnings growth percentage")

    # Analyst sentiment
    target_price: Union[float, str] = Field(..., description="Analyst target price")
    target_upside: Union[float, str] = Field(..., description="Upside to target price %")
    recommendation: str = Field(..., description="Analyst recommendation")


class NewsItem(BaseModel):
    """Model for a news article."""

    title: str = Field(..., description="News headline")
    source: str = Field(..., description="News source")
    url: Optional[str] = Field(None, description="Article URL")


class AnalysisResponse(BaseModel):
    """Response model for stock analysis."""

    ticker: str = Field(..., description="Stock ticker symbol")
    company_name: str = Field(..., description="Company name")
    rating: str = Field(..., description="Risk rating: BEARISH or NEUTRAL")
    metrics: StockMetrics = Field(..., description="Stock market metrics")
    news: List[NewsItem] = Field(..., description="Recent news articles")
    analysis: str = Field(..., description="AI-generated risk assessment")
    generated_at: str = Field(..., description="Timestamp of analysis")


class HealthResponse(BaseModel):
    """Response model for health check."""

    status: str = Field(..., description="API status")
    message: str = Field(..., description="Status message")
    version: str = Field(..., description="API version")
