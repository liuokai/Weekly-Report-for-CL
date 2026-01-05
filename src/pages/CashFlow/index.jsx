import React, { useState, useMemo, useEffect } from 'react';
import DataTable from '../../components/Common/DataTable';
import LineTrendChart from '../../components/Common/LineTrendChart';
import useFetchData from '../../hooks/useFetchData';

const CashFlowTab = () => {
  // Data Constants
  const data = {
    current: {
      newStoreInvestment: 1816,
      operatingCashFlow: 4790,
      annualSurplus: 2974
    },
    lastYear: {
      newStoreInvestment: 3308,
      operatingCashFlow: 4798,
      annualSurplus: 1490
    }
  };

  // City Cash Flow Data (from src/data/城市维度现金流.csv)
  const cityCashFlowData = [
    { city: "成都市", newStoreInvestment: 529, operatingCashFlow: 2839, annualSurplus: 2310, safetyLine: 2000 },
    { city: "重庆市", newStoreInvestment: 116, operatingCashFlow: 649, annualSurplus: 533, safetyLine: 450 },
    { city: "深圳市", newStoreInvestment: 449, operatingCashFlow: 618, annualSurplus: 169, safetyLine: 400 },
    { city: "杭州市", newStoreInvestment: 129, operatingCashFlow: 155, annualSurplus: 26, safetyLine: 120 },
    { city: "南京市", newStoreInvestment: 59, operatingCashFlow: 47, annualSurplus: -12, safetyLine: 40 },
    { city: "宁波市", newStoreInvestment: 0, operatingCashFlow: -15, annualSurplus: -15, safetyLine: 0 },
    { city: "广州市", newStoreInvestment: 65, operatingCashFlow: 115, annualSurplus: 50, safetyLine: 80 },
    { city: "上海市", newStoreInvestment: 71, operatingCashFlow: 146, annualSurplus: 75, safetyLine: 100 },
    { city: "北京市", newStoreInvestment: 397, operatingCashFlow: 236, annualSurplus: -161, safetyLine: 150 }
  ];

  // Helper to calculate YoY
  const calculateYoY = (current, last) => {
    const value = ((current - last) / last) * 100;
    return {
      value: Math.abs(value).toFixed(2),
      direction: value >= 0 ? 'up' : 'down',
      sign: value >= 0 ? '+' : '-'
    };
  };

  const metrics = [
    {
      key: 'newStoreInvestment',
      label: '新店投资',
      value: data.current.newStoreInvestment,
      lastValue: data.lastYear.newStoreInvestment,
      yoY: calculateYoY(data.current.newStoreInvestment, data.lastYear.newStoreInvestment)
    },
    {
      key: 'operatingCashFlow',
      label: '经营现金流',
      value: data.current.operatingCashFlow,
      lastValue: data.lastYear.operatingCashFlow,
      yoY: calculateYoY(data.current.operatingCashFlow, data.lastYear.operatingCashFlow)
    },
    {
      key: 'annualSurplus',
      label: '年度结余',
      value: data.current.annualSurplus,
      lastValue: data.lastYear.annualSurplus,
      yoY: calculateYoY(data.current.annualSurplus, data.lastYear.annualSurplus),
      highlight: true // Special highlight for this metric
    },
    {
      key: 'safetyLine',
      label: '资金安全线',
      value: 16000000,
      unit: '(元)',
      isStatic: true
    }
  ];

  // Funds Trend (between overview and city table)
  const [fundsShowYoY, setFundsShowYoY] = useState(false);
  const [fundsShowAvg, setFundsShowAvg] = useState(true);
  const [fundsShowExtremes, setFundsShowExtremes] = useState(true);
  const months = useMemo(() => Array.from({ length: 12 }, (_, i) => `25年${i + 1}月`), []);

  const generateCumulativeSeries = (total) => {
    const parts = Array.from({ length: 12 }, () => Math.random() + 0.2);
    const sum = parts.reduce((a, b) => a + b, 0);
    const increments = parts.map(p => (total * p) / sum);
    const cumulative = [];
    let acc = 0;
    for (let i = 0; i < increments.length; i++) {
      acc += increments[i];
      cumulative.push(acc);
    }
    return cumulative;
  };

  const fundsTrendConfig = useMemo(() => {
    const currentTotal = data.current.annualSurplus; // 2974
    const lastTotal = data.lastYear.annualSurplus;   // 1490
    const values = generateCumulativeSeries(currentTotal);
    const valuesYoY = generateCumulativeSeries(lastTotal);
    return {
      title: '现金流结余（月度累计）',
      unit: '万元',
      values,
      valuesYoY,
      formatter: (v) => Math.round(v).toString()
    };
  }, [data.current.annualSurplus, data.lastYear.annualSurplus]);

  // Modal State
  const [selectedCity, setSelectedCity] = useState(null);
  
  // Modal Chart State
  const [modalActiveMetric, setModalActiveMetric] = useState('annualSurplus');
  const [modalShowYoY, setModalShowYoY] = useState(false);
  const [modalShowAvg, setModalShowAvg] = useState(true);
  const [modalShowExtremes, setModalShowExtremes] = useState(true);

  const { data: storeWeeklyTurnover } = useFetchData('getCityStoreWeeklyTurnover');

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

  // Generate Mock Trend Data for Modal
  
  const generateTrendData = (metric) => {
    let base = 0;
    let title = '';
    
    if (metric === 'newStoreInvestment') {
      base = 50;
      title = '新店投资';
    } else if (metric === 'operatingCashFlow') {
      base = 200;
      title = '经营现金流';
    } else {
      base = 150;
      title = '年度结余';
    }

    const values = months.map(() => base + (Math.random() - 0.5) * base * 0.8);
    const valuesYoY = values.map(v => v * (0.9 + Math.random() * 0.2));

    return {
      title,
      unit: '万元',
      values,
      valuesYoY,
      formatter: (v) => v.toFixed(0)
    };
  };

  const modalTrendConfig = useMemo(() => generateTrendData(modalActiveMetric), [modalActiveMetric, selectedCity]);

  // Generate Store Data for Modal
  const storeData = useMemo(() => {
    if (!selectedCity) return [];
    
    const stores = (storeWeeklyTurnover || [])
      .filter(r => (r.statistics_city_name || r.city) === selectedCity)
      .map(r => r.store_name);
    const uniqueStores = Array.from(new Set(stores));
    return uniqueStores.map((store, index) => {
      // Mock data for each store
      const newStoreInvestment = Math.floor(Math.random() * 50);
      const operatingCashFlow = Math.floor(20 + Math.random() * 100);
      const annualSurplus = operatingCashFlow - newStoreInvestment;
      
      return {
        key: index,
        store,
        newStoreInvestment,
        operatingCashFlow,
        annualSurplus
      };
    });
  }, [selectedCity, storeWeeklyTurnover]);

  // Table Columns
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
    { key: 'newStoreInvestment', title: '今年新店投资', dataIndex: 'newStoreInvestment' },
    { key: 'operatingCashFlow', title: '今年经营现金流', dataIndex: 'operatingCashFlow' },
    { key: 'annualSurplus', title: '今年年度结余', dataIndex: 'annualSurplus' },
    { key: 'safetyLine', title: '资金安全线', dataIndex: 'safetyLine', render: (val) => val?.toLocaleString() }
  ];

  const storeColumns = [
    { key: 'store', title: '门店名称', dataIndex: 'store' },
    { key: 'newStoreInvestment', title: '新店投资', dataIndex: 'newStoreInvestment' },
    { key: 'operatingCashFlow', title: '经营现金流', dataIndex: 'operatingCashFlow' },
    { key: 'annualSurplus', title: '年度结余', dataIndex: 'annualSurplus' }
  ];

  const renderCityModal = () => {
    if (!selectedCity) return null;

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={() => setSelectedCity(null)}>
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
          <div className="flex items-center justify-between p-6 border-b border-gray-100">
             <h3 className="text-xl font-bold text-gray-800">{selectedCity} - 资金结余分析</h3>
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
                      {['newStoreInvestment', 'operatingCashFlow', 'annualSurplus'].map(metric => (
                        <button
                          key={metric}
                          onClick={() => setModalActiveMetric(metric)}
                          className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                            modalActiveMetric === metric 
                              ? 'bg-[#a40035] text-white shadow-sm' 
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }`}
                        >
                          {metric === 'newStoreInvestment' && '新店投资'}
                          {metric === 'operatingCashFlow' && '经营现金流'}
                          {metric === 'annualSurplus' && '年度结余'}
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
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <h3 className="text-lg font-bold text-gray-800 p-6 border-b border-gray-100 bg-gray-50/50">
          总部现金流概览
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-gray-100">
          {metrics.map((metric) => (
            <div key={metric.key} className={`p-6 flex flex-col items-center justify-center text-center ${metric.highlight ? 'bg-red-50/30' : ''}`}>
              <h3 className="text-gray-500 text-sm font-medium mb-2">{metric.label} {metric.unit || '(万元)'}</h3>
              <div className={`text-3xl font-bold mb-2 ${metric.highlight ? 'text-[#a40035]' : 'text-gray-900'}`}>
                {metric.value.toLocaleString()}
              </div>
              
              <div className="flex flex-col items-center space-y-1">
                {!metric.isStatic ? (
                  <>
                    <div className="flex items-center text-sm">
                      <span className="text-gray-400 mr-2">去年同期: {metric.lastValue.toLocaleString()}</span>
                    </div>
                    
                    <div className={`flex items-center text-sm px-2 py-0.5 rounded-full ${metric.yoY.direction === 'up' ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
                      <span className="font-medium mr-1">同比</span>
                      <span className="font-bold flex items-center">
                        {metric.yoY.sign}{metric.yoY.value}%
                        {metric.yoY.direction === 'up' ? (
                          <svg className="w-4 h-4 ml-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                          </svg>
                        ) : (
                          <svg className="w-4 h-4 ml-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
                          </svg>
                        )}
                      </span>
                    </div>
                  </>
                ) : (
                  <div className="flex items-center text-sm text-gray-400 mt-2 min-h-[48px]">
                     固定指标
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Funds Trend Container (between overview and city table) */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-bold text-gray-800 mb-6 border-l-4 border-[#a40035] pl-3">资金结余趋势分析</h3>
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <button
              className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${fundsShowYoY ? 'bg-[#a40035] text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
              onClick={() => setFundsShowYoY(!fundsShowYoY)}
            >
              显示同比
            </button>
            <button
              className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${fundsShowAvg ? 'bg-[#a40035] text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
              onClick={() => setFundsShowAvg(!fundsShowAvg)}
            >
              显示均值
            </button>
            <button
              className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${fundsShowExtremes ? 'bg-[#a40035] text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
              onClick={() => setFundsShowExtremes(!fundsShowExtremes)}
            >
              显示极值
            </button>
          </div>
          <LineTrendChart
            headerTitle={fundsTrendConfig.title}
            headerUnit={fundsTrendConfig.unit}
            values={fundsTrendConfig.values}
            valuesYoY={fundsTrendConfig.valuesYoY}
            xLabels={months}
            showYoY={fundsShowYoY}
            showAverage={fundsShowAvg}
            showExtremes={fundsShowExtremes}
            valueFormatter={fundsTrendConfig.formatter}
            yAxisFormatter={fundsTrendConfig.formatter}
            height={320}
          />
        </div>
      </div>
      
      {/* City Cash Flow Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-bold text-gray-800 mb-6 border-l-4 border-[#a40035] pl-3">城市资金结余一览</h3>
        <DataTable data={cityCashFlowData} columns={cityColumns} />
      </div>

      {renderCityModal()}
    </div>
  );
};

export default CashFlowTab;
