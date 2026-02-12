import React, { useMemo, useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import useFetchData from '../../hooks/useFetchData';
import DataTable from '../../components/Common/DataTable';
import DataContainer from '../../components/Common/DataContainer';
import useTableSorting from '../../components/Common/useTableSorting';
import CapitalForecastContainer from './CapitalForecastContainer';
import CityBudgetExecutionContainer from './CityBudgetExecutionContainer';
import NewStoreOperationStatusContainer from './NewStoreOperationStatusContainer';
import NewStoreSupplyContainer from './NewStoreSupplyContainer';
import CashFlowContinuousLossContainer from './CashFlowContinuousLossContainer';
import ClosingWarningContainer from './ClosingWarningContainer';
import FilterDropdown from '../../components/Common/FilterDropdown';
import { generateNewStoreAnalysis } from '../../services/analysisService';

const CashFlowTab = () => {
  const { data: newStoreProcessData } = useFetchData('getCashFlowNewStoreProcess');
  const [analysisText, setAnalysisText] = useState('');
  const [isAnalysisLoading, setIsAnalysisLoading] = useState(false);
  
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    now.setDate(now.getDate() - 1);
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
  });
  const [selectedCity, setSelectedCity] = useState(null);

  useEffect(() => {
    if (newStoreProcessData && newStoreProcessData.length > 0 && !analysisText && !isAnalysisLoading) {
      
      // Calculate Global Total Stores (Frontend Logic)
      // 1. Filter out summary rows and get detail rows
      const detailRows = newStoreProcessData.filter(r => r.city_name !== '月度合计');
      
      // 2. Find rows with store count > 0
      const validStoreRows = detailRows.filter(r => (Number(r['total_store_count']) || 0) > 0);
      
      let currentTotalStores = 0;
      if (validStoreRows.length > 0) {
        // 3. Find latest valid month
        const allValidMonths = validStoreRows.map(r => r.month).sort();
        const latestValidMonth = allValidMonths[allValidMonths.length - 1];
        
        // 4. Sum stores for that month
        currentTotalStores = detailRows
          .filter(r => r.month === latestValidMonth)
          .reduce((sum, r) => sum + (Number(r['total_store_count']) || 0), 0);
      }

      setIsAnalysisLoading(true);
      generateNewStoreAnalysis(newStoreProcessData, currentTotalStores)
        .then(text => {
          setAnalysisText(text);
        })
        .finally(() => {
          setIsAnalysisLoading(false);
        });
    }
  }, [newStoreProcessData]);

  // 提取筛选选项
  const { uniqueMonths, uniqueCities } = useMemo(() => {
    if (!Array.isArray(newStoreProcessData)) return { uniqueMonths: [], uniqueCities: [] };
    
    const months = new Set();
    const cities = new Set();
    
    newStoreProcessData.forEach(item => {
      if (item.month) months.add(item.month);
      if (item.city_name && item.city_name !== '月度合计') cities.add(item.city_name);
    });
    
    return {
      uniqueMonths: Array.from(months).sort(),
      uniqueCities: Array.from(cities).sort()
    };
  }, [newStoreProcessData]);

  const { rows, summaryRow } = useMemo(() => {
    if (!Array.isArray(newStoreProcessData)) return { rows: [], summaryRow: null };
    
    // 1. 识别并分离合计行与数据行
    // SQL 中合计行的 city_name 为 '月度合计'
    const allDataRows = newStoreProcessData.filter(item => item.city_name !== '月度合计');
    
    // 2. 过滤数据行
    const filteredRows = allDataRows.filter(item => {
      const matchMonth = selectedMonth ? item.month === selectedMonth : true;
      const matchCity = selectedCity ? item.city_name === selectedCity : true;
      return matchMonth && matchCity;
    });

    // 3. 排序 (默认按月份排序)
    const sortedFilteredRows = [...filteredRows].sort((a, b) => {
      const monthA = a.month || '';
      const monthB = b.month || '';
      return monthA.localeCompare(monthB);
    });

    // 4. 获取合计行
    let summary = null;

    // 辅助函数：计算合计行状态逻辑 (参考 SQL 逻辑)
    const getSummaryStatus = (target, actual) => {
      if ((target === null || target === 0) && actual > 0) return '高于目标';
      if ((target === null || target === 0) && (actual === null || actual === 0)) return null;
      if (actual === target) return '如期完成';
      if (actual > target) return '高于目标';
      if (actual < target) return '尚未完成';
      return null;
    };

    if (selectedMonth) {
      // 场景 A：选择了特定月份
      // 直接使用 SQL 返回的 '月度合计' 行
      const sqlSummaryRow = newStoreProcessData.find(
        item => item.month === selectedMonth && item.city_name === '月度合计'
      );
      
      if (sqlSummaryRow) {
        summary = {
          ...sqlSummaryRow,
          isSummary: true
        };
      }
    } else {
      // 场景 B：全部月份 (或未选择月份)
      // 需要前端计算整体合计
      // 基于 filteredRows (已应用城市筛选，且已排除 '月度合计' 行)
      
      if (sortedFilteredRows.length > 0) {
        // 1. 累加各项指标 (新店、重装)
        const totalNewTarget = sortedFilteredRows.reduce((sum, r) => sum + (Number(r['new_store_target']) || 0), 0);
        const totalNewActual = sortedFilteredRows.reduce((sum, r) => sum + (Number(r['new_store_count']) || 0), 0);
        const totalReinstallTarget = sortedFilteredRows.reduce((sum, r) => sum + (Number(r['reinstall_target']) || 0), 0);
        const totalReinstallActual = sortedFilteredRows.reduce((sum, r) => sum + (Number(r['reinstall_count']) || 0), 0);

        // 2. 计算门店数量
        // 逻辑：各个城市的门店数量不为空(>0)时的月份最大的那个月中，各个城市门店数量的和
        
        // 第一步：找到所有“门店数量 > 0”的记录
        const validStoreRows = sortedFilteredRows.filter(r => (Number(r['total_store_count']) || 0) > 0);
        
        let currentTotalStores = 0;
        
        if (validStoreRows.length > 0) {
          // 第二步：找到这些记录中的最大月份
          const allValidMonths = validStoreRows.map(r => r.month).sort();
          const latestValidMonth = allValidMonths[allValidMonths.length - 1];
          
          // 第三步：统计该最大月份下所有记录的门店数量之和
          // 注意：这里是统计 sortedFilteredRows 中在该月份下的所有记录，不仅仅是 validStoreRows
          // 不过既然是按月份统计，通常我们只关心该月份的数据
          currentTotalStores = sortedFilteredRows
            .filter(r => r.month === latestValidMonth)
            .reduce((sum, r) => sum + (Number(r['total_store_count']) || 0), 0);
        }

        summary = {
          month: '整体合计', 
          city_name: '-',
          'new_store_target': totalNewTarget,
          'new_store_count': totalNewActual,
          'new_store_target_status': getSummaryStatus(totalNewTarget, totalNewActual),
          'reinstall_target': totalReinstallTarget,
          'reinstall_count': totalReinstallActual,
          'reinstall_target_status': getSummaryStatus(totalReinstallTarget, totalReinstallActual),
          'total_store_count': currentTotalStores, 
          isSummary: true
        };
      }
    }

    return { rows: sortedFilteredRows, summaryRow: summary };
  }, [newStoreProcessData, selectedMonth, selectedCity]);

  const getStatusColor = (status) => {
    switch (status) {
      case '高于目标':
        return 'text-green-600 font-bold';
      case '如期完成':
        return 'text-blue-600 font-bold';
      case '尚未完成':
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
    { key: 'new_store_opening_target', title: '新店目标', dataIndex: 'new_store_target', align: 'right' },
    { key: 'new_store_opening_num', title: '新店数量', dataIndex: 'new_store_count', align: 'right' },
    { 
      key: 'new_store_process', 
      title: '新店目标完成情况', 
      dataIndex: 'new_store_target_status',
      render: (text) => <span className={getStatusColor(text)}>{text}</span>
    },
    { key: 'reinstall_store_target', title: '重装目标', dataIndex: 'reinstall_target', align: 'right' },
    { key: 'reinstall_store_num', title: '重装数量', dataIndex: 'reinstall_count', align: 'right' },
    { 
      key: 'reinstall_store_process', 
      title: '重装目标完成情况', 
      dataIndex: 'reinstall_target_status',
      render: (text) => <span className={getStatusColor(text)}>{text}</span>
    },
    { key: 'total_store_num', title: '门店数量', dataIndex: 'total_store_count', align: 'right' },
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
            const num = Number(item['total_store_count']) || 0;
            if (!monthlyStores[m]) monthlyStores[m] = 0;
            monthlyStores[m] += num;
          });

          // 找到最后一个门店数量合计 > 0 的月份
          const sortedMonths = Object.keys(monthlyStores).sort();
          let validStoreMonth = null;
          let totalStores = 0;
          
          // 逻辑：各个城市的门店数量不为空时的月份最大的那个月中，各个城市门店数量的和
          // 1. 找到所有记录中“门店数量 > 0”的记录，取最大月份
          const validRecords = newStoreProcessData.filter(r => (Number(r['total_store_count']) || 0) > 0);
          if (validRecords.length > 0) {
             const validMonths = validRecords.map(r => r.month).sort();
             validStoreMonth = validMonths[validMonths.length - 1];
             
             // 2. 统计该月份下所有记录的门店数量之和
             totalStores = newStoreProcessData
               .filter(r => r.month === validStoreMonth && r.city_name !== '月度合计') // 排除月度合计行以免重复计算
               .reduce((sum, r) => sum + (Number(r['total_store_count']) || 0), 0);
          } else {
             // 兜底逻辑：如果所有记录都为0，取原本的逻辑（最后一个有数据的月份）
             // 或者直接设为0
             validStoreMonth = sortedMonths[sortedMonths.length - 1];
             totalStores = 0;
          }

          // 获取当前系统时间，用于计算截止当前月的进度
          const now = new Date();
          const currentYear = now.getFullYear();
          const currentMonth = now.getMonth() + 1;
          const currentSysMonthStr = `${currentYear}-${String(currentMonth).padStart(2, '0')}`;
          const currentSysMonthDisplay = `${currentYear} 年 ${currentMonth} 月`;

          // 2. 计算新店和重装的全年目标与实际
          // 逻辑：基于 '月度合计' 行进行统计，确保数据准确性
          const totalRows = newStoreProcessData.filter(
            r => r.city_name === '月度合计' && r.month.startsWith(String(currentYear))
          );

          // 全年目标与实际：累加所有月份的合计行
          const totalNewTarget = totalRows.reduce((sum, r) => sum + (Number(r['new_store_target']) || 0), 0);
          const totalNewActual = totalRows.reduce((sum, r) => sum + (Number(r['new_store_count']) || 0), 0);
          const totalReinstallTarget = totalRows.reduce((sum, r) => sum + (Number(r['reinstall_target']) || 0), 0);
          const totalReinstallActual = totalRows.reduce((sum, r) => sum + (Number(r['reinstall_count']) || 0), 0);

          // 3. 计算截止当前月份（currentSysMonthStr）的目标与实际
          // 逻辑：累加 1月 至 当前月份 的 '月度合计' 行
          const rowsUpToNow = totalRows.filter(r => r.month <= currentSysMonthStr);
          
          const currentNewTarget = rowsUpToNow.reduce((sum, r) => sum + (Number(r['new_store_target']) || 0), 0);
          const currentNewActual = rowsUpToNow.reduce((sum, r) => sum + (Number(r['new_store_count']) || 0), 0);
          const currentReinstallTarget = rowsUpToNow.reduce((sum, r) => sum + (Number(r['reinstall_target']) || 0), 0);
          const currentReinstallActual = rowsUpToNow.reduce((sum, r) => sum + (Number(r['reinstall_count']) || 0), 0);

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
        <div className="bg-white rounded-lg shadow-sm mb-8 overflow-hidden border border-gray-100">
          <div className="px-6 py-4 border-b border-gray-100 bg-[#a40035]/5 flex items-center justify-between">
            <h2 className="text-lg font-bold text-[#a40035] flex items-center gap-2">
              新店总结
            </h2>
          </div>
          
          {/* 分析总结区域 */}
          <div className="px-6 py-4 bg-gradient-to-r from-gray-50 to-white border-b border-gray-100">
             <div className="flex items-start gap-3">
                <div className="p-1.5 bg-[#a40035]/10 rounded mt-0.5 shrink-0">
                   <svg className="w-4 h-4 text-[#a40035]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                   </svg>
                </div>
                <div className="flex-1">
                   <h3 className="text-sm font-bold text-gray-800 mb-1">分析总结</h3>
                   <div className="text-sm text-gray-600 leading-relaxed">
                      {isAnalysisLoading ? (
                        <div className="flex items-center gap-2 py-1">
                           <div className="animate-spin h-4 w-4 border-2 border-[#a40035] border-t-transparent rounded-full"></div>
                           <span>正在生成智能分析...</span>
                        </div>
                      ) : (
                         <div className="prose prose-sm max-w-none text-gray-700 [&>p]:mb-0">
                            <ReactMarkdown>
                               {analysisText || '暂无分析内容'}
                            </ReactMarkdown>
                         </div>
                       )}
                   </div>
                </div>
             </div>
          </div>

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

      {/* 新店供应总结 */}
      <NewStoreSupplyContainer />

      {/* 新店经营情况总结 */}
      <NewStoreOperationStatusContainer />

      {/* 现金流持续亏损门店 */}
      <CashFlowContinuousLossContainer />

      {/* 触发闭店预警门店 (NEW) */}
      <ClosingWarningContainer />
    </div>
  );
};

export default CashFlowTab;
