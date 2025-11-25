"use client";
import React, { useState, useMemo } from 'react';
import {
  Search, AlertTriangle, Shield, TrendingDown, TrendingUp,
  Zap, BarChart3, AlertCircle, DollarSign, Activity,
  ExternalLink, Clock, Target, Percent, Lightbulb,
  AlertOctagon, Gauge, PieChart, CheckCircle, XCircle, MinusCircle
} from 'lucide-react';

export default function Dashboard() {
  const [ticker, setTicker] = useState('');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  const analyzeStock = async () => {
    if (!ticker) return;
    setLoading(true);
    setError('');
    setData(null);

    try {
      const response = await fetch(`http://127.0.0.1:8000/api/analyze/${ticker}`);
      if (!response.ok) throw new Error("Failed to fetch data");

      const result = await response.json();
      setData(result);
    } catch (err) {
      setError("Unable to connect to backend. Please ensure the server is running.");
    } finally {
      setLoading(false);
    }
  };

  // Format price change display
  const formatPriceChange = (change, pct) => {
    if (change === 'N/A') return { text: 'N/A', isPositive: true };
    const isPositive = parseFloat(change) >= 0;
    const sign = isPositive ? '+' : '';
    return {
      text: `${sign}$${Math.abs(change).toFixed(2)} (${sign}${pct}%)`,
      isPositive
    };
  };

  // Smart color coding function
  const getMetricColor = (metric, value) => {
    if (value === 'N/A' || value === undefined || value === null || value === 'Unknown') {
      return 'text-slate-400';
    }

    const num = parseFloat(value);
    if (isNaN(num)) return 'text-slate-400';

    const rules = {
      // Price metrics
      price_change: () => num >= 0 ? 'text-emerald-400' : 'text-red-400',
      pct_from_high: () => {
        if (num > -5) return 'text-red-400';      // Near high = risky (overvalued)
        if (num > -20) return 'text-yellow-400';  // Moderate
        return 'text-emerald-400';                 // Good discount
      },
      volume_vs_avg: () => {
        if (num > 200) return 'text-red-400';     // Extreme volume = volatility
        if (num > 150) return 'text-yellow-400';  // High volume
        return 'text-white';
      },

      // Valuation
      pe_ratio: () => {
        if (num > 50) return 'text-red-400';      // Very expensive
        if (num > 30) return 'text-yellow-400';   // Expensive
        if (num > 0) return 'text-emerald-400';   // Reasonable
        return 'text-red-400';                     // Negative = losing money
      },
      forward_pe: () => {
        if (num > 40) return 'text-red-400';
        if (num > 25) return 'text-yellow-400';
        if (num > 0) return 'text-emerald-400';
        return 'text-red-400';
      },

      // Risk indicators
      beta: () => {
        if (num > 1.5) return 'text-red-400';     // High volatility
        if (num > 1.2) return 'text-yellow-400';  // Above market
        return 'text-emerald-400';                 // Stable
      },
      short_percent: () => {
        if (num > 15) return 'text-red-400';      // Very high short interest
        if (num > 8) return 'text-yellow-400';    // Elevated
        return 'text-emerald-400';                 // Normal
      },
      debt_to_equity: () => {
        if (num > 150) return 'text-red-400';     // Heavily leveraged
        if (num > 80) return 'text-yellow-400';   // Moderate leverage
        return 'text-emerald-400';                 // Conservative
      },
      current_ratio: () => {
        if (num < 1) return 'text-red-400';       // Liquidity risk
        if (num < 1.5) return 'text-yellow-400';  // Tight liquidity
        return 'text-emerald-400';                 // Healthy
      },

      // Growth & Profitability
      profit_margin: () => {
        if (num < 0) return 'text-red-400';       // Losing money
        if (num < 10) return 'text-yellow-400';   // Low margin
        return 'text-emerald-400';                 // Healthy margin
      },
      revenue_growth: () => {
        if (num < 0) return 'text-red-400';       // Declining
        if (num < 10) return 'text-yellow-400';   // Slow growth
        return 'text-emerald-400';                 // Strong growth
      },
      earnings_growth: () => {
        if (num < -10) return 'text-red-400';     // Significant decline
        if (num < 5) return 'text-yellow-400';    // Stagnant
        return 'text-emerald-400';                 // Growing
      },

      // Analyst sentiment
      target_upside: () => {
        if (num < -10) return 'text-red-400';     // Analysts bearish
        if (num < 10) return 'text-yellow-400';   // Limited upside
        return 'text-emerald-400';                 // Good upside
      },
    };

    return rules[metric] ? rules[metric]() : 'text-white';
  };

  // Generate smart insights based on metrics
  const generateInsights = (metrics) => {
    if (!metrics) return [];

    const insights = [];

    // Valuation insights
    const pe = parseFloat(metrics.pe_ratio);
    const forwardPe = parseFloat(metrics.forward_pe);
    if (!isNaN(pe) && !isNaN(forwardPe)) {
      if (pe > 50) {
        insights.push({
          type: 'danger',
          icon: XCircle,
          title: 'Extreme Valuation',
          text: `P/E of ${pe} is very high. Stock is priced for perfection - any disappointment could trigger a selloff.`
        });
      } else if (forwardPe > pe && pe > 0) {
        insights.push({
          type: 'warning',
          icon: AlertTriangle,
          title: 'Earnings Expected to Decline',
          text: `Forward P/E (${forwardPe}) > Trailing P/E (${pe}) suggests analysts expect earnings to drop.`
        });
      } else if (forwardPe < pe * 0.7 && forwardPe > 0) {
        insights.push({
          type: 'good',
          icon: CheckCircle,
          title: 'Strong Earnings Growth Expected',
          text: `Forward P/E (${forwardPe}) much lower than trailing (${pe}) - analysts expect significant earnings growth.`
        });
      }
    }

    // Short interest insights
    const shortPct = parseFloat(metrics.short_percent);
    if (!isNaN(shortPct)) {
      if (shortPct > 20) {
        insights.push({
          type: 'danger',
          icon: XCircle,
          title: 'Very High Short Interest',
          text: `${shortPct}% of shares are sold short. Institutional investors are betting heavily against this stock.`
        });
      } else if (shortPct > 10) {
        insights.push({
          type: 'warning',
          icon: AlertTriangle,
          title: 'Elevated Short Interest',
          text: `${shortPct}% short interest indicates notable bearish sentiment from sophisticated investors.`
        });
      }
    }

    // Debt/Liquidity insights
    const debtEquity = parseFloat(metrics.debt_to_equity);
    const currentRatio = parseFloat(metrics.current_ratio);
    if (!isNaN(debtEquity) && debtEquity > 150) {
      insights.push({
        type: 'danger',
        icon: XCircle,
        title: 'High Financial Leverage',
        text: `Debt/Equity of ${debtEquity} means the company is heavily leveraged. Rising interest rates or revenue decline could be catastrophic.`
      });
    }
    if (!isNaN(currentRatio) && currentRatio < 1) {
      insights.push({
        type: 'danger',
        icon: XCircle,
        title: 'Liquidity Risk',
        text: `Current ratio of ${currentRatio} (<1) means the company may struggle to pay short-term obligations.`
      });
    }

    // 52-week position insights
    const pctFromHigh = parseFloat(metrics.pct_from_high);
    if (!isNaN(pctFromHigh)) {
      if (pctFromHigh > -5) {
        insights.push({
          type: 'warning',
          icon: AlertTriangle,
          title: 'Trading Near 52-Week High',
          text: `Only ${Math.abs(pctFromHigh)}% below 52-week high. Limited upside, elevated downside risk.`
        });
      } else if (pctFromHigh < -40) {
        insights.push({
          type: 'neutral',
          icon: MinusCircle,
          title: 'Significant Pullback',
          text: `Stock is ${Math.abs(pctFromHigh)}% below 52-week high. Could be value opportunity or falling knife.`
        });
      }
    }

    // Beta insights
    const beta = parseFloat(metrics.beta);
    if (!isNaN(beta)) {
      if (beta > 1.8) {
        insights.push({
          type: 'warning',
          icon: AlertTriangle,
          title: 'High Volatility Stock',
          text: `Beta of ${beta} means this stock moves ${Math.round((beta - 1) * 100)}% more than the market. Expect large swings.`
        });
      } else if (beta < 0.8) {
        insights.push({
          type: 'good',
          icon: CheckCircle,
          title: 'Defensive Stock',
          text: `Low beta of ${beta} indicates less volatility than the market. Good for risk-averse investors.`
        });
      }
    }

    // Growth insights
    const revenueGrowth = parseFloat(metrics.revenue_growth);
    const earningsGrowth = parseFloat(metrics.earnings_growth);
    const profitMargin = parseFloat(metrics.profit_margin);

    if (!isNaN(revenueGrowth) && revenueGrowth < 0) {
      insights.push({
        type: 'danger',
        icon: XCircle,
        title: 'Declining Revenue',
        text: `Revenue declining ${Math.abs(revenueGrowth)}% YoY. Fundamental business weakness.`
      });
    } else if (!isNaN(revenueGrowth) && revenueGrowth > 30) {
      insights.push({
        type: 'good',
        icon: CheckCircle,
        title: 'Strong Revenue Growth',
        text: `${revenueGrowth}% revenue growth shows strong business momentum.`
      });
    }

    if (!isNaN(profitMargin) && profitMargin < 0) {
      insights.push({
        type: 'danger',
        icon: XCircle,
        title: 'Unprofitable Company',
        text: `Negative ${Math.abs(profitMargin)}% profit margin. Company is losing money on operations.`
      });
    }

    // Analyst sentiment
    const targetUpside = parseFloat(metrics.target_upside);
    const recommendation = metrics.recommendation;
    if (!isNaN(targetUpside)) {
      if (targetUpside < -10) {
        insights.push({
          type: 'danger',
          icon: XCircle,
          title: 'Analysts See Downside',
          text: `Analyst target implies ${Math.abs(targetUpside)}% downside from current price.`
        });
      } else if (targetUpside > 30) {
        insights.push({
          type: 'good',
          icon: CheckCircle,
          title: 'Strong Analyst Upside',
          text: `Analysts see ${targetUpside}% upside potential to their price targets.`
        });
      }
    }

    // Volume insight
    const volumeVsAvg = parseFloat(metrics.volume_vs_avg);
    if (!isNaN(volumeVsAvg) && volumeVsAvg > 200) {
      insights.push({
        type: 'warning',
        icon: AlertTriangle,
        title: 'Unusual Trading Volume',
        text: `Volume is ${volumeVsAvg}% of average - ${Math.round(volumeVsAvg / 100)}x normal activity. Something is happening.`
      });
    }

    return insights;
  };

  // Memoize insights
  const insights = useMemo(() => {
    return data ? generateInsights(data.metrics) : [];
  }, [data]);

  // Metric card component with smart coloring
  const MetricCard = ({ icon: Icon, label, value, subValue, tooltip, metric }) => {
    // Convert value to string and remove $ and % for color calculation
    const cleanValue = String(value || '').replace(/[$%]/g, '');
    const colorClass = getMetricColor(metric, cleanValue);

    return (
      <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50 p-4 group relative">
        <div className="flex items-center gap-2 text-slate-400 text-sm mb-2">
          <Icon className="w-4 h-4" />
          <span>{label}</span>
        </div>
        <div className={`text-xl font-bold ${colorClass}`}>{value}</div>
        {subValue && <div className="text-xs text-slate-500 mt-1">{subValue}</div>}
        {tooltip && (
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-slate-900 text-slate-300 text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10 border border-slate-700">
            {tooltip}
          </div>
        )}
      </div>
    );
  };

  // Insight card component
  const InsightCard = ({ insight }) => {
    const bgColors = {
      danger: 'bg-red-500/10 border-red-500/30',
      warning: 'bg-yellow-500/10 border-yellow-500/30',
      good: 'bg-emerald-500/10 border-emerald-500/30',
      neutral: 'bg-slate-500/10 border-slate-500/30'
    };
    const textColors = {
      danger: 'text-red-400',
      warning: 'text-yellow-400',
      good: 'text-emerald-400',
      neutral: 'text-slate-400'
    };
    const Icon = insight.icon;

    return (
      <div className={`p-4 rounded-xl border ${bgColors[insight.type]}`}>
        <div className={`flex items-center gap-2 font-medium mb-1 ${textColors[insight.type]}`}>
          <Icon className="w-4 h-4" />
          <span>{insight.title}</span>
        </div>
        <p className="text-slate-300 text-sm">{insight.text}</p>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Navigation */}
      <nav className="border-b border-slate-700/50 backdrop-blur-sm bg-slate-900/50 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-br from-emerald-500 to-cyan-500 p-2.5 rounded-xl shadow-lg shadow-emerald-500/20">
                <Shield className="text-white w-6 h-6" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white tracking-tight">HedgeAI</h1>
                <p className="text-slate-400 text-xs">Contrarian Risk Analysis</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-slate-400 text-sm">
              <Zap className="w-4 h-4 text-emerald-400" />
              <span>Powered by Claude Sonnet 4.5</span>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">

        {/* Search Section */}
        <div className="max-w-2xl mx-auto mb-12">
          <div className="text-center mb-8">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-3">
              AI-Powered <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">Risk Analysis</span>
            </h2>
            <p className="text-slate-400">
              Get contrarian insights on any stock. Identify risks others miss.
            </p>
          </div>

          <div className="bg-slate-800/50 backdrop-blur-sm p-2 rounded-2xl border border-slate-700/50 flex gap-2 shadow-2xl shadow-black/20">
            <div className="flex-1 flex items-center gap-3 px-4">
              <BarChart3 className="w-5 h-5 text-slate-500" />
              <input
                type="text"
                placeholder="Enter ticker or company name (e.g., NVDA, Google, Tesla)"
                className="flex-1 bg-transparent py-4 outline-none text-lg text-white placeholder:normal-case placeholder:text-slate-500"
                value={ticker}
                onChange={(e) => setTicker(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && analyzeStock()}
              />
            </div>
            <button
              onClick={analyzeStock}
              disabled={loading || !ticker}
              className="bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-white px-8 py-4 rounded-xl font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg shadow-emerald-500/25"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Analyzing...</span>
                </div>
              ) : (
                <>
                  <Search className="w-5 h-5" />
                  <span>Analyze</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="max-w-2xl mx-auto mb-8">
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          </div>
        )}

        {/* Results Dashboard */}
        {data && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">

            {/* Header with Rating */}
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700/50 p-6">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="bg-slate-700/50 p-4 rounded-xl">
                    <BarChart3 className="w-10 h-10 text-emerald-400" />
                  </div>
                  <div>
                    <div className="flex items-center gap-3 flex-wrap">
                      <h2 className="text-3xl font-bold text-white">{data.ticker}</h2>
                      <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                        data.rating === 'BEARISH'
                          ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                          : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                      }`}>
                        {data.rating === 'BEARISH' ? <TrendingDown className="w-4 h-4 inline mr-1" /> : <AlertCircle className="w-4 h-4 inline mr-1" />}
                        {data.rating}
                      </span>
                      {data.metrics.recommendation && data.metrics.recommendation !== 'N/A' && (
                        <span className={`px-3 py-1 rounded-full text-sm font-medium border ${
                          data.metrics.recommendation.toLowerCase().includes('buy')
                            ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                            : data.metrics.recommendation.toLowerCase().includes('sell')
                            ? 'bg-red-500/20 text-red-400 border-red-500/30'
                            : 'bg-slate-700/50 text-slate-300 border-slate-600/50'
                        }`}>
                          Analyst: {data.metrics.recommendation.toUpperCase()}
                        </span>
                      )}
                    </div>
                    <p className="text-slate-400">{data.company_name}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-slate-500 text-sm">
                  <Clock className="w-4 h-4" />
                  <span>{data.generated_at}</span>
                </div>
              </div>
            </div>

            {/* Smart Insights Panel */}
            {insights.length > 0 && (
              <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700/50 overflow-hidden">
                <div className="bg-gradient-to-r from-slate-800 to-slate-800/50 px-6 py-4 border-b border-slate-700/50 flex items-center gap-3">
                  <Lightbulb className="text-yellow-400 w-5 h-5" />
                  <h3 className="text-white font-semibold">Smart Insights</h3>
                  <span className="text-slate-500 text-sm">({insights.length} findings)</span>
                </div>
                <div className="p-4 grid md:grid-cols-2 gap-4">
                  {insights.map((insight, index) => (
                    <InsightCard key={index} insight={insight} />
                  ))}
                </div>
              </div>
            )}

            {/* Price & Trading Section */}
            <div>
              <h3 className="text-slate-400 text-sm font-medium mb-3 flex items-center gap-2">
                <DollarSign className="w-4 h-4" /> PRICE & TRADING
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                <MetricCard
                  icon={DollarSign}
                  label="Price"
                  value={`$${data.metrics.price}`}
                  subValue={formatPriceChange(data.metrics.price_change, data.metrics.price_change_pct).text}
                  metric="price_change"
                />
                <MetricCard
                  icon={Activity}
                  label="Market Cap"
                  value={data.metrics.market_cap}
                  metric="market_cap"
                />
                <MetricCard
                  icon={Target}
                  label="From 52W High"
                  value={`${data.metrics.pct_from_high}%`}
                  tooltip="Distance from 52-week high"
                  metric="pct_from_high"
                />
                <MetricCard
                  icon={BarChart3}
                  label="Volume vs Avg"
                  value={`${data.metrics.volume_vs_avg}%`}
                  tooltip="Today's volume compared to average"
                  metric="volume_vs_avg"
                />
                <MetricCard
                  icon={Target}
                  label="Analyst Target"
                  value={data.metrics.target_price !== 'N/A' ? `$${data.metrics.target_price}` : 'N/A'}
                  subValue={data.metrics.target_upside !== 'N/A' ? `${data.metrics.target_upside}% upside` : ''}
                  metric="target_upside"
                />
              </div>
            </div>

            {/* 52-Week Range Bar */}
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50 p-4">
              <div className="flex items-center justify-between text-sm mb-3">
                <span className="text-slate-400">52-Week Range</span>
                <span className="text-slate-400">
                  ${data.metrics.week_52_low} - ${data.metrics.week_52_high}
                </span>
              </div>
              <div className="relative h-3 bg-slate-700 rounded-full overflow-hidden">
                {(() => {
                  const low = parseFloat(data.metrics.week_52_low);
                  const high = parseFloat(data.metrics.week_52_high);
                  const current = parseFloat(data.metrics.price);
                  const position = ((current - low) / (high - low)) * 100;
                  const safePosition = Math.min(Math.max(position, 0), 100);

                  // Color based on position
                  const barColor = position > 80
                    ? 'from-red-500 to-red-400'
                    : position > 60
                    ? 'from-yellow-500 to-yellow-400'
                    : 'from-emerald-500 to-cyan-500';

                  return (
                    <>
                      <div
                        className={`absolute h-full bg-gradient-to-r ${barColor} rounded-full`}
                        style={{ width: `${safePosition}%` }}
                      />
                      <div
                        className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full shadow-lg border-2 border-emerald-500"
                        style={{ left: `calc(${safePosition}% - 8px)` }}
                      />
                    </>
                  );
                })()}
              </div>
              <div className="flex justify-between mt-2 text-xs text-slate-500">
                <span>Low: ${data.metrics.week_52_low}</span>
                <span className="text-emerald-400 font-medium">Current: ${data.metrics.price}</span>
                <span>High: ${data.metrics.week_52_high}</span>
              </div>
            </div>

            {/* Valuation Metrics */}
            <div>
              <h3 className="text-slate-400 text-sm font-medium mb-3 flex items-center gap-2">
                <PieChart className="w-4 h-4" /> VALUATION
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <MetricCard
                  icon={Percent}
                  label="Trailing P/E"
                  value={data.metrics.pe_ratio}
                  tooltip="Price-to-Earnings ratio (trailing 12 months)"
                  metric="pe_ratio"
                />
                <MetricCard
                  icon={Percent}
                  label="Forward P/E"
                  value={data.metrics.forward_pe}
                  tooltip="Forward P/E based on expected earnings"
                  metric="forward_pe"
                />
                <MetricCard
                  icon={Gauge}
                  label="Beta"
                  value={data.metrics.beta}
                  tooltip="Volatility vs S&P 500 (>1 = more volatile)"
                  metric="beta"
                />
              </div>
            </div>

            {/* Risk Indicators */}
            <div>
              <h3 className="text-red-400 text-sm font-medium mb-3 flex items-center gap-2">
                <AlertOctagon className="w-4 h-4" /> RISK INDICATORS
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <MetricCard
                  icon={TrendingDown}
                  label="Short Interest"
                  value={data.metrics.short_percent !== 'N/A' ? `${data.metrics.short_percent}%` : 'N/A'}
                  tooltip="% of shares sold short (>10% = high bearish sentiment)"
                  metric="short_percent"
                />
                <MetricCard
                  icon={AlertTriangle}
                  label="Debt/Equity"
                  value={data.metrics.debt_to_equity}
                  tooltip="Financial leverage (>100 = highly leveraged)"
                  metric="debt_to_equity"
                />
                <MetricCard
                  icon={Activity}
                  label="Current Ratio"
                  value={data.metrics.current_ratio}
                  tooltip="Liquidity (<1 = may struggle to pay short-term debts)"
                  metric="current_ratio"
                />
                <MetricCard
                  icon={Gauge}
                  label="Volatility (Beta)"
                  value={data.metrics.beta}
                  tooltip="Market volatility (>1.5 = high risk)"
                  metric="beta"
                />
              </div>
            </div>

            {/* Growth & Profitability */}
            <div>
              <h3 className="text-emerald-400 text-sm font-medium mb-3 flex items-center gap-2">
                <TrendingUp className="w-4 h-4" /> GROWTH & PROFITABILITY
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <MetricCard
                  icon={Percent}
                  label="Profit Margin"
                  value={data.metrics.profit_margin !== 'N/A' ? `${data.metrics.profit_margin}%` : 'N/A'}
                  tooltip="Net profit margin"
                  metric="profit_margin"
                />
                <MetricCard
                  icon={TrendingUp}
                  label="Revenue Growth"
                  value={data.metrics.revenue_growth !== 'N/A' ? `${data.metrics.revenue_growth}%` : 'N/A'}
                  tooltip="Year-over-year revenue growth"
                  metric="revenue_growth"
                />
                <MetricCard
                  icon={TrendingUp}
                  label="Earnings Growth"
                  value={data.metrics.earnings_growth !== 'N/A' ? `${data.metrics.earnings_growth}%` : 'N/A'}
                  tooltip="Year-over-year earnings growth"
                  metric="earnings_growth"
                />
              </div>
            </div>

            {/* Main Content Grid */}
            <div className="grid lg:grid-cols-3 gap-6">

              {/* Analysis - Takes 2 columns */}
              <div className="lg:col-span-2 bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700/50 overflow-hidden">
                <div className="bg-gradient-to-r from-slate-800 to-slate-800/50 px-6 py-4 border-b border-slate-700/50 flex items-center gap-3">
                  <Shield className="text-emerald-400 w-5 h-5" />
                  <h3 className="text-white font-semibold">AI Risk Assessment</h3>
                </div>
                <div className="p-6">
                  <div className="prose prose-invert prose-sm max-w-none">
                    <div className="whitespace-pre-wrap text-slate-300 leading-relaxed">
                      {data.analysis}
                    </div>
                  </div>
                </div>
              </div>

              {/* News Sources - Takes 1 column */}
              <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700/50 overflow-hidden">
                <div className="bg-gradient-to-r from-slate-800 to-slate-800/50 px-6 py-4 border-b border-slate-700/50 flex items-center gap-3">
                  <ExternalLink className="text-emerald-400 w-5 h-5" />
                  <h3 className="text-white font-semibold">News Sources</h3>
                </div>
                <div className="p-4 space-y-3 max-h-96 overflow-y-auto">
                  {data.news && data.news.map((item, index) => (
                    <a
                      key={index}
                      href={item.url || '#'}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block p-3 bg-slate-700/30 hover:bg-slate-700/50 rounded-xl transition-colors group"
                    >
                      <p className="text-slate-300 text-sm leading-snug group-hover:text-white transition-colors line-clamp-2">
                        {item.title}
                      </p>
                      <p className="text-slate-500 text-xs mt-1">
                        {item.source}
                      </p>
                    </a>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer Disclaimer */}
            <div className="text-center text-xs text-slate-500 py-4">
              Generated by AI • Not Financial Advice • For Research Purposes Only
            </div>
          </div>
        )}

        {/* Empty State */}
        {!data && !loading && !error && (
          <div className="max-w-2xl mx-auto text-center py-12">
            <div className="bg-slate-800/30 rounded-2xl border border-slate-700/30 p-12">
              <Shield className="w-16 h-16 text-slate-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-slate-400 mb-2">Ready to Analyze</h3>
              <p className="text-slate-500 mb-6">Enter a stock ticker or company name to get AI-powered risk analysis</p>
              <div className="flex flex-wrap justify-center gap-2">
                {['NVDA', 'TSLA', 'AAPL', 'Google', 'Amazon', 'Microsoft'].map((example) => (
                  <button
                    key={example}
                    onClick={() => setTicker(example)}
                    className="px-3 py-1.5 bg-slate-700/50 hover:bg-slate-700 text-slate-400 hover:text-white rounded-lg text-sm transition-colors"
                  >
                    {example}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="border-t border-slate-800 mt-8">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-slate-500 text-sm">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4" />
              <span>HedgeAI v1.0</span>
            </div>
            <p>Built by Rakesh Ponnala</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
