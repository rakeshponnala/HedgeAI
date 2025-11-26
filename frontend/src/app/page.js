"use client";
import React, { useState, useMemo } from 'react';
import {
  Search, AlertTriangle, Shield, TrendingDown, TrendingUp,
  Zap, BarChart3, AlertCircle, DollarSign, Activity,
  ExternalLink, Clock, Target, Percent, Lightbulb,
  AlertOctagon, Gauge, PieChart, CheckCircle, XCircle, MinusCircle,
  Landmark, Scale, Wallet, TrendingUp as Growth, Users
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
        if (num > -5) return 'text-red-400';
        if (num > -20) return 'text-yellow-400';
        return 'text-emerald-400';
      },
      volume_vs_avg: () => {
        if (num > 200) return 'text-red-400';
        if (num > 150) return 'text-yellow-400';
        return 'text-white';
      },

      // Valuation
      pe_ratio: () => {
        if (num > 50) return 'text-red-400';
        if (num > 30) return 'text-yellow-400';
        if (num > 0) return 'text-emerald-400';
        return 'text-red-400';
      },
      forward_pe: () => {
        if (num > 40) return 'text-red-400';
        if (num > 25) return 'text-yellow-400';
        if (num > 0) return 'text-emerald-400';
        return 'text-red-400';
      },

      // Volatility
      beta: () => {
        if (num > 1.5) return 'text-red-400';
        if (num > 1.2) return 'text-yellow-400';
        return 'text-emerald-400';
      },

      // Debt & Leverage
      short_percent: () => {
        if (num > 15) return 'text-red-400';
        if (num > 8) return 'text-yellow-400';
        return 'text-emerald-400';
      },
      debt_to_equity: () => {
        if (num > 150) return 'text-red-400';
        if (num > 80) return 'text-yellow-400';
        return 'text-emerald-400';
      },
      current_ratio: () => {
        if (num < 1) return 'text-red-400';
        if (num < 1.5) return 'text-yellow-400';
        return 'text-emerald-400';
      },

      // Profitability
      profit_margin: () => {
        if (num < 0) return 'text-red-400';
        if (num < 10) return 'text-yellow-400';
        return 'text-emerald-400';
      },
      revenue_growth: () => {
        if (num < 0) return 'text-red-400';
        if (num < 10) return 'text-yellow-400';
        return 'text-emerald-400';
      },
      earnings_growth: () => {
        if (num < -10) return 'text-red-400';
        if (num < 5) return 'text-yellow-400';
        return 'text-emerald-400';
      },

      // Analyst sentiment
      target_upside: () => {
        if (num < -10) return 'text-red-400';
        if (num < 10) return 'text-yellow-400';
        return 'text-emerald-400';
      },
    };

    return rules[metric] ? rules[metric]() : 'text-white';
  };

  // Generate section-specific insights
  const generateSectionInsights = (metrics) => {
    if (!metrics) return {};

    const sections = {
      trading: [],
      valuation: [],
      debt: [],
      profitability: [],
      sentiment: []
    };

    // === TRADING INSIGHTS ===
    const pctFromHigh = parseFloat(metrics.pct_from_high);
    if (!isNaN(pctFromHigh)) {
      if (pctFromHigh > -5) {
        sections.trading.push({
          type: 'warning',
          icon: AlertTriangle,
          title: 'Near 52-Week High',
          text: `Only ${Math.abs(pctFromHigh).toFixed(1)}% below peak. Limited upside, elevated downside risk.`
        });
      } else if (pctFromHigh < -40) {
        sections.trading.push({
          type: 'neutral',
          icon: MinusCircle,
          title: 'Significant Pullback',
          text: `Down ${Math.abs(pctFromHigh).toFixed(1)}% from high. Could be value opportunity or falling knife.`
        });
      } else if (pctFromHigh < -20) {
        sections.trading.push({
          type: 'good',
          icon: CheckCircle,
          title: 'Trading at Discount',
          text: `${Math.abs(pctFromHigh).toFixed(1)}% below 52-week high offers potential entry point.`
        });
      }
    }

    const volumeVsAvg = parseFloat(metrics.volume_vs_avg);
    if (!isNaN(volumeVsAvg)) {
      if (volumeVsAvg > 200) {
        sections.trading.push({
          type: 'warning',
          icon: AlertTriangle,
          title: 'Unusual Volume',
          text: `${Math.round(volumeVsAvg)}% of average - ${(volumeVsAvg / 100).toFixed(1)}x normal. Significant activity detected.`
        });
      } else if (volumeVsAvg < 50) {
        sections.trading.push({
          type: 'neutral',
          icon: MinusCircle,
          title: 'Low Volume',
          text: `Only ${Math.round(volumeVsAvg)}% of average volume. Low liquidity today.`
        });
      }
    }

    const beta = parseFloat(metrics.beta);
    if (!isNaN(beta)) {
      if (beta > 1.8) {
        sections.trading.push({
          type: 'warning',
          icon: AlertTriangle,
          title: 'High Volatility',
          text: `Beta of ${beta.toFixed(2)} means ${Math.round((beta - 1) * 100)}% more volatile than market.`
        });
      } else if (beta < 0.8) {
        sections.trading.push({
          type: 'good',
          icon: CheckCircle,
          title: 'Low Volatility',
          text: `Beta of ${beta.toFixed(2)} - more stable than the overall market.`
        });
      }
    }

    // === VALUATION INSIGHTS ===
    const pe = parseFloat(metrics.pe_ratio);
    const forwardPe = parseFloat(metrics.forward_pe);

    if (!isNaN(pe)) {
      if (pe > 50) {
        sections.valuation.push({
          type: 'danger',
          icon: XCircle,
          title: 'Extreme Valuation',
          text: `P/E of ${pe.toFixed(1)} is very expensive. Priced for perfection.`
        });
      } else if (pe > 30) {
        sections.valuation.push({
          type: 'warning',
          icon: AlertTriangle,
          title: 'High Valuation',
          text: `P/E of ${pe.toFixed(1)} above market average (~25). Growth expectations baked in.`
        });
      } else if (pe > 0 && pe < 15) {
        sections.valuation.push({
          type: 'good',
          icon: CheckCircle,
          title: 'Attractive Valuation',
          text: `P/E of ${pe.toFixed(1)} suggests reasonable value relative to earnings.`
        });
      } else if (pe < 0) {
        sections.valuation.push({
          type: 'danger',
          icon: XCircle,
          title: 'Negative Earnings',
          text: `Negative P/E indicates the company is currently unprofitable.`
        });
      }
    }

    if (!isNaN(pe) && !isNaN(forwardPe) && pe > 0 && forwardPe > 0) {
      if (forwardPe > pe * 1.1) {
        sections.valuation.push({
          type: 'warning',
          icon: AlertTriangle,
          title: 'Earnings Decline Expected',
          text: `Forward P/E (${forwardPe.toFixed(1)}) > Trailing (${pe.toFixed(1)}) - analysts expect earnings drop.`
        });
      } else if (forwardPe < pe * 0.75) {
        sections.valuation.push({
          type: 'good',
          icon: CheckCircle,
          title: 'Strong Growth Expected',
          text: `Forward P/E (${forwardPe.toFixed(1)}) << Trailing (${pe.toFixed(1)}) - significant earnings growth ahead.`
        });
      }
    }

    // === DEBT & LIQUIDITY INSIGHTS ===
    const debtEquity = parseFloat(metrics.debt_to_equity);
    const currentRatio = parseFloat(metrics.current_ratio);
    const shortPct = parseFloat(metrics.short_percent);

    if (!isNaN(debtEquity)) {
      if (debtEquity > 200) {
        sections.debt.push({
          type: 'danger',
          icon: XCircle,
          title: 'Extremely Leveraged',
          text: `Debt/Equity of ${debtEquity.toFixed(0)} is dangerously high. Interest rate sensitive.`
        });
      } else if (debtEquity > 100) {
        sections.debt.push({
          type: 'warning',
          icon: AlertTriangle,
          title: 'High Leverage',
          text: `Debt/Equity of ${debtEquity.toFixed(0)} - company relies heavily on borrowed money.`
        });
      } else if (debtEquity < 30 && debtEquity >= 0) {
        sections.debt.push({
          type: 'good',
          icon: CheckCircle,
          title: 'Conservative Debt',
          text: `Debt/Equity of ${debtEquity.toFixed(0)} shows strong balance sheet.`
        });
      }
    }

    if (!isNaN(currentRatio)) {
      if (currentRatio < 1) {
        sections.debt.push({
          type: 'danger',
          icon: XCircle,
          title: 'Liquidity Risk',
          text: `Current ratio of ${currentRatio.toFixed(2)} (<1) - may struggle to pay short-term debts.`
        });
      } else if (currentRatio < 1.2) {
        sections.debt.push({
          type: 'warning',
          icon: AlertTriangle,
          title: 'Tight Liquidity',
          text: `Current ratio of ${currentRatio.toFixed(2)} is borderline. Limited financial flexibility.`
        });
      } else if (currentRatio > 2) {
        sections.debt.push({
          type: 'good',
          icon: CheckCircle,
          title: 'Strong Liquidity',
          text: `Current ratio of ${currentRatio.toFixed(2)} - ample cash to cover obligations.`
        });
      }
    }

    if (!isNaN(shortPct)) {
      if (shortPct > 20) {
        sections.debt.push({
          type: 'danger',
          icon: XCircle,
          title: 'Very High Short Interest',
          text: `${shortPct.toFixed(1)}% of shares sold short. Institutions betting heavily against.`
        });
      } else if (shortPct > 10) {
        sections.debt.push({
          type: 'warning',
          icon: AlertTriangle,
          title: 'Elevated Short Interest',
          text: `${shortPct.toFixed(1)}% short interest - notable bearish sentiment.`
        });
      } else if (shortPct < 3 && shortPct > 0) {
        sections.debt.push({
          type: 'good',
          icon: CheckCircle,
          title: 'Low Short Interest',
          text: `Only ${shortPct.toFixed(1)}% short interest - minimal bearish bets.`
        });
      }
    }

    // === PROFITABILITY INSIGHTS ===
    const profitMargin = parseFloat(metrics.profit_margin);
    const revenueGrowth = parseFloat(metrics.revenue_growth);
    const earningsGrowth = parseFloat(metrics.earnings_growth);

    if (!isNaN(profitMargin)) {
      if (profitMargin < 0) {
        sections.profitability.push({
          type: 'danger',
          icon: XCircle,
          title: 'Unprofitable',
          text: `Negative ${Math.abs(profitMargin).toFixed(1)}% margin - company losing money on operations.`
        });
      } else if (profitMargin < 5) {
        sections.profitability.push({
          type: 'warning',
          icon: AlertTriangle,
          title: 'Thin Margins',
          text: `${profitMargin.toFixed(1)}% profit margin leaves little room for error.`
        });
      } else if (profitMargin > 20) {
        sections.profitability.push({
          type: 'good',
          icon: CheckCircle,
          title: 'Strong Margins',
          text: `${profitMargin.toFixed(1)}% profit margin indicates pricing power and efficiency.`
        });
      }
    }

    if (!isNaN(revenueGrowth)) {
      if (revenueGrowth < -10) {
        sections.profitability.push({
          type: 'danger',
          icon: XCircle,
          title: 'Revenue Declining',
          text: `Revenue down ${Math.abs(revenueGrowth).toFixed(1)}% YoY - fundamental weakness.`
        });
      } else if (revenueGrowth < 0) {
        sections.profitability.push({
          type: 'warning',
          icon: AlertTriangle,
          title: 'Slowing Revenue',
          text: `Revenue declined ${Math.abs(revenueGrowth).toFixed(1)}% - growth concerns.`
        });
      } else if (revenueGrowth > 25) {
        sections.profitability.push({
          type: 'good',
          icon: CheckCircle,
          title: 'Strong Revenue Growth',
          text: `${revenueGrowth.toFixed(1)}% revenue growth shows business momentum.`
        });
      }
    }

    if (!isNaN(earningsGrowth)) {
      if (earningsGrowth < -20) {
        sections.profitability.push({
          type: 'danger',
          icon: XCircle,
          title: 'Earnings Collapsing',
          text: `Earnings down ${Math.abs(earningsGrowth).toFixed(1)}% - severe profit deterioration.`
        });
      } else if (earningsGrowth > 30) {
        sections.profitability.push({
          type: 'good',
          icon: CheckCircle,
          title: 'Earnings Surge',
          text: `${earningsGrowth.toFixed(1)}% earnings growth - strong profit expansion.`
        });
      }
    }

    // === ANALYST SENTIMENT INSIGHTS ===
    const targetUpside = parseFloat(metrics.target_upside);
    const recommendation = metrics.recommendation;

    if (!isNaN(targetUpside)) {
      if (targetUpside < -15) {
        sections.sentiment.push({
          type: 'danger',
          icon: XCircle,
          title: 'Analysts Bearish',
          text: `Target implies ${Math.abs(targetUpside).toFixed(1)}% downside - Wall Street sees overvaluation.`
        });
      } else if (targetUpside < 0) {
        sections.sentiment.push({
          type: 'warning',
          icon: AlertTriangle,
          title: 'Limited Upside',
          text: `Analyst target ${Math.abs(targetUpside).toFixed(1)}% below current price.`
        });
      } else if (targetUpside > 30) {
        sections.sentiment.push({
          type: 'good',
          icon: CheckCircle,
          title: 'Strong Upside',
          text: `Analysts see ${targetUpside.toFixed(1)}% upside to price targets.`
        });
      }
    }

    if (recommendation && recommendation !== 'N/A') {
      const rec = recommendation.toLowerCase();
      if (rec.includes('strong_buy') || rec === 'buy') {
        sections.sentiment.push({
          type: 'good',
          icon: CheckCircle,
          title: 'Buy Rating',
          text: `Wall Street consensus is "${recommendation.toUpperCase()}" - bullish outlook.`
        });
      } else if (rec.includes('sell') || rec.includes('underperform')) {
        sections.sentiment.push({
          type: 'danger',
          icon: XCircle,
          title: 'Sell Rating',
          text: `Analyst consensus is "${recommendation.toUpperCase()}" - cautious outlook.`
        });
      }
    }

    return sections;
  };

  // Memoize section insights
  const sectionInsights = useMemo(() => {
    return data ? generateSectionInsights(data.metrics) : {};
  }, [data]);

  // Metric card component with smart coloring
  const MetricCard = ({ icon: Icon, label, value, subValue, tooltip, metric }) => {
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

  // Section insight card component
  const SectionInsightCard = ({ insight }) => {
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
      <div className={`p-3 rounded-lg border ${bgColors[insight.type]}`}>
        <div className={`flex items-center gap-2 font-medium text-sm ${textColors[insight.type]}`}>
          <Icon className="w-3.5 h-3.5" />
          <span>{insight.title}</span>
        </div>
        <p className="text-slate-400 text-xs mt-1">{insight.text}</p>
      </div>
    );
  };

  // Section component with metrics and insights
  const MetricSection = ({ title, icon: Icon, iconColor, metrics, insights }) => (
    <div className="bg-slate-800/30 rounded-2xl border border-slate-700/50 overflow-hidden">
      <div className={`px-5 py-3 border-b border-slate-700/50 flex items-center gap-2 ${iconColor}`}>
        <Icon className="w-4 h-4" />
        <h3 className="font-semibold text-sm">{title}</h3>
      </div>
      <div className="p-4">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 mb-4">
          {metrics}
        </div>
        {insights && insights.length > 0 && (
          <div className="space-y-2 pt-3 border-t border-slate-700/30">
            {insights.map((insight, index) => (
              <SectionInsightCard key={index} insight={insight} />
            ))}
          </div>
        )}
      </div>
    </div>
  );

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

            {/* 1. TRADING & PRICE Section */}
            <MetricSection
              title="TRADING & PRICE"
              icon={Activity}
              iconColor="text-blue-400"
              insights={sectionInsights.trading}
              metrics={
                <>
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
                    icon={Gauge}
                    label="Beta"
                    value={data.metrics.beta}
                    tooltip="Volatility vs S&P 500 (>1 = more volatile)"
                    metric="beta"
                  />
                </>
              }
            />

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

            {/* 2. VALUATION Section */}
            <MetricSection
              title="VALUATION"
              icon={PieChart}
              iconColor="text-purple-400"
              insights={sectionInsights.valuation}
              metrics={
                <>
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
                </>
              }
            />

            {/* 3. DEBT & LIQUIDITY Section */}
            <MetricSection
              title="DEBT & LIQUIDITY"
              icon={Landmark}
              iconColor="text-red-400"
              insights={sectionInsights.debt}
              metrics={
                <>
                  <MetricCard
                    icon={Scale}
                    label="Debt/Equity"
                    value={data.metrics.debt_to_equity}
                    tooltip="Financial leverage (>100 = highly leveraged)"
                    metric="debt_to_equity"
                  />
                  <MetricCard
                    icon={Wallet}
                    label="Current Ratio"
                    value={data.metrics.current_ratio}
                    tooltip="Liquidity (<1 = may struggle with short-term debts)"
                    metric="current_ratio"
                  />
                  <MetricCard
                    icon={TrendingDown}
                    label="Short Interest"
                    value={data.metrics.short_percent !== 'N/A' ? `${data.metrics.short_percent}%` : 'N/A'}
                    tooltip="% of shares sold short (>10% = high bearish sentiment)"
                    metric="short_percent"
                  />
                </>
              }
            />

            {/* 4. PROFITABILITY & GROWTH Section */}
            <MetricSection
              title="PROFITABILITY & GROWTH"
              icon={TrendingUp}
              iconColor="text-emerald-400"
              insights={sectionInsights.profitability}
              metrics={
                <>
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
                </>
              }
            />

            {/* 5. ANALYST SENTIMENT Section */}
            <MetricSection
              title="ANALYST SENTIMENT"
              icon={Users}
              iconColor="text-cyan-400"
              insights={sectionInsights.sentiment}
              metrics={
                <>
                  <MetricCard
                    icon={Target}
                    label="Price Target"
                    value={data.metrics.target_price !== 'N/A' ? `$${data.metrics.target_price}` : 'N/A'}
                    subValue={data.metrics.target_upside !== 'N/A' ? `${data.metrics.target_upside}% upside` : ''}
                    metric="target_upside"
                  />
                  <MetricCard
                    icon={Users}
                    label="Recommendation"
                    value={data.metrics.recommendation !== 'N/A' ? data.metrics.recommendation.toUpperCase() : 'N/A'}
                    tooltip="Wall Street consensus rating"
                    metric="recommendation"
                  />
                </>
              }
            />

            {/* Main Content Grid - AI Analysis & News */}
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
