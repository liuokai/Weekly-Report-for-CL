import React, { useState, useMemo, useEffect } from 'react';
import DataTable from '../../components/Common/DataTable';
import LineTrendChart from '../../components/Common/LineTrendChart';
import LineTrendStyle from '../../components/Common/LineTrendStyleConfig';
import useTableSorting from '../../components/Common/useTableSorting';
import useFetchData from '../../hooks/useFetchData';
import UnifiedProgressBar from '../../components/Common/UnifiedProgressBar';
import BusinessTargets from '../../config/businessTargets';
import { getTimeProgress } from '../../components/Common/TimeProgressUtils';

const CashFlowTab = () => {
  const { data: cashFlowRows } = useFetchData('getCashFlowAndPaybackPeriod');
  const { data: storeCashFlowRows } = useFetchData('getCashFlowAndPaybackPeriodStore');
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

  // Generate Store Data for Modal
  const storeData = useMemo(() => {
    if (!selectedCity || !latestMonth || !Array.isArray(storeCashFlowRows)) return [];
    
    return storeCashFlowRows
      .filter(r => {
        const rowCity = r.statistics_city_name || r['statistics_city_name'];
        const rowMonth = r.month || r['month'];
        return rowCity === selectedCity && rowMonth === latestMonth;
      })
      .map((r, index) => ({
        key: index,
        storeName: r.store_name || r['store_name'],
        storeCode: r.store_code || r['store_code'],
        totalDepreciation: Number(r['总折旧']) || 0,
        cumulativeCashFlow: Number(r['累计现金流']) || 0,
        cumulativePaybackPeriod: Number(r['累计投资回收期']) || 0
      }));
  }, [selectedCity, latestMonth, storeCashFlowRows]);

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
    { key: 'storeName', title: '门店名称', dataIndex: 'storeName' },
    { key: 'storeCode', title: '门店编码', dataIndex: 'storeCode' },
    { key: 'totalDepreciation', title: '总折旧', dataIndex: 'totalDepreciation', align: 'right', render: (val) => <div className="tabular-nums">{formatNumber(val)}</div> },
    { key: 'cumulativeCashFlow', title: '累计现金流', dataIndex: 'cumulativeCashFlow', align: 'right', render: (val) => <div className="tabular-nums">{formatNumber(val)}</div> },
    { key: 'cumulativePaybackPeriod', title: '累计投资回收期', dataIndex: 'cumulativePaybackPeriod', align: 'right', render: (val) => <div className="tabular-nums">{val}</div> }
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
          
          <div className="p-6">
            <DataTable data={storeData} columns={storeColumns} />
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
      
      {/* 门店概览 */}
      <StoreOverviewSection />

      {/* 城市维度数据容器：门店数量与预算执行情况表格 */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-lg font-bold text-gray-800 mb-2 flex items-center">
          <span className="w-1 h-5 bg-[#a40035] rounded-full mr-3"></span>
          城市维度门店情况统计
        </h2>
        <CityStoresSection />
      </div>

      <ClosingStoresSection />
    </div>
  );
};

export default CashFlowTab;

const ClosingStoresSection = () => {
  const { data: closingStores } = useFetchData('getClosingStoreList');

  const columns = useMemo(() => ([
    { key: 'city', title: '城市', dataIndex: '城市' },
    { key: 'storeName', title: '门店名称', dataIndex: 'store_name' },
    { key: 'storeCode', title: '门店编码', dataIndex: 'store_code' },
    { 
      key: 'cost', 
      title: '人工+固定成本', 
      dataIndex: '年度指定成本(人工+固定)',
      render: (val) => val ? Number(val).toLocaleString() : '-' 
    },
    { 
      key: 'income', 
      title: '主营业务收入', 
      dataIndex: '年度主营业务收入',
      render: (val) => val ? Number(val).toLocaleString() : '-'
    },
    { 
      key: 'isTrigger', 
      title: '是否触发关闭条件', 
      dataIndex: '是否触发关闭条件',
      render: (val) => (
        <span className={val === '是' ? 'text-[#a40035] font-bold' : 'text-green-600'}>
          {val}
        </span>
      )
    },
  ]), []);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <h2 className="text-lg font-bold text-gray-800 mb-2 flex items-center">
        <span className="w-1 h-5 bg-[#a40035] rounded-full mr-3"></span>
        闭店预警门店
      </h2>
      <DataTable
        data={closingStores || []}
        columns={columns}
        getKey={(item) => item.store_code}
        hideNoDataMessage={true}
      />
    </div>
  );
};

const StoreOverviewSection = () => {
  const { data: cityStoreData } = useFetchData('getStoreCalCity');

  // 计算门店指标（实时聚合数据）
  const storeMetrics = useMemo(() => {
    if (!cityStoreData || cityStoreData.length === 0) {
      return {
        total: 0,
        newOpened: 0,
        closed: 0,
        netIncrease: 0,
        target: BusinessTargets.store.newStore.target || 0
      };
    }

    return cityStoreData.reduce((acc, curr) => ({
      total: acc.total + (Number(curr['门店数量']) || 0),
      newOpened: acc.newOpened + (Number(curr['今年新开门店数量']) || 0),
      closed: acc.closed + (Number(curr['今年闭店门店数量']) || 0),
      netIncrease: acc.netIncrease + (Number(curr['今年净增门店数量']) || 0),
      target: BusinessTargets.store.newStore.target || 0
    }), { total: 0, newOpened: 0, closed: 0, netIncrease: 0, target: BusinessTargets.store.newStore.target || 0 });
  }, [cityStoreData]);

  // 计算完成率
  const completionRate = storeMetrics.target > 0 
    ? Math.round((storeMetrics.netIncrease / storeMetrics.target) * 100) 
    : 0;

  // 预算指标 - 完全来自配置文件
  const budgetMetrics = {
    budgetTotal: BusinessTargets.store.newStore.budget || 0, // 新增预算总值
    cumulativeInvestment: BusinessTargets.store.newStore.cumulativeInvestment || 0, // 累计投资金额
    newStoreInvestment: BusinessTargets.store.newStore.newStoreInvestment || 0, // 新店投资金额
    renovationInvestment: BusinessTargets.store.newStore.renovationInvestment || 0 // 重装投资金额
  };

  // 计算时间进度
  const timeProgress = getTimeProgress();

  // 预算使用进度
  const budgetProgress = Math.round((budgetMetrics.cumulativeInvestment / budgetMetrics.budgetTotal) * 100);

  return (
       <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
            <span className="w-1 h-5 bg-[#a40035] rounded-full mr-3"></span>
            门店数量与预算执行情况概览
          </h2>

          <div className="flex flex-col">
            {/* 上部：门店指标 */}
            <div className="pb-4">
              <div className="relative overflow-hidden">
                <div className="flex flex-col md:flex-row items-center justify-between gap-8 relative z-10">
                   {/* 左侧：超大字号门店总数 */}
                   <div className="flex-1 text-center md:text-left md:pl-4">
                      <p className="text-sm text-gray-600 mb-2">当前门店总数</p>
                      <div className="flex items-baseline justify-center md:justify-start gap-2 mb-4">
                        <p className="text-7xl font-extrabold text-[#a40035] tracking-tight">{storeMetrics.total}</p>
                        <span className="text-xl font-medium text-gray-500">家</span>
                      </div>
                      
                      {/* 进度条：净增目标完成率 vs 时间进度 */}
                      <UnifiedProgressBar
                        className="max-w-[360px] mx-auto md:mx-0"
                        label="净增目标完成率"
                        value={completionRate}
                        timeProgress={timeProgress}
                      />
                   </div>

                   {/* 右侧：其他指标上下排布 (2x2 Grid) */}
                   <div className="flex-1 w-full">
                      <div className="grid grid-cols-2 gap-4">
                         <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                            <p className="text-xs text-gray-500 mb-1">今年新开</p>
                            <p className="text-xl font-bold text-gray-800">{storeMetrics.newOpened}</p>
                         </div>
                         <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                            <p className="text-xs text-gray-500 mb-1">今年闭店</p>
                            <p className="text-xl font-bold text-gray-800">{storeMetrics.closed}</p>
                         </div>
                         <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                            <p className="text-xs text-gray-500 mb-1">净增门店</p>
                            <p className={`text-xl font-bold ${storeMetrics.netIncrease >= storeMetrics.target ? 'text-[#a40035]' : 'text-green-600'}`}>{storeMetrics.netIncrease}</p>
                         </div>
                         <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                            <p className="text-xs text-gray-500 mb-1">年度新店目标</p>
                            <p className="text-xl font-bold text-gray-800">{storeMetrics.target}</p>
                         </div>
                      </div>
                   </div>
                </div>
              </div>
            </div>

            {/* 分割线 */}
            <div className="h-px bg-gray-100 my-2" />

            {/* 下部：预算指标 */}
             <div className="pt-4">
               <div className="p-0">
                  <div className="flex flex-col md:flex-row items-center justify-between gap-8">
                     {/* 左侧：预算值与累计投资金额 */}
                     <div className="flex-1 md:pl-4">
                         <div className="flex items-center justify-center md:justify-start gap-8 mb-4">
                             {/* 预算值 */}
                             <div className="text-center md:text-left">
                                <div className="flex items-center justify-center md:justify-start gap-2 mb-2">
                                  <p className="text-sm text-gray-600">预算金额</p>
                                </div>
                                <div className="flex items-baseline justify-center md:justify-start gap-2">
                                   <p className="text-6xl font-extrabold text-gray-400 tracking-tight">{budgetMetrics.budgetTotal}</p>
                                   <span className="text-lg font-medium text-gray-400">万元</span>
                                </div>
                             </div>

                             {/* 分隔竖线 */}
                             <div className="w-px h-16 bg-gray-200 hidden md:block"></div>

                             {/* 累计投资金额 */}
                             <div className="text-center md:text-left">
                                <div className="flex items-center justify-center md:justify-start gap-2 mb-2">
                                  <p className="text-sm text-gray-600">累计投资金额</p>
                                </div>
                                <div className="flex items-baseline justify-center md:justify-start gap-2">
                                   <p className="text-6xl font-extrabold text-gray-800 tracking-tight">{budgetMetrics.cumulativeInvestment}</p>
                                   <span className="text-lg font-medium text-gray-400">万元</span>
                                </div>
                             </div>
                         </div>

                         {/* 进度条：预算使用进度 (位于下方) */}
                         <UnifiedProgressBar
                           className="max-w-[360px] mx-auto md:mx-0"
                           label="预算使用率"
                           value={budgetProgress}
                           timeProgress={timeProgress}
                         />
                     </div>

                    {/* 右侧：其他预算指标上下排布 */}
                    <div className="flex-1 w-full space-y-4">
                       <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-100">
                          <div className="flex items-center gap-3">
                            <span className="text-sm font-medium text-gray-700">新店投资金额</span>
                          </div>
                          <span className="text-xl font-bold text-gray-600">{budgetMetrics.newStoreInvestment}</span>
                       </div>

                       <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-100">
                          <div className="flex items-center gap-3">
                            <span className="text-sm font-medium text-gray-700">重装投资金额</span>
                          </div>
                          <span className="text-xl font-bold text-gray-600">{budgetMetrics.renovationInvestment}</span>
                       </div>
                    </div>
                 </div>
              </div>
            </div>
          </div>
       </div>
  );
};

const CityStoresSection = () => {
  const [selectedCity, setSelectedCity] = useState(null);
  const { data: storeData } = useFetchData('getStoreCalCity');
  const { data: paybackData } = useFetchData('getCashFlowAndPaybackPeriod');
  const { data: storeDetailDataRaw } = useFetchData('getCashFlowAndPaybackPeriodStore');

  const tableData = useMemo(() => {
    if (!storeData) return [];

    // 目标配置 (从配置文件读取)
    const targetsMap = BusinessTargets.store.newStore.cityTargets || {};
    const budgetsMap = BusinessTargets.store.newStore.cityBudgets || {};

    // 投资回收期数据映射 (取每个城市最新的一个月数据)
    const paybackMap = {};
    if (paybackData) {
      // 假设 paybackData 按月份降序排列，只需遍历找到每个城市的第一条记录
      paybackData.forEach(p => {
        const city = p['statistics_city_name'] || p['统计城市']; // 兼容可能的字段名
        if (city && !paybackMap[city]) {
          paybackMap[city] = p['累计投资回收期'];
        }
      });
    }

    return storeData.map(item => {
      const city = item['统计城市'];
      const storeCount = item['门店数量'];
      const newOpened = item['今年新开门店数量'];
      const closed = item['今年闭店门店数量'];
      const netIncrease = item['今年净增门店数量'];
      // 投资金额 (SQL返回单位预计为元，需转换为万元)
      const newInvest = item['新开门店总投资金额'] || 0;
      const newInvestWan = Math.round(newInvest / 10000);

      const targetNew = targetsMap[city] || 0;
      const targetCompare = netIncrease - targetNew;
      
      // 预算逻辑：直接从配置读取，单位转换为万元（保留1位小数）
      const budgetRaw = budgetsMap[city] || 0;
      const budgetWan = budgetRaw > 0 ? Number((budgetRaw / 10000).toFixed(2)) : 0;
      
      let usage = 0;
      if (budgetWan > 0 && newInvestWan > 0) {
         usage = Math.round((newInvestWan / budgetWan) * 100);
      }

      const paybackPeriod = paybackMap[city] || '-';

      return {
        城市: city,
        门店数量: storeCount,
        新开门店数量: newOpened,
        闭店门店数量: closed,
        净增门店数量: netIncrease,
        新开门店目标: targetNew,
        目标对照: targetCompare,
        新店预算费用: budgetWan > 0 ? budgetWan : '-',
        新店投资金额: newInvestWan > 0 ? newInvestWan : '-',
        预算使用率: (budgetWan > 0 && newInvestWan > 0) ? `${usage}%` : '-',
        投资回收期: paybackPeriod
      };
    });
  }, [storeData, paybackData]);

  const storeDetails = useMemo(() => {
    if (!storeDetailDataRaw || !selectedCity) return [];
    
    // 1. 找到最大月份
    let maxMonth = '';
    storeDetailDataRaw.forEach(item => {
      if (!maxMonth || item.month > maxMonth) {
        maxMonth = item.month;
      }
    });

    if (!maxMonth) return [];

    // 2. 筛选数据
    return storeDetailDataRaw.filter(item => 
      item.month === maxMonth && 
      (item.statistics_city_name === selectedCity || item['统计城市'] === selectedCity)
    );
  }, [storeDetailDataRaw, selectedCity]);

  const columns = useMemo(() => ([
    { 
      key: 'city', 
      title: '城市', 
      dataIndex: '城市',
      render: (value) => (
        <span 
          className="font-medium text-[#a40035] cursor-pointer hover:underline"
          onClick={() => setSelectedCity(value)}
        >
          {value}
        </span>
      )
    },
    { key: 'storeCount', title: '门店数量', dataIndex: '门店数量' },
    { key: 'newOpened', title: '新开门店数量', dataIndex: '新开门店数量' },
    { key: 'closed', title: '闭店门店数量', dataIndex: '闭店门店数量' },
    { key: 'netIncrease', title: '净增门店数量', dataIndex: '净增门店数量' },
    { key: 'targetNew', title: '新开门店目标', dataIndex: '新开门店目标' },
    { 
      key: 'targetCompare', 
      title: '目标对照', 
      dataIndex: '目标对照',
      render: (value) => (
        <span className={`${value > 0 ? 'text-[#a40035]' : value < 0 ? 'text-green-600' : 'text-gray-600'} font-medium`}>
          {value}
        </span>
      )
    },
    { key: 'budgetPlan', title: '新店预算费用（万元）', dataIndex: '新店预算费用' },
    { key: 'budgetUsed', title: '新店投资金额（万元）', dataIndex: '新店投资金额' },
    { key: 'budgetUsage', title: '预算使用率', dataIndex: '预算使用率' },
    { key: 'paybackPeriod', title: '投资回收期 (月)', dataIndex: '投资回收期' },
  ]), []);

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

  return (
    <>
      <DataTable
        data={tableData}
        columns={columns}
        getKey={(item) => item.城市}
        hideNoDataMessage={true}
      />

      {selectedCity && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setSelectedCity(null)} />
          <div className="relative bg-white w-full max-w-5xl mx-4 rounded-xl shadow-lg flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between px-6 py-4 border-b flex-shrink-0">
              <h3 className="text-lg font-bold text-gray-800">{selectedCity} · 门店详情</h3>
              <button className="text-gray-500 hover:text-gray-700" onClick={() => setSelectedCity(null)}>关闭</button>
            </div>
            <div className="p-6 overflow-y-auto">
               <DataTable
                  data={storeDetails}
                  columns={[
                    { key: 'storeName', title: '门店名称', dataIndex: 'store_name' },
                    { key: 'storeCode', title: '门店编码', dataIndex: 'store_code' },
                    { key: 'depreciation', title: '总折旧', dataIndex: '总折旧' },
                    { key: 'cashFlow', title: '累计现金流', dataIndex: '累计现金流' },
                    { key: 'payback', title: '累计投资回收期', dataIndex: '累计投资回收期' },
                  ]}
                  getKey={(item) => item.store_code}
               />
            </div>
          </div>
        </div>
      )}
    </>
  );
};
