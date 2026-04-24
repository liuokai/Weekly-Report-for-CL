import React from 'react';
import useFetchData from '../../hooks/useFetchData';
import useTableSorting from '../../components/Common/useTableSorting';
import FilterDropdown from '../../components/Common/FilterDropdown';
import Pagination from '../../components/Common/Pagination';

// 爬坡期门店详情弹窗
const RampUpDetailModal = ({ store, onClose }) => {
  const { data: allData, loading } = useFetchData('getRampUpStoreOperationStatus', []);

  // 过滤出该门店所有月份数据
  const storeData = React.useMemo(() => {
    if (!allData || !store) return [];
    return allData
      .filter(item => item.store_code === store.store_code)
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
    { key: 'current_ramp_up_month_index', label: '当前爬坡期' },
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
    { key: 'exhibition_fee_actual', label: '布展' },
    { key: 'masseur_commission_actual', label: '推拿师提成' },
    { key: 'incentive_budget_total', label: '激励费预算' },
    { key: 'incentive_actual_total', label: '激励费实际' },
    { key: 'incentive_usage_ratio_display', label: '激励费使用率' },
    { key: 'incentive_variance', label: '激励费差异' },
  ];

  const formatCurrency = (val) => {
    if (val === null || val === undefined) return '-';
    return Number(val).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return dateStr.split('T')[0];
  };

  // 货币类字段
  const currencyKeys = new Set([
    'cash_flow_budget_total', 'cash_flow_actual_to_date', 'cash_flow_variance',
    'marketing_budget_total', 'marketing_actual_total', 'marketing_usage_diff',
    'ad_fee_actual', 'group_buy_discount_actual', 'offline_ad_fee_actual',
    'new_guest_discount_actual', 'exhibition_fee_actual', 'masseur_commission_actual',
    'incentive_budget_total', 'incentive_actual_total', 'incentive_variance',
  ]);
  // 负数红色字段
  const negRedKeys = new Set(['cash_flow_variance', 'marketing_usage_diff', 'incentive_variance']);

  const getCellClass = (key, val) => {
    const n = Number(val);
    if (negRedKeys.has(key) && n < 0) return 'text-[#a40035]';
    return '';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div
        className="bg-white rounded-xl shadow-2xl w-[96vw] max-w-[1400px] max-h-[90vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* 标题栏 */}
        <div className="px-6 py-4 border-b border-gray-100 bg-[#a40035]/5 rounded-t-xl flex items-center justify-between shrink-0">
          <div>
            <h2 className="text-lg font-bold text-[#a40035]">爬坡期门店经营情况总结</h2>
            <p className="text-sm text-gray-500 mt-0.5">
              {store.store_name}（{store.store_code}）· 共 {storeData.length} 个月
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* 表格区域 */}
        <div className="overflow-auto flex-1 p-4">
          <table className="w-full text-sm text-left text-gray-700">
            <thead className="text-xs text-gray-600 bg-gray-50 border-b sticky top-0 z-10">
              <tr>
                {columns.map(col => (
                  <th key={col.key} className="px-3 py-2 whitespace-nowrap font-semibold">
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={columns.length} className="px-6 py-8 text-center text-gray-400">加载中...</td></tr>
              ) : storeData.length === 0 ? (
                <tr><td colSpan={columns.length} className="px-6 py-8 text-center text-gray-400">暂无爬坡期数据</td></tr>
              ) : (
                storeData.map((item, idx) => (
                  <tr key={idx} className="border-b hover:bg-gray-50/50 even:bg-gray-50/30">
                    {columns.map(col => {
                      const val = item[col.key];
                      let display;
                      if (col.key === 'opening_date') {
                        display = formatDate(val);
                      } else if (currencyKeys.has(col.key)) {
                        display = formatCurrency(val);
                      } else {
                        display = val ?? '-';
                      }
                      return (
                        <td
                          key={col.key}
                          className={`px-3 py-2 whitespace-nowrap ${currencyKeys.has(col.key) ? 'text-right' : ''} ${getCellClass(col.key, val)}`}
                        >
                          {display}
                        </td>
                      );
                    })}
                  </tr>
                ))
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
  
  // 筛选状态
  const [selectedCity, setSelectedCity] = React.useState(null);
  const [selectedMonth, setSelectedMonth] = React.useState(null);

  // 弹窗状态
  const [modalStore, setModalStore] = React.useState(null);

  // 分页状态
  const PAGE_SIZE = 10;
  const [currentPage, setCurrentPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(PAGE_SIZE);

  // 计算昨天的日期
  const yesterday = React.useMemo(() => {
    const date = new Date();
    date.setDate(date.getDate() - 1);
    return date.toISOString().split('T')[0];
  }, []);

  const columns = [
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
  ];

  const { sortedData, sortConfig, handleSort } = useTableSorting(columns, data || [], { key: 'city_name', direction: 'asc' });

  // 从数据中提取城市列表和开业月份列表
  const cityList = React.useMemo(() => {
    const cities = [...new Set((data || []).map(d => d.city_name).filter(Boolean))];
    return cities.sort();
  }, [data]);

  const monthList = React.useMemo(() => {
    const months = [...new Set((data || []).map(d => {
      if (!d.opening_date) return null;
      return d.opening_date.split('T')[0].slice(0, 7); // 取 YYYY-MM
    }).filter(Boolean))];
    return months.sort().reverse();
  }, [data]);

  // 过滤后的数据，默认按城市分组再按城市门店排序升序
  const filteredData = React.useMemo(() => {
    const filtered = sortedData.filter(item => {
      if (selectedCity && item.city_name !== selectedCity) return false;
      if (selectedMonth) {
        const itemMonth = item.opening_date ? item.opening_date.split('T')[0].slice(0, 7) : '';
        if (itemMonth !== selectedMonth) return false;
      }
      return true;
    });

    // 仅在默认排序（city_name）时，追加 city_store_order 作为二级排序
    if (sortConfig.key === 'city_name') {
      filtered.sort((a, b) => {
        const cityA = (a.city_name || '').localeCompare(b.city_name || '', 'zh-CN');
        if (cityA !== 0) return sortConfig.direction === 'asc' ? cityA : -cityA;
        return (a.city_store_order ?? Infinity) - (b.city_store_order ?? Infinity);
      });
    }

    return filtered;
  }, [sortedData, selectedCity, selectedMonth, sortConfig]);

  // 分页数据
  const totalPages = Math.ceil(filteredData.length / pageSize);
  const pagedData = filteredData.slice((currentPage - 1) * pageSize, currentPage * pageSize);

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
           新店经营情况总结(现金流)
           <span className="ml-2 text-sm font-normal bg-[#a40035]/10 text-[#a40035] px-2 py-0.5 rounded-full">
             {loading ? '...' : `${filteredData?.length ?? data?.length ?? 0} 家`}
           </span>
           <span className="ml-3 text-sm font-normal text-[#a40035]">
             {/* 数据区间: 2026-01-01 ~ {yesterday} */}
           </span>
         </h2>
         {error && (
            <button onClick={() => fetchData()} className="text-xs text-[#a40035] hover:text-[#8a002d] underline">
            重试
            </button>
         )}
         <div className="flex flex-row relative z-40">
           <FilterDropdown
             label="城市"
             value={selectedCity}
             options={cityList}
             onChange={(val) => { setSelectedCity(val); setCurrentPage(1); }}
           />
           <FilterDropdown
             label="开业月份"
             value={selectedMonth}
             options={monthList}
             onChange={(val) => { setSelectedMonth(val); setCurrentPage(1); }}
           />
         </div>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left text-gray-700">
            <thead className="text-xs text-gray-600 bg-gray-50 border-b">
                <tr>
                    {columns.map((col) => (
                        <th 
                            key={col.key} 
                            scope="col" 
                            className="px-3 py-2 cursor-pointer hover:bg-gray-100 whitespace-nowrap font-semibold group"
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
                                    <span className="text-gray-300 opacity-0 group-hover:opacity-100">
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
                    <tr><td colSpan={columns.length} className="px-6 py-8 text-center text-gray-400">加载中...</td></tr>
                ) : filteredData.length === 0 ? (
                    <tr><td colSpan={columns.length} className="px-6 py-8 text-center text-gray-400">暂无数据</td></tr>
                ) : (
                    pagedData.map((item, index) => (
                        <tr key={index} className="bg-white border-b hover:bg-gray-50/50">
                            <td className="px-3 py-2 text-gray-700 whitespace-nowrap">{item['city_name']}</td>
                            <td className="px-3 py-2 text-gray-700 whitespace-nowrap">
                              <button
                                className="text-[#a40035] hover:underline text-left"
                                onClick={() => setModalStore(item)}
                              >
                                {item['store_name']}
                              </button>
                            </td>
                            <td className="px-3 py-2 text-gray-700">{item['store_code']}</td>
                            <td className="px-3 py-2 text-center text-gray-700">{item['city_store_order'] ?? '-'}</td>
                            <td className="px-3 py-2 whitespace-nowrap text-gray-700">{formatDate(item['opening_date'])}</td>
                            <td className="px-3 py-2 text-gray-700">{item['city_manager_name'] || '-'}</td>
                            <td className="px-3 py-2 text-gray-700">{item['tech_vice_president_name'] || '-'}</td>
                            <td className="px-3 py-2 text-center text-gray-700">{item['ramp_up_period_months']}</td>
                            <td className="px-3 py-2 text-center text-gray-700">{item['current_ramp_up_month_index']}</td>
                            <td className="px-3 py-2 text-right text-gray-700">{formatCurrency(item['cash_flow_budget_total'])}</td>
                            <td className="px-3 py-2 text-right text-gray-700">{formatCurrency(item['cash_flow_actual_to_date'])}</td>
                            <td className={`px-3 py-2 text-right ${item['cash_flow_variance'] < 0 ? 'text-[#a40035]' : 'text-gray-700'}`}>
                                {formatCurrency(item['cash_flow_variance'])}
                            </td>
                        </tr>
                    ))
                )}
            </tbody>
        </table>
      </div>

      {/* 分页控件 */}
      <Pagination
        total={filteredData.length}
        currentPage={currentPage}
        pageSize={pageSize}
        onPageChange={setCurrentPage}
        onPageSizeChange={setPageSize}
      />

      {/* 爬坡期门店详情弹窗 */}
      {modalStore && (
        <RampUpDetailModal store={modalStore} onClose={() => setModalStore(null)} />
      )}
    </div>
  );
};

export default NewStoreOperationStatusContainer;
