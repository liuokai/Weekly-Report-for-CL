import React from 'react';
import useFetchData from '../../hooks/useFetchData';
import useTableSorting from '../../components/Common/useTableSorting';
import FilterDropdown from '../../components/Common/FilterDropdown';
import Pagination from '../../components/Common/Pagination';

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

const RampUpDetailModal = ({ store, onClose }) => {
  const { data: allData, loading } = useFetchData('getRampUpStoreOperationStatus', []);

  const storeData = React.useMemo(() => {
    if (!allData || !store) return [];
    return allData
      .filter((item) => item.store_code === store.store_code)
      .sort((a, b) => (a.month || '').localeCompare(b.month || ''));
  }, [allData, store]);

  const columns = [
    { key: 'month', label: '月份' },
    { key: 'city_name', label: '城市' },
    { key: 'store_name', label: '门店名称' },
    { key: 'store_code', label: '门店编码' },
    { key: 'city_store_order', label: '城市门店排序' },
    { key: 'opening_date', label: '开业日期' },
    { key: 'city_manager_name', label: '城市经理' },
    { key: 'tech_vice_president_name', label: '技术副总' },
    { key: 'ramp_up_period_months', label: '爬坡期长度' },
    { key: 'current_ramp_up_month_index', label: '当前爬坡月' },
    { key: 'cash_flow_budget_total', label: '现金流目标值' },
    { key: 'cash_flow_actual_to_date', label: '爬坡期现金流实际值' },
    { key: 'cash_flow_variance', label: '现金流差异' },
    { key: 'marketing_budget_total', label: '营销费预算' },
    { key: 'marketing_actual_total', label: '营销费合计' },
    { key: 'marketing_usage_diff', label: '营销费差异' },
    { key: 'ad_fee_actual', label: '广告费' },
    { key: 'group_buy_discount_actual', label: '团购优惠' },
    { key: 'offline_ad_fee_actual', label: '线下广告' },
    { key: 'new_guest_discount_actual', label: '新客优惠' },
    { key: 'exhibition_fee_actual', label: '布展费' },
    { key: 'masseur_commission_actual', label: '推拿师提成' },
    { key: 'incentive_budget_total', label: '激励费预算' },
    { key: 'incentive_actual_total', label: '激励费实际' },
    { key: 'incentive_usage_ratio_display', label: '激励费使用率' },
    { key: 'incentive_variance', label: '激励费差异' },
  ];

  columns.splice(
    columns.findIndex((col) => col.key === 'current_ramp_up_month_index'),
    0,
    { key: 'ramp_up_end_month', label: '爬坡期结束月' }
  );

  const columnWidths = {
    month: '120px',
    city_name: '120px',
    store_name: '180px',
    store_code: '130px',
    city_store_order: '140px',
    opening_date: '130px',
    city_manager_name: '140px',
    tech_vice_president_name: '150px',
    ramp_up_period_months: '120px',
    ramp_up_end_month: '130px',
    current_ramp_up_month_index: '120px',
    cash_flow_budget_total: '150px',
    cash_flow_actual_to_date: '170px',
    cash_flow_variance: '150px',
    marketing_budget_total: '150px',
    marketing_actual_total: '150px',
    marketing_usage_diff: '150px',
    ad_fee_actual: '140px',
    group_buy_discount_actual: '150px',
    offline_ad_fee_actual: '150px',
    new_guest_discount_actual: '150px',
    exhibition_fee_actual: '140px',
    masseur_commission_actual: '150px',
    incentive_budget_total: '150px',
    incentive_actual_total: '150px',
    incentive_usage_ratio_display: '140px',
    incentive_variance: '150px',
  };
  const tableMinWidth = getTableMinWidth(columnWidths);
  const stickyOffsets = getStickyLeftOffsets(columns, columnWidths, 5);

  const formatCurrency = (value) => {
    if (value === null || value === undefined) return '-';
    return Number(value).toLocaleString('zh-CN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const formatDate = (value) => {
    if (!value) return '-';
    return value.split('T')[0];
  };

  const currencyKeys = new Set([
    'cash_flow_budget_total', 'cash_flow_actual_to_date', 'cash_flow_variance',
    'marketing_budget_total', 'marketing_actual_total', 'marketing_usage_diff',
    'ad_fee_actual', 'group_buy_discount_actual', 'offline_ad_fee_actual',
    'new_guest_discount_actual', 'exhibition_fee_actual', 'masseur_commission_actual',
    'incentive_budget_total', 'incentive_actual_total', 'incentive_variance',
  ]);
  const negativeKeys = new Set(['cash_flow_variance', 'marketing_usage_diff', 'incentive_variance']);

  const getCellClass = (key, value) => {
    if (negativeKeys.has(key) && Number(value) < 0) return 'text-[#a40035]';
    return '';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div
        className="flex max-h-[90vh] w-[96vw] max-w-[1400px] flex-col rounded-xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex shrink-0 items-center justify-between rounded-t-xl border-b border-gray-100 bg-[#a40035]/5 px-6 py-4">
          <div>
            <h2 className="text-lg font-bold text-[#a40035]">爬坡期门店经营情况明细</h2>
            <p className="mt-0.5 text-sm text-gray-500">
              {store.store_name}（{store.store_code}），共 {storeData.length} 个月
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-auto p-4">
          <table
            className="w-full table-fixed border-separate border-spacing-0 border-l border-t border-gray-300 text-center text-sm text-gray-700"
            style={{ minWidth: `${tableMinWidth}px` }}
          >
            <colgroup>
              {columns.map((col) => (
                <col key={col.key} style={{ width: columnWidths[col.key] || '120px' }} />
              ))}
            </colgroup>
            <thead className="sticky top-0 z-10 bg-gray-100 text-xs text-gray-600">
              <tr>
                {columns.map((col, colIdx) => (
                  <th
                    key={col.key}
                    className={`${TABLE_HEADER_CELL_CLASS} ${colIdx < 5 ? 'sticky bg-gray-100 z-30 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]' : ''}`}
                    style={colIdx < 5 ? { left: `${stickyOffsets[col.key]}px` } : undefined}
                  >
                    {col.label}
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
              ) : storeData.length === 0 ? (
                <tr>
                  <td colSpan={columns.length} className="border border-gray-200 px-6 py-8 text-center text-gray-400">
                    暂无爬坡期数据
                  </td>
                </tr>
              ) : (
                storeData.map((item, idx) => {
                  const rowBgClass = idx % 2 === 0 ? 'bg-white' : 'bg-gray-50';

                  return (
                    <tr key={idx} className={`group ${rowBgClass} hover:bg-gray-50`}>
                      {columns.map((col, colIdx) => {
                        const value = item[col.key];
                        const display = col.key === 'opening_date'
                          ? formatDate(value)
                          : currencyKeys.has(col.key)
                            ? formatCurrency(value)
                            : (value ?? '-');

                        return (
                          <td
                            key={col.key}
                            className={`${TABLE_BODY_CELL_CLASS} whitespace-nowrap text-center ${getCellClass(col.key, value)} ${colIdx < 5 ? `sticky z-10 ${rowBgClass} group-hover:bg-gray-50 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]` : ''}`}
                            style={colIdx < 5 ? { left: `${stickyOffsets[col.key]}px` } : undefined}
                          >
                            {display}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const NewStoreOperationStatusContainer = () => {
  const { data, loading, error, fetchData } = useFetchData('getNewStoreOperationStatus', []);

  const [selectedCity, setSelectedCity] = React.useState(null);
  const [selectedMonth, setSelectedMonth] = React.useState(null);
  const [modalStore, setModalStore] = React.useState(null);

  const [currentPage, setCurrentPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(10);

  const columns = [
    { key: 'city_name', label: '城市', dataIndex: 'city_name' },
    { key: 'store_name', label: '门店名称', dataIndex: 'store_name' },
    { key: 'store_code', label: '门店编码', dataIndex: 'store_code' },
    { key: 'city_store_order', label: '城市门店排序', dataIndex: 'city_store_order' },
    { key: 'opening_date', label: '开业日期', dataIndex: 'opening_date' },
    { key: 'city_manager_name', label: '城市经理', dataIndex: 'city_manager_name' },
    { key: 'tech_vice_president_name', label: '技术副总', dataIndex: 'tech_vice_president_name' },
    { key: 'ramp_up_period_months', label: '爬坡期长度', dataIndex: 'ramp_up_period_months' },
    { key: 'current_ramp_up_month_index', label: '当前爬坡月', dataIndex: 'current_ramp_up_month_index' },
    { key: 'cash_flow_budget_total', label: '现金流目标值', dataIndex: 'cash_flow_budget_total' },
    { key: 'cash_flow_actual_to_date', label: '爬坡期现金流实际值', dataIndex: 'cash_flow_actual_to_date' },
    { key: 'cash_flow_variance', label: '现金流差异', dataIndex: 'cash_flow_variance' },
  ];

  columns.splice(
    columns.findIndex((col) => col.key === 'current_ramp_up_month_index'),
    0,
    { key: 'ramp_up_end_month', label: '爬坡期结束月', dataIndex: 'ramp_up_end_month' }
  );

  const columnWidths = {
    city_name: '120px',
    store_name: '180px',
    store_code: '130px',
    city_store_order: '140px',
    opening_date: '130px',
    city_manager_name: '140px',
    tech_vice_president_name: '150px',
    ramp_up_period_months: '120px',
    current_ramp_up_month_index: '120px',
    cash_flow_budget_total: '150px',
    cash_flow_actual_to_date: '170px',
    cash_flow_variance: '150px',
  };
  columnWidths.ramp_up_end_month = '130px';
  const tableMinWidth = getTableMinWidth(columnWidths);
  const stickyOffsets = getStickyLeftOffsets(columns, columnWidths, 5);

  const { sortedData, sortConfig, handleSort } = useTableSorting(columns, data || [], {
    key: 'city_name',
    direction: 'asc',
  });

  const cityList = React.useMemo(() => {
    const cities = [...new Set((data || []).map((item) => item.city_name).filter(Boolean))];
    return cities.sort();
  }, [data]);

  const monthList = React.useMemo(() => {
    const months = [...new Set((data || []).map((item) => {
      if (!item.opening_date) return null;
      return item.opening_date.split('T')[0].slice(0, 7);
    }).filter(Boolean))];
    return months.sort().reverse();
  }, [data]);

  const previousMonthLabel = React.useMemo(() => {
    const now = new Date();
    now.setMonth(now.getMonth() - 1);
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  }, []);

  const filteredData = React.useMemo(() => {
    const filtered = sortedData.filter((item) => {
      if (selectedCity && item.city_name !== selectedCity) return false;
      if (selectedMonth) {
        const itemMonth = item.opening_date ? item.opening_date.split('T')[0].slice(0, 7) : '';
        if (itemMonth !== selectedMonth) return false;
      }
      return true;
    });

    if (sortConfig.key === 'city_name') {
      filtered.sort((a, b) => {
        const cityCompare = (a.city_name || '').localeCompare(b.city_name || '', 'zh-CN');
        if (cityCompare !== 0) return sortConfig.direction === 'asc' ? cityCompare : -cityCompare;
        return (a.city_store_order ?? Infinity) - (b.city_store_order ?? Infinity);
      });
    }

    return filtered;
  }, [selectedCity, selectedMonth, sortConfig, sortedData]);

  const pagedData = filteredData.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const formatCurrency = (value) => {
    if (value === null || value === undefined) return '-';
    return Number(value).toLocaleString('zh-CN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const formatDate = (value) => {
    if (!value) return '-';
    return value.split('T')[0];
  };

  return (
    <div className="mb-6 overflow-hidden rounded-lg border border-gray-100 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-gray-100 bg-[#a40035]/5 px-6 py-4">
        <div className="flex flex-col items-start">
        <h2 className="flex items-center gap-2 text-lg font-bold text-[#a40035]">
          新店经营情况总结（现金流）
          <span className="ml-2 rounded-full bg-[#a40035]/10 px-2 py-0.5 text-sm font-normal text-[#a40035]">
            {loading ? '...' : `${filteredData.length} 家`}
          </span>
        </h2>
        <p className="mt-1 text-left text-sm text-gray-600">
          统计本季度还处于爬坡期的门店，只统计其爬坡期数据，数据截止到{previousMonthLabel}
        </p>
        </div>
        {error && (
          <button onClick={() => fetchData()} className="text-xs text-[#a40035] underline hover:text-[#8a002d]">
            重试
          </button>
        )}
        <div className="relative z-40 flex flex-row">
          <FilterDropdown
            label="城市"
            value={selectedCity}
            options={cityList}
            onChange={(value) => {
              setSelectedCity(value);
              setCurrentPage(1);
            }}
          />
          <FilterDropdown
            label="开业月份"
            value={selectedMonth}
            options={monthList}
            onChange={(value) => {
              setSelectedMonth(value);
              setCurrentPage(1);
            }}
          />
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
                  scope="col"
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
              pagedData.map((item, index) => {
                const rowBgClass = index % 2 === 0 ? 'bg-white' : 'bg-gray-50';

                return (
                  <tr key={index} className={`group ${rowBgClass} hover:bg-gray-50`}>
                  <td
                    className={`${TABLE_BODY_CELL_CLASS} whitespace-nowrap text-center sticky z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] ${rowBgClass} group-hover:bg-gray-50`}
                    style={{ left: `${stickyOffsets.city_name}px` }}
                  >
                    {item.city_name}
                  </td>
                  <td
                    className={`${TABLE_BODY_CELL_CLASS} whitespace-nowrap text-center sticky z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] ${rowBgClass} group-hover:bg-gray-50`}
                    style={{ left: `${stickyOffsets.store_name}px` }}
                  >
                    <button className="text-center text-[#a40035] hover:underline" onClick={() => setModalStore(item)}>
                      {item.store_name}
                    </button>
                  </td>
                  <td
                    className={`${TABLE_BODY_CELL_CLASS} text-center sticky z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] ${rowBgClass} group-hover:bg-gray-50`}
                    style={{ left: `${stickyOffsets.store_code}px` }}
                  >
                    {item.store_code}
                  </td>
                  <td
                    className={`${TABLE_BODY_CELL_CLASS} text-center sticky z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] ${rowBgClass} group-hover:bg-gray-50`}
                    style={{ left: `${stickyOffsets.city_store_order}px` }}
                  >
                    {item.city_store_order ?? '-'}
                  </td>
                  <td
                    className={`${TABLE_BODY_CELL_CLASS} whitespace-nowrap text-center sticky z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] ${rowBgClass} group-hover:bg-gray-50`}
                    style={{ left: `${stickyOffsets.opening_date}px` }}
                  >
                    {formatDate(item.opening_date)}
                  </td>
                  <td className={`${TABLE_BODY_CELL_CLASS} text-center`}>{item.city_manager_name || '-'}</td>
                  <td className={`${TABLE_BODY_CELL_CLASS} text-center`}>{item.tech_vice_president_name || '-'}</td>
                  <td className={`${TABLE_BODY_CELL_CLASS} text-center`}>{item.ramp_up_period_months}</td>
                  <td className={`${TABLE_BODY_CELL_CLASS} text-center`}>{item.ramp_up_end_month || '-'}</td>
                  <td className={`${TABLE_BODY_CELL_CLASS} text-center`}>{item.current_ramp_up_month_index}</td>
                  <td className={`${TABLE_BODY_CELL_CLASS} text-center`}>{formatCurrency(item.cash_flow_budget_total)}</td>
                  <td className={`${TABLE_BODY_CELL_CLASS} text-center`}>{formatCurrency(item.cash_flow_actual_to_date)}</td>
                  <td className={`${TABLE_BODY_CELL_CLASS} text-center ${item.cash_flow_variance < 0 ? 'text-[#a40035]' : 'text-gray-700'}`}>
                    {formatCurrency(item.cash_flow_variance)}
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

      {modalStore && <RampUpDetailModal store={modalStore} onClose={() => setModalStore(null)} />}
    </div>
  );
};

export default NewStoreOperationStatusContainer;
