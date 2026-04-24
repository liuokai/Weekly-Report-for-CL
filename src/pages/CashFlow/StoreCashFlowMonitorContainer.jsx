import React, { useMemo, useState } from 'react';
import useFetchData from '../../hooks/useFetchData';
import FilterDropdown from '../../components/Common/FilterDropdown';
import Pagination from '../../components/Common/Pagination';
import useTableSorting from '../../components/Common/useTableSorting';

/**
 * 单店现金流完成情况监视
 * 数据来源：getStoreCashFlowCompletionMonitoring（cash_flow_completion_monitoring_store.sql）
 */
const StoreCashFlowMonitorContainer = () => {
  const { data, loading, error, fetchData } = useFetchData('getStoreCashFlowCompletionMonitoring', []);

  const [selectedCity, setSelectedCity] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const columns = [
    { key: 'city_name', label: '城市名称', dataIndex: 'city_name' },
    { key: 'store_code', label: '门店编码', dataIndex: 'store_code' },
    { key: 'store_name', label: '门店名称', dataIndex: 'store_name' },
    { key: 'actual_value', label: '实际值', dataIndex: 'actual_value' },
    { key: 'target_value', label: '目标值', dataIndex: 'target_value' },
    { key: 'diff_value', label: '差异值', dataIndex: 'diff_value' },
    { key: 'conclusion', label: '结论', dataIndex: 'conclusion' },
    { key: 'completion_ratio', label: '完成比例', dataIndex: 'completion_ratio' },
  ];

  const normalizedData = useMemo(() => {
    return (data || []).map((item) => ({
      ...item,
      actual_value: Number(item.actual_value) || 0,
      target_value: Number(item.target_value) || 0,
      diff_value: Number(item.diff_value) || 0,
      completion_ratio: item.completion_ratio === null || item.completion_ratio === undefined
        ? null
        : Number(item.completion_ratio),
      conclusion: item.completion_status || item.conclusion || '-',
    }));
  }, [data]);

  const { sortedData, sortConfig, handleSort } = useTableSorting(
    columns,
    normalizedData,
    { key: 'city_name', direction: 'asc' }
  );

  const cityOptions = useMemo(() => {
    const cities = [...new Set(normalizedData.map((item) => item.city_name).filter(Boolean))];
    return cities.sort();
  }, [normalizedData]);

  const filteredData = useMemo(() => {
    return sortedData.filter((item) => {
      if (selectedCity && item.city_name !== selectedCity) return false;
      return true;
    });
  }, [selectedCity, sortedData]);

  const pagedData = filteredData.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const fmtNumber = (value) => {
    if (value === null || value === undefined) return '-';
    return Number(value).toLocaleString('zh-CN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const fmtPercent = (value) => {
    if (value === null || value === undefined || Number.isNaN(value)) return '-';
    return `${(value * 100).toFixed(2)}%`;
  };

  const isCompleted = (value) => {
    return typeof value === 'string' && (value.includes('已完成') || value.includes('超额完成'));
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden mb-6">
      <div className="px-6 py-4 border-b border-gray-100 bg-[#a40035]/5 flex items-center justify-between">
        <h2 className="text-lg font-bold text-[#a40035] flex items-center gap-2">
          单店现金流完成情况监视
          <span className="ml-2 text-sm font-normal bg-[#a40035]/10 text-[#a40035] px-2 py-0.5 rounded-full">
            {loading ? '...' : `${filteredData.length} 家`}
          </span>
        </h2>
        <div className="flex items-center gap-2">
          {error && (
            <button
              onClick={() => fetchData()}
              className="text-xs text-[#a40035] hover:text-[#8a002d] underline"
            >
              重试
            </button>
          )}
          <div className="flex flex-row relative z-40">
            <FilterDropdown
              label="城市"
              value={selectedCity}
              options={cityOptions}
              onChange={(value) => {
                setSelectedCity(value);
                setCurrentPage(1);
              }}
            />
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left text-gray-700">
          <thead className="text-xs text-gray-600 bg-gray-50 border-b">
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  className="px-3 py-2 cursor-pointer hover:bg-gray-100 whitespace-nowrap font-semibold group"
                  onClick={() => handleSort(col.key)}
                >
                  <div className="relative flex items-center justify-center">
                    <span>{col.label}</span>
                    {sortConfig.key === col.key && (
                      <span className="absolute right-0 text-[#a40035]">
                        {sortConfig.direction === 'asc' ? '▲' : '▼'}
                      </span>
                    )}
                    {sortConfig.key !== col.key && (
                      <span className="absolute right-0 text-gray-300 opacity-0 group-hover:opacity-100">
                        ↕
                      </span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={columns.length} className="px-6 py-8 text-center text-gray-400">
                  加载中...
                </td>
              </tr>
            ) : filteredData.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-6 py-8 text-center text-gray-400">
                  暂无数据
                </td>
              </tr>
            ) : (
              pagedData.map((item, idx) => {
                const completed = isCompleted(item.conclusion);
                return (
                  <tr key={idx} className="border-b hover:bg-gray-50/50 even:bg-gray-50/30">
                    <td className="px-3 py-2 whitespace-nowrap text-center">{item.city_name}</td>
                    <td className="px-3 py-2 whitespace-nowrap text-center">{item.store_code}</td>
                    <td className="px-3 py-2 whitespace-nowrap text-center">{item.store_name}</td>
                    <td className="px-3 py-2 text-center">{fmtNumber(item.actual_value)}</td>
                    <td className="px-3 py-2 text-center">{fmtNumber(item.target_value)}</td>
                    <td className={`px-3 py-2 text-center ${item.diff_value < 0 ? 'text-[#a40035]' : 'text-gray-700'}`}>
                      {fmtNumber(item.diff_value)}
                    </td>
                    <td className="px-3 py-2 text-center">
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          completed ? 'bg-transparent text-gray-700' : 'bg-red-100 text-[#a40035]'
                        }`}
                      >
                        {item.conclusion}
                      </span>
                    </td>
                    <td className={`px-3 py-2 text-center ${!completed ? 'text-[#a40035]' : 'text-gray-700'}`}>
                      {fmtPercent(item.completion_ratio)}
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
