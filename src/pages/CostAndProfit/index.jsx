import React, { useState, useMemo, useEffect } from 'react';
import axios from 'axios';
import LineTrendChart from '../../components/Common/LineTrendChart';
import LineTrendStyle from '../../components/Common/LineTrendStyleConfig';
import DataTable from '../../components/Common/DataTable';
import UnifiedProgressBar from '../../components/Common/UnifiedProgressBar';
import BusinessTargets from '../../config/businessTargets';
import { getTimeProgress } from '../../components/Common/TimeProgressUtils';
import CostStructureContainer from '../CashFlow/CostStructureContainer';

const CostAndProfitTab = () => {
  const targetProfitRate = BusinessTargets.profit.annualTargetRate;
  const [yearlyRows, setYearlyRows] = useState([]);
  const [loadingYearly, setLoadingYearly] = useState(true);
  const latestRow = yearlyRows?.[0] || null;
  const prevRow = yearlyRows?.[1] || null;
  const currentProfit = latestRow ? Number(latestRow.total_profit) || 0 : 0;
  const lastYearProfit = prevRow ? Number(prevRow.total_profit) || 0 : 0;
  const currentProfitRate = latestRow ? Number(latestRow.profit_rate) || 0 : 0;
  const lastYearProfitRate = latestRow ? Number(latestRow.last_year_profit_rate) || 0 : 0;
  const profitGrowthRate = latestRow && latestRow.yoy_growth != null ? Number(latestRow.yoy_growth) || 0 : 0;
  
  // Time Progress Calculation
  const timeProgress = getTimeProgress();
  
  // Profit Target Completion（以利润率达成度为准）
  const profitCompletion = targetProfitRate > 0 ? (currentProfitRate / targetProfitRate) * 100 : 0;

  const formatCurrency = (val) => {
    return val.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  // 获取年度利润数据
  useEffect(() => {
    const fetchYearlyProfit = async () => {
      setLoadingYearly(true);
      try {
        const res = await axios.post('/api/fetch-data', {
          queryKey: 'getProfitYearly',
          params: []
        });
        if (res.data && res.data.status === 'success' && Array.isArray(res.data.data)) {
          setYearlyRows(res.data.data);
        } else {
          setYearlyRows([]);
        }
      } catch (e) {
        setYearlyRows([]);
      } finally {
        setLoadingYearly(false);
      }
    };
    fetchYearlyProfit();
  }, []);

  const [trendRows, setTrendRows] = useState([]);
  useEffect(() => {
    const fetchTrend = async () => {
      try {
        const res = await axios.post('/api/fetch-data', {
          queryKey: 'getProfitTrend'
        });
        if (res.data && res.data.status === 'success' && Array.isArray(res.data.data)) {
          setTrendRows(res.data.data);
        }
      } catch (e) {
        console.error(e);
      }
    };
    fetchTrend();
  }, []);

  // --- Trend Chart Logic ---
  const [activeMetric, setActiveMetric] = useState('monthly_profit');
  const [showYoY, setShowYoY] = useState(false);
  const [showAvg, setShowAvg] = useState(true);
  const [showExtremes, setShowExtremes] = useState(true);
  
  // City Modal State
  const [selectedCity, setSelectedCity] = useState(null);
  const [modalActiveMetric, setModalActiveMetric] = useState('monthly_profit');
  // Local state for modal chart options to allow independent control
  const [modalShowYoY, setModalShowYoY] = useState(false);
  const [modalShowAvg, setModalShowAvg] = useState(true);
  const [modalShowExtremes, setModalShowExtremes] = useState(true);

  const [costData, setCostData] = useState(null);
  useEffect(() => {
    const fetchCost = async () => {
      try {
        const res = await axios.get('/api/cost-structure');
        if (res.data && res.data.status === 'success') {
          setCostData(res.data.data);
        }
      } catch (e) {
      }
    };
    fetchCost();
  }, []);

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

  const months = Array.from({length: 12}, (_, i) => `25年${i+1}月`);
  
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
        return { 
          title: '月度利润金额', 
          unit: '元', 
          values, 
          valuesYoY: [], // No YoY in current SQL
          xLabels,
          formatter: (v) => (v/10000).toFixed(2) + '万'
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
        formatter: (v) => (v/10000).toFixed(2) + '万'
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
        formatter: (v) => (v/10000).toFixed(2) + '万'
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
                          className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                            modalActiveMetric === metric 
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
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Unified Profit Dashboard Container */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Header */}
        <div className="px-8 pt-6 pb-4 bg-white">
          <h3 className="text-lg font-bold text-gray-800 border-l-4 border-[#a40035] pl-3">年度利润概览</h3>
        </div>
        
        {/* NEW LAYOUT: Split Top (Left/Right) & Bottom Progress */}
        <div className="flex flex-col">
          {/* Top Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 border-t border-b border-gray-100">
            {/* LEFT SIDE: Amounts */}
            <div className="p-8 flex flex-col justify-center border-b lg:border-b-0 lg:border-r border-gray-100 bg-gray-50/30">
              <div className="mb-4">
                 <p className="text-sm text-gray-500 font-medium mb-1">年度利润值 (元)</p>
                 <div className="flex items-baseline gap-2">
                   <span className="text-4xl font-bold text-gray-900 tracking-tight">
                     {loadingYearly ? '...' : formatCurrency(currentProfit)}
                   </span>
                 </div>
              </div>
              
              <div className="flex items-center gap-2 text-sm">
                 <span className="text-gray-400">去年利润值:</span>
                 <span className="font-semibold text-gray-700 font-mono">
                   {loadingYearly ? '...' : formatCurrency(lastYearProfit)}
                 </span>
              </div>
            </div>

            {/* RIGHT SIDE: Ratios */}
            <div className="p-8 flex items-center justify-around bg-white">
               {/* Profit Rate */}
               <div className="flex flex-col items-center">
                  <span className="text-sm text-gray-500 mb-2">年度利润率</span>
                  <span className={`text-3xl font-bold ${currentProfitRate >= targetProfitRate ? 'text-[#a40035]' : 'text-gray-900'}`}>
                     {loadingYearly ? '...' : `${currentProfitRate}%`}
                  </span>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                      目标 {targetProfitRate}%
                    </span>
                    <span className="text-xs text-gray-400">
                      去年 {lastYearProfitRate}%
                    </span>
                  </div>
               </div>

               {/* Divider */}
               <div className="w-px h-12 bg-gray-100"></div>

               {/* Growth Rate */}
               <div className="flex flex-col items-center">
                  <span className="text-sm text-gray-500 mb-2">利润增长率</span>
                  <div className="flex items-center">
                     <span className={`text-3xl font-bold ${profitGrowthRate >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                        {loadingYearly ? '...' : (profitGrowthRate > 0 ? `+${profitGrowthRate}` : profitGrowthRate)}%
                     </span>
                     {profitGrowthRate !== 0 && (
                        <span className={`ml-1 text-lg ${profitGrowthRate >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                          {profitGrowthRate >= 0 ? '↑' : '↓'}
                        </span>
                     )}
                  </div>
                  <span className="text-xs text-gray-400 mt-1">
                    同比去年
                  </span>
               </div>
            </div>
          </div>

          {/* Bottom Section: Progress Bar (No Title) */}
          <div className="px-8 py-6 bg-white">
             <UnifiedProgressBar
               label="目标达成率"
               value={profitCompletion}
               timeProgress={timeProgress}
               height="h-3"
             />
             <div className="mt-2 flex items-center justify-end">
                <span className={`text-xs font-medium px-2 py-0.5 rounded ${profitCompletion >= timeProgress ? 'bg-red-50 text-[#a40035]' : 'bg-green-50 text-green-600'}`}>
                  {profitCompletion >= timeProgress ? '当前进度领先' : '当前进度滞后'}
                </span>
             </div>
          </div>
        </div>
      </div>

      {/* NEW SECTION: Trend Analysis Chart */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-bold text-gray-800 mb-6 border-l-4 border-[#a40035] pl-3">成本与利润趋势分析</h3>
        
        {LineTrendStyle.renderMetricSwitch(
          [
            { key: 'monthly_profit', label: '月度利润金额' },
            { key: 'profit_rate', label: '利润率' }
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
        <LineTrendChart
          values={trendConfig.values}
          valuesYoY={trendConfig.valuesYoY}
          xLabels={trendConfig.xLabels || months}
          showYoY={showYoY}
          showTrend={showAvg}
          showExtremes={showExtremes}
          valueFormatter={trendConfig.formatter}
          yAxisFormatter={trendConfig.formatter}
          height={LineTrendStyle.DIMENSIONS.height}
          width={LineTrendStyle.DIMENSIONS.width}
          colorPrimary={LineTrendStyle.COLORS.primary}
          colorYoY={LineTrendStyle.COLORS.yoy}
        />
      </div>

      {/* Cost Structure Analysis */}
      <CostStructureContainer />

      {renderCityModal()}
    </div>
  );
};

export default CostAndProfitTab;
