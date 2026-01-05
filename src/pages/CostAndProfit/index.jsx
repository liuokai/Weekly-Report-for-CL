import React, { useState, useMemo, useEffect } from 'react';
import axios from 'axios';
import LineTrendChart from '../../components/Common/LineTrendChart';
import DataTable from '../../components/Common/DataTable';
import UnifiedProgressBar from '../../components/Common/UnifiedProgressBar';
import BusinessTargets from '../../config/businessTargets';
import { getTimeProgress } from '../../components/Common/TimeProgressUtils';
import CostStructureContainer from '../CashFlow/CostStructureContainer';

const CostAndProfitTab = () => {
  // Constants from requirements
  const currentProfit = 32067186.09;
  const currentProfitRate = 8.2;
  const targetProfitRate = BusinessTargets.profit.annualTargetRate;
  
  // Mocked/Derived data
  const profitGrowthRate = 2.2; // YoY Growth
  const targetAnnualProfit = 28000000; // Mock target to show completion > 100%
  
  // Time Progress Calculation
  const timeProgress = getTimeProgress();
  
  // Profit Target Completion
  const profitCompletion = (currentProfit / targetAnnualProfit) * 100;

  const formatCurrency = (val) => {
    return val.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

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
    // 1. Monthly Profit: Avg ~2.67M (National) or ~200k (City)
    if (metric === 'monthly_profit') {
      const base = isCityLevel ? 200000 : 2670000;
      const values = months.map(() => base + (Math.random() - 0.5) * base * 0.4); 
      const valuesYoY = values.map(v => v * (0.9 + Math.random() * 0.2)); 
      return { 
        title: '月度利润金额', 
        unit: '元', 
        values, 
        valuesYoY,
        formatter: (v) => (v/10000).toFixed(2) + '万'
      };
    }
    // 2. Cumulative Profit
    else if (metric === 'cumulative_profit') {
      let acc = 0;
      const base = isCityLevel ? 200000 : 2670000;
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
        formatter: (v) => v.toFixed(2) + '%'
      };
    }
  };

  const trendConfig = useMemo(() => generateTrendData(activeMetric, false), [activeMetric]);
  const modalTrendConfig = useMemo(() => generateTrendData(modalActiveMetric, true), [modalActiveMetric, selectedCity]);

  // --- City Table Data ---
  const cityTableData = useMemo(() => {
    if (!costData || !costData.city_dimension) return [];
    return costData.city_dimension.map((row, index) => {
      const revenue = Number(row.revenue) || 0;
      const netProfit = Number(row.netProfit) || 0;
      const mgmt = row.costs.find(c => c.name === '服务费');
      const labor = row.costs.find(c => c.name === '人工成本') || row.costs.find(c => c.name === '推拿师成本') || row.costs.find(c => c.name === '客户经理成本');
      const mgmtFee = mgmt ? Number(mgmt.value) || 0 : 0;
      const laborCost = labor ? Number(labor.value) || 0 : 0;
      const variableCost = revenue - netProfit - mgmtFee - laborCost;
      const profitRate = revenue ? (netProfit / revenue) * 100 : 0;
      return {
        key: index,
        city: row.name,
        revenue,
        mgmtFee,
        laborCost,
        variableCost,
        profit: netProfit,
        profitRate
      };
    });
  }, [costData]);

  const cityColumns = [
    { 
      key: 'city', 
      title: '城市', 
      dataIndex: 'city',
      render: (text) => (
        <span 
          className="text-[#a40035] cursor-pointer hover:underline font-medium"
          onClick={() => setSelectedCity(text)}
        >
          {text}
        </span>
      )
    },
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

                   {/* Row 2: Display Options (Left Aligned) */}
                   <div className="flex flex-wrap items-center gap-3">
                      <button 
                        className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${modalShowYoY ? 'bg-[#a40035] text-white shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                        onClick={() => setModalShowYoY(!modalShowYoY)}
                      >
                        显示同比
                      </button>
                      <button 
                        className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${modalShowAvg ? 'bg-[#a40035] text-white shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                        onClick={() => setModalShowAvg(!modalShowAvg)}
                      >
                        显示均值
                      </button>
                      <button 
                        className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${modalShowExtremes ? 'bg-[#a40035] text-white shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                        onClick={() => setModalShowExtremes(!modalShowExtremes)}
                      >
                        显示极值
                      </button>
                   </div>
                 </div>
              </div>

              <LineTrendChart
                headerTitle={modalTrendConfig.title}
                headerUnit={modalTrendConfig.unit}
                values={modalTrendConfig.values}
                valuesYoY={modalTrendConfig.valuesYoY}
                xLabels={months}
                showYoY={modalShowYoY}
                showAverage={modalShowAvg}
                showExtremes={modalShowExtremes}
                valueFormatter={modalTrendConfig.formatter}
                yAxisFormatter={modalTrendConfig.formatter}
                height={300}
              />
            </div>

            {/* Bottom: Store Table */}
            <div>
              <h4 className="text-sm font-bold text-gray-600 mb-4 border-l-4 border-[#a40035] pl-2">门店数据明细</h4>
              <DataTable data={storeData} columns={storeColumns} />
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
        
        {/* TOP SECTION: 3 Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-gray-100 bg-gradient-to-b from-white to-gray-50/30">
          
          {/* Annual Profit Value */}
          <div className="p-6 flex flex-col items-center justify-center text-center">
            <h3 className="text-gray-500 text-sm font-medium mb-2">年度利润值 (元)</h3>
            <div className="text-3xl font-bold text-gray-900 mb-2">
              {formatCurrency(currentProfit)}
            </div>
            <div className="flex items-center text-sm bg-red-50 px-3 py-1 rounded-full">
              <span className="text-gray-500 mr-2">同比去年</span>
              <span className="text-red-600 font-bold flex items-center">
                +{profitGrowthRate}%
                <svg className="w-4 h-4 ml-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </span>
            </div>
          </div>

          {/* Annual Profit Rate */}
          <div className="p-6 flex flex-col items-center justify-center text-center">
            <h3 className="text-gray-500 text-sm font-medium mb-2">年度利润率</h3>
            <div className="text-3xl font-bold text-gray-900 mb-2">
              {currentProfitRate}%
            </div>
            <div className="flex items-center text-sm">
              <span className="text-gray-400 mr-2">目标值 {targetProfitRate}%</span>
              <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded text-xs font-bold">
                超额达成
              </span>
            </div>
          </div>

          {/* Profit Growth Rate */}
          <div className="p-6 flex flex-col items-center justify-center text-center">
            <h3 className="text-gray-500 text-sm font-medium mb-2">利润增长率</h3>
            <div className="text-3xl font-bold text-gray-900 mb-2">
              {profitGrowthRate}%
            </div>
            <div className="h-6"></div> {/* Spacer to align with others since description is removed */}
          </div>
        </div>

        {/* BOTTOM SECTION: Merged Progress Bar */}
        <div className="p-8 border-t border-gray-100 bg-white">
           <div className="mb-4">
              <h4 className="text-sm font-bold text-gray-600 border-l-4 border-[#a40035] pl-2">利润目标完成进度</h4>
           </div>
           <UnifiedProgressBar
             label="目标完成率"
             value={profitCompletion}
             timeProgress={timeProgress}
           />
           <div className="mt-4 flex items-center justify-between">
              <div className="text-xs text-gray-400">
                 注：当实际进度超越时间进度时显示为主题色，反之显示为绿色。
              </div>
              <div className={`text-sm font-bold ${profitCompletion >= timeProgress ? 'text-[#a40035]' : 'text-green-600'}`}>
                {profitCompletion >= timeProgress ? '当前进度领先' : '当前进度滞后'}
              </div>
           </div>
        </div>
      </div>

      {/* NEW SECTION: Trend Analysis Chart */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-bold text-gray-800 mb-6 border-l-4 border-[#a40035] pl-3">成本与利润趋势分析</h3>
        
        {/* Controls Container */}
        <div className="space-y-4 mb-6">
          {/* Row 1: Metric Selectors */}
          <div className="flex flex-wrap items-center gap-3">
             <button 
               className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${activeMetric === 'monthly_profit' ? 'bg-[#a40035] text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
               onClick={() => setActiveMetric('monthly_profit')}
             >
               月度利润金额
             </button>
             <button 
               className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${activeMetric === 'cumulative_profit' ? 'bg-[#a40035] text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
               onClick={() => setActiveMetric('cumulative_profit')}
             >
               年度累计利润金额
             </button>
             <button 
               className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${activeMetric === 'profit_rate' ? 'bg-[#a40035] text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
               onClick={() => setActiveMetric('profit_rate')}
             >
               利润率
             </button>
          </div>
          
          {/* Row 2: Display Options */}
          <div className="flex flex-wrap items-center gap-3">
             <button 
               className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${showYoY ? 'bg-[#a40035] text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
               onClick={() => setShowYoY(!showYoY)}
             >
               显示同比
             </button>
             <button 
               className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${showAvg ? 'bg-[#a40035] text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
               onClick={() => setShowAvg(!showAvg)}
             >
               显示均值
             </button>
             <button 
               className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${showExtremes ? 'bg-[#a40035] text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
               onClick={() => setShowExtremes(!showExtremes)}
             >
               显示极值
             </button>
          </div>
        </div>

        {/* Chart Component */}
        <LineTrendChart
          headerTitle={trendConfig.title}
          headerUnit={trendConfig.unit}
          values={trendConfig.values}
          valuesYoY={trendConfig.valuesYoY}
          xLabels={months}
          showYoY={showYoY}
          showAverage={showAvg}
          showExtremes={showExtremes}
          valueFormatter={trendConfig.formatter}
          yAxisFormatter={trendConfig.formatter}
          height={320}
        />
      </div>

      {/* NEW SECTION: City Data Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-bold text-gray-800 mb-6 border-l-4 border-[#a40035] pl-3">城市利润明细</h3>
        <DataTable data={cityTableData} columns={cityColumns} />
      </div>

      {/* Cost Structure Analysis */}
      <CostStructureContainer />

      {renderCityModal()}
    </div>
  );
};

export default CostAndProfitTab;
