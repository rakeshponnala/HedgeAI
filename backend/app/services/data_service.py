from typing import Union, List

import yfinance as yf
from ddgs import DDGS
from datetime import datetime

from app.core.config import settings


class DataService:
    """Service for retrieving stock and news data."""

    @staticmethod
    def get_stock_price(ticker: str) -> Union[float, str]:
        """
        Fetch current stock price from Yahoo Finance.

        Args:
            ticker: Stock ticker symbol

        Returns:
            Current stock price or "Unknown" if unavailable
        """
        try:
            stock = yf.Ticker(ticker)
            price = round(stock.fast_info.last_price, 2)
            return price
        except Exception as e:
            print(f"[DataService] Price fetch warning: {e}")
            return "Unknown"

    @staticmethod
    def get_news_headlines(ticker: str) -> List[str]:
        """
        Fetch recent news headlines from DuckDuckGo.

        Args:
            ticker: Stock ticker symbol

        Returns:
            List of news headline strings
        """
        news_list = []
        try:
            with DDGS() as ddgs:
                query = f"{ticker} stock investor risks {datetime.now().year}"
                results = ddgs.news(query, max_results=settings.NEWS_MAX_RESULTS)
                for r in results:
                    news_list.append(f"- {r['title']} (Source: {r['source']})")
        except Exception as e:
            print(f"[DataService] News fetch warning: {e}")
            news_list.append("No recent news found.")

        return news_list

    @classmethod
    def fetch_stock_data(cls, ticker: str) -> dict:
        """
        Fetch all stock data (price and news).

        Args:
            ticker: Stock ticker symbol

        Returns:
            Dictionary with price and news data
        """
        print(f"[DataService] Fetching data for {ticker}...")

        price = cls.get_stock_price(ticker)
        news = cls.get_news_headlines(ticker)

        return {
            "price": price,
            "news": "\n".join(news)
        }
