import React, { useMemo } from 'react';
import useFetchData from '../../hooks/useFetchData';

/**
 * 新店供应总结容器组件
 * 数据来源：cash_flow_new_store_supply.sql
 * 表头：城市、店均面积、店均床位、空间利用率、店均投资、店均工期、单床位装修成本（2026/2025/2024/2023）
 */
const NewStoreSupplyContainer = () => {
  const { data, loading, error } = useFetchData('getNewStoreSupplySummary', [], [], { manual: false });

  // 数字格式化，保留指定小数位
  const fmt = (val, decimal = 0) => {
    if (val === null || val === undefined || val === '') return '-';
    const n = Number(val);
    if (isNaN(n)) return '-';
    return n.toLocaleString('zh-CN', { minimumFractionDigits: decimal, maximumFractionDigits: decimal });
  };

  const yesterday = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return d.toISOString().split('T')[0];
  }, []);

  // 分离合计行与数据行
  const { rows, summaryRow } = useMemo(() => {
    if (!data || data.length === 0) return { rows: [], summaryRow: null };
    return {
      rows: data.filter(r => r.city !== '合计'),
      summaryRow: data.find(r => r.city === '合计') || null,
    };
  }, [data]);

  // 单床位装修成本年份列
  const costYears = [2026, 2025, 2024, 2023];

  const renderRow = (row, idx, isSummary = false) => {
    const rowClass = isSummary
      ? 'bg-gray-100 font-semibold'
      : idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50';

    return (
      <tr key={isSummary ? 'summary' : row.city} className={rowClass}>
        <td className="border border-gray-200 px-3 py-2 text-center whitespace-nowrap text-gray-700">{row.city || '-'}</td>
        <td className="border border-gray-200 px-3 py-2 text-center whitespace-nowrap text-gray-700">{fmt(row.store_count)}</td>
        <td className="border border-gray-200 px-3 py-2 text-center whitespace-nowrap text-gray-700">{fmt(row.avg_area_per_store)}</td>
        <td className="border border-gray-200 px-3 py-2 text-center whitespace-nowrap text-gray-700">{fmt(row.avg_bed_per_store)}</td>
        <td className="border border-gray-200 px-3 py-2 text-center whitespace-nowrap text-gray-700">{row.space_utilization_rate || '-'}</td>
        <td className="border border-gray-200 px-3 py-2 text-center whitespace-nowrap text-gray-700">{fmt(row.avg_investment_per_store)}</td>
        <td className="border border-gray-200 px-3 py-2 text-center whitespace-nowrap text-gray-700">{fmt(row.avg_construction_period)}</td>
        {costYears.map(year => (
          <td key={year} className="border border-gray-200 px-3 py-2 text-center whitespace-nowrap text-gray-700">
            {fmt(row[`cost_per_bed_${year}`], 2)}
          </td>
        ))}
      </tr>
    );
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden mb-6">
      <div className="px-6 py-4 border-b border-gray-100 bg-[#a40035]/5">
        <h2 className="text-lg font-bold text-[#a40035]">
          新店供应总结
          <span className="ml-3 text-sm font-normal text-[#a40035]">数据区间: 2026-01-01 ~ {yesterday}</span>
        </h2>
      </div>
      <div className="p-4">
        {loading ? (
          <div className="text-center py-8 text-gray-400">加载中...</div>
        ) : error ? (
          <div className="text-center py-8 text-gray-400">加载失败</div>
        ) : !data || data.length === 0 ? (
          <div className="text-center py-8 text-gray-400">暂无数据</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                {/* 第一行：固定列（rowSpan=2）+ 单床位装修成本分组 */}
                <tr className="bg-gray-100 text-gray-600 text-center">
                  <th rowSpan={2} className="border border-gray-300 px-3 py-2 text-xs font-semibold whitespace-nowrap align-middle">城市</th>
                  <th rowSpan={2} className="border border-gray-300 px-3 py-2 text-xs font-semibold whitespace-nowrap align-middle">门店数</th>
                  <th rowSpan={2} className="border border-gray-300 px-3 py-2 text-xs font-semibold whitespace-nowrap align-middle">店均面积</th>
                  <th rowSpan={2} className="border border-gray-300 px-3 py-2 text-xs font-semibold whitespace-nowrap align-middle">店均床位</th>
                  <th rowSpan={2} className="border border-gray-300 px-3 py-2 text-xs font-semibold whitespace-nowrap align-middle">空间利用率</th>
                  <th rowSpan={2} className="border border-gray-300 px-3 py-2 text-xs font-semibold whitespace-nowrap align-middle">店均投资</th>
                  <th rowSpan={2} className="border border-gray-300 px-3 py-2 text-xs font-semibold whitespace-nowrap align-middle">店均工期</th>
                  <th colSpan={4} className="border border-gray-300 px-3 py-2 text-xs font-semibold whitespace-nowrap">
                    单床位装修成本
                  </th>
                </tr>
                {/* 第二行：年份子列 */}
                <tr className="bg-gray-100 text-gray-600 text-center">
                  {costYears.map(year => (
                    <th key={year} className="border border-gray-300 px-3 py-2 text-xs font-semibold whitespace-nowrap">
                      {year}年
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row, idx) => renderRow(row, idx))}
                {summaryRow && renderRow(summaryRow, 0, true)}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default NewStoreSupplyContainer;
