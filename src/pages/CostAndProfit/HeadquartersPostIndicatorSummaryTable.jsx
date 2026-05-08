import React, { useMemo } from 'react';
import useFetchData from '../../hooks/useFetchData';

const TABLE_TITLE = '总部岗位及指标汇总';
const QUARTER_KEYS = ['2026Q1', '2026Q2', '2026Q3', '2026Q4'];

const toNumber = (value) => {
  if (value == null || value === '') return 0;
  const num = Number(value);
  return Number.isNaN(num) ? 0 : num;
};

const normalizeQuarter = (value) => {
  if (!value) return '';
  const text = String(value).trim().toUpperCase();
  const match = text.match(/(\d{4})[-\s_]?Q([1-4])/);
  if (match) return `${match[1]}Q${match[2]}`;
  return text.replace(/[^0-9Q]/g, '');
};

const buildRowKey = (row) => [
  row.event || '',
  row.task || '',
  row.post_name || '',
  row.job_number || '',
  row.name || '',
  row.budget_subject || ''
].join('__');

const formatAmount = (value, allowDash = false) => {
  const num = toNumber(value);
  if (allowDash && Math.abs(num) < 0.000001) return '-';
  return num.toLocaleString('zh-CN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
};

const buildTableRows = (rows) => {
  const grouped = new Map();

  rows.forEach((row) => {
    const key = buildRowKey(row);
    const quarter = normalizeQuarter(row.quarter);
    const current = grouped.get(key) || {
      event: row.event || '',
      task: row.task || '',
      post_name: row.post_name || '',
      job_number: row.job_number || '',
      name: row.name || '',
      budget_subject: row.budget_subject || '',
      budget_amount: toNumber(row.budget_amount),
      '2026Q1': 0,
      '2026Q2': 0,
      '2026Q3': 0,
      '2026Q4': 0
    };

    if (!current.budget_amount) {
      current.budget_amount = toNumber(row.budget_amount);
    }

    if (QUARTER_KEYS.includes(quarter)) {
      current[quarter] += toNumber(row.actual_amount);
    }

    grouped.set(key, current);
  });

  return Array.from(grouped.values()).map((row) => {
    const subtotal = QUARTER_KEYS.reduce((sum, quarter) => sum + toNumber(row[quarter]), 0);
    return {
      ...row,
      subtotal,
      balance_amount: toNumber(row.budget_amount) - subtotal
    };
  });
};

const HeadquartersPostIndicatorSummaryTable = () => {
  const { data: rawData, loading, error } = useFetchData('getHeadquartersPostIndicatorConfig', [], []);
  const tableRows = useMemo(() => {
    const rows = Array.isArray(rawData) ? rawData : [];
    return buildTableRows(rows);
  }, [rawData]);

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

  if (!tableRows.length) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
        <div className="text-center text-gray-500">暂无数据</div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-6">
      <div className="p-6 border-b border-gray-100 bg-gray-50/50">
        <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
          <span className="w-1 h-5 bg-[#a40035] rounded-full"></span>
          {TABLE_TITLE}
        </h3>
      </div>

      <div className="overflow-x-auto max-h-[800px] overflow-y-auto">
        <table className="w-full text-sm text-center text-gray-700 relative">
          <thead className="bg-gray-50 text-xs text-gray-600 sticky top-0 z-20 shadow-sm">
            <tr>
              <th rowSpan={3} className="px-6 py-4 font-bold sticky left-0 bg-gray-50 z-30 border-r border-b border-gray-300 min-w-[100px] shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                事件
              </th>
              <th rowSpan={3} className="px-6 py-4 font-bold bg-gray-50 z-20 border-r border-b border-gray-300 min-w-[100px]">
                任务
              </th>
              <th rowSpan={3} className="px-6 py-4 font-bold bg-gray-50 z-20 border-r border-b border-gray-300 min-w-[100px]">
                岗位
              </th>
              <th rowSpan={3} className="px-6 py-4 font-bold bg-gray-50 z-20 border-r border-b border-gray-300 min-w-[140px]">
                人员工号
              </th>
              <th rowSpan={3} className="px-6 py-4 font-bold bg-gray-50 z-20 border-r border-b border-gray-300 min-w-[100px]">
                人员名称
              </th>
              <th rowSpan={3} className="px-6 py-4 font-bold bg-gray-50 z-20 border-r border-b border-gray-300 min-w-[260px]">
                预算科目详情
              </th>
              <th colSpan={7} className="px-6 py-2 font-semibold whitespace-nowrap text-center border-r border-b border-gray-300 bg-gray-100">
                成本指标
              </th>
            </tr>
            <tr>
              <th rowSpan={2} className="px-6 py-4 font-semibold whitespace-nowrap min-w-[130px] text-center border-r border-b border-gray-300 bg-gray-50">
                预算金额（全年预算）
              </th>
              <th colSpan={5} className="px-6 py-4 font-semibold whitespace-nowrap min-w-[120px] text-center border-r border-b border-gray-300 bg-gray-100">
                费用预算
              </th>
              <th rowSpan={2} className="px-6 py-4 font-semibold whitespace-nowrap min-w-[130px] text-center border-r border-b border-gray-300 bg-gray-50">
                结余金额
              </th>
            </tr>
            <tr>
              <th className="px-6 py-2 font-medium whitespace-nowrap min-w-[90px] text-center bg-gray-50 border-b border-r border-gray-300 text-gray-600">
                2026Q1
              </th>
              <th className="px-6 py-2 font-medium whitespace-nowrap min-w-[90px] text-center bg-gray-50 border-b border-r border-gray-300 text-gray-600">
                2026Q2
              </th>
              <th className="px-6 py-2 font-medium whitespace-nowrap min-w-[90px] text-center bg-gray-50 border-b border-r border-gray-300 text-gray-600">
                2026Q3
              </th>
              <th className="px-6 py-2 font-medium whitespace-nowrap min-w-[90px] text-center bg-gray-50 border-b border-r border-gray-300 text-gray-600">
                2026Q4
              </th>
              <th className="px-6 py-2 font-medium whitespace-nowrap min-w-[90px] text-center bg-gray-50 border-b border-r border-gray-300 text-gray-600">
                小计
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {tableRows.map((row, index) => (
              <tr key={`${row.job_number}-${row.name}-${row.budget_subject}-${index}`} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 font-medium sticky left-0 z-10 border-r border-gray-300 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] bg-white text-gray-700">
                  {row.event || '-'}
                </td>
                <td className="px-6 py-4 text-center whitespace-nowrap border-r border-gray-300">
                  {row.task || '-'}
                </td>
                <td className="px-6 py-4 text-center whitespace-nowrap border-r border-gray-300">
                  {row.post_name || '-'}
                </td>
                <td className="px-6 py-4 text-center whitespace-nowrap border-r border-gray-300 font-mono">
                  {row.job_number || '-'}
                </td>
                <td className="px-6 py-4 text-center whitespace-nowrap border-r border-gray-300">
                  {row.name || '-'}
                </td>
                <td className="px-6 py-4 text-left border-r border-gray-300 min-w-[260px]">
                  {row.budget_subject || '-'}
                </td>
                <td className="px-6 py-4 text-center whitespace-nowrap border-r border-gray-300 font-mono">
                  {formatAmount(row.budget_amount)}
                </td>
                {QUARTER_KEYS.map((quarter) => (
                  <td key={`${row.job_number}-${quarter}`} className="px-6 py-4 text-center whitespace-nowrap border-r border-gray-300 font-mono">
                    {formatAmount(row[quarter], true)}
                  </td>
                ))}
                <td className="px-6 py-4 text-center whitespace-nowrap border-r border-gray-300 font-mono">
                  {formatAmount(row.subtotal, true)}
                </td>
                <td className="px-6 py-4 text-center whitespace-nowrap border-r border-gray-300 font-mono">
                  {formatAmount(row.balance_amount)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default HeadquartersPostIndicatorSummaryTable;
