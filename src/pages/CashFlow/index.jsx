import React, { useMemo, useState } from 'react';
import useFetchData from '../../hooks/useFetchData';
import DataTable from '../../components/Common/DataTable';
import DataContainer from '../../components/Common/DataContainer';

const CashFlowTab = () => {
  const { data: newStoreProcessData } = useFetchData('getCashFlowNewStoreProcess');

  const processedData = useMemo(() => {
    if (!Array.isArray(newStoreProcessData)) return [];
    
    // 获取最新月份
    const months = Array.from(new Set(newStoreProcessData.map(r => r.month))).sort();
    const latestMonth = months[months.length - 1];
    
    // 过滤最新月份数据
    const currentMonthData = newStoreProcessData.filter(r => r.month === latestMonth);

    // 计算合计行
    const totalNewTarget = currentMonthData.reduce((sum, r) => sum + (Number(r['新店目标']) || 0), 0);
    const totalNewActual = currentMonthData.reduce((sum, r) => sum + (Number(r['新店数量']) || 0), 0);
    const totalReinstallTarget = currentMonthData.reduce((sum, r) => sum + (Number(r['重装目标']) || 0), 0);
    const totalReinstallActual = currentMonthData.reduce((sum, r) => sum + (Number(r['重装数量']) || 0), 0);
    const totalStores = currentMonthData.reduce((sum, r) => sum + (Number(r['门店数量']) || 0), 0);

    // 计算合计行状态逻辑 (参考 SQL 逻辑)
    const getSummaryStatus = (target, actual) => {
      if ((target === null || target === 0) && actual > 0) return '高于目标';
      if ((target === null || target === 0) && (actual === null || actual === 0)) return null;
      if (actual === target) return '如期完成';
      if (actual > target) return '高于目标';
      if (actual < target) return '未完成';
      return null;
    };

    const summaryRow = {
      month: latestMonth,
      city_name: '合计',
      '新店目标': totalNewTarget,
      '新店数量': totalNewActual,
      '新店目标完成情况': getSummaryStatus(totalNewTarget, totalNewActual),
      '重装目标': totalReinstallTarget,
      '重装数量': totalReinstallActual,
      '重装目标完成情况': getSummaryStatus(totalReinstallTarget, totalReinstallActual),
      '门店数量': totalStores,
      isSummary: true // 标记为合计行，用于样式处理
    };

    return [...currentMonthData, summaryRow];
  }, [newStoreProcessData]);

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

  // 汇总统计逻辑（按月份聚合最新数据）
  const summaryMetrics = useMemo(() => {
    if (!processedData.length) return null;
    
    // 找到合计行
    const summaryRow = processedData.find(r => r.isSummary);
    if (!summaryRow) return null;

    const totalNewTarget = summaryRow['新店目标'];
    const totalNewActual = summaryRow['新店数量'];
    const totalReinstallTarget = summaryRow['重装目标'];
    const totalReinstallActual = summaryRow['重装数量'];
    const totalStores = summaryRow['门店数量'];

    return {
      month: summaryRow.month,
      totalStores,
      newStore: {
        target: totalNewTarget,
        actual: totalNewActual,
        rate: totalNewTarget > 0 ? Math.round((totalNewActual / totalNewTarget) * 100) : 0
      },
      reinstall: {
        target: totalReinstallTarget,
        actual: totalReinstallActual,
        rate: totalReinstallTarget > 0 ? Math.round((totalReinstallActual / totalReinstallTarget) * 100) : 0
      }
    };
  }, [processedData]);

  return (
    <div className="space-y-6">
      {/* 核心指标卡片 */}
      {summaryMetrics && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* 门店总数卡片 */}
          <div className="bg-gradient-to-br from-[#a40035] to-[#c81f52] rounded-xl shadow-md p-6 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <svg className="w-24 h-24" fill="currentColor" viewBox="0 0 24 24"><path d="M12 7V3H2v18h20V7H12zM6 19H4v-2h2v2zm0-4H4v-2h2v2zm0-4H4V9h2v2zm0-4H4V5h2v2zm4 12H8v-2h2v2zm0-4H8v-2h2v2zm0-4H8V9h2v2zm0-4H8V5h2v2zm10 12h-8v-2h2v-2h-2v-2h2V9h-2V7h8v12zm-2-8h-2v2h2V9zm0 4h-2v2h2v-2z"/></svg>
            </div>
            <div className="relative z-10">
              <p className="text-white/80 text-sm font-medium mb-1">当前门店总数</p>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-bold">{summaryMetrics.totalStores}</span>
                <span className="text-sm">家</span>
              </div>
              <p className="mt-4 text-xs bg-white/20 inline-block px-2 py-1 rounded">
                统计截止：{summaryMetrics.month}
              </p>
            </div>
          </div>

          {/* 新店指标卡片 */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-gray-600 font-medium">新店开发进度</h4>
                <span className={`px-2 py-1 rounded text-xs font-bold ${
                  summaryMetrics.newStore.actual >= summaryMetrics.newStore.target 
                    ? 'bg-green-100 text-green-700' 
                    : 'bg-red-50 text-[#a40035]'
                }`}>
                  {summaryMetrics.newStore.actual >= summaryMetrics.newStore.target ? '达成目标' : '需努力'}
                </span>
              </div>
              <div className="flex items-end justify-between mb-2">
                <div>
                  <span className="text-3xl font-bold text-gray-800">{summaryMetrics.newStore.actual}</span>
                  <span className="text-gray-500 text-sm ml-1">/ {summaryMetrics.newStore.target} 家</span>
                </div>
                <div className="text-right">
                  <span className="text-sm text-gray-500 block">完成率</span>
                  <span className="text-xl font-bold text-[#a40035]">{summaryMetrics.newStore.rate}%</span>
                </div>
              </div>
            </div>
            {/* 进度条 */}
            <div className="w-full bg-gray-100 rounded-full h-2 mt-2">
              <div 
                className="bg-[#a40035] h-2 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(summaryMetrics.newStore.rate, 100)}%` }}
              ></div>
            </div>
          </div>

          {/* 重装指标卡片 */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-gray-600 font-medium">老店重装进度</h4>
                <span className={`px-2 py-1 rounded text-xs font-bold ${
                  summaryMetrics.reinstall.actual >= summaryMetrics.reinstall.target 
                    ? 'bg-green-100 text-green-700' 
                    : 'bg-blue-50 text-blue-600'
                }`}>
                  {summaryMetrics.reinstall.actual >= summaryMetrics.reinstall.target ? '达成目标' : '进行中'}
                </span>
              </div>
              <div className="flex items-end justify-between mb-2">
                <div>
                  <span className="text-3xl font-bold text-gray-800">{summaryMetrics.reinstall.actual}</span>
                  <span className="text-gray-500 text-sm ml-1">/ {summaryMetrics.reinstall.target} 家</span>
                </div>
                <div className="text-right">
                  <span className="text-sm text-gray-500 block">完成率</span>
                  <span className="text-xl font-bold text-blue-600">{summaryMetrics.reinstall.rate}%</span>
                </div>
              </div>
            </div>
            {/* 进度条 */}
            <div className="w-full bg-gray-100 rounded-full h-2 mt-2">
              <div 
                className="bg-blue-500 h-2 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(summaryMetrics.reinstall.rate, 100)}%` }}
              ></div>
            </div>
          </div>
        </div>
      )}

      {/* 详细数据表格 - 使用 DataContainer 保持统一风格 */}
      <DataContainer title="新店与重装目标完成情况详情">
        <DataTable data={processedData} columns={columns} />
      </DataContainer>
    </div>
  );
};

export default CashFlowTab;
