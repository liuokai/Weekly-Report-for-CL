import React, { useMemo, useState, useEffect } from 'react';
import useFetchData from '../../hooks/useFetchData';
import DataTable from '../../components/Common/DataTable';
import DataContainer from '../../components/Common/DataContainer';
import useTableSorting from '../../components/Common/useTableSorting';
import CapitalForecastContainer from './CapitalForecastContainer';
import CityBudgetExecutionContainer from './CityBudgetExecutionContainer';
import FilterDropdown from '../../components/Common/FilterDropdown';

const CashFlowTab = () => {
  const { data: newStoreProcessData } = useFetchData('getCashFlowNewStoreProcess');
  
  const [selectedMonth, setSelectedMonth] = useState(null);
  const [selectedCity, setSelectedCity] = useState(null);

  // 提取筛选选项
  const { uniqueMonths, uniqueCities } = useMemo(() => {
    if (!Array.isArray(newStoreProcessData)) return { uniqueMonths: [], uniqueCities: [] };
    
    const months = new Set();
    const cities = new Set();
    
    newStoreProcessData.forEach(item => {
      if (item.month) months.add(item.month);
      if (item.city_name) cities.add(item.city_name);
    });
    
    return {
      uniqueMonths: Array.from(months).sort(),
      uniqueCities: Array.from(cities).sort()
    };
  }, [newStoreProcessData]);

  const { rows, summaryRow } = useMemo(() => {
    if (!Array.isArray(newStoreProcessData)) return { rows: [], summaryRow: null };
    
    // 1. 过滤数据
    const filteredData = newStoreProcessData.filter(item => {
      const matchMonth = selectedMonth ? item.month === selectedMonth : true;
      const matchCity = selectedCity ? item.city_name === selectedCity : true;
      return matchMonth && matchCity;
    });

    if (filteredData.length === 0) return { rows: [], summaryRow: null };

    // 2. 排序 (默认按月份排序)
    const sortedFilteredData = [...filteredData].sort((a, b) => {
      const monthA = a.month || '';
      const monthB = b.month || '';
      return monthA.localeCompare(monthB);
    });

    // 3. 计算合计行 (基于筛选后的数据)
    const totalNewTarget = sortedFilteredData.reduce((sum, r) => sum + (Number(r['新店目标']) || 0), 0);
    const totalNewActual = sortedFilteredData.reduce((sum, r) => sum + (Number(r['新店数量']) || 0), 0);
    const totalReinstallTarget = sortedFilteredData.reduce((sum, r) => sum + (Number(r['重装目标']) || 0), 0);
    const totalReinstallActual = sortedFilteredData.reduce((sum, r) => sum + (Number(r['重装数量']) || 0), 0);
    
    // 计算合计行中的“门店数量”
    // - 当存在筛选条件时（按月份或城市筛选），基于筛选结果：
    //   取筛选结果中最新月份的数据汇总门店数量
    // - 当不存在筛选条件时，基于全量数据：
    //   先按月汇总各城市的门店数量，再按月份排序，从后往前找到最后一个门店数量合计 > 0 的月份，
    //   取该月份的门店数量合计值
    let currentTotalStores = 0;

    if (selectedMonth || selectedCity) {
      const monthsInFilter = Array.from(new Set(sortedFilteredData.map(r => r.month))).sort();
      const latestMonthInFilter = monthsInFilter[monthsInFilter.length - 1];
      const latestMonthData = sortedFilteredData.filter(r => r.month === latestMonthInFilter);
      currentTotalStores = latestMonthData.reduce((sum, r) => sum + (Number(r['门店数量']) || 0), 0);
    } else {
      const monthlyStores = {};
      newStoreProcessData.forEach(item => {
        const m = item.month;
        const num = Number(item['门店数量']) || 0;
        if (!monthlyStores[m]) monthlyStores[m] = 0;
        monthlyStores[m] += num;
      });

      const sortedMonths = Object.keys(monthlyStores).sort();
      for (let i = sortedMonths.length - 1; i >= 0; i--) {
        const m = sortedMonths[i];
        if (monthlyStores[m] > 0) {
          currentTotalStores = monthlyStores[m];
          break;
        }
      }
    }

    // 计算合计行状态逻辑 (参考 SQL 逻辑)
    const getSummaryStatus = (target, actual) => {
      if ((target === null || target === 0) && actual > 0) return '高于目标';
      if ((target === null || target === 0) && (actual === null || actual === 0)) return null;
      if (actual === target) return '如期完成';
      if (actual > target) return '高于目标';
      if (actual < target) return '未完成';
      return null;
    };

    const summary = {
      month: '合计', 
      city_name: '-',
      '新店目标': totalNewTarget,
      '新店数量': totalNewActual,
      '新店目标完成情况': getSummaryStatus(totalNewTarget, totalNewActual),
      '重装目标': totalReinstallTarget,
      '重装数量': totalReinstallActual,
      '重装目标完成情况': getSummaryStatus(totalReinstallTarget, totalReinstallActual),
      '门店数量': currentTotalStores, 
      isSummary: true
    };

    return { rows: sortedFilteredData, summaryRow: summary };
  }, [newStoreProcessData, selectedMonth, selectedCity]);

  const getStatusColor = (status) => {
    switch (status) {
      case '高于目标':
        return 'text-green-600 font-bold';
      case '如期完成':
        return 'text-blue-600 font-bold';
      case '未完成':
        return 'text-[#a40035] font-bold';
      default:
        return 'text-gray-600';
    }
  };

  const columns = [
    { key: 'month', title: '月份', dataIndex: 'month' },
    { 
      key: 'city_name', 
      title: '城市', 
      dataIndex: 'city_name',
      render: (text, row) => row.isSummary ? <span className="font-bold">{text}</span> : text
    },
    { key: 'new_store_opening_target', title: '新店目标', dataIndex: '新店目标', align: 'right' },
    { key: 'new_store_opening_num', title: '新店数量', dataIndex: '新店数量', align: 'right' },
    { 
      key: 'new_store_process', 
      title: '新店目标完成情况', 
      dataIndex: '新店目标完成情况',
      render: (text) => <span className={getStatusColor(text)}>{text}</span>
    },
    { key: 'reinstall_store_target', title: '重装目标', dataIndex: '重装目标', align: 'right' },
    { key: 'reinstall_store_num', title: '重装数量', dataIndex: '重装数量', align: 'right' },
    { 
      key: 'reinstall_store_process', 
      title: '重装目标完成情况', 
      dataIndex: '重装目标完成情况',
      render: (text) => <span className={getStatusColor(text)}>{text}</span>
    },
    { key: 'total_store_num', title: '门店数量', dataIndex: '门店数量', align: 'right' },
  ];

  // 使用 useTableSorting 钩子实现排序
  // 注意：只对数据行进行排序，不包含合计行
  const { sortedData, sortConfig, handleSort } = useTableSorting(columns, rows);

  // 汇总统计逻辑（始终基于最新月份数据展示卡片，不随表格排序或过滤变化，除非需要联动）
  const summaryMetrics = useMemo(() => {
    if (!newStoreProcessData || !newStoreProcessData.length) return null;
    
    // 获取最新月份
    const months = Array.from(new Set(newStoreProcessData.map(r => r.month))).sort();
    const latestMonth = months[months.length - 1];
    
    // 1. 计算门店总数：逻辑为按月份分组，取最后一个有数据的月份的合计值
          // 由于数据可能是分城市的，需要先把所有数据按月份聚合
          const monthlyStores = {};
          newStoreProcessData.forEach(item => {
            const m = item.month;
            const num = Number(item['门店数量']) || 0;
            if (!monthlyStores[m]) monthlyStores[m] = 0;
            monthlyStores[m] += num;
          });

          // 找到最后一个门店数量合计 > 0 的月份
          const sortedMonths = Object.keys(monthlyStores).sort();
          let validStoreMonth = null;
          let totalStores = 0;
          
          for (let i = sortedMonths.length - 1; i >= 0; i--) {
            const m = sortedMonths[i];
            if (monthlyStores[m] > 0) {
              validStoreMonth = m;
              totalStores = monthlyStores[m];
              break;
            }
          }

          // 获取当前系统时间，用于计算截止当前月的进度
          const now = new Date();
          const currentYear = now.getFullYear();
          const currentMonth = now.getMonth() + 1;
          const currentSysMonthStr = `${currentYear}-${String(currentMonth).padStart(2, '0')}`;
          const currentSysMonthDisplay = `${currentYear} 年 ${currentMonth} 月`;

          // 2. 计算新店和重装的全年目标与实际
          // 过滤当年数据（假设数据中的年份与系统年份一致，或者直接取数据中的年份）
          // 这里使用系统年份作为基准
          const currentYearData = newStoreProcessData.filter(r => r.month.startsWith(String(currentYear)));
          
          const totalNewTarget = currentYearData.reduce((sum, r) => sum + (Number(r['新店目标']) || 0), 0);
          const totalNewActual = currentYearData.reduce((sum, r) => sum + (Number(r['新店数量']) || 0), 0);
          const totalReinstallTarget = currentYearData.reduce((sum, r) => sum + (Number(r['重装目标']) || 0), 0);
          const totalReinstallActual = currentYearData.reduce((sum, r) => sum + (Number(r['重装数量']) || 0), 0);

          // 3. 计算截止当前月份（currentSysMonthStr）的目标与实际
          // 取从当年 1 月至当前月份这段时间的数据
          const dataUpToNow = currentYearData.filter(r => r.month <= currentSysMonthStr);
          
          const currentNewTarget = dataUpToNow.reduce((sum, r) => sum + (Number(r['新店目标']) || 0), 0);
          const currentNewActual = dataUpToNow.reduce((sum, r) => sum + (Number(r['新店数量']) || 0), 0);
          const currentReinstallTarget = dataUpToNow.reduce((sum, r) => sum + (Number(r['重装目标']) || 0), 0);
          const currentReinstallActual = dataUpToNow.reduce((sum, r) => sum + (Number(r['重装数量']) || 0), 0);

          // 计算完成率的辅助函数
          const calculateRate = (actual, target) => {
            if (target > 0) return Math.round((actual / target) * 100);
            if (target === 0 && actual > 0) return 100;
            return 0;
          };

          return {
            month: latestMonth,
            currentSysMonthDisplay,
            totalStores,
            validStoreMonth,
            newStore: {
              totalTarget: totalNewTarget,
              totalActual: totalNewActual,
              totalRate: calculateRate(totalNewActual, totalNewTarget),
              currentTarget: currentNewTarget,
              currentActual: currentNewActual,
              currentRate: calculateRate(currentNewActual, currentNewTarget)
            },
            reinstall: {
              totalTarget: totalReinstallTarget,
              totalActual: totalReinstallActual,
              totalRate: calculateRate(totalReinstallActual, totalReinstallTarget),
              currentTarget: currentReinstallTarget,
              currentActual: currentReinstallActual,
              currentRate: calculateRate(currentReinstallActual, currentReinstallTarget)
            }
          };
        }, [newStoreProcessData]);

  const renderFilters = () => (
    <div className="flex flex-row relative z-40">
        <FilterDropdown 
            label="月份" 
            value={selectedMonth} 
            options={uniqueMonths} 
            onChange={setSelectedMonth} 
        />
        <FilterDropdown 
            label="城市" 
            value={selectedCity} 
            options={uniqueCities} 
            onChange={setSelectedCity} 
        />
    </div>
  );

  return (
    <div className="space-y-6">
      {/* 核心指标整体容器 */}
      {summaryMetrics && (
        <div className="bg-white rounded-2xl shadow-lg mb-8 overflow-hidden border border-gray-100">
          <div className="flex flex-col md:flex-row">
            
            {/* 左侧：新店开发进度 */}
            <div className="flex-1 p-8 relative">
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-1.5 h-6 bg-[#a40035] rounded-full"></div>
                  <h3 className="text-gray-900 font-bold text-xl tracking-tight">新店拓店</h3>
                </div>
                <div className="text-[11px] text-[#a40035] font-semibold bg-[#a40035]/5 px-2.5 py-1 rounded-full border border-[#a40035]/10">实际值 / 目标值</div>
              </div>
              
              <div className="space-y-6">
                {/* 全年进度 */}
                <div>
                  <div className="flex justify-between text-sm mb-2.5 items-end">
                    <span className="text-gray-500 font-medium">全年目标进度</span>
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-[#a40035] text-lg leading-none">{summaryMetrics.newStore.totalRate}<span className="text-sm ml-0.5">%</span></span>
                      <span className="text-xs text-gray-400 font-medium bg-gray-50 px-2 py-0.5 rounded-md">
                        <span className="text-gray-700">{summaryMetrics.newStore.totalActual}</span>
                        <span className="mx-1 text-gray-300">/</span>
                        <span>{summaryMetrics.newStore.totalTarget}</span>
                      </span>
                    </div>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-3.5 overflow-hidden p-0.5">
                    <div 
                      className="bg-gradient-to-r from-[#a40035] to-[#d62055] h-full rounded-full transition-all duration-700 relative shadow-sm"
                      style={{ width: `${Math.min(summaryMetrics.newStore.totalRate, 100)}%` }}
                    >
                      <div className="absolute top-0 left-0 bottom-0 right-0 bg-gradient-to-r from-transparent via-white/30 to-transparent w-full -translate-x-full animate-[shimmer_2s_infinite]"></div>
                    </div>
                  </div>
                </div>

                {/* 截止当前月进度 */}
                <div>
                  <div className="flex justify-between text-sm mb-2.5 items-end">
                    <span className="text-gray-500 font-medium">截至 {summaryMetrics.currentSysMonthDisplay} 进度</span>
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-[#a40035] text-lg leading-none">{summaryMetrics.newStore.currentRate}<span className="text-sm ml-0.5">%</span></span>
                      <span className="text-xs text-gray-400 font-medium bg-gray-50 px-2 py-0.5 rounded-md">
                        <span className="text-gray-700">{summaryMetrics.newStore.currentActual}</span>
                        <span className="mx-1 text-gray-300">/</span>
                        <span>{summaryMetrics.newStore.currentTarget}</span>
                      </span>
                    </div>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-3.5 overflow-hidden p-0.5">
                    <div 
                      className="bg-gradient-to-r from-[#a40035] to-[#d62055] h-full rounded-full transition-all duration-700 relative shadow-sm"
                      style={{ width: `${Math.min(summaryMetrics.newStore.currentRate, 100)}%` }}
                    >
                       <div className="absolute top-0 left-0 bottom-0 right-0 bg-gradient-to-r from-transparent via-white/30 to-transparent w-full -translate-x-full animate-[shimmer_2s_infinite]"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 中间：老店重装进度 */}
            <div className="flex-1 p-8 relative">
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-3">
                   <div className="w-1.5 h-6 bg-[#a40035] rounded-full"></div>
                   <h3 className="text-gray-900 font-bold text-xl tracking-tight">老店重装</h3>
                </div>
                <div className="text-[11px] text-[#a40035] font-semibold bg-[#a40035]/5 px-2.5 py-1 rounded-full border border-[#a40035]/10">实际值 / 目标值</div>
              </div>
              
              <div className="space-y-6">
                {/* 全年进度 */}
                <div>
                  <div className="flex justify-between text-sm mb-2.5 items-end">
                    <span className="text-gray-500 font-medium">全年目标进度</span>
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-[#a40035] text-lg leading-none">{summaryMetrics.reinstall.totalRate}<span className="text-sm ml-0.5">%</span></span>
                      <span className="text-xs text-gray-400 font-medium bg-gray-50 px-2 py-0.5 rounded-md">
                        <span className="text-gray-700">{summaryMetrics.reinstall.totalActual}</span>
                        <span className="mx-1 text-gray-300">/</span>
                        <span>{summaryMetrics.reinstall.totalTarget}</span>
                      </span>
                    </div>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-3.5 overflow-hidden p-0.5">
                    <div 
                      className="bg-gradient-to-r from-[#a40035] to-[#d62055] h-full rounded-full transition-all duration-700 relative shadow-sm"
                      style={{ width: `${Math.min(summaryMetrics.reinstall.totalRate, 100)}%` }}
                    >
                      <div className="absolute top-0 left-0 bottom-0 right-0 bg-gradient-to-r from-transparent via-white/30 to-transparent w-full -translate-x-full animate-[shimmer_2s_infinite]"></div>
                    </div>
                  </div>
                </div>

                {/* 截止当前月进度 */}
                <div>
                  <div className="flex justify-between text-sm mb-2.5 items-end">
                    <span className="text-gray-500 font-medium">截至 {summaryMetrics.currentSysMonthDisplay} 进度</span>
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-[#a40035] text-lg leading-none">{summaryMetrics.reinstall.currentRate}<span className="text-sm ml-0.5">%</span></span>
                      <span className="text-xs text-gray-400 font-medium bg-gray-50 px-2 py-0.5 rounded-md">
                        <span className="text-gray-700">{summaryMetrics.reinstall.currentActual}</span>
                        <span className="mx-1 text-gray-300">/</span>
                        <span>{summaryMetrics.reinstall.currentTarget}</span>
                      </span>
                    </div>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-3.5 overflow-hidden p-0.5">
                    <div 
                      className="bg-gradient-to-r from-[#a40035] to-[#d62055] h-full rounded-full transition-all duration-700 relative shadow-sm"
                      style={{ width: `${Math.min(summaryMetrics.reinstall.currentRate, 100)}%` }}
                    >
                      <div className="absolute top-0 left-0 bottom-0 right-0 bg-gradient-to-r from-transparent via-white/30 to-transparent w-full -translate-x-full animate-[shimmer_2s_infinite]"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 右侧：当前门店数量 - 浅色背景 */}
            <div className="flex-1 p-8 relative flex flex-col justify-between overflow-hidden bg-red-50/50">
              {/* 背景装饰 */}
              <div className="absolute top-0 right-0 p-0 opacity-[0.03] pointer-events-none text-[#a40035]">
                <svg className="w-48 h-48 transform translate-x-12 -translate-y-12" fill="currentColor" viewBox="0 0 24 24"><path d="M12 7V3H2v18h20V7H12zM6 19H4v-2h2v2zm0-4H4v-2h2v2zm0-4H4V9h2v2zm0-4H4V5h2v2zm4 12H8v-2h2v2zm0-4H8v-2h2v2zm0-4H8V9h2v2zm0-4H8V5h2v2zm10 12h-8v-2h2v-2h-2v-2h2V9h-2V7h8v12zm-2-8h-2v2h2V9zm0 4h-2v2h2v-2z"/></svg>
              </div>
              
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-2">
                    <div className="p-1.5 bg-[#a40035]/10 rounded-lg">
                        <svg className="w-5 h-5 text-[#a40035]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path></svg>
                    </div>
                    <h3 className="text-gray-900 font-bold text-lg tracking-wide">当前门店总数</h3>
                </div>
              </div>

              <div className="flex items-end justify-end mt-4 relative z-10">
                 <div className="text-right">
                    <div className="flex items-baseline gap-2 justify-end">
                      <span className="text-7xl font-black text-[#a40035] tracking-tighter drop-shadow-sm">{summaryMetrics.totalStores}</span>
                      <span className="text-xl font-medium text-gray-500 mb-3">家</span>
                    </div>
                 </div>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* 详细数据表格 - 使用 DataContainer 保持统一风格 */}
      <DataContainer 
        title="新店与重装目标完成情况详情"
        renderFilters={renderFilters}
        maxHeight="none" // 禁用 DataContainer 的内部滚动，移交给 DataTable
      >
        <DataTable 
          data={sortedData} 
          columns={columns} 
          onSort={handleSort}
          sortConfig={sortConfig}
          summaryRow={summaryRow}
          maxHeight={selectedMonth || selectedCity ? undefined : "500px"} // 当未筛选时，限制表格高度并启用内部滚动
        />
      </DataContainer>

      {/* 2026年公司总部及城市维度资金测算周报 (NEW) */}
      <CapitalForecastContainer />

      {/* 2026年城市新店投资与现金流预算执行情况 (NEW) */}
      <CityBudgetExecutionContainer />
    </div>
  );
};

export default CashFlowTab;
