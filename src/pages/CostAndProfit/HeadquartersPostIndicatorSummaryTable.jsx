import React, { useEffect, useMemo, useState } from 'react';
import useFetchData from '../../hooks/useFetchData';

const TABLE_TITLE = '总部岗位及指标汇总';
const DETAIL_MODAL_TITLE = '总部岗位及指标明细';
const QUARTER_KEYS = ['2026Q1', '2026Q2', '2026Q3', '2026Q4'];
const DETAIL_COLUMNS = [
  { key: 'quarter', label: '归属季度', width: '120px' },
  { key: 'code', label: '单据编号', width: '160px' },
  { key: 'fund_organization', label: '组织名称', width: '160px' },
  { key: 'created_on', label: '创建时间', width: '180px' },
  { key: 'supplier_name', label: '申请单位', width: '160px' },
  { key: 'supplier_id', label: '申请人工号', width: '140px' },
  { key: 'payment_type', label: '付款类型', width: '140px' },
  { key: 'material_name', label: '对象类型', width: '140px' },
  { key: 'excerpt', label: '付款摘要', width: '220px' },
  { key: 'payment', label: '付款金额', width: '140px', isAmount: true },
  { key: 'payment_name', label: '付款单位', width: '160px' },
  { key: 'payment_num', label: '付款账号', width: '180px' },
  { key: 'payment_bank', label: '付款银行', width: '160px' },
  { key: 'payee', label: '收款单位', width: '160px' },
  { key: 'payee_num', label: '收款账号', width: '180px' },
  { key: 'payee_bank', label: '收款银行', width: '160px' },
  { key: 'send_bank_time', label: '提交银行时间', width: '180px' },
  { key: 'bank_return_time', label: '银行返回时间', width: '180px' },
  { key: 'bank_return', label: '银行返回信息', width: '180px' },
  { key: 'security_code', label: '对账防标码', width: '180px' },
  { key: 'pay_msg', label: '付款失败原因', width: '180px' },
  { key: 'danju', label: '单据状态', width: '120px' },
  { key: 'kaipiao', label: '发票状态', width: '120px' },
  { key: 'ruzhang', label: '入账状态', width: '120px' },
  { key: 'fukuan', label: '付款状态', width: '120px' }
];

const FROZEN_COLUMN_WIDTHS = [120, 120, 120, 140];
const FROZEN_DIVIDER_SHADOW = 'inset -1px 0 0 #d1d5db, 2px 0 5px -2px rgba(0,0,0,0.1)';
const FROZEN_DIVIDER_SHADOW_SOFT = 'inset -1px 0 0 #d1d5db, 2px 0 5px -2px rgba(0,0,0,0.08)';

const getFrozenColumnStyle = (index) => ({
  left: `${FROZEN_COLUMN_WIDTHS.slice(0, index).reduce((sum, width) => sum + width, 0)}px`,
  minWidth: `${FROZEN_COLUMN_WIDTHS[index]}px`,
  width: `${FROZEN_COLUMN_WIDTHS[index]}px`,
  maxWidth: `${FROZEN_COLUMN_WIDTHS[index]}px`
});

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

const formatDetailValue = (value, column) => {
  if (value == null || value === '') return '-';
  if (column.isAmount) return formatAmount(value);
  return String(value);
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
  const [selectedPerson, setSelectedPerson] = useState(null);
  const {
    data: rawData,
    loading,
    error
  } = useFetchData('getHeadquartersPostIndicatorConfig', [], []);
  const {
    data: detailData,
    loading: detailLoading,
    error: detailError,
    fetchData: fetchDetailData,
    setData: setDetailData
  } = useFetchData('getHeadquartersPostIndicatorDetail', [], [], { manual: true });

  const tableRows = useMemo(() => {
    const rows = Array.isArray(rawData) ? rawData : [];
    return buildTableRows(rows);
  }, [rawData]);

  const detailRows = Array.isArray(detailData) ? detailData : [];

  useEffect(() => {
    if (selectedPerson) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }

    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [selectedPerson]);

  const handleOpenDetail = (row) => {
    if (!row.job_number) return;
    setSelectedPerson(row);
    setDetailData([]);
    fetchDetailData([row.job_number]);
  };

  const handleCloseDetail = () => {
    setSelectedPerson(null);
    setDetailData([]);
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

  if (!tableRows.length) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
        <div className="text-center text-gray-500">暂无数据</div>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-6">
        <div className="p-6 border-b border-gray-100 bg-gray-50/50">
          <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
            <span className="w-1 h-5 bg-[#a40035] rounded-full"></span>
            {TABLE_TITLE}
          </h3>
        </div>

        <div className="overflow-x-auto max-h-[800px] overflow-y-auto">
          <table className="w-full text-sm text-center text-gray-700 relative">
            <thead className="bg-gray-50 text-sm text-gray-600 sticky top-0 z-20 shadow-sm">
              <tr>
                <th
                  rowSpan={3}
                  className="px-6 py-4 font-bold sticky bg-gray-50 z-30 border-b border-gray-300 whitespace-nowrap"
                  style={{ ...getFrozenColumnStyle(0), boxShadow: FROZEN_DIVIDER_SHADOW }}
                >
                  事件
                </th>
                <th
                  rowSpan={3}
                  className="px-6 py-4 font-bold sticky bg-gray-50 z-30 border-b border-gray-300 whitespace-nowrap"
                  style={{ ...getFrozenColumnStyle(1), boxShadow: FROZEN_DIVIDER_SHADOW_SOFT }}
                >
                  任务
                </th>
                <th
                  rowSpan={3}
                  className="px-6 py-4 font-bold sticky bg-gray-50 z-30 border-b border-gray-300 whitespace-nowrap"
                  style={{ ...getFrozenColumnStyle(2), boxShadow: FROZEN_DIVIDER_SHADOW_SOFT }}
                >
                  岗位
                </th>
                <th
                  rowSpan={3}
                  className="px-6 py-4 font-bold sticky bg-gray-50 z-30 border-b border-gray-300 whitespace-nowrap"
                  style={{ ...getFrozenColumnStyle(3), boxShadow: FROZEN_DIVIDER_SHADOW }}
                >
                  人员名称
                </th>
                <th rowSpan={3} className="px-6 py-4 font-bold bg-gray-50 z-20 border-r border-b border-gray-300 min-w-[260px] whitespace-nowrap">
                  预算科目详情
                </th>
                <th colSpan={7} className="px-6 py-2 font-bold whitespace-nowrap text-center border-r border-b border-gray-300 bg-gray-100">
                  成本指标
                </th>
              </tr>
              <tr>
                <th rowSpan={2} className="px-6 py-4 font-bold whitespace-nowrap min-w-[130px] text-center border-r border-b border-gray-300 bg-gray-50">
                  预算金额
                </th>
                <th colSpan={5} className="px-6 py-4 font-bold whitespace-nowrap min-w-[120px] text-center border-r border-b border-gray-300 bg-gray-100">
                  费用预算
                </th>
                <th rowSpan={2} className="px-6 py-4 font-bold whitespace-nowrap min-w-[130px] text-center border-r border-b border-gray-300 bg-gray-50">
                  结余金额
                </th>
              </tr>
              <tr>
                <th className="px-6 py-2 font-bold whitespace-nowrap min-w-[90px] text-center bg-gray-50 border-b border-r border-gray-300 text-gray-600">
                  2026Q1
                </th>
                <th className="px-6 py-2 font-bold whitespace-nowrap min-w-[90px] text-center bg-gray-50 border-b border-r border-gray-300 text-gray-600">
                  2026Q2
                </th>
                <th className="px-6 py-2 font-bold whitespace-nowrap min-w-[90px] text-center bg-gray-50 border-b border-r border-gray-300 text-gray-600">
                  2026Q3
                </th>
                <th className="px-6 py-2 font-bold whitespace-nowrap min-w-[90px] text-center bg-gray-50 border-b border-r border-gray-300 text-gray-600">
                  2026Q4
                </th>
                <th className="px-6 py-2 font-bold whitespace-nowrap min-w-[90px] text-center bg-gray-50 border-b border-r border-gray-300 text-gray-600">
                  小计
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {tableRows.map((row, index) => (
                <tr key={`${row.job_number}-${row.name}-${row.budget_subject}-${index}`} className="hover:bg-gray-50 transition-colors">
                  <td
                    className="px-6 py-4 font-medium sticky z-10 whitespace-nowrap bg-white text-gray-700"
                    style={{ ...getFrozenColumnStyle(0), boxShadow: FROZEN_DIVIDER_SHADOW }}
                  >
                    {row.event || '-'}
                  </td>
                  <td
                    className="px-6 py-4 text-center whitespace-nowrap sticky z-10 bg-white"
                    style={{ ...getFrozenColumnStyle(1), boxShadow: FROZEN_DIVIDER_SHADOW_SOFT }}
                  >
                    {row.task || '-'}
                  </td>
                  <td
                    className="px-6 py-4 text-center whitespace-nowrap sticky z-10 bg-white"
                    style={{ ...getFrozenColumnStyle(2), boxShadow: FROZEN_DIVIDER_SHADOW_SOFT }}
                  >
                    {row.post_name || '-'}
                  </td>
                  <td
                    className="px-6 py-4 text-center whitespace-nowrap sticky z-10 bg-white"
                    style={{ ...getFrozenColumnStyle(3), boxShadow: FROZEN_DIVIDER_SHADOW }}
                  >
                    {row.job_number ? (
                      <button
                        type="button"
                        className="text-[#a40035] hover:underline font-medium disabled:text-gray-400 disabled:no-underline"
                        onClick={() => handleOpenDetail(row)}
                        disabled={!row.name}
                      >
                        {row.name || '-'}
                      </button>
                    ) : (
                      row.name || '-'
                    )}
                  </td>
                  <td className="px-6 py-4 text-left border-r border-gray-300 min-w-[260px]">
                    {row.budget_subject || '-'}
                  </td>
                  <td className="px-6 py-4 text-right whitespace-nowrap border-r border-gray-300 font-mono">
                    {formatAmount(row.budget_amount)}
                  </td>
                  {QUARTER_KEYS.map((quarter) => (
                    <td key={`${row.job_number}-${quarter}`} className="px-6 py-4 text-right whitespace-nowrap border-r border-gray-300 font-mono">
                      {formatAmount(row[quarter], true)}
                    </td>
                  ))}
                  <td className="px-6 py-4 text-right whitespace-nowrap border-r border-gray-300 font-mono">
                    {formatAmount(row.subtotal, true)}
                  </td>
                  <td
                    className={`px-6 py-4 text-right whitespace-nowrap border-r border-gray-300 font-mono ${
                      row.balance_amount < 0 ? 'text-[#A40035]' : ''
                    }`}
                  >
                    {formatAmount(row.balance_amount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {selectedPerson && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4" onClick={handleCloseDetail}>
          <div
            className="flex max-h-[90vh] w-[96vw] max-w-[1600px] flex-col rounded-xl bg-white shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex shrink-0 items-center justify-between rounded-t-xl border-b border-gray-100 bg-[#a40035]/5 px-6 py-4">
              <div>
                <h2 className="text-lg font-bold text-[#a40035]">{DETAIL_MODAL_TITLE}</h2>
                <p className="mt-0.5 text-sm text-gray-500">
                  {selectedPerson.name || '-'} / {selectedPerson.job_number || '-'} / {selectedPerson.post_name || '-'}
                </p>
              </div>
              <button
                type="button"
                onClick={handleCloseDetail}
                className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="h-[60vh] p-4">
              {detailLoading ? (
                <div className="flex h-full items-center justify-center text-gray-500">加载中...</div>
              ) : detailError ? (
                <div className="flex h-full items-center justify-center text-red-500">加载失败: {detailError}</div>
              ) : !detailRows.length ? (
                <div className="flex h-full items-center justify-center text-gray-500">暂无明细数据</div>
              ) : (
                <div className="h-full overflow-auto rounded-lg border border-gray-200 bg-white">
                  <table
                    className="w-full table-fixed border-collapse text-center text-sm text-gray-700"
                    style={{ minWidth: `${DETAIL_COLUMNS.reduce((sum, column) => sum + Number.parseInt(column.width, 10), 0)}px` }}
                  >
                    <colgroup>
                      {DETAIL_COLUMNS.map((column) => (
                        <col key={column.key} style={{ width: column.width }} />
                      ))}
                    </colgroup>
                    <thead className="sticky top-0 z-20">
                      <tr>
                        {DETAIL_COLUMNS.map((column) => (
                          <th
                            key={column.key}
                            className="border-r border-b border-gray-300 bg-gray-50 px-3 py-3 font-semibold text-center last:border-r-0"
                          >
                            {column.label}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {detailRows.map((detailRow, index) => (
                        <tr key={`${detailRow.code || 'detail'}-${index}`} className="hover:bg-gray-50">
                          {DETAIL_COLUMNS.map((column) => (
                            <td
                              key={`${column.key}-${index}`}
                              className={`border-r border-b border-gray-200 bg-white px-3 py-2 last:border-r-0 ${column.isAmount ? 'font-mono text-right' : 'text-center'}`}
                            >
                              {formatDetailValue(detailRow[column.key], column)}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default HeadquartersPostIndicatorSummaryTable;
