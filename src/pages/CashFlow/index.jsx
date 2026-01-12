import React, { useState, useMemo, useEffect } from 'react';
import DataTable from '../../components/Common/DataTable';
import LineTrendChart from '../../components/Common/LineTrendChart';
import LineTrendStyle from '../../components/Common/LineTrendStyleConfig';
import useTableSorting from '../../components/Common/useTableSorting';
import useFetchData from '../../hooks/useFetchData';

const CashFlowTab = () => {
  const { data: cashFlowRows } = useFetchData('getCashFlowAndPaybackPeriod');
  const { data: safetyLineRows } = useFetchData('getCapitalSafetyLine');
  const { data: safetyLineCityRows } = useFetchData('getCapitalSafetyLineCity');

  const latestMonth = useMemo(() => {
    if (!Array.isArray(cashFlowRows) || cashFlowRows.length === 0) return null;
    const months = Array.from(new Set(cashFlowRows.map(r => r.month || r['month'])));
    return months.sort((a, b) => a.localeCompare(b)).pop() || null;
  }, [cashFlowRows]);

  const operatingCashFlow = useMemo(() => {
    if (!Array.isArray(cashFlowRows) || !latestMonth) return 0;
    return cashFlowRows
      .filter(r => (r.month || r['month']) === latestMonth)
      .reduce((sum, r) => {
        const v = Number(r['累计现金流']) || 0;
        return sum + v;
      }, 0);
  }, [cashFlowRows, latestMonth]);

  const capitalSafetyLine = useMemo(() => {
    if (!Array.isArray(safetyLineRows) || safetyLineRows.length === 0) return 0;
    const row = safetyLineRows[0] || {};
    return Number(row['总和']) || 0;
  }, [safetyLineRows]);

  const availableFunds = useMemo(() => {
    return operatingCashFlow - capitalSafetyLine;
  }, [operatingCashFlow, capitalSafetyLine]);

  const cityStats = useMemo(() => {
    if (!Array.isArray(cashFlowRows) || !latestMonth) return [];
    const safetyMap = new Map(
      (Array.isArray(safetyLineCityRows) ? safetyLineCityRows : []).map(r => [r['统计城市'] || r.statistics_city_name, Number(r['资金安全线']) || 0])
    );
    return cashFlowRows
      .filter(r => (r.month || r['month']) === latestMonth)
      .map(r => {
        const city = r.statistics_city_name || r['statistics_city_name'] || r.city;
        return {
          city,
          totalDepreciation: Number(r['总折旧']) || 0,
          cumulativeCashFlow: Number(r['累计现金流']) || 0,
          cumulativePaybackPeriod: Number(r['累计投资回收期']) || 0,
          safetyLine: safetyMap.get(city) || 0
        };
      });
  }, [cashFlowRows, latestMonth, safetyLineCityRows]);

  const metrics = useMemo(() => {
    return [
      {
        key: 'operatingCashFlow',
        label: '经营现金流',
        value: operatingCashFlow,
        isStatic: true,
        highlight: false
      },
      {
        key: 'capitalSafetyLine',
        label: '资金安全线',
        value: capitalSafetyLine,
        isStatic: true,
        highlight: false
      },
      {
        key: 'availableFunds',
        label: '自有资金可用金额',
        value: availableFunds,
        isStatic: true,
        highlight: true
      }
    ];
  }, [operatingCashFlow, capitalSafetyLine, availableFunds]);

  const months = useMemo(() => Array.from({ length: 12 }, (_, i) => `25年${i + 1}月`), []);

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

  const numberFormatter = useMemo(() => {
    return new Intl.NumberFormat('zh-CN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
      useGrouping: true
    });
  }, []);

  const formatNumber = (v) => numberFormatter.format(Number(v || 0));
  const toWan = (v) => (Number(v || 0) / 10000);
  const formatWan = (v) => numberFormatter.format(toWan(v));

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
    { key: 'totalDepreciation', title: '总折旧', dataIndex: 'totalDepreciation', align: 'right', render: (val) => <div className="tabular-nums">{formatNumber(val)}</div> },
    { key: 'cumulativeCashFlow', title: '累计现金流', dataIndex: 'cumulativeCashFlow', align: 'right', render: (val) => <div className="tabular-nums">{formatNumber(val)}</div> },
    { key: 'cumulativePaybackPeriod', title: '累计投资回收期', dataIndex: 'cumulativePaybackPeriod', align: 'right', render: (val) => <div className="tabular-nums">{formatNumber(val)}</div> },
    { key: 'safetyLine', title: '资金安全线', dataIndex: 'safetyLine', align: 'right', render: (val) => <div className="tabular-nums">{formatNumber(val)}</div> }
  ];

  const { sortedData: sortedCityStats, sortConfig: citySortConfig, handleSort: handleCitySort } = useTableSorting(cityColumns, cityStats);

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
        
        <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-gray-100">
          {metrics.map((metric) => (
            <div key={metric.key} className={`p-6 flex flex-col items-center justify-center text-center ${metric.highlight ? 'bg-red-50/30' : ''}`}>
              <h3 className="text-gray-500 text-sm font-medium mb-2">{metric.label}</h3>
              <div className={`text-3xl font-bold mb-2 tabular-nums ${metric.highlight ? 'text-[#a40035]' : 'text-gray-900'}`}>
                {formatWan(metric.value)}
                <span className="ml-1 align-top text-sm text-gray-500">万元</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* City Cash Flow Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-bold text-gray-800 mb-6 border-l-4 border-[#a40035] pl-3">城市经营现金流统计</h3>
        <DataTable data={sortedCityStats} columns={cityColumns} onSort={handleCitySort} sortConfig={citySortConfig} />
      </div>

      {renderCityModal()}
    </div>
  );
};

export default CashFlowTab;
