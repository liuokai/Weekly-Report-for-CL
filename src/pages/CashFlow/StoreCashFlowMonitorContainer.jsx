import React, { useMemo, useState } from 'react';
import useFetchData from '../../hooks/useFetchData';
import FilterDropdown from '../../components/Common/FilterDropdown';
import Pagination from '../../components/Common/Pagination';
import useTableSorting from '../../components/Common/useTableSorting';

const TABLE_HEADER_CELL_CLASS = 'relative border-r border-b border-gray-300 px-3 py-2 whitespace-nowrap font-semibold text-center last:border-r-0';
const TABLE_BODY_CELL_CLASS = 'border-r border-b border-gray-200 px-3 py-2 text-gray-700 last:border-r-0';

const getTableMinWidth = (columnWidths) => (
  Object.values(columnWidths).reduce((total, width) => total + Number.parseInt(width, 10), 0)
);

const getStickyLeftOffsets = (columns, columnWidths, count) => {
  let offset = 0;
  return columns.slice(0, count).reduce((acc, col) => {
    acc[col.key] = offset;
    offset += Number.parseInt(columnWidths[col.key] || '120px', 10);
    return acc;
  }, {});
};

const SORT_ASC = '\u2191';
const SORT_DESC = '\u2193';
const SORT_IDLE = '\u2195';

const StoreCashFlowMonitorContainer = () => {
  const { data, loading, error, fetchData } = useFetchData('getStoreCashFlowCompletionMonitoring', []);

  const [selectedCity, setSelectedCity] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const columns = [
    { key: 'city_name', label: '城市名称', dataIndex: 'city_name' },
    { key: 'store_code', label: '门店编码', dataIndex: 'store_code' },
    { key: 'store_name', label: '门店名称', dataIndex: 'store_name' },
    { key: 'opening_date', label: '开业日期', dataIndex: 'opening_date' },
    { key: 'ramp_up_period', label: '爬坡期长度', dataIndex: 'ramp_up_period' },
    { key: 'ramp_up_month_count', label: '当前爬坡期月数', dataIndex: 'ramp_up_month_count' },
    { key: 'ramp_up_end_month', label: '爬坡期结束月', dataIndex: 'ramp_up_end_month' },
    { key: 'actual_value', label: '实际值', dataIndex: 'actual_value' },
    { key: 'target_value', label: '目标值', dataIndex: 'target_value' },
    { key: 'diff_value', label: '差异值', dataIndex: 'diff_value' },
    { key: 'conclusion', label: '结论', dataIndex: 'conclusion' },
    { key: 'completion_ratio', label: '完成比例', dataIndex: 'completion_ratio' },
  ];

  const columnWidths = {
    city_name: '140px',
    store_code: '130px',
    store_name: '180px',
    opening_date: '130px',
    ramp_up_period: '120px',
    ramp_up_month_count: '140px',
    ramp_up_end_month: '130px',
    actual_value: '140px',
    target_value: '140px',
    diff_value: '140px',
    conclusion: '140px',
    completion_ratio: '140px',
  };
  const tableMinWidth = getTableMinWidth(columnWidths);
  const stickyOffsets = getStickyLeftOffsets(columns, columnWidths, 4);

  const normalizedData = useMemo(() => (
    (data || []).map((item) => ({
      ...item,
      actual_value: Number(item.actual_value) || 0,
      target_value: Number(item.target_value) || 0,
      diff_value: Number(item.diff_value) || 0,
      completion_ratio: item.completion_ratio === null || item.completion_ratio === undefined
        ? null
        : Number(item.completion_ratio),
      conclusion: item.completion_status || item.conclusion || '-',
    }))
  ), [data]);

  const { sortedData, sortConfig, handleSort } = useTableSorting(columns, normalizedData, {
    key: 'city_name',
    direction: 'asc',
  });

  const cityOptions = useMemo(() => {
    const cities = [...new Set(normalizedData.map((item) => item.city_name).filter(Boolean))];
    return cities.sort();
  }, [normalizedData]);

  const previousMonthLabel = useMemo(() => {
    const now = new Date();
    now.setMonth(now.getMonth() - 1);
    return `${now.getFullYear()}年${String(now.getMonth() + 1).padStart(2, '0')}月`;
  }, []);

  const filteredData = useMemo(() => (
    sortedData.filter((item) => {
      if (selectedCity && item.city_name !== selectedCity) return false;
      return true;
    })
  ), [selectedCity, sortedData]);

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

  const fmtDate = (value) => {
    if (!value) return '-';
    return String(value).split('T')[0];
  };

  const fmtText = (value) => (
    value === null || value === undefined || value === '' ? '-' : value
  );

  const isCompleted = (value) => (
    typeof value === 'string' && (value.includes('已完成') || value.includes('超额完成'))
  );

  return (
    <div className="mb-6 overflow-hidden rounded-lg border border-gray-100 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-gray-100 bg-[#a40035]/5 px-6 py-4">
        <div className="flex flex-col items-start">
          <h2 className="flex items-center gap-2 text-lg font-bold text-[#a40035]">
            单店现金流完成情况监控
            <span className="ml-2 rounded-full bg-[#a40035]/10 px-2 py-0.5 text-sm font-normal text-[#a40035]">
              {loading ? '...' : `${filteredData.length} 家`}
            </span>
          </h2>
          <p className="mt-1 text-left text-sm text-gray-600">
            统计所有在营门店2026年现金流情况，数据截止到{previousMonthLabel}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {error && (
            <button
              onClick={() => fetchData()}
              className="text-xs text-[#a40035] underline hover:text-[#8a002d]"
            >
              重试
            </button>
          )}
          <div className="relative z-40 flex flex-row">
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
        <table
          className="w-full table-fixed border-separate border-spacing-0 border-l border-t border-gray-300 text-left text-sm text-gray-700"
          style={{ minWidth: `${tableMinWidth}px` }}
        >
          <colgroup>
            {columns.map((col) => (
              <col key={col.key} style={{ width: columnWidths[col.key] || '120px' }} />
            ))}
          </colgroup>
          <thead className="bg-gray-100 text-xs text-gray-600">
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={`${TABLE_HEADER_CELL_CLASS} cursor-pointer hover:bg-gray-100 group ${stickyOffsets[col.key] !== undefined ? 'sticky bg-gray-100 z-30 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]' : ''}`}
                  style={stickyOffsets[col.key] !== undefined ? { left: `${stickyOffsets[col.key]}px` } : undefined}
                  onClick={() => handleSort(col.key)}
                >
                  <div className="flex w-full items-center justify-center">
                    <span className="block text-center">{col.label}</span>
                  </div>
                  {sortConfig.key === col.key && (
                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[#a40035]">
                      {sortConfig.direction === 'asc' ? SORT_ASC : SORT_DESC}
                    </span>
                  )}
                  {sortConfig.key !== col.key && (
                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-300 opacity-0 group-hover:opacity-100">
                      {SORT_IDLE}
                    </span>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={columns.length} className="border border-gray-200 px-6 py-8 text-center text-gray-400">
                  加载中...
                </td>
              </tr>
            ) : filteredData.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="border border-gray-200 px-6 py-8 text-center text-gray-400">
                  暂无数据
                </td>
              </tr>
            ) : (
              pagedData.map((item, idx) => {
                const completed = isCompleted(item.conclusion);
                const rowBgClass = idx % 2 === 0 ? 'bg-white' : 'bg-gray-50';

                return (
                  <tr key={idx} className={`group ${rowBgClass} hover:bg-gray-50`}>
                    <td
                      className={`${TABLE_BODY_CELL_CLASS} whitespace-nowrap text-center sticky z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] ${rowBgClass} group-hover:bg-gray-50`}
                      style={{ left: `${stickyOffsets.city_name}px` }}
                    >
                      {item.city_name}
                    </td>
                    <td
                      className={`${TABLE_BODY_CELL_CLASS} whitespace-nowrap text-center sticky z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] ${rowBgClass} group-hover:bg-gray-50`}
                      style={{ left: `${stickyOffsets.store_code}px` }}
                    >
                      {item.store_code}
                    </td>
                    <td
                      className={`${TABLE_BODY_CELL_CLASS} whitespace-nowrap text-center sticky z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] ${rowBgClass} group-hover:bg-gray-50`}
                      style={{ left: `${stickyOffsets.store_name}px` }}
                    >
                      {item.store_name}
                    </td>
                    <td
                      className={`${TABLE_BODY_CELL_CLASS} whitespace-nowrap text-center sticky z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] ${rowBgClass} group-hover:bg-gray-50`}
                      style={{ left: `${stickyOffsets.opening_date}px` }}
                    >
                      {fmtDate(item.opening_date)}
                    </td>
                    <td className={`${TABLE_BODY_CELL_CLASS} text-center`}>{fmtText(item.ramp_up_period)}</td>
                    <td className={`${TABLE_BODY_CELL_CLASS} text-center`}>{fmtText(item.ramp_up_month_count)}</td>
                    <td className={`${TABLE_BODY_CELL_CLASS} whitespace-nowrap text-center`}>{fmtText(item.ramp_up_end_month)}</td>
                    <td className={`${TABLE_BODY_CELL_CLASS} text-center`}>{fmtNumber(item.actual_value)}</td>
                    <td className={`${TABLE_BODY_CELL_CLASS} text-center`}>{fmtNumber(item.target_value)}</td>
                    <td className={`${TABLE_BODY_CELL_CLASS} text-center ${item.diff_value < 0 ? 'text-[#a40035]' : 'text-gray-700'}`}>
                      {fmtNumber(item.diff_value)}
                    </td>
                    <td className={`${TABLE_BODY_CELL_CLASS} text-center`}>
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                          completed ? 'bg-transparent text-gray-700' : 'bg-red-100 text-[#a40035]'
                        }`}
                      >
                        {item.conclusion}
                      </span>
                    </td>
                    <td className={`${TABLE_BODY_CELL_CLASS} text-center ${!completed ? 'text-[#a40035]' : 'text-gray-700'}`}>
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
