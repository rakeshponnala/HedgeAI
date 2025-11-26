from anthropic import Anthropic
from datetime import datetime
import re

from app.core.config import settings
from app.core.logging_config import get_logger
from app.services.data_service import DataService

logger = get_logger(__name__)


class AnalysisService:
    """Service for AI-powered stock risk analysis."""

    SYSTEM_PROMPT = """You are a senior risk analyst at a top-tier hedge fund. Your role is to protect capital by identifying downside risks that retail investors typically overlook.

Your analysis style:
- Data-driven and factual
- Skeptical of hype and momentum
- Focus on what could go wrong
- Clear, structured formatting
- Always cite the specific news sources provided

CRITICAL DATA ACCURACY RULES:
- ONLY use the EXACT numbers provided in the data above. Do NOT make up, estimate, or hallucinate any figures.
- When citing a metric, use the precise value given (e.g., if P/E is 45.23, say "45.23" not "around 45" or "approximately 45")
- If a metric shows "N/A", acknowledge it is unavailable rather than guessing
- Do NOT invent statistics, percentages, or financial figures that are not explicitly provided
- Reference news headlines exactly as provided - do not paraphrase or add details not in the headline

You do NOT provide bullish recommendations. Your job is risk identification only."""

    USER_PROMPT_TEMPLATE = """
Analyze {ticker} ({company_name}) for investment risks.

═══════════════════════════════════════════════════════════
PRICE & TRADING DATA
═══════════════════════════════════════════════════════════
• Current Price: ${price}
• Today's Change: {price_change_direction}${abs_price_change} ({price_change_pct}%)
• Previous Close: ${prev_close}
• 52-Week High: ${week_52_high}
• 52-Week Low: ${week_52_low}
• Distance from 52-Week High: {pct_from_high}%
• Volume vs Average: {volume_vs_avg}%

═══════════════════════════════════════════════════════════
VALUATION METRICS
═══════════════════════════════════════════════════════════
• Market Cap: {market_cap}
• Trailing P/E: {pe_ratio}
• Forward P/E: {forward_pe}

═══════════════════════════════════════════════════════════
RISK INDICATORS (Critical for hedge fund analysis)
═══════════════════════════════════════════════════════════
• Beta (Volatility): {beta} (>1 = more volatile than market)
• Short Interest: {short_percent}% of float (>10% = high bearish sentiment)
• Debt/Equity: {debt_to_equity} (>100 = highly leveraged)
• Current Ratio: {current_ratio} (<1 = liquidity risk)

═══════════════════════════════════════════════════════════
GROWTH & PROFITABILITY
═══════════════════════════════════════════════════════════
• Profit Margin: {profit_margin}%
• Revenue Growth: {revenue_growth}%
• Earnings Growth: {earnings_growth}%

═══════════════════════════════════════════════════════════
ANALYST SENTIMENT
═══════════════════════════════════════════════════════════
• Analyst Target: ${target_price} ({target_upside}% upside)
• Consensus: {recommendation}

═══════════════════════════════════════════════════════════
RECENT NEWS (Cite these sources in your analysis)
═══════════════════════════════════════════════════════════
{news}

═══════════════════════════════════════════════════════════
TASK: Generate a Risk Assessment
═══════════════════════════════════════════════════════════

IMPORTANT: Only cite the EXACT numbers from the data above. Do not round, estimate, or invent any figures.

Provide your analysis in this EXACT format:

**SUMMARY**
[2-3 sentences summarizing the current situation and key concern. Use exact figures from above.]

**KEY RISKS**

1. **[Risk Title]**
[Explanation citing specific data or news source with exact numbers]

2. **[Risk Title]**
[Explanation citing specific data or news source with exact numbers]

3. **[Risk Title]**
[Explanation based on metrics or news with exact numbers]

**VERDICT: [BEARISH or NEUTRAL]**
[1-2 sentence conclusion explaining the rating]
"""

    def __init__(self):
        """Initialize the analysis service with Anthropic client."""
        if not settings.ANTHROPIC_API_KEY:
            raise ValueError(
                "Missing API Key. Please add ANTHROPIC_API_KEY to your .env file."
            )

        self.client = Anthropic(api_key=settings.ANTHROPIC_API_KEY)
        self.model = settings.AI_MODEL_NAME
        self.data_service = DataService()

        logger.info(f"[AnalysisService] Initialized with model: {self.model}")

    def analyze(self, ticker: str) -> dict:
        """
        Perform AI-powered risk analysis on a stock.

        Args:
            ticker: Stock ticker symbol

        Returns:
            Dictionary with structured analysis data
        """
        # Fetch real-time data
        data = self.data_service.fetch_stock_data(ticker)

        # Determine price direction
        try:
            price_change = float(data["price_change"])
            price_change_direction = "+" if price_change >= 0 else "-"
            abs_price_change = abs(price_change)
        except:
            price_change_direction = ""
            abs_price_change = data["price_change"]

        # Construct prompt with real data
        user_message = self.USER_PROMPT_TEMPLATE.format(
            ticker=ticker,
            company_name=data["company_name"],
            price=data["price"],
            price_change_direction=price_change_direction,
            abs_price_change=abs_price_change,
            price_change_pct=data["price_change_pct"],
            prev_close=data["prev_close"],
            week_52_high=data["week_52_high"],
            week_52_low=data["week_52_low"],
            pct_from_high=data["pct_from_high"],
            market_cap=data["market_cap"],
            pe_ratio=data["pe_ratio"],
            forward_pe=data["forward_pe"],
            volume_vs_avg=data["volume_vs_avg"],
            beta=data["beta"],
            short_percent=data["short_percent"],
            debt_to_equity=data["debt_to_equity"],
            current_ratio=data["current_ratio"],
            profit_margin=data["profit_margin"],
            revenue_growth=data["revenue_growth"],
            earnings_growth=data["earnings_growth"],
            target_price=data["target_price"],
            target_upside=data["target_upside"],
            recommendation=data["recommendation"],
            news=data["news"]
        )

        logger.info(f"[AnalysisService] Sending request to {self.model}...")

        try:
            response = self.client.messages.create(
                model=self.model,
                max_tokens=settings.AI_MAX_TOKENS,
                temperature=settings.AI_TEMPERATURE,
                system=self.SYSTEM_PROMPT,
                messages=[{"role": "user", "content": user_message}]
            )
            analysis_text = response.content[0].text

            # Extract rating from analysis
            rating = self._extract_rating(analysis_text)

            # Return structured data
            return {
                "ticker": ticker,
                "company_name": data["company_name"],
                "rating": rating,
                "metrics": {
                    "price": data["price"],
                    "price_change": data["price_change"],
                    "price_change_pct": data["price_change_pct"],
                    "prev_close": data["prev_close"],
                    "week_52_high": data["week_52_high"],
                    "week_52_low": data["week_52_low"],
                    "pct_from_high": data["pct_from_high"],
                    "market_cap": data["market_cap"],
                    "pe_ratio": data["pe_ratio"],
                    "forward_pe": data["forward_pe"],
                    "volume_vs_avg": data["volume_vs_avg"],
                    "beta": data["beta"],
                    "short_percent": data["short_percent"],
                    "debt_to_equity": data["debt_to_equity"],
                    "current_ratio": data["current_ratio"],
                    "profit_margin": data["profit_margin"],
                    "revenue_growth": data["revenue_growth"],
                    "earnings_growth": data["earnings_growth"],
                    "target_price": data["target_price"],
                    "target_upside": data["target_upside"],
                    "recommendation": data["recommendation"]
                },
                "news": data["news_sources"],
                "analysis": analysis_text,
                "generated_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            }

        except Exception as e:
            error_msg = f"Analysis failed: {str(e)}"
            logger.error(f"[AnalysisService] {error_msg}")
            logger.exception("[AnalysisService] Full traceback:")
            raise RuntimeError(error_msg)

    def _extract_rating(self, analysis: str) -> str:
        """Extract rating from analysis text."""
        analysis_lower = analysis.lower()

        # Look for explicit verdict
        if "verdict: bearish" in analysis_lower or "**bearish**" in analysis_lower:
            return "BEARISH"
        elif "verdict: neutral" in analysis_lower or "**neutral**" in analysis_lower:
            return "NEUTRAL"

        # Fallback: count mentions
        bearish_count = analysis_lower.count("bearish")
        neutral_count = analysis_lower.count("neutral")

        if bearish_count > neutral_count:
            return "BEARISH"
        elif neutral_count > 0:
            return "NEUTRAL"

        return "NEUTRAL"  # Default
