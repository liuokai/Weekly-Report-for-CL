import React, { useEffect, useMemo, useRef, useState } from 'react';
import useFetchData from '../../hooks/useFetchData';

const ProfitSummaryTable = () => {
  const [viewMode, setViewMode] = useState('month');
  const [tableHeight, setTableHeight] = useState(null);
  const tableWrapperRef = useRef(null);
  const { data: profitDataRaw, loading, error } = useFetchData('getTurnoverProfitTotalMonthly', [], []);
  const profitData = Array.isArray(profitDataRaw) ? profitDataRaw : [];

  const getQuarterLabel = (monthValue) => {
    if (!monthValue) return '';

    const monthText = String(monthValue).trim();
    const matched = monthText.match(/(\d{4})\D?(\d{1,2})/);
    if (!matched) return monthText;

    const year = matched[1];
    const month = Number(matched[2]);
    if (!month || month < 1 || month > 12) return monthText;

    return `${year}Q${Math.ceil(month / 3)}`;
  };

  const displayedData = useMemo(() => {
    if (viewMode === 'month') {
      return profitData;
    }

    const quarterMap = new Map();

    profitData.forEach((row) => {
      const quarterLabel = getQuarterLabel(row.month);
      const current = quarterMap.get(quarterLabel) || {
        month: quarterLabel,
        main_business_income: 0,
        hq_total_income: 0,
        store_total_profit: 0,
        hq_total_profit: 0,
        total_profit: 0
      };

      current.main_business_income += Number(row.main_business_income) || 0;
      current.hq_total_income += Number(row.hq_total_income) || 0;
      current.store_total_profit += Number(row.store_total_profit) || 0;
      current.hq_total_profit += Number(row.hq_total_profit) || 0;
      current.total_profit += Number(row.total_profit) || 0;

      quarterMap.set(quarterLabel, current);
    });

    return Array.from(quarterMap.values()).map((row) => {
      const storeRevenue = row.main_business_income;
      const totalRevenue = row.main_business_income + row.hq_total_income;

      return {
        ...row,
        store_profit_margin: storeRevenue ? row.store_total_profit / storeRevenue : 0,
        hq_profit_margin: storeRevenue ? row.hq_total_profit / storeRevenue : 0,
        total_profit_margin: totalRevenue ? row.total_profit / totalRevenue : 0
      };
    });
  }, [profitData, viewMode]);

  const summaryRow = useMemo(() => {
    if (!displayedData.length) return null;

    const totals = displayedData.reduce(
      (acc, row) => {
        acc.main_business_income += Number(row.main_business_income) || 0;
        acc.hq_total_income += Number(row.hq_total_income) || 0;
        acc.store_total_profit += Number(row.store_total_profit) || 0;
        acc.hq_total_profit += Number(row.hq_total_profit) || 0;
        acc.total_profit += Number(row.total_profit) || 0;
        return acc;
      },
      {
        main_business_income: 0,
        hq_total_income: 0,
        store_total_profit: 0,
        hq_total_profit: 0,
        total_profit: 0
      }
    );

    const storeRevenue = totals.main_business_income;
    const totalRevenue = totals.main_business_income + totals.hq_total_income;

    return {
      month: '合计',
      ...totals,
      store_profit_margin: storeRevenue ? totals.store_total_profit / storeRevenue : 0,
      hq_profit_margin: storeRevenue ? totals.hq_total_profit / storeRevenue : 0,
      total_profit_margin: totalRevenue ? totals.total_profit / totalRevenue : 0,
      isSummary: true
    };
  }, [displayedData]);

  const formatAmount = (value) => {
    if (value == null || value === '') return '-';
    const numValue = Number(value);
    if (Number.isNaN(numValue)) return '-';
    return (numValue / 10000).toLocaleString('zh-CN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  const formatPercent = (value) => {
    if (value == null || value === '') return '-';
    const numValue = Number(value);
    if (Number.isNaN(numValue)) return '-';
    return `${(numValue * 100).toFixed(2)}%`;
  };

  const isLowTotalProfitMargin = (value) => {
    const numValue = Number(value);
    return !Number.isNaN(numValue) && numValue < 0.06;
  };

  const formatPeriod = (value) => {
    if (!value) return '';
    return String(value);
  };

  useEffect(() => {
    if (viewMode !== 'month') return;
    if (!displayedData.length) return;
    if (!tableWrapperRef.current) return;

    const nextHeight = Math.ceil(tableWrapperRef.current.scrollHeight);
    if (nextHeight > 0 && nextHeight !== tableHeight) {
      setTableHeight(nextHeight);
    }
  }, [displayedData, tableHeight, viewMode]);

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
        <div className="text-center text-gray-500">加载中...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
        <div className="text-center text-red-500">加载失败: {error}</div>
      </div>
    );
  }

  if (!displayedData.length) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
        <div className="text-center text-gray-500">暂无数据</div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-6">
      <div className="p-6 border-b border-gray-100 bg-gray-50/50">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
              <span className="w-1 h-5 bg-[#a40035] rounded-full"></span>
              利润汇总
            </h3>
            <div className="mt-2 text-sm text-gray-500 text-left">利润率=利润/门店营业额</div>
            <div className="mt-2 text-sm text-gray-500 text-left">单位：万元</div>
          </div>

          <div className="flex bg-gray-100 p-1 rounded-lg">
            <button
              type="button"
              onClick={() => setViewMode('month')}
              className={`px-3 py-1 text-sm font-medium rounded-md transition-all ${
                viewMode === 'month'
                  ? 'bg-white text-[#a40035] shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              月份
            </button>
            <button
              type="button"
              onClick={() => setViewMode('quarter')}
              className={`px-3 py-1 text-sm font-medium rounded-md transition-all ${
                viewMode === 'quarter'
                  ? 'bg-white text-[#a40035] shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              季度
            </button>
          </div>
        </div>
      </div>

      <div
        ref={tableWrapperRef}
        className="overflow-x-auto overflow-y-auto"
        style={tableHeight ? { height: `${tableHeight}px` } : undefined}
      >
        <table className="w-full text-sm text-center text-black relative">
          <thead className="bg-gray-50 text-xs text-gray-600 sticky top-0 z-20 shadow-sm">
            <tr>
              <th rowSpan={2} className="px-6 py-2 font-bold sticky left-0 bg-gray-50 z-30 border-r border-gray-300 min-w-[100px] shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                {viewMode === 'month' ? '统计月份' : '统计季度'}
              </th>
              <th rowSpan={2} className="px-6 py-2 font-bold whitespace-nowrap min-w-[120px] text-center border-b border-r border-gray-300">
                门店营业额
              </th>
              <th rowSpan={2} className="px-6 py-2 font-bold whitespace-nowrap min-w-[120px] text-center border-b border-r border-gray-300">
                总部收入
              </th>
              <th colSpan={2} className="px-6 py-2 font-bold whitespace-nowrap min-w-[120px] text-center border-b border-r border-gray-300 bg-gray-100">
                门店利润
              </th>
              <th colSpan={2} className="px-6 py-2 font-bold whitespace-nowrap min-w-[120px] text-center border-b border-r border-gray-300 bg-gray-100">
                总部利润
              </th>
              <th colSpan={2} className="px-6 py-2 font-bold whitespace-nowrap min-w-[120px] text-center border-b border-r border-gray-300 bg-gray-100">
                合计
              </th>
            </tr>
            <tr>
              <th className="px-6 py-2 font-bold whitespace-nowrap min-w-[90px] text-center bg-gray-50 border-b border-r border-gray-300 text-gray-600">
                金额
              </th>
              <th className="px-6 py-2 font-bold whitespace-nowrap min-w-[90px] text-center bg-gray-50 border-b border-r border-gray-300 text-gray-600">
                利润率
              </th>
              <th className="px-6 py-2 font-bold whitespace-nowrap min-w-[90px] text-center bg-gray-50 border-b border-r border-gray-300 text-gray-600">
                金额
              </th>
              <th className="px-6 py-2 font-bold whitespace-nowrap min-w-[90px] text-center bg-gray-50 border-b border-r border-gray-300 text-gray-600">
                利润率
              </th>
              <th className="px-6 py-2 font-bold whitespace-nowrap min-w-[90px] text-center bg-gray-50 border-b border-r border-gray-300 text-gray-600">
                金额
              </th>
              <th className="px-6 py-2 font-bold whitespace-nowrap min-w-[90px] text-center bg-gray-50 border-b border-r border-gray-300 text-gray-600">
                利润率
              </th>
            </tr>
          </thead>
          <tbody>
            {displayedData.map((row, index) => (
              <tr key={row.month || index} className={`${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-gray-50 transition-colors`}>
                <td className={`px-6 py-2 sticky left-0 z-10 border-r border-b border-gray-300 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} text-black`}>
                  {formatPeriod(row.month)}
                </td>
                <td className={`px-6 py-2 text-center whitespace-nowrap border-r border-b border-gray-300 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} text-black`}>
                  {formatAmount(row.main_business_income)}
                </td>
                <td className={`px-6 py-2 text-center whitespace-nowrap border-r border-b border-gray-300 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} text-black`}>
                  {formatAmount(row.hq_total_income)}
                </td>
                <td className={`px-6 py-2 text-center whitespace-nowrap border-r border-b border-gray-300 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} text-black`}>
                  {formatAmount(row.store_total_profit)}
                </td>
                <td className={`px-6 py-2 text-center whitespace-nowrap border-r border-b border-gray-300 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} text-black`}>
                  {formatPercent(row.store_profit_margin)}
                </td>
                <td className={`px-6 py-2 text-center whitespace-nowrap border-r border-b border-gray-300 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} text-black`}>
                  {formatAmount(row.hq_total_profit)}
                </td>
                <td className={`px-6 py-2 text-center whitespace-nowrap border-r border-b border-gray-300 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} text-black`}>
                  {formatPercent(row.hq_profit_margin)}
                </td>
                <td className={`px-6 py-2 text-center whitespace-nowrap border-r border-b border-gray-300 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} text-black`}>
                  {formatAmount(row.total_profit)}
                </td>
                <td
                  className={`px-6 py-2 text-center whitespace-nowrap border-r border-b border-gray-300 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} ${
                    isLowTotalProfitMargin(row.total_profit_margin) ? 'text-[#a40035]' : 'text-black'
                  }`}
                >
                  {formatPercent(row.total_profit_margin)}
                </td>
              </tr>
            ))}
            {summaryRow && (
              <tr className="bg-red-50">
                <td className="px-6 py-2 sticky left-0 z-10 border-r border-b border-gray-300 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] bg-red-50 text-black">
                  {summaryRow.month}
                </td>
                <td className="px-6 py-2 text-center whitespace-nowrap border-r border-b border-gray-300 text-black">
                  {formatAmount(summaryRow.main_business_income)}
                </td>
                <td className="px-6 py-2 text-center whitespace-nowrap border-r border-b border-gray-300 text-black">
                  {formatAmount(summaryRow.hq_total_income)}
                </td>
                <td className="px-6 py-2 text-center whitespace-nowrap border-r border-b border-gray-300 text-black">
                  {formatAmount(summaryRow.store_total_profit)}
                </td>
                <td className="px-6 py-2 text-center whitespace-nowrap border-r border-b border-gray-300 text-black">
                  {formatPercent(summaryRow.store_profit_margin)}
                </td>
                <td className="px-6 py-2 text-center whitespace-nowrap border-r border-b border-gray-300 text-black">
                  {formatAmount(summaryRow.hq_total_profit)}
                </td>
                <td className="px-6 py-2 text-center whitespace-nowrap border-r border-b border-gray-300 text-black">
                  {formatPercent(summaryRow.hq_profit_margin)}
                </td>
                <td className="px-6 py-2 text-center whitespace-nowrap border-r border-b border-gray-300 text-black">
                  {formatAmount(summaryRow.total_profit)}
                </td>
                <td
                  className={`px-6 py-2 text-center whitespace-nowrap border-r border-b border-gray-300 ${
                    isLowTotalProfitMargin(summaryRow.total_profit_margin) ? 'text-[#a40035]' : 'text-black'
                  }`}
                >
                  {formatPercent(summaryRow.total_profit_margin)}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ProfitSummaryTable;
