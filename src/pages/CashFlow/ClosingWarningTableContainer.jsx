import React, { useMemo, useState } from 'react';
import useFetchData from '../../hooks/useFetchData';
import FilterDropdown from '../../components/Common/FilterDropdown';
import Pagination from '../../components/Common/Pagination';

/**
 * 触发闭店预警门店列表表格
 */
const ClosingWarningTableContainer = () => {
  const { data, loading, error, fetchData } = useFetchData('getCashFlowClosingWarning', [], [], { manual: false });

  const [selectedCity, setSelectedCity] = useState(null);
  const [selectedStore, setSelectedStore] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // 格式化金额，无小数
  const fmtMoney = (val) => {
    if (val === null || val === undefined || val === '') return '-';
    const num = Number(val);
    if (isNaN(num)) return '-';
    return num.toLocaleString('zh-CN', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  };

  // 格式化日期
  const fmtDate = (dateStr) => {
    if (!dateStr) return '-';
    return String(dateStr).split('T')[0];
  };

  // 负数红色，其余黑色
  const numClass = (val) => {
    const num = Number(val);
    if (!isNaN(num) && num < 0) return 'text-[#a40035]';
    return 'text-gray-900';
  };

  const rows = useMemo(() => {
    if (!data || data.length === 0) return [];
    return data;
  }, [data]);

  // 城市选项
  const cityOptions = useMemo(() => {
    return [...new Set(rows.map(r => r.city_name).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'zh-CN'));
  }, [rows]);

  // 门店选项（随城市联动）
  const storeOptions = useMemo(() => {
    const base = selectedCity ? rows.filter(r => r.city_name === selectedCity) : rows;
    return [...new Set(base.map(r => r.store_name).filter(Boolean))];
  }, [rows, selectedCity]);

  // 过滤后的行
  const filteredRows = useMemo(() => {
    return rows.filter(r => {
      if (selectedCity && r.city_name !== selectedCity) return false;
      if (selectedStore && r.store_name !== selectedStore) return false;
      return true;
    });
  }, [rows, selectedCity, selectedStore]);

  // 分页数据
  const pagedRows = useMemo(() => {
    return filteredRows.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  }, [filteredRows, currentPage, pageSize]);

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden mb-6">
      {/* 标题栏 */}
      <div className="px-6 py-4 border-b border-gray-100 bg-[#a40035]/5 flex items-center justify-between">
        <h2 className="text-lg font-bold text-[#a40035] flex items-center gap-2">
          触发闭店预警门店列表
          <span className="ml-2 text-sm font-normal bg-[#a40035]/10 text-[#a40035] px-2 py-0.5 rounded-full">
            {loading ? '...' : (error ? '-' : `${filteredRows.length} 家`)}
          </span>
        </h2>
        <div className="flex items-center gap-2">
          {error && (
            <button onClick={() => fetchData()} className="text-xs text-[#a40035] hover:text-[#8a002d] underline mr-2">
              重试
            </button>
          )}
          <div className="flex flex-row relative z-40">
            <FilterDropdown
              label="城市"
              value={selectedCity}
              options={cityOptions}
              onChange={(val) => { setSelectedCity(val); setSelectedStore(null); setCurrentPage(1); }}
            />
            <FilterDropdown
              label="门店"
              value={selectedStore}
              options={storeOptions}
              onChange={(val) => { setSelectedStore(val); setCurrentPage(1); }}
            />
          </div>
        </div>
      </div>

      <div className="p-4">
        {loading ? (
          <div className="text-center py-8 text-gray-400">加载中...</div>
        ) : filteredRows.length === 0 ? (
          <div className="text-center py-8 text-gray-400">暂无触发闭店预警门店</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-gray-100 text-gray-600 text-center">
                  <th className="border border-gray-300 px-3 py-2 text-xs font-semibold whitespace-nowrap">序号</th>
                  <th className="border border-gray-300 px-3 py-2 text-xs font-semibold whitespace-nowrap">城市</th>
                  <th className="border border-gray-300 px-3 py-2 text-xs font-semibold whitespace-nowrap">门店编码</th>
                  <th className="border border-gray-300 px-3 py-2 text-xs font-semibold whitespace-nowrap">门店名称</th>
                  <th className="border border-gray-300 px-3 py-2 text-xs font-semibold whitespace-nowrap">开业年份</th>
                  <th className="border border-gray-300 px-3 py-2 text-xs font-semibold whitespace-nowrap">开业时间</th>
                  <th className="border border-gray-300 px-3 py-2 text-xs font-semibold whitespace-nowrap">总投资</th>
                  <th className="border border-gray-300 px-3 py-2 text-xs font-semibold whitespace-nowrap">总折旧</th>
                  <th className="border border-gray-300 px-3 py-2 text-xs font-semibold whitespace-nowrap">累计现金流合计</th>
                  <th className="border border-gray-300 px-3 py-2 text-xs font-semibold whitespace-nowrap">差异</th>
                  <th className="border border-gray-300 px-3 py-2 text-xs font-semibold whitespace-nowrap">亏损占总折旧比例</th>
                  <th className="border border-gray-300 px-3 py-2 text-xs font-semibold whitespace-nowrap">是否触发闭店</th>
                  <th className="border border-gray-300 px-3 py-2 text-xs font-semibold whitespace-nowrap">预警原因</th>
                </tr>
              </thead>
              <tbody>
                {pagedRows.map((row, idx) => {
                  const openingDate = row.opening_date;
                  const openingYear = openingDate ? String(openingDate).split('T')[0].slice(0, 4) : '-';
                  const globalIdx = (currentPage - 1) * pageSize + idx;
                  return (
                    <tr key={row.store_code + idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}>
                      <td className="border border-gray-200 px-3 py-2 text-center text-gray-700">{globalIdx + 1}</td>
                      <td className="border border-gray-200 px-3 py-2 text-center whitespace-nowrap text-gray-700">{row.city_name || '-'}</td>
                      <td className="border border-gray-200 px-3 py-2 text-center whitespace-nowrap text-sm text-gray-700">{row.store_code || '-'}</td>
                      <td className="border border-gray-200 px-3 py-2 whitespace-nowrap text-gray-700">{row.store_name || '-'}</td>
                      <td className="border border-gray-200 px-3 py-2 text-center whitespace-nowrap text-gray-700">{openingYear}</td>
                      <td className="border border-gray-200 px-3 py-2 text-center whitespace-nowrap text-gray-700">{fmtDate(openingDate)}</td>
                      <td className="border border-gray-200 px-3 py-2 text-right whitespace-nowrap">
                        <span className={numClass(row.total_investment_amt)}>{fmtMoney(row.total_investment_amt)}</span>
                      </td>
                      <td className="border border-gray-200 px-3 py-2 text-right whitespace-nowrap">
                        <span className={numClass(row.total_depreciation)}>{fmtMoney(row.total_depreciation)}</span>
                      </td>
                      <td className="border border-gray-200 px-3 py-2 text-right whitespace-nowrap">
                        <span className={numClass(row.cum_net_cash_flow_mgmt)}>{fmtMoney(row.cum_net_cash_flow_mgmt)}</span>
                      </td>
                      <td className="border border-gray-200 px-3 py-2 text-right whitespace-nowrap">
                        <span className={numClass(row.cumulative_cash_flow_mgmt)}>{fmtMoney(row.cumulative_cash_flow_mgmt)}</span>
                      </td>
                      <td className="border border-gray-200 px-3 py-2 text-center whitespace-nowrap text-gray-700">
                        {row.cumulative_cash_flow_loss_ratio || '-'}
                      </td>
                      <td className="border border-gray-200 px-3 py-2 text-center whitespace-nowrap">
                        <span className={row.is_close_warning === '是' ? 'text-[#a40035]' : 'text-gray-700'}>
                          {row.is_close_warning || '-'}
                        </span>
                      </td>
                      <td className="border border-gray-200 px-3 py-2 whitespace-nowrap text-gray-700 max-w-xs">
                        {row.warning_reason || '-'}
                      </td>
                    </tr>
                  );
                })}
                {/* 空行补齐：仅当总数据不足10条时，补齐到10条高度 */}
                {filteredRows.length < 10 && Array.from({ length: 10 - pagedRows.length }).map((_, i) => (
                  <tr key={`empty-${i}`} className="bg-white">
                    {Array.from({ length: 13 }).map((__, j) => (
                      <td key={j} className="border border-gray-200 px-3 py-2">&nbsp;</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <Pagination
        total={filteredRows.length}
        currentPage={currentPage}
        pageSize={pageSize}
        onPageChange={setCurrentPage}
        onPageSizeChange={setPageSize}
      />
    </div>
  );
};

export default ClosingWarningTableContainer;
