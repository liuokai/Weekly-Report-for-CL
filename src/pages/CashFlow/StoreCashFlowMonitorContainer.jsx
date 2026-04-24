import React, { useMemo, useState } from 'react';
import useFetchData from '../../hooks/useFetchData';
import FilterDropdown from '../../components/Common/FilterDropdown';
import Pagination from '../../components/Common/Pagination';
import useTableSorting from '../../components/Common/useTableSorting';

/**
 * 单店现金流完成情况监视
 * 数据来源：getStoreCashFlowMonitor（profit_store_detail_monthly.sql）
 * 列：城市、门店编码、门店名称、实际值、目标值、差异值、结论、完成比例
 */
const StoreCashFlowMonitorContainer = () => {
  const { data, loading, error, fetchData } = useFetchData('getStoreCashFlowMonitor', []);

  const [selectedCity, setSelectedCity] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const columns = [
    { key: 'city_name',   label: '城市名称', dataIndex: 'city_name' },
    { key: 'store_code',  label: '门店编码', dataIndex: 'store_code' },
    { key: 'store_name',  label: '门店名称', dataIndex: 'store_name' },
    { key: 'net_cash_flow',    label: '实际值',   dataIndex: 'net_cash_flow' },
    { key: 'cash_flow_target', label: '目标值',   dataIndex: 'cash_flow_target' },
    { key: 'variance',    label: '差异值',   dataIndex: 'variance' },
    { key: 'conclusion',  label: '结论',     dataIndex: 'conclusion' },
    { key: 'completion',  label: '完成比例', dataIndex: 'completion' },
  ];

  const { sortedData, sortConfig, handleSort } = useTableSorting(columns, data || [], { key: 'city_name', direction: 'asc' });

  // 月份选项（取 report_month）
  const monthOptions = useMemo(() => {
    const months = [...new Set((data || []).map(d => d.report_month).filter(Boolean))];
    return months.sort().reverse();
  }, [data]);

  // 默认选最新月份
  React.useEffect(() => {
    if (monthOptions.length > 0 && !selectedMonth) {
      setSelectedMonth(monthOptions[0]);
    }
  }, [monthOptions, selectedMonth]);

  // 城市选项
  const cityOptions = useMemo(() => {
    const cities = [...new Set((data || []).map(d => d.city_name).filter(Boolean))];
    return cities.sort();
  }, [data]);

  // 过滤 + 计算派生字段
  const filteredData = useMemo(() => {
    return sortedData
      .filter(item => {
        if (selectedMonth && item.report_month !== selectedMonth) return false;
        if (selectedCity && item.city_name !== selectedCity) return false;
        return true;
      })
      .map(item => {
        const actual = Number(item.net_cash_flow) || 0;
        const target = Number(item.cash_flow_target) || 0;
        const variance = actual - target;
        const completion = target !== 0 ? Math.round((actual / target) * 100) : null;
        const conclusion = actual >= target ? '已完成' : '未完成';
        return { ...item, variance, conclusion, completion };
      });
  }, [sortedData, selectedMonth, selectedCity]);

  const pagedData = filteredData.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const fmt = (val) => {
    if (val === null || val === undefined) return '-';
    return Number(val).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden mb-6">
      {/* 标题栏 */}
      <div className="px-6 py-4 border-b border-gray-100 bg-[#a40035]/5 flex items-center justify-between">
        <h2 className="text-lg font-bold text-[#a40035] flex items-center gap-2">
          单店现金流完成情况监视
          <span className="ml-2 text-sm font-normal bg-[#a40035]/10 text-[#a40035] px-2 py-0.5 rounded-full">
            {loading ? '...' : `${filteredData.length} 家`}
          </span>
        </h2>
        <div className="flex items-center gap-2">
          {error && (
            <button onClick={() => fetchData()} className="text-xs text-[#a40035] hover:text-[#8a002d] underline">重试</button>
          )}
          <div className="flex flex-row relative z-40">
            <FilterDropdown label="月份" value={selectedMonth} options={monthOptions}
              onChange={(v) => { setSelectedMonth(v); setCurrentPage(1); }} showAllOption={false} />
            <FilterDropdown label="城市" value={selectedCity} options={cityOptions}
              onChange={(v) => { setSelectedCity(v); setCurrentPage(1); }} />
          </div>
        </div>
      </div>

      {/* 表格 */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left text-gray-700">
          <thead className="text-xs text-gray-600 bg-gray-50 border-b">
            <tr>
              {columns.map(col => (
                <th
                  key={col.key}
                  className="px-3 py-2 cursor-pointer hover:bg-gray-100 whitespace-nowrap font-semibold group"
                  onClick={() => handleSort(col.key)}
                >
                  <div className="relative flex items-center justify-center">
                    <span>{col.label}</span>
                    {sortConfig.key === col.key && (
                      <span className="absolute right-0 text-[#a40035]">{sortConfig.direction === 'asc' ? '▲' : '▼'}</span>
                    )}
                    {sortConfig.key !== col.key && (
                      <span className="absolute right-0 text-gray-300 opacity-0 group-hover:opacity-100">↕</span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={columns.length} className="px-6 py-8 text-center text-gray-400">加载中...</td></tr>
            ) : filteredData.length === 0 ? (
              <tr><td colSpan={columns.length} className="px-6 py-8 text-center text-gray-400">暂无数据</td></tr>
            ) : (
              pagedData.map((item, idx) => {
                const done = item.conclusion === '已完成';
                return (
                  <tr key={idx} className="border-b hover:bg-gray-50/50 even:bg-gray-50/30">
                    <td className="px-3 py-2 whitespace-nowrap text-center">{item.city_name}</td>
                    <td className="px-3 py-2 whitespace-nowrap text-center">{item.store_code}</td>
                    <td className="px-3 py-2 whitespace-nowrap text-center">{item.store_name}</td>
                    <td className="px-3 py-2 text-center">{fmt(item.net_cash_flow)}</td>
                    <td className="px-3 py-2 text-center">{fmt(item.cash_flow_target)}</td>
                    <td className={`px-3 py-2 text-center ${item.variance < 0 ? 'text-[#a40035]' : 'text-gray-700'}`}>
                      {fmt(item.variance)}
                    </td>
                    <td className="px-3 py-2 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${done ? 'bg-green-100 text-green-700' : 'bg-red-100 text-[#a40035]'}`}>
                        {item.conclusion}
                      </span>
                    </td>
                    <td className={`px-3 py-2 text-center ${!done ? 'text-[#a40035]' : 'text-gray-700'}`}>
                      {item.completion !== null ? `${item.completion}%` : '-'}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <Pagination
        total={filteredData.length}
        currentPage={currentPage}
        pageSize={pageSize}
        onPageChange={setCurrentPage}
        onPageSizeChange={setPageSize}
      />
    </div>
  );
};

export default StoreCashFlowMonitorContainer;
