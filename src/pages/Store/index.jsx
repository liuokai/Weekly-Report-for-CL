import React, { useMemo, useState, useEffect } from 'react';
import DataTable from '../../components/Common/DataTable';
import LineTrendChart from '../../components/Common/LineTrendChart';
import UnifiedProgressBar from '../../components/Common/UnifiedProgressBar';
import BusinessTargets from '../../config/businessTargets';
import { getTimeProgress } from '../../components/Common/TimeProgressUtils';
import useFetchData from '../../hooks/useFetchData';

const StoreTab = () => {
  // 模拟数据 - 门店指标
  const storeMetrics = {
    total: 198,       // 门店数量
    newOpened: 36,    // 新开门店数量
    closed: 14,       // 闭店门店数量
    netIncrease: 22,  // 净增门店数量
    target: BusinessTargets.store.newStore.target,       // 新店目标
  };

  // 计算完成率
  const completionRate = Math.round((storeMetrics.netIncrease / storeMetrics.target) * 100);

  // 模拟数据 - 预算指标
  const budgetMetrics = {
    budgetTotal: BusinessTargets.store.newStore.budget, // 新增预算总值
    cumulativeInvestment: 240, // 累计投资金额 (模拟值)
    newStoreInvestment: 185,
    renovationInvestment: 55
  };

  // 计算时间进度
  const timeProgress = getTimeProgress();

  // 预算使用进度
  const budgetProgress = Math.round((budgetMetrics.cumulativeInvestment / budgetMetrics.budgetTotal) * 100);

  return (
    <div className="space-y-6">
       {/* 概览容器 */}
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

       {/* 城市维度数据容器：门店数量与预算执行情况表格 */}
       <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
         <h2 className="text-lg font-bold text-gray-800 mb-2 flex items-center">
           <span className="w-1 h-5 bg-[#a40035] rounded-full mr-3"></span>
           城市维度门店情况统计
         </h2>
         <CityStoresSection />
       </div>
    </div>
  );
};

export default StoreTab;

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
