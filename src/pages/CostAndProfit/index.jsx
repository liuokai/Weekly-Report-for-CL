import React, { useState, useMemo, useEffect, useRef } from 'react';
import LineTrendChart from '../../components/Common/LineTrendChart';
import LineTrendStyle from '../../components/Common/LineTrendStyleConfig';
import DataTable from '../../components/Common/DataTable';
import UnifiedProgressBar from '../../components/Common/UnifiedProgressBar';
import BusinessTargets from '../../config/businessTargets';
import { getTimeProgress } from '../../components/Common/TimeProgressUtils';
import CostStructureContainer from './CostStructureContainer';
import AnnualCostAnalysis from './AnnualCostAnalysis';
import HeadquartersCostBudget from './HeadquartersCostBudget';
import HeadquartersCostBudgetTable from './HeadquartersCostBudgetTable';
import HeadquartersPostIndicatorSummaryTable from './HeadquartersPostIndicatorSummaryTable';
import BudgetCostRatioTable from './BudgetCostRatioTable';
import CostRatioComparison2026Table from './CostRatioComparison2026Table';
import StoreActualCostRatio2026Table from './StoreActualCostRatio2026Table';
import StoreDataStatistics2026Table from './StoreDataStatistics2026Table';
import ProfitSummaryTable from './ProfitSummaryTable';
import useFetchData from '../../hooks/useFetchData';
import dataLoader from '../../utils/dataLoader';

const COST_RATIO_MONTH_OPTIONS = Array.from({ length: 12 }, (_, index) => {
  const month = String(index + 1).padStart(2, '0');
  return `2026-${month}`;
});

const COST_RATIO_QUARTER_TO_MONTH_RANGE = {
  '2026Q1': ['2026-01', '2026-03'],
  '2026Q2': ['2026-04', '2026-06'],
  '2026Q3': ['2026-07', '2026-09'],
  '2026Q4': ['2026-10', '2026-12']
};

const CostAndProfitTab = () => {
  const targetProfitRate = BusinessTargets.profit.annualTargetRate;
  const storeTargetProfitRate = 12;
  const [costRatioViewMode, setCostRatioViewMode] = useState('month');
  const [costRatioStartMonth, setCostRatioStartMonth] = useState('2026-01');
  const [costRatioEndMonth, setCostRatioEndMonth] = useState(COST_RATIO_MONTH_OPTIONS[COST_RATIO_MONTH_OPTIONS.length - 1]);
  const [costRatioQuarter, setCostRatioQuarter] = useState('2026Q1');

  // 计算年度利润目标：营业额目标 × 6%
  const annualProfitTarget = BusinessTargets.turnover.annualTarget * 0.06;

  const { data: yearlyRowsRaw, loading: loadingYearly } = useFetchData('getProfitYearly', [], []);
  const yearlyRows = Array.isArray(yearlyRowsRaw) ? yearlyRowsRaw : [];
  const latestRow = yearlyRows?.[0] || null;
  const prevRow = yearlyRows?.[1] || null;
  const currentProfit = latestRow ? Number(latestRow.total_profit) || 0 : 0;
  const lastYearProfit = prevRow ? Number(prevRow.total_profit) || 0 : 0;
  const currentProfitRate = latestRow ? Number(latestRow.profit_rate) || 0 : 0;
  const lastYearProfitRate = latestRow ? Number(latestRow.last_year_profit_rate) || 0 : 0;
  const profitGrowthRate = latestRow && latestRow.yoy_growth != null ? Number(latestRow.yoy_growth) || 0 : 0;

  // 获取总部利润数据
  const { data: headquartersProfitRaw } = useFetchData('getHeadquartersProfitMonthly', [], []);
  const headquartersProfitData = Array.isArray(headquartersProfitRaw) ? headquartersProfitRaw : [];

  // 汇总总部年度利润
  const headquartersProfit = headquartersProfitData.reduce((acc, row) => {
    acc += Number(row.total_profit || 0);
    return acc;
  }, 0);

  // 汇总总部年度收入
  const headquartersRevenue = headquartersProfitData.reduce((acc, row) => {
    acc += Number(row.total_income || 0);
    return acc;
  }, 0);

  // 获取营业额目标用于计算总部预算收入
  const [turnoverTarget, setTurnoverTarget] = useState(BusinessTargets.turnover.annualTarget);

  useEffect(() => {
    const fetchTurnoverTarget = async () => {
      try {
        const dataResult = await dataLoader.fetchData('getTurnoverOverview', []);
        if (dataResult && dataResult.status === 'success' && dataResult.data && dataResult.data.length > 0) {
          const sortedData = [...dataResult.data].sort((a, b) => b.year - a.year);
          const currentYearData = sortedData[0];

          let annualTargetInWan = BusinessTargets.turnover.annualTarget;
          if (currentYearData && currentYearData.annual_target != null) {
            annualTargetInWan = Math.floor(parseFloat(currentYearData.annual_target) / 10000);
          }
          setTurnoverTarget(annualTargetInWan);
        }
      } catch (err) {
        console.error('获取营业额目标失败:', err);
      }
    };
    fetchTurnoverTarget();
  }, []);

  // 计算总部预算收入（营业额目标 * 0.025）
  const headquartersBudgetIncome = turnoverTarget * 10000 * 0.025; // 单位：元

  // 计算总部预算利润目标（预算收入 * 0.06）
  const headquartersProfitTarget = headquartersBudgetIncome * 0.06; // 单位：元

  // 计算总部+门店的年度利润目标（门店目标 + 总部目标）
  const combinedProfitTarget = annualProfitTarget * 10000 + headquartersProfitTarget; // 统一为元

  // 计算总部+门店的总利润和利润率
  const totalProfit = currentProfit + headquartersProfit;
  const totalRevenue = latestRow ? Number(latestRow.total_revenue) || 0 : 0;
  const combinedRevenue = totalRevenue + headquartersRevenue;
  const combinedProfitRate = combinedRevenue > 0 ? (totalProfit / combinedRevenue) * 100 : 0;
  const headquartersProfitRate = totalRevenue > 0 ? (headquartersProfit / totalRevenue) * 100 : 0;

  // 年度利润值达成率（实际利润 / 利润目标）- 统一单位为元
  const profitValueCompletion = annualProfitTarget > 0 ? (currentProfit / (annualProfitTarget * 10000)) * 100 : 0;

  // 总部+门店年度利润值达成率
  const combinedProfitValueCompletion = combinedProfitTarget > 0 ? (totalProfit / combinedProfitTarget) * 100 : 0;

  // 年度利润率达成率（实际利润率 / 目标利润率）
  const profitRateCompletion = storeTargetProfitRate > 0 ? (currentProfitRate / storeTargetProfitRate) * 100 : 0;

  // 总部+门店年度利润率达成率
  const combinedProfitRateCompletion = targetProfitRate > 0 ? (combinedProfitRate / targetProfitRate) * 100 : 0;

  useEffect(() => {
    if (costRatioStartMonth > costRatioEndMonth) {
      setCostRatioEndMonth(costRatioStartMonth);
    }
  }, [costRatioEndMonth, costRatioStartMonth]);

  const costRatioQueryParams = useMemo(() => {
    if (costRatioViewMode === 'quarter') {
      return COST_RATIO_QUARTER_TO_MONTH_RANGE[costRatioQuarter] || ['2026-01', '2026-03'];
    }

    return [costRatioStartMonth, costRatioEndMonth];
  }, [costRatioEndMonth, costRatioQuarter, costRatioStartMonth, costRatioViewMode]);

  const summaryValueCards = [
    {
      key: 'store-profit',
      rawValue: currentProfit,
      title: '门店年度利润值',
      value: loadingYearly ? '...' : (currentProfit / 10000).toFixed(2),
      unit: '万元',
      targetLabel: '年度利润目标',
      targetValue: `${annualProfitTarget.toFixed(2)}万元`
    },
    {
      key: 'headquarters-profit',
      rawValue: headquartersProfit,
      title: '总部年度利润值',
      value: loadingYearly ? '...' : (headquartersProfit / 10000).toFixed(2),
      unit: '万元',
      targetLabel: '年度利润目标',
      targetValue: `${(headquartersProfitTarget / 10000).toFixed(2)}万元`
    }
  ];

  const summaryRateCards = [
    {
      key: 'store-rate',
      rawValue: currentProfitRate,
      title: '门店年度利润率',
      value: loadingYearly ? '...' : `${currentProfitRate.toFixed(2)}%`,
      targetLabel: '年度利润率目标',
      targetValue: `${storeTargetProfitRate.toFixed(2)}%`
    },
    {
      key: 'headquarters-rate',
      rawValue: headquartersProfitRate,
      title: '总部年度利润率',
      value: loadingYearly ? '...' : `${headquartersProfitRate.toFixed(2)}%`,
      targetLabel: '年度利润率目标',
      targetValue: `0`
    }
  ];

  const now = new Date();
  const lastDayOfPrevMonth = new Date(now.getFullYear(), now.getMonth(), 0);
  const timeProgress = getTimeProgress(lastDayOfPrevMonth);

  const formatCurrency = (val) => {
    return val.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const { data: trendRowsRaw } = useFetchData('getProfitTrend', [], []);
  const trendRows = Array.isArray(trendRowsRaw) ? trendRowsRaw : [];

  // --- Trend Chart Logic ---
  const [activeMetric, setActiveMetric] = useState('monthly_profit');
  const [showYoY, setShowYoY] = useState(false);
  const [showAvg, setShowAvg] = useState(true);
  const [showExtremes, setShowExtremes] = useState(true);

  // 折线图容器宽度自适应
  const chartContainerRef = useRef(null);
  const [chartContainerWidth, setChartContainerWidth] = useState(800);

  useEffect(() => {
    if (!chartContainerRef.current) return;
    const observer = new ResizeObserver(entries => {
      for (const entry of entries) {
        const w = Math.floor(entry.contentRect.width);
        if (w > 0) setChartContainerWidth(w);
      }
    });
    observer.observe(chartContainerRef.current);
    setChartContainerWidth(Math.floor(chartContainerRef.current.getBoundingClientRect().width) || 800);
    return () => observer.disconnect();
  }, []);

  // City Modal State
  const [selectedCity, setSelectedCity] = useState(null);
  const [modalActiveMetric, setModalActiveMetric] = useState('monthly_profit');
  // Local state for modal chart options to allow independent control
  const [modalShowYoY, setModalShowYoY] = useState(false);
  const [modalShowAvg, setModalShowAvg] = useState(true);
  const [modalShowExtremes, setModalShowExtremes] = useState(true);

  const [costData, setCostData] = useState(null);
  // Note: Cost structure data fetching has been moved to CostStructureContainer component
  // which uses static configuration instead of server-side mapping.

  // Lock body scroll when modal is open
  useEffect(() => {
    if (selectedCity) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [selectedCity]);

  const months = Array.from({ length: 12 }, (_, i) => `25年${i + 1}月`);

  // Data Simulation Helper
  const generateTrendData = (metric, isCityLevel = false) => {
    // Main Chart Logic (Real Data)
    if (!isCityLevel) {
      // 1. Sort and Filter Data (Last 12 months)
      const sortedData = [...trendRows].sort((a, b) => a.stat_month.localeCompare(b.stat_month));
      const recentData = sortedData.slice(-12);
      const xLabels = recentData.map(d => d.stat_month);

      // 2. Map Metric
      if (metric === 'monthly_profit') {
        const values = recentData.map(d => Number(d.total_profit) || 0);
        const costValues = recentData.map(d => Number(d.total_cost) || 0);

        return {
          title: '月度利润金额',
          unit: '元',
          values,
          valuesYoY: [], // No YoY in current SQL
          costValues, // 成本数据
          xLabels,
          formatter: (v) => (v / 10000).toFixed(2) + '万'
        };
      } else if (metric === 'profit_rate') {
        const values = recentData.map(d => Number(d.profit_rate) || 0);
        return {
          title: '利润率',
          unit: '%',
          values,
          valuesYoY: [],
          xLabels,
          formatter: (v) => v.toFixed(2) + '%'
        };
      } else if (metric === 'revenue_cost') {
        const revenueValues = recentData.map(d => Number(d.total_revenue) || 0);
        const costValues = recentData.map(d => Number(d.total_cost) || 0);

        return {
          title: '营业额与成本',
          unit: '元',
          values: revenueValues, // 主线：营业额
          valuesYoY: [],
          costValues, // 副线：成本
          xLabels,
          formatter: (v) => (v / 10000).toFixed(2) + '万'
        };
      }
      return { title: '', unit: '', values: [], valuesYoY: [], xLabels: [], formatter: (v) => v };
    }

    // City Modal Logic (Mock Data)
    // 1. Monthly Profit: Avg ~2.67M (National) or ~200k (City)
    if (metric === 'monthly_profit') {
      const base = 200000;
      const values = months.map(() => base + (Math.random() - 0.5) * base * 0.4);
      const valuesYoY = values.map(v => v * (0.9 + Math.random() * 0.2));
      return {
        title: '月度利润金额',
        unit: '元',
        values,
        valuesYoY,
        xLabels: months,
        formatter: (v) => (v / 10000).toFixed(2) + '万'
      };
    }
    // 2. Cumulative Profit
    else if (metric === 'cumulative_profit') {
      let acc = 0;
      const base = 200000;
      const values = months.map((_, i) => {
        const monthly = base + (i > 8 ? base * 0.2 : 0) + (Math.random() - 0.5) * base * 0.2;
        acc += monthly;
        return acc;
      });
      const valuesYoY = values.map(v => v * 0.95);
      return {
        title: '年度累计利润金额',
        unit: '元',
        values,
        valuesYoY,
        xLabels: months,
        formatter: (v) => (v / 10000).toFixed(2) + '万'
      };
    }
    // 3. Profit Rate
    else {
      const values = months.map((_, i) => {
        return 6.0 + (i * 0.2) + (Math.random() - 0.5) * 1.5;
      });
      const valuesYoY = values.map(v => v - 0.5);
      return {
        title: '利润率',
        unit: '%',
        values,
        valuesYoY,
        xLabels: months,
        formatter: (v) => v.toFixed(2) + '%'
      };
    }
  };

  const trendConfig = useMemo(() => generateTrendData(activeMetric, false), [activeMetric, trendRows]);
  const modalTrendConfig = useMemo(() => generateTrendData(modalActiveMetric, true), [modalActiveMetric, selectedCity]);

  // 已移除城市利润明细数据与列定义

  const renderCityModal = () => {
    if (!selectedCity) return null;

    const rows = (costData?.store_dimension || []).filter(r => r.city === selectedCity).map((r, idx) => {
      const revenue = Number(r.revenue) || 0;
      const netProfit = Number(r.netProfit) || 0;
      const mgmt = r.costs.find(c => c.name === '服务费');
      const labor = r.costs.find(c => c.name === '人工成本') || r.costs.find(c => c.name === '推拿师成本') || r.costs.find(c => c.name === '客户经理成本');
      const mgmtFee = mgmt ? Number(mgmt.value) || 0 : 0;
      const laborCost = labor ? Number(labor.value) || 0 : 0;
      const variableCost = revenue - netProfit - mgmtFee - laborCost;
      const profitRate = revenue ? (netProfit / revenue) * 100 : 0;
      return {
        key: idx,
        store: r.store,
        revenue,
        mgmtFee,
        laborCost,
        variableCost,
        profit: netProfit,
        profitRate
      };
    });

    const storeColumns = [
      { key: 'store', title: '门店名称', dataIndex: 'store' },
      {
        key: 'revenue',
        title: '营业额',
        dataIndex: 'revenue',
        render: (val) => val.toLocaleString('zh-CN', { maximumFractionDigits: 0 })
      },
      {
        key: 'mgmtFee',
        title: '管理费',
        dataIndex: 'mgmtFee',
        render: (val) => val.toLocaleString('zh-CN', { maximumFractionDigits: 0 })
      },
      {
        key: 'laborCost',
        title: '人工成本',
        dataIndex: 'laborCost',
        render: (val) => val.toLocaleString('zh-CN', { maximumFractionDigits: 0 })
      },
      {
        key: 'variableCost',
        title: '变动成本',
        dataIndex: 'variableCost',
        render: (val) => val.toLocaleString('zh-CN', { maximumFractionDigits: 0 })
      },
      {
        key: 'profit',
        title: '利润',
        dataIndex: 'profit',
        render: (val) => val.toLocaleString('zh-CN', { maximumFractionDigits: 0 })
      },
      {
        key: 'profitRate',
        title: '利润率',
        dataIndex: 'profitRate',
        render: (val) => {
          const isHigh = val > 6.0;
          return (
            <span className={`font-medium ${isHigh ? 'text-red-600' : 'text-gray-700'}`}>
              {val.toFixed(2)}%
            </span>
          );
        }
      }
    ];

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={() => setSelectedCity(null)}>
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
          <div className="flex items-center justify-between p-6 border-b border-gray-100">
            <h3 className="text-xl font-bold text-gray-800">{selectedCity} - 利润分析</h3>
            <button onClick={() => setSelectedCity(null)} className="text-gray-400 hover:text-gray-600">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
            </button>
          </div>

          <div className="p-6 space-y-8">
            {/* Top: Trend Chart */}
            <div>
              <div className="mb-6">
                <h4 className="text-sm font-bold text-gray-600 border-l-4 border-[#a40035] pl-2 mb-4">趋势分析</h4>

                <div className="space-y-3">
                  {/* Row 1: Metric Selectors (Left Aligned) */}
                  <div className="flex flex-wrap items-center gap-3">
                    {['monthly_profit', 'cumulative_profit', 'profit_rate'].map(metric => (
                      <button
                        key={metric}
                        onClick={() => setModalActiveMetric(metric)}
                        className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${modalActiveMetric === metric
                          ? 'bg-[#a40035] text-white shadow-sm'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }`}
                      >
                        {metric === 'monthly_profit' && '月度利润'}
                        {metric === 'cumulative_profit' && '累计利润'}
                        {metric === 'profit_rate' && '利润率'}
                      </button>
                    ))}
                  </div>

                  {/* Row 2: Display Options (Unified Aux Controls) */}
                  <div className="flex flex-wrap items-center gap-3">
                    {LineTrendStyle.renderAuxControls({
                      showYoY: modalShowYoY,
                      setShowYoY: () => setModalShowYoY(!modalShowYoY),
                      showTrend: modalShowAvg,
                      setShowTrend: () => setModalShowAvg(!modalShowAvg),
                      showExtremes: modalShowExtremes,
                      setShowExtremes: () => setModalShowExtremes(!modalShowExtremes)
                    })}
                  </div>
                </div>
              </div>

              {LineTrendStyle.renderHeader(modalTrendConfig.title, modalTrendConfig.unit)}
              <LineTrendChart
                values={modalTrendConfig.values}
                valuesYoY={modalTrendConfig.valuesYoY}
                xLabels={months}
                showYoY={modalShowYoY}
                showTrend={modalShowAvg}
                showExtremes={modalShowExtremes}
                valueFormatter={modalTrendConfig.formatter}
                yAxisFormatter={modalTrendConfig.formatter}
                height={LineTrendStyle.DIMENSIONS.height}
                width={LineTrendStyle.DIMENSIONS.width}
                colorPrimary={LineTrendStyle.COLORS.primary}
                colorYoY={LineTrendStyle.COLORS.yoy}
              />
            </div>

            {/* Bottom: Store Table */}
            <div>
              <h4 className="text-sm font-bold text-gray-600 mb-4 border-l-4 border-[#a40035] pl-2">门店数据明细</h4>
              <DataTable data={rows} columns={storeColumns} />
            </div>
          </div>
          <p className="hidden">
            利润值=门店利润+总部利润，利润率=（门店利润+总部利润）/（门店营业额+总部收入）
          </p>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* 总部+门店年度利润概览 */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Header */}
        <div className="px-8 pt-6 pb-4 bg-white">
          <h3 className="text-lg font-bold text-gray-800 border-l-4 border-[#a40035] pl-3">总部+门店年度利润概览 (截止到上月)</h3>
          <div className="mt-2 pl-4 text-sm text-gray-500 space-y-1">
            <p>利润值=门店利润+总部利润，</p>
            <p>利润率=（门店利润+总部利润）/（门店营业额+总部收入）</p>
            <p>注：房租（每月约800多万）、人员社保工资（每月约400多万）等费用为一次性缴纳，因此月初利润会有较大波动</p>
          </div>
        </div>

        {/* Layout: Split Top (Left/Right) */}
        <div className="flex flex-col">
          {/* Top Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 border-t border-gray-100">
            {/* LEFT SIDE: Amounts */}
            <div className="p-8 flex flex-col items-center justify-center text-center border-b lg:border-b-0 lg:border-r border-gray-100 bg-gray-50/30">
              <div className="mb-4">
                <p className="text-sm text-gray-500 font-medium mb-1">综合年度利润值 (万元)</p>
                <div className="flex items-baseline justify-center gap-2">
                  <span className={`text-4xl font-bold tracking-tight ${totalProfit < 0 ? 'text-[#a40035]' : 'text-gray-900'}`}>
                    {loadingYearly ? '...' : (totalProfit / 10000).toFixed(2)}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-center gap-2 text-sm mt-2">
                <span className="text-gray-400">总年度利润目标:</span>
                <span className="font-semibold text-gray-700 font-mono">
                  {(combinedProfitTarget / 10000).toFixed(2)}万元
                </span>
              </div>

            </div>

            {/* RIGHT SIDE: Rates */}
            <div className="p-8 flex flex-col items-center justify-center text-center">
              <div className="mb-4">
                <p className="text-sm text-gray-500 font-medium mb-1">综合年度利润率</p>
                <div className="flex items-baseline justify-center gap-2">
                  <span className={`text-4xl font-bold tracking-tight ${combinedProfitRate < 0 ? 'text-[#a40035]' : combinedProfitRate >= targetProfitRate ? 'text-[#a40035]' : 'text-gray-900'}`}>
                    {loadingYearly ? '...' : combinedProfitRate.toFixed(2)}
                    <span className="text-xl ml-1">%</span>
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-center gap-2 text-sm mt-2">
                <span className="text-gray-400">总年度利润率目标:</span>
                <span className="font-semibold text-gray-700 font-mono">
                  6.00%
                </span>
              </div>

               
            </div>
          </div>

          <div className="grid grid-cols-1 gap-8 border-t border-gray-100 px-8 py-6 sm:grid-cols-2">
            <div className="text-center">
              <div className="mb-4 text-center">
                <p className="mb-2 text-sm font-medium text-gray-500"> </p>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {summaryValueCards.map((card) => (
                  <div key={card.key} className="py-1 text-center">
                    <div className="text-xs font-semibold text-gray-500">
                      {card.title}
                    </div>
                    <div className={`mt-3 text-2xl font-bold tracking-tight ${card.rawValue < 0 ? 'text-[#a40035]' : 'text-gray-900'}`}>{card.value}</div>
                    <div className="mt-3 text-sm text-gray-500">
                      {card.targetLabel}：<span className="font-semibold text-gray-800">{card.targetValue}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="text-center">
              <div className="mb-4 text-center">
                <p className="mb-2 text-sm font-medium text-gray-500"> </p>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {summaryRateCards.map((card) => (
                  <div key={card.key} className="py-1 text-center">
                    <div className="text-xs font-semibold text-gray-500">
                      {card.title}
                    </div>
                    <div className={`mt-3 text-2xl font-bold tracking-tight ${card.rawValue < 0 ? 'text-[#a40035]' : 'text-gray-900'}`}>{card.value}</div>
                    <div className="mt-3 text-sm text-gray-500">
                      {card.targetLabel}：<span className="font-semibold text-gray-800">{card.targetValue}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="border-t border-gray-100 px-8 pb-6">
            <div className="mt-6">
              <UnifiedProgressBar
                label="年度利润值达成率"
                value={combinedProfitValueCompletion}
                timeProgress={timeProgress}
                height="h-3"
              />
              <div className="mt-2 flex items-center justify-end">
                <span className={`text-xs font-medium px-2 py-0.5 rounded ${combinedProfitValueCompletion >= timeProgress ? 'bg-green-50 text-green-600' : 'bg-red-50 text-[#a40035]'}`}>
                  {combinedProfitValueCompletion >= timeProgress ? '当前进度领先' : '当前进度滞后'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>


      {/* ???????*/}
      <ProfitSummaryTable />




      {/* Unified Profit Dashboard Container */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Header */}
        <div className="px-8 pt-6 pb-4 bg-white">
          <h3 className="text-lg font-bold text-gray-800 border-l-4 border-[#a40035] pl-3">门店年度利润概览</h3>
        </div>

        {/* NEW LAYOUT: Split Top (Left/Right) */}
        <div className="flex flex-col">
          {/* Top Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 border-t border-gray-100">
            {/* LEFT SIDE: Amounts */}
            <div className="p-8 flex flex-col justify-center border-b lg:border-b-0 lg:border-r border-gray-100 bg-gray-50/30">
              <div className="mb-4">
                <p className="text-sm text-gray-500 font-medium mb-1">年度利润值 (万元)</p>
                <div className="flex items-baseline gap-2">
                  <span className={`text-4xl font-bold tracking-tight ${currentProfit < 0 ? 'text-[#a40035]' : 'text-gray-900'}`}>
                    {loadingYearly ? '...' : (currentProfit / 10000).toFixed(2)}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 text-sm">
                <span className="text-gray-400">去年利润值:</span>
                <span className="font-semibold text-gray-700 font-mono">
                  {(lastYearProfit / 10000).toFixed(2)}万元
                </span>
                <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${profitGrowthRate >= 0 ? 'bg-red-50 text-[#a40035]' : 'bg-green-50 text-green-600'}`}>
                  {profitGrowthRate > 0 ? '+' : ''}{profitGrowthRate.toFixed(1)}%
                </span>
              </div>

              <div className="flex items-center gap-2 text-sm mt-2">
                <span className="text-gray-400">年度利润目标:</span>
                <span className="font-semibold text-gray-700 font-mono">
                  {annualProfitTarget.toFixed(2)}万元
                </span>
              </div>

              {/* 年度利润值达成率进度条 */}
              <div className="mt-4">
                <UnifiedProgressBar
                  label="年度利润值达成率"
                  value={profitValueCompletion}
                  timeProgress={timeProgress}
                  height="h-3"
                />
                <div className="mt-2 flex items-center justify-end">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded ${profitValueCompletion >= timeProgress ? 'bg-green-50 text-green-600' : 'bg-red-50 text-[#a40035]'}`}>
                    {profitValueCompletion >= timeProgress ? '当前进度领先' : '当前进度滞后'}
                  </span>
                </div>
              </div>
            </div>

            {/* RIGHT SIDE: Rates */}
            <div className="p-8 flex flex-col justify-center">
              <div className="mb-4">
                <p className="text-sm text-gray-500 font-medium mb-1">年度利润率</p>
                <div className="flex items-baseline gap-2">
                  <span className={`text-4xl font-bold tracking-tight ${currentProfitRate < 0 ? 'text-[#a40035]' : currentProfitRate >= storeTargetProfitRate ? 'text-[#a40035]' : 'text-gray-900'}`}>
                    {loadingYearly ? '...' : currentProfitRate.toFixed(2)}
                    <span className="text-xl ml-1">%</span>
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 text-sm">
                <span className="text-gray-400">去年同期:</span>
                <span className="font-semibold text-gray-700 font-mono">
                  {lastYearProfitRate.toFixed(2)}%
                </span>
                <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${currentProfitRate >= lastYearProfitRate ? 'bg-red-50 text-[#a40035]' : 'bg-green-50 text-green-600'}`}>
                  {currentProfitRate >= lastYearProfitRate ? '↑' : '↓'}
                  {Math.abs(currentProfitRate - lastYearProfitRate).toFixed(2)}%
                </span>
              </div>

              <div className="flex items-center gap-2 text-sm mt-2">
                <span className="text-gray-400">年度利润率目标:</span>
                <span className="font-semibold text-gray-700 font-mono">
                  {storeTargetProfitRate.toFixed(2)}%
                </span>
              </div>

              {/* 年度利润率达成率进度条 */}
              <div className="mt-4">
                <UnifiedProgressBar
                  label="年度利润率达成率"
                  value={profitRateCompletion}
                  timeProgress={timeProgress}
                  height="h-3"
                />
                <div className="mt-2 flex items-center justify-end">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded ${profitRateCompletion >= timeProgress ? 'bg-green-50 text-green-600' : 'bg-red-50 text-[#a40035]'}`}>
                    {profitRateCompletion >= timeProgress ? '当前进度领先' : '当前进度滞后'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>


      {/* 2026年门店数据统计 */}
      <StoreDataStatistics2026Table />

      {/* NEW SECTION: Trend Analysis Chart */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-bold text-gray-800 mb-6 border-l-4 border-[#a40035] pl-3">门店成本与利润趋势分析</h3>

        {LineTrendStyle.renderMetricSwitch(
          [
            { key: 'monthly_profit', label: '月度利润金额' },
            { key: 'profit_rate', label: '利润率' },
            { key: 'revenue_cost', label: '营业额与成本' }
          ],
          activeMetric,
          setActiveMetric
        )}
        {LineTrendStyle.renderAuxControls({
          showYoY,
          setShowYoY: () => setShowYoY(!showYoY),
          showTrend: showAvg,
          setShowTrend: () => setShowAvg(!showAvg),
          showExtremes,
          setShowExtremes: () => setShowExtremes(!showExtremes)
        })}

        {/* Chart Component */}
        <div ref={chartContainerRef} style={{ overflow: 'hidden' }}>
          <LineTrendChart
            values={trendConfig.values}
            valuesYoY={trendConfig.valuesYoY}
            valuesSecondary={activeMetric === 'revenue_cost' ? trendConfig.costValues : []}
            secondaryLabel="成本"
            xLabels={trendConfig.xLabels || months}
            showYoY={showYoY}
            showTrend={showAvg}
            showExtremes={showExtremes}
            valueFormatter={trendConfig.formatter}
            yAxisFormatter={trendConfig.formatter}
            currentLabel={activeMetric === 'revenue_cost' ? '营业额' : '利润'}
            height={LineTrendStyle.DIMENSIONS.height}
            width={chartContainerWidth}
            padding={{ top: 40, right: 90, bottom: 60, left: 90 }}
            colorPrimary={LineTrendStyle.COLORS.primary}
            colorYoY={LineTrendStyle.COLORS.yoy}
            colorSecondary="#10b981"
          />
        </div>
      </div>



      {/* Annual Cost Analysis */}
      <AnnualCostAnalysis data={latestRow} />




      {/* 2026年门店实际成本占比情况 */}
      <StoreActualCostRatio2026Table
        viewMode={costRatioViewMode}
        startMonth={costRatioStartMonth}
        endMonth={costRatioEndMonth}
        selectedQuarter={costRatioQuarter}
        onViewModeChange={setCostRatioViewMode}
        onStartMonthChange={setCostRatioStartMonth}
        onEndMonthChange={setCostRatioEndMonth}
        onSelectedQuarterChange={setCostRatioQuarter}
        queryParams={costRatioQueryParams}
      />


      {/* 预算成本占比情况 */}
      <BudgetCostRatioTable />

      {/* 成本占比对比 */}
      <CostRatioComparison2026Table queryParams={costRatioQueryParams} />


      {/* 城市维度门店成本结构分析 */}

      {/* Cost Structure Analysis */}
      <CostStructureContainer />


      {/* 总部利润汇总 */}
      {/* Headquarters Cost Budget */}.0
      
      <HeadquartersCostBudgetTable />



      {/* 总部岗位及指标汇总 */}
      <HeadquartersPostIndicatorSummaryTable />









      {/* 总部成本预算 老版 */}
      {/* <HeadquartersCostBudget /> */}
      {renderCityModal()}
    </div>
  );
};

export default CostAndProfitTab;
