import React, { useMemo, useState, useEffect } from 'react';
import useFetchData from '../../hooks/useFetchData';
import useTableSorting from '../../components/Common/useTableSorting';
import FilterDropdown from '../../components/Common/FilterDropdown';

/**
 * 爬坡期门店经营情况总结组件
 * 数据来源：cash_flow_new_store_commission.sql（不限年份，覆盖所有爬坡期门店）
 */
const RampUpStoreOperationContainer = () => {
  const { data, loading, error, fetchData } = useFetchData('getRampUpStoreOperationStatus', []);

  // 计算昨天的日期
  const yesterday = useMemo(() => {
    const date = new Date();
    date.setDate(date.getDate() - 1);
    return date.toISOString().split('T')[0];
  }, []);

  // 从数据中提取月份列表（降序）
  const monthList = useMemo(() => {
    if (!data || data.length === 0) return [];
    const months = [...new Set(data.map(item => item['month']).filter(Boolean))];
    return months.sort().reverse();
  }, [data]);

  // 默认选中最新月份
  const [selectedMonth, setSelectedMonth] = useState('');
  useEffect(() => {
    if (monthList.length > 0 && !selectedMonth) {
      setSelectedMonth(monthList[0]);
    }
  }, [monthList, selectedMonth]);

  // 城市筛选
  const [selectedCity, setSelectedCity] = useState(null);

  // 从数据中提取城市列表
  const cityList = useMemo(() => {
    const cities = [...new Set((data || []).map(d => d.city_name).filter(Boolean))];
    return cities.sort();
  }, [data]);

  // 分页状态
  const PAGE_SIZE = 10;
  const [currentPage, setCurrentPage] = useState(1);

  // 按月份和城市筛选后的数据
  const filteredData = useMemo(() => {
    if (!data) return [];
    return data.filter(item => {
      if (selectedMonth && item['month'] !== selectedMonth) return false;
      if (selectedCity && item['city_name'] !== selectedCity) return false;
      return true;
    });
  }, [data, selectedMonth, selectedCity]);

  // 分页数据
  const totalPages = Math.ceil(filteredData.length / PAGE_SIZE);
  const pagedData = filteredData.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const columns = [
    { key: 'month', label: '月份', dataIndex: 'month' },
    { key: 'city_name', label: '城市', dataIndex: 'city_name' },
    { key: 'store_name', label: '门店名称', dataIndex: 'store_name' },
    { key: 'store_code', label: '门店编码', dataIndex: 'store_code' },
    { key: 'city_store_order', label: '城市门店排序', dataIndex: 'city_store_order' },
    { key: 'opening_date', label: '开业日期', dataIndex: 'opening_date' },
    { key: 'city_manager_name', label: '城市经理', dataIndex: 'city_manager_name' },
    { key: 'tech_vice_president_name', label: '技术副总', dataIndex: 'tech_vice_president_name' },
    { key: 'ramp_up_period_months', label: '爬坡期长度', dataIndex: 'ramp_up_period_months' },
    { key: 'current_ramp_up_month_index', label: '当前爬坡期', dataIndex: 'current_ramp_up_month_index' },
    { key: 'cash_flow_budget_total', label: '现金流目标值', dataIndex: 'cash_flow_budget_total' },
    { key: 'cash_flow_actual_to_date', label: '爬坡期现金流实际值', dataIndex: 'cash_flow_actual_to_date' },
    { key: 'cash_flow_variance', label: '现金流差异', dataIndex: 'cash_flow_variance' },
    { key: 'marketing_budget_total', label: '营销费预算', dataIndex: 'marketing_budget_total' },
    { key: 'marketing_actual_total', label: '营销费合计', dataIndex: 'marketing_actual_total' },
    { key: 'marketing_usage_diff', label: '营销费差异', dataIndex: 'marketing_usage_diff' },
    { key: 'ad_fee_actual', label: '广告费', dataIndex: 'ad_fee_actual' },
    { key: 'group_buy_discount_actual', label: '团购优惠', dataIndex: 'group_buy_discount_actual' },
    { key: 'offline_ad_fee_actual', label: '线下广告', dataIndex: 'offline_ad_fee_actual' },
    { key: 'new_guest_discount_actual', label: '新客优惠', dataIndex: 'new_guest_discount_actual' },
    { key: 'exhibition_fee_actual', label: '布展', dataIndex: 'exhibition_fee_actual' },
    { key: 'masseur_commission_actual', label: '推拿师提成', dataIndex: 'masseur_commission_actual' },
    { key: 'incentive_budget_total', label: '激励费预算', dataIndex: 'incentive_budget_total' },
    { key: 'incentive_actual_total', label: '激励费实际', dataIndex: 'incentive_actual_total' },
    { key: 'incentive_usage_ratio_display', label: '激励费使用率', dataIndex: 'incentive_usage_ratio_display' },
    { key: 'incentive_variance', label: '激励费差异', dataIndex: 'incentive_variance' },
  ];

  const { sortedData, sortConfig, handleSort } = useTableSorting(columns, filteredData, { key: 'city_store_order', direction: 'asc' });

  const formatCurrency = (val) => {
    if (val === null || val === undefined) return '-';
    return Number(val).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return dateStr.split('T')[0];
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden mb-6">
      <div className="px-6 py-4 border-b border-gray-100 bg-[#a40035]/5 flex items-center justify-between">
        <h2 className="text-lg font-bold text-[#a40035] flex items-center gap-2">
          爬坡期门店经营情况总结
          <span className="ml-2 text-sm font-normal bg-[#a40035]/10 text-[#a40035] px-2 py-0.5 rounded-full">
            {loading ? '...' : `${data?.length || 0} 家`}
          </span>
          <span className="ml-3 text-sm font-normal text-[#a40035]">
            数据区间: 开业至 {yesterday}
          </span>
        </h2>
        {error && (
          <button onClick={() => fetchData()} className="text-xs text-[#a40035] hover:text-[#8a002d] underline">
            重试
          </button>
        )}
        {/* 月份筛选下拉 */}
        <div className="flex flex-row relative z-40">
          <FilterDropdown
            label="城市"
            value={selectedCity}
            options={cityList}
            onChange={(val) => { setSelectedCity(val); setCurrentPage(1); }}
          />
          <FilterDropdown
            label="月份"
            value={selectedMonth}
            options={monthList}
            onChange={(val) => { setSelectedMonth(val || monthList[0] || ''); setCurrentPage(1); }}
            showAllOption={false}
          />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left text-gray-500">
          <thead className="text-xs text-gray-700 uppercase bg-gray-50 border-b">
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  scope="col"
                  className="px-6 py-3 cursor-pointer hover:bg-gray-100 whitespace-nowrap group"
                  onClick={() => handleSort(col.key)}
                >
                  <div className="flex items-center gap-1">
                    {col.label}
                    {sortConfig.key === col.key && (
                      <span className="text-[#a40035]">
                        {sortConfig.direction === 'asc' ? '▲' : '▼'}
                      </span>
                    )}
                    {(!sortConfig.key || sortConfig.key !== col.key) && (
                      <span className="text-gray-300 opacity-0 group-hover:opacity-100">↕</span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={columns.length} className="px-6 py-8 text-center text-gray-400">加载中...</td></tr>
            ) : sortedData.length === 0 ? (
              <tr><td colSpan={columns.length} className="px-6 py-8 text-center text-gray-400">暂无数据</td></tr>
            ) : (
              pagedData.map((item, index) => (
                <tr key={index} className="bg-white border-b hover:bg-gray-50/50">
                  <td className="px-6 py-4 whitespace-nowrap text-gray-700">{item['month'] || '-'}</td>
                  <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">{item['city_name']}</td>
                  <td className="px-6 py-4 text-gray-900 whitespace-nowrap">{item['store_name']}</td>
                  <td className="px-6 py-4 text-gray-500 text-xs">{item['store_code']}</td>
                  <td className="px-6 py-4 text-center">{item['city_store_order'] ?? '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{formatDate(item['opening_date'])}</td>
                  <td className="px-6 py-4">{item['city_manager_name'] || '-'}</td>
                  <td className="px-6 py-4">{item['tech_vice_president_name'] || '-'}</td>
                  <td className="px-6 py-4 text-center">{item['ramp_up_period_months']}</td>
                  <td className="px-6 py-4 text-center">{item['current_ramp_up_month_index']}</td>
                  <td className="px-6 py-4 text-right font-mono">{formatCurrency(item['cash_flow_budget_total'])}</td>
                  <td className="px-6 py-4 text-right font-mono">{formatCurrency(item['cash_flow_actual_to_date'])}</td>
                  <td className={`px-6 py-4 text-right font-mono font-bold ${item['cash_flow_variance'] < 0 ? 'text-red-600' : ''}`}>
                    {formatCurrency(item['cash_flow_variance'])}
                  </td>
                  <td className="px-6 py-4 text-right font-mono">{formatCurrency(item['marketing_budget_total'])}</td>
                  <td className="px-6 py-4 text-right font-mono">{formatCurrency(item['marketing_actual_total'])}</td>
                  <td className={`px-6 py-4 text-right font-mono ${item['marketing_usage_diff'] < 0 ? 'text-red-600' : ''}`}>
                    {formatCurrency(item['marketing_usage_diff'])}
                  </td>
                  <td className="px-6 py-4 text-right font-mono">{formatCurrency(item['ad_fee_actual'])}</td>
                  <td className="px-6 py-4 text-right font-mono">{formatCurrency(item['group_buy_discount_actual'])}</td>
                  <td className="px-6 py-4 text-right font-mono">{formatCurrency(item['offline_ad_fee_actual'])}</td>
                  <td className="px-6 py-4 text-right font-mono">{formatCurrency(item['new_guest_discount_actual'])}</td>
                  <td className="px-6 py-4 text-right font-mono">{formatCurrency(item['exhibition_fee_actual'])}</td>
                  <td className="px-6 py-4 text-right font-mono">{formatCurrency(item['masseur_commission_actual'])}</td>
                  <td className="px-6 py-4 text-right font-mono">{formatCurrency(item['incentive_budget_total'])}</td>
                  <td className="px-6 py-4 text-right font-mono">{formatCurrency(item['incentive_actual_total'])}</td>
                  <td className="px-6 py-4 text-right font-mono text-gray-500">{item['incentive_usage_ratio_display'] || '-'}</td>
                  <td className={`px-6 py-4 text-right font-mono font-bold ${item['incentive_variance'] > 0 ? 'text-red-600' : ''}`}>
                    {formatCurrency(item['incentive_variance'])}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* 分页控件 */}
      {totalPages > 1 && (
        <div className="px-6 py-3 border-t border-gray-100 flex items-center justify-between text-sm text-gray-500">
          <span>共 {filteredData.length} 条，第 {currentPage} / {totalPages} 页</span>
          <div className="flex items-center gap-1">
            <button onClick={() => setCurrentPage(1)} disabled={currentPage === 1} className="px-2 py-1 rounded border border-gray-200 disabled:opacity-30 hover:border-[#a40035] hover:text-[#a40035]">«</button>
            <button onClick={() => setCurrentPage(p => p - 1)} disabled={currentPage === 1} className="px-2 py-1 rounded border border-gray-200 disabled:opacity-30 hover:border-[#a40035] hover:text-[#a40035]">‹</button>
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter(p => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 2)
              .reduce((acc, p, idx, arr) => {
                if (idx > 0 && p - arr[idx - 1] > 1) acc.push('...');
                acc.push(p);
                return acc;
              }, [])
              .map((p, idx) => p === '...' ? (
                <span key={`ellipsis-${idx}`} className="px-2">…</span>
              ) : (
                <button key={p} onClick={() => setCurrentPage(p)} className={`px-3 py-1 rounded border ${currentPage === p ? 'border-[#a40035] text-[#a40035] font-bold' : 'border-gray-200 hover:border-[#a40035] hover:text-[#a40035]'}`}>{p}</button>
              ))
            }
            <button onClick={() => setCurrentPage(p => p + 1)} disabled={currentPage === totalPages} className="px-2 py-1 rounded border border-gray-200 disabled:opacity-30 hover:border-[#a40035] hover:text-[#a40035]">›</button>
            <button onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages} className="px-2 py-1 rounded border border-gray-200 disabled:opacity-30 hover:border-[#a40035] hover:text-[#a40035]">»</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default RampUpStoreOperationContainer;
