from typing import Union, List, Dict, Any

import yfinance as yf
from ddgs import DDGS
from datetime import datetime

from app.core.config import settings
from app.core.logging_config import get_logger

logger = get_logger(__name__)


class DataService:
    """Service for retrieving stock and news data."""

    @staticmethod
    def get_stock_data(ticker: str) -> Dict[str, Any]:
        """
        Fetch comprehensive stock data from Yahoo Finance.

        Args:
            ticker: Stock ticker symbol

        Returns:
            Dictionary with price, change, and context data
        """
        logger.info(f"[DataService] Fetching stock data for ticker: {ticker}")
        try:
            stock = yf.Ticker(ticker)
            info = stock.info
            fast_info = stock.fast_info

            logger.info(f"[DataService] Yahoo Finance info keys: {list(info.keys())[:10]}...")
            logger.info(f"[DataService] Company name from info: {info.get('shortName', 'NOT FOUND')}")

            # Current price
            current_price = round(fast_info.last_price, 2)
            logger.info(f"[DataService] Current price: {current_price}")

            # Previous close and daily change
            prev_close = info.get('previousClose', current_price)
            price_change = round(current_price - prev_close, 2)
            price_change_pct = round((price_change / prev_close) * 100, 2) if prev_close else 0

            # 52-week range
            week_52_high = info.get('fiftyTwoWeekHigh', 'N/A')
            week_52_low = info.get('fiftyTwoWeekLow', 'N/A')

            # Calculate % from 52-week high
            pct_from_high = round(((current_price - week_52_high) / week_52_high) * 100, 1) if week_52_high != 'N/A' else 'N/A'

            # Market cap
            market_cap = info.get('marketCap', 0)
            if market_cap >= 1_000_000_000_000:
                market_cap_str = f"${round(market_cap / 1_000_000_000_000, 2)}T"
            elif market_cap >= 1_000_000_000:
                market_cap_str = f"${round(market_cap / 1_000_000_000, 2)}B"
            elif market_cap >= 1_000_000:
                market_cap_str = f"${round(market_cap / 1_000_000, 2)}M"
            else:
                market_cap_str = f"${market_cap}"

            # Company name
            company_name = info.get('shortName', ticker)

            # P/E Ratio
            pe_ratio = info.get('trailingPE', 'N/A')
            if pe_ratio != 'N/A':
                pe_ratio = round(pe_ratio, 2)

            # Forward P/E (expectations vs current)
            forward_pe = info.get('forwardPE', 'N/A')
            if forward_pe != 'N/A':
                forward_pe = round(forward_pe, 2)

            # Volume
            volume = fast_info.last_volume
            avg_volume = info.get('averageVolume', volume)
            volume_vs_avg = round((volume / avg_volume) * 100, 0) if avg_volume else 100

            # Beta (volatility vs market) - >1 means more volatile than S&P500
            beta = info.get('beta', 'N/A')
            if beta != 'N/A':
                beta = round(beta, 2)

            # Short Interest - percentage of float sold short (bearish sentiment)
            short_percent = info.get('shortPercentOfFloat', 'N/A')
            if short_percent != 'N/A':
                short_percent = round(short_percent * 100, 2)

            # Debt to Equity - financial leverage risk
            debt_to_equity = info.get('debtToEquity', 'N/A')
            if debt_to_equity != 'N/A':
                debt_to_equity = round(debt_to_equity, 2)

            # Profit Margins - operational efficiency
            profit_margin = info.get('profitMargins', 'N/A')
            if profit_margin != 'N/A':
                profit_margin = round(profit_margin * 100, 2)

            # Revenue Growth - business momentum
            revenue_growth = info.get('revenueGrowth', 'N/A')
            if revenue_growth != 'N/A':
                revenue_growth = round(revenue_growth * 100, 2)

            # Earnings Growth
            earnings_growth = info.get('earningsGrowth', 'N/A')
            if earnings_growth != 'N/A':
                earnings_growth = round(earnings_growth * 100, 2)

            # Current Ratio - liquidity (ability to pay short-term debts)
            current_ratio = info.get('currentRatio', 'N/A')
            if current_ratio != 'N/A':
                current_ratio = round(current_ratio, 2)

            # Analyst Target Price - log all available target fields
            target_mean = info.get('targetMeanPrice', 'N/A')
            target_high = info.get('targetHighPrice', 'N/A')
            target_low = info.get('targetLowPrice', 'N/A')
            target_median = info.get('targetMedianPrice', 'N/A')
            num_analysts = info.get('numberOfAnalystOpinions', 'N/A')

            logger.info(f"[DataService] Analyst Targets - Mean: {target_mean}, Median: {target_median}, High: {target_high}, Low: {target_low}, # Analysts: {num_analysts}")

            target_price = target_mean
            if target_price != 'N/A':
                target_price = round(target_price, 2)
                target_upside = round(((target_price - current_price) / current_price) * 100, 1)
            else:
                target_upside = 'N/A'
            logger.info(f"[DataService] Final target_price: {target_price}, target_upside: {target_upside}%")

            # Recommendation (buy/hold/sell)
            recommendation = info.get('recommendationKey', 'N/A')
            logger.info(f"[DataService] Recommendation: {recommendation}")

            return {
                "company_name": company_name,
                "current_price": current_price,
                "price_change": price_change,
                "price_change_pct": price_change_pct,
                "prev_close": prev_close,
                "week_52_high": week_52_high,
                "week_52_low": week_52_low,
                "pct_from_high": pct_from_high,
                "market_cap": market_cap_str,
                "pe_ratio": pe_ratio,
                "forward_pe": forward_pe,
                "volume": volume,
                "volume_vs_avg": volume_vs_avg,
                "beta": beta,
                "short_percent": short_percent,
                "debt_to_equity": debt_to_equity,
                "profit_margin": profit_margin,
                "revenue_growth": revenue_growth,
                "earnings_growth": earnings_growth,
                "current_ratio": current_ratio,
                "target_price": target_price,
                "target_upside": target_upside,
                "recommendation": recommendation
            }

        except Exception as e:
            logger.error(f"[DataService] Stock data fetch FAILED for {ticker}: {e}")
            logger.error(f"[DataService] This usually means the ticker '{ticker}' is invalid or not found on Yahoo Finance")
            return {
                "company_name": ticker,
                "current_price": "Unknown",
                "price_change": "N/A",
                "price_change_pct": "N/A",
                "prev_close": "N/A",
                "week_52_high": "N/A",
                "week_52_low": "N/A",
                "pct_from_high": "N/A",
                "market_cap": "N/A",
                "pe_ratio": "N/A",
                "forward_pe": "N/A",
                "volume": "N/A",
                "volume_vs_avg": "N/A",
                "beta": "N/A",
                "short_percent": "N/A",
                "debt_to_equity": "N/A",
                "profit_margin": "N/A",
                "revenue_growth": "N/A",
                "earnings_growth": "N/A",
                "current_ratio": "N/A",
                "target_price": "N/A",
                "target_upside": "N/A",
                "recommendation": "N/A"
            }

    @staticmethod
    def get_news_with_sources(ticker: str) -> List[Dict[str, str]]:
        """
        Fetch recent news headlines with sources and URLs from DuckDuckGo.

        Args:
            ticker: Stock ticker symbol

        Returns:
            List of news dictionaries with title, source, and url
        """
        news_list = []
        try:
            with DDGS() as ddgs:
                query = f"{ticker} stock news risks concerns {datetime.now().year}"
                results = ddgs.news(query, max_results=settings.NEWS_MAX_RESULTS)
                for r in results:
                    news_list.append({
                        "title": r.get('title', ''),
                        "source": r.get('source', 'Unknown'),
                        "url": r.get('url', ''),
                        "date": r.get('date', '')
                    })
        except Exception as e:
            print(f"[DataService] News fetch warning: {e}")
            news_list.append({
                "title": "No recent news found",
                "source": "N/A",
                "url": "",
                "date": ""
            })

        return news_list

    @classmethod
    def fetch_stock_data(cls, ticker: str) -> dict:
        """
        Fetch all stock data (price metrics and news).

        Args:
            ticker: Stock ticker symbol

        Returns:
            Dictionary with comprehensive stock data and news
        """
        print(f"[DataService] Fetching comprehensive data for {ticker}...")

        stock_data = cls.get_stock_data(ticker)
        news_data = cls.get_news_with_sources(ticker)

        # Format news for prompt
        news_formatted = []
        for i, article in enumerate(news_data, 1):
            news_formatted.append(
                f"{i}. \"{article['title']}\" - {article['source']}"
            )

        return {
            "company_name": stock_data["company_name"],
            "price": stock_data["current_price"],
            "price_change": stock_data["price_change"],
            "price_change_pct": stock_data["price_change_pct"],
            "prev_close": stock_data["prev_close"],
            "week_52_high": stock_data["week_52_high"],
            "week_52_low": stock_data["week_52_low"],
            "pct_from_high": stock_data["pct_from_high"],
            "market_cap": stock_data["market_cap"],
            "pe_ratio": stock_data["pe_ratio"],
            "forward_pe": stock_data["forward_pe"],
            "volume_vs_avg": stock_data["volume_vs_avg"],
            "beta": stock_data["beta"],
            "short_percent": stock_data["short_percent"],
            "debt_to_equity": stock_data["debt_to_equity"],
            "profit_margin": stock_data["profit_margin"],
            "revenue_growth": stock_data["revenue_growth"],
            "earnings_growth": stock_data["earnings_growth"],
            "current_ratio": stock_data["current_ratio"],
            "target_price": stock_data["target_price"],
            "target_upside": stock_data["target_upside"],
            "recommendation": stock_data["recommendation"],
            "news": "\n".join(news_formatted),
            "news_sources": news_data
        }
