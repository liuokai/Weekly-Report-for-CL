import React, { useMemo } from 'react';
import useFetchData from '../../hooks/useFetchData';

/**
 * 利润汇总表格组件
 * 显示2026年门店和总部的月度利润汇总数据
 */
const ProfitSummaryTable = () => {
  const { data: profitDataRaw, loading, error } = useFetchData('getTurnoverProfitTotalMonthly', [], []);
  const profitData = Array.isArray(profitDataRaw) ? profitDataRaw : [];

  const summaryRow = useMemo(() => {
    if (!profitData.length) return null;

    const totals = profitData.reduce(
      (acc, row) => {
        acc.main_business_income += Number(row.main_business_income) || 0;
        acc.store_total_profit += Number(row.store_total_profit) || 0;
        acc.hq_total_profit += Number(row.hq_total_profit) || 0;
        acc.total_profit += Number(row.total_profit) || 0;
        return acc;
      },
      {
        main_business_income: 0,
        store_total_profit: 0,
        hq_total_profit: 0,
        total_profit: 0
      }
    );

    const revenue = totals.main_business_income;

    return {
      month: '合计',
      ...totals,
      store_profit_margin: revenue ? totals.store_total_profit / revenue : 0,
      hq_profit_margin: revenue ? totals.hq_total_profit / revenue : 0,
      total_profit_margin: revenue ? totals.total_profit / revenue : 0,
      isSummary: true
    };
  }, [profitData]);

  // 格式化金额显示（原始金额）
  const formatAmount = (value) => {
    if (value == null || value === '') return '-';
    const numValue = Number(value);
    if (isNaN(numValue)) return '-';
    return numValue.toLocaleString('zh-CN', {
      minimumFractionDigits: 2, 
      maximumFractionDigits: 2 
    });
  };

  // 格式化百分比显示
  const formatPercent = (value) => {
    if (value == null || value === '') return '-';
    const numValue = Number(value);
    if (isNaN(numValue)) return '-';
    return (numValue * 100).toFixed(2) + '%';
  };

  // 格式化月份显示
  const formatMonth = (month) => {
    if (!month) return '';
    return month.replace('-', '年') + '月';
  };

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

  if (!profitData.length) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
        <div className="text-center text-gray-500">暂无数据</div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-6">
      {/* 表格标题 */}
      <div className="p-6 border-b border-gray-100 bg-gray-50/50">
        <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
          <span className="w-1 h-5 bg-[#a40035] rounded-full"></span>
          利润汇总
        </h3>
      </div>

      {/* 表格内容 */}
      <div className="overflow-x-auto max-h-[800px] overflow-y-auto">
        <table className="w-full text-sm text-center text-gray-700 relative">
          <thead className="bg-gray-50 text-xs text-gray-600 sticky top-0 z-20 shadow-sm">
            <tr>
              <th rowSpan={2} className="px-6 py-4 font-bold sticky left-0 bg-gray-50 z-30 border-r border-gray-300 min-w-[100px] shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                时间
              </th>
              <th rowSpan={2} className="px-6 py-4 font-semibold whitespace-nowrap min-w-[120px] text-center border-b border-r border-gray-300">
                营业额
              </th>
              <th colSpan={2} className="px-6 py-4 font-semibold whitespace-nowrap min-w-[120px] text-center border-b border-r border-gray-300 bg-gray-100">
                门店利润
              </th>
              <th colSpan={2} className="px-6 py-4 font-semibold whitespace-nowrap min-w-[120px] text-center border-b border-r border-gray-300 bg-gray-100">
                总部利润
              </th>
              <th colSpan={2} className="px-6 py-4 font-semibold whitespace-nowrap min-w-[120px] text-center border-b border-r border-gray-300 bg-gray-100">
                合计
              </th>
            </tr>
            <tr>
              <th className="px-6 py-2 font-medium whitespace-nowrap min-w-[90px] text-center bg-gray-50 border-b border-r border-gray-300 text-gray-600">
                金额
              </th>
              <th className="px-6 py-2 font-medium whitespace-nowrap min-w-[90px] text-center bg-gray-50 border-b border-r border-gray-300 text-gray-600">
                利润率
              </th>
              <th className="px-6 py-2 font-medium whitespace-nowrap min-w-[90px] text-center bg-gray-50 border-b border-r border-gray-300 text-gray-600">
                金额
              </th>
              <th className="px-6 py-2 font-medium whitespace-nowrap min-w-[90px] text-center bg-gray-50 border-b border-r border-gray-300 text-gray-600">
                利润率
              </th>
              <th className="px-6 py-2 font-medium whitespace-nowrap min-w-[90px] text-center bg-gray-50 border-b border-r border-gray-300 text-gray-600">
                金额
              </th>
              <th className="px-6 py-2 font-medium whitespace-nowrap min-w-[90px] text-center bg-gray-50 border-b border-r border-gray-300 text-gray-600">
                利润率
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {profitData.map((row, index) => (
              <tr key={row.month || index} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 font-medium sticky left-0 z-10 border-r border-gray-300 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] bg-white text-gray-700">
                  {formatMonth(row.month)}
                </td>
                <td className="px-6 py-4 text-center whitespace-nowrap border-r border-gray-300 font-mono">
                  {formatAmount(row.main_business_income)}
                </td>
                <td className="px-6 py-4 text-center whitespace-nowrap border-r border-gray-300 font-mono">
                  {formatAmount(row.store_total_profit)}
                </td>
                <td className="px-6 py-4 text-center whitespace-nowrap border-r border-gray-300 font-mono">
                  {formatPercent(row.store_profit_margin)}
                </td>
                <td className="px-6 py-4 text-center whitespace-nowrap border-r border-gray-300 font-mono">
                  {formatAmount(row.hq_total_profit)}
                </td>
                <td className="px-6 py-4 text-center whitespace-nowrap border-r border-gray-300 font-mono">
                  {formatPercent(row.hq_profit_margin)}
                </td>
                <td className="px-6 py-4 text-center whitespace-nowrap border-r border-gray-300 font-mono font-semibold text-[#a40035]">
                  {formatAmount(row.total_profit)}
                </td>
                <td className="px-6 py-4 text-center whitespace-nowrap border-r border-gray-300 font-mono font-semibold text-[#a40035]">
                  {formatPercent(row.total_profit_margin)}
                </td>
              </tr>
            ))}
            {summaryRow && (
              <tr className="bg-red-50 font-bold">
                <td className="px-6 py-4 font-medium sticky left-0 z-10 border-r border-gray-300 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] bg-red-50 text-[#a40035]">
                  {summaryRow.month}
                </td>
                <td className="px-6 py-4 text-center whitespace-nowrap border-r border-gray-300 font-mono text-[#a40035]">
                  {formatAmount(summaryRow.main_business_income)}
                </td>
                <td className="px-6 py-4 text-center whitespace-nowrap border-r border-gray-300 font-mono text-[#a40035]">
                  {formatAmount(summaryRow.store_total_profit)}
                </td>
                <td className="px-6 py-4 text-center whitespace-nowrap border-r border-gray-300 font-mono text-[#a40035]">
                  {formatPercent(summaryRow.store_profit_margin)}
                </td>
                <td className="px-6 py-4 text-center whitespace-nowrap border-r border-gray-300 font-mono text-[#a40035]">
                  {formatAmount(summaryRow.hq_total_profit)}
                </td>
                <td className="px-6 py-4 text-center whitespace-nowrap border-r border-gray-300 font-mono text-[#a40035]">
                  {formatPercent(summaryRow.hq_profit_margin)}
                </td>
                <td className="px-6 py-4 text-center whitespace-nowrap border-r border-gray-300 font-mono font-semibold text-[#a40035]">
                  {formatAmount(summaryRow.total_profit)}
                </td>
                <td className="px-6 py-4 text-center whitespace-nowrap border-r border-gray-300 font-mono font-semibold text-[#a40035]">
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
