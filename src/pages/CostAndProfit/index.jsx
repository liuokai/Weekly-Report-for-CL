import React, { useState, useMemo, useEffect } from 'react';
import LineTrendChart from './Common/LineTrendChart';
import DataTable from './Common/DataTable';
import { cityStoreMap } from '../data/storeData';

const ProfitTab = () => {
  // Constants from requirements
  const currentProfit = 32067186.09;
  const currentProfitRate = 8.2;
  const targetProfitRate = 6.0;
  
  // Mocked/Derived data
  const profitGrowthRate = 2.2; // YoY Growth
  const targetAnnualProfit = 28000000; // Mock target to show completion > 100%
  
  // Time Progress Calculation (assuming 2025 based on env context)
  const today = new Date('2025-12-18');
  const startOfYear = new Date('2025-01-01');
  const endOfYear = new Date('2025-12-31');
  const totalDays = (endOfYear - startOfYear) / (1000 * 60 * 60 * 24) + 1;
  const daysElapsed = (today - startOfYear) / (1000 * 60 * 60 * 24) + 1;
  const timeProgress = Math.min((daysElapsed / totalDays) * 100, 100);
  
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
    return Object.keys(cityStoreMap).map((city, index) => {
      // Mock Financial Data per City
      const revenue = Math.floor(10000000 + Math.random() * 50000000); // 10M - 60M
      
      // Target Profit Rate: 3% - 7%
      const targetProfitRate = 3.0 + Math.random() * 4.0;
      const profit = revenue * (targetProfitRate / 100);
      
      // Costs Breakdown
      // Mgmt Fee: ~5-6%
      const mgmtFee = revenue * (0.05 + Math.random() * 0.01);
      // Labor Cost: ~50-55% (High labor intensity)
      const laborCost = revenue * (0.50 + Math.random() * 0.05);
      // Variable Cost: Remainder (Revenue - Profit - Mgmt - Labor)
      const variableCost = revenue - profit - mgmtFee - laborCost;

      const profitRate = (profit / revenue) * 100;

      return {
        key: index,
        city,
        revenue,
        mgmtFee,
        laborCost,
        variableCost,
        profit,
        profitRate
      };
    });
  }, []);

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

    // Mock Store Data for Selected City
    const storeList = cityStoreMap[selectedCity] || [];
    const storeData = storeList.map((store, index) => {
      const revenue = Math.floor(500000 + Math.random() * 2000000); // 500k - 2.5M
      const mgmtFee = revenue * 0.05;
      const laborCost = revenue * (0.4 + Math.random() * 0.1);
      const variableCost = revenue * (0.1 + Math.random() * 0.05);
      const profit = revenue - mgmtFee - laborCost - variableCost;
      const profitRate = (profit / revenue) * 100;

      return {
        key: index,
        store,
        revenue,
        mgmtFee,
        laborCost,
        variableCost,
        profit,
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
           <div className="flex flex-col space-y-4">
              {/* Header Info */}
              <div className="flex justify-between items-end mb-2">
                <div className="flex items-center space-x-6">
                   <div>
                      <span className="text-xs text-gray-400 block mb-1">目标完成率</span>
                      <span className="text-2xl font-bold text-[#a40035]">{profitCompletion.toFixed(1)}%</span>
                   </div>
                   <div className="h-8 w-px bg-gray-200"></div>
                   <div>
                      <span className="text-xs text-gray-400 block mb-1">时间进度</span>
                      <span className="text-xl font-semibold text-gray-600">{timeProgress.toFixed(1)}%</span>
                   </div>
                </div>
                <div className="text-right">
                   <div className="text-sm font-medium text-gray-700">进度对比分析</div>
                   <div className="text-xs text-gray-400">利润达成 领先于 时间进度</div>
                </div>
              </div>

              {/* Merged Visualization: Bullet Chart Style */}
              <div className="relative h-12 bg-gray-100 rounded-lg overflow-hidden w-full">
                
                {/* 1. Base Track Labels (Optional Grid) */}
                <div className="absolute inset-0 flex justify-between px-2 items-center text-[10px] text-gray-300 pointer-events-none z-10">
                   <span>0%</span>
                   <span>25%</span>
                   <span>50%</span>
                   <span>75%</span>
                   <span>100%</span>
                </div>

                {/* 2. Profit Completion Bar (The Main Bar) */}
                <div 
                  className="absolute top-0 left-0 h-full bg-gradient-to-r from-[#a40035] to-[#d63065] flex items-center justify-end pr-2 transition-all duration-1000"
                  style={{ width: `${Math.min(profitCompletion, 100)}%` }}
                >
                  <span className="text-white text-xs font-bold drop-shadow-md">完成 {profitCompletion.toFixed(0)}%</span>
                </div>

                {/* 3. Time Progress Marker (The "Target" Line) */}
                <div 
                  className="absolute top-0 bottom-0 w-0.5 bg-gray-800 z-20 flex flex-col items-center"
                  style={{ left: `${timeProgress}%` }}
                >
                  <div className="w-2 h-2 bg-gray-800 rounded-full -mt-1"></div>
                  <div className="absolute top-2 bg-gray-800 text-white text-[10px] px-1.5 py-0.5 rounded opacity-80 whitespace-nowrap transform -translate-x-1/2">
                    当前时间 {timeProgress.toFixed(0)}%
                  </div>
                  <div className="w-2 h-2 bg-gray-800 rounded-full absolute bottom-0 -mb-1"></div>
                </div>
              </div>
              
              <div className="text-xs text-gray-400 text-center pt-1">
                 注：红色进度条代表利润完成情况，黑色竖线代表当前时间进度。红条越过黑线表示当前进度超前。
              </div>
           </div>
        </div>
      </div>

      {/* NEW SECTION: Trend Analysis Chart */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-bold text-gray-800 mb-6 border-l-4 border-[#a40035] pl-3">利润趋势分析</h3>
        
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

      {/* NEW SECTION: Material Cost Review (Placeholder) */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-bold text-gray-800 mb-6 border-l-4 border-[#a40035] pl-3">物资成本检视</h3>
        <div className="flex flex-col items-center justify-center h-48 bg-gray-50 rounded-lg border border-dashed border-gray-200">
          <svg className="w-12 h-12 text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
          <span className="text-gray-400 font-medium">功能开发中，敬请期待...</span>
        </div>
      </div>

      {renderCityModal()}
    </div>
  );
};

export default ProfitTab;
