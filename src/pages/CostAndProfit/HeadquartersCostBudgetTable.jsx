import React, { useMemo } from 'react';
import useFetchData from '../../hooks/useFetchData';

const TABLE_TITLE = '总部利润汇总';


const FROZEN_DIVIDER_SHADOW = 'inset -1px 0 0 #d1d5db, 2px 0 5px -2px rgba(0,0,0,0.1)';
const FROZEN_DIVIDER_SHADOW_SOFT = 'inset -1px 0 0 #d1d5db, 2px 0 5px -2px rgba(0,0,0,0.08)';

const FIXED_COST_KNOWN_KEYS = [
  'total_rent_fee',
  'total_depreciation_fee',
  'total_recruitment_channel_fee',
  'total_office_fee',
  'total_utilities_fee',
  'total_server_leasing_fee',
  'total_handling_fee',
  'total_tax_and_surcharge'
];

const SECTION_CONFIG = [
  {
    center: '收入',
    rows: [
      { subject: '管理费收入', amountKey: 'total_management_income', ratioKey: 'total_management_income_ratio' },
      { subject: '租金收入', amountKey: 'total_rental_income', ratioKey: 'total_rental_income_ratio' },
      { subject: '商品销售收入', amountKey: 'total_goods_sales_income', ratioKey: 'total_goods_sales_income_ratio', zeroAsDash: true },
      { subject: '小计', amountKey: 'total_income', ratioType: 'fixedOne', isSubtotal: true }
    ]
  },
  {
    center: '人工成本',
    rows: [
      { subject: '推拿之家', amountKey: 'total_massage_home_budget', ratioKey: 'total_massage_home_budget_ratio' },
      { subject: '用户中心', amountKey: 'total_user_center_budget', ratioKey: 'total_user_center_budget_ratio' },
      { subject: '投融资管理', amountKey: 'total_investment_financing_budget', ratioKey: 'total_investment_financing_budget_ratio' },
      { subject: '数字化中台', amountKey: 'total_digital_platform_budget', ratioKey: 'total_digital_platform_budget_ratio' },
      { subject: '小计', amountKey: 'total_labor_cost', ratioKey: 'total_labor_cost_ratio', isSubtotal: true }
    ]
  },
  {
    center: '固定成本',
    rows: [
      { subject: '房租费', amountKey: 'total_rent_fee', ratioKey: 'total_rent_fee_ratio' },
      { subject: '折旧费', amountKey: 'total_depreciation_fee', ratioKey: 'total_depreciation_fee_ratio' },
      { subject: '招聘渠道费', amountKey: 'total_recruitment_channel_fee', ratioKey: 'total_recruitment_channel_fee_ratio' },
      { subject: '办公费', amountKey: 'total_office_fee', ratioKey: 'total_office_fee_ratio' },
      { subject: '水电费', amountKey: 'total_utilities_fee', ratioKey: 'total_utilities_fee_ratio' },
      { subject: '服务器租赁费', amountKey: 'total_server_leasing_fee', ratioKey: 'total_server_leasing_fee_ratio' },
      { subject: '手续费', amountKey: 'total_handling_fee', ratioKey: 'total_handling_fee_ratio' },
      { subject: '税金', amountKey: 'total_tax_and_surcharge', ratioKey: 'total_tax_and_surcharge_ratio' },
      { subject: '其他', amountKey: 'total_other_fixed_cost', ratioType: 'costDerived', derivedAmount: 'fixedOther', zeroAsDash: true },
      { subject: '小计', amountKey: 'total_fixed_cost', ratioKey: 'total_fixed_cost_ratio', isSubtotal: true }
    ]
  },
  {
    center: '',
    rows: [
      { subject: '支出合计', amountKey: 'total_cost', ratioType: 'fixedOne', isGrandTotal: true },
      { subject: '利润', amountKey: 'total_profit', ratioType: 'profitIncome', isProfit: true }
    ]
  }
];

const toNumber = (value) => {
  if (value == null || value === '') return 0;
  const num = Number(value);
  return Number.isNaN(num) ? 0 : num;
};

const formatAmount = (value, zeroAsDash = false) => {
  const num = toNumber(value);
  if (zeroAsDash && Math.abs(num) < 0.000001) return '-';
  return (num / 10000).toLocaleString('zh-CN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
};

const formatRatio = (value, zeroAsDash = false) => {
  if (value == null || Number.isNaN(value)) return '-';
  if (zeroAsDash && Math.abs(value) < 0.000001) return '-';
  return `${(value * 100).toFixed(1)}%`;
};

const formatMonthLabel = (month, index) => {
  const match = String(month || '').match(/^(\d{4})-(\d{2})$/);
  if (match) return `${Number(match[2])}月`;
  return `${index + 1}月`;
};

const sortByMonth = (rows) => [...rows].sort((a, b) => String(a.month || '').localeCompare(String(b.month || '')));

const buildAggregateRow = (rows) => {
  const aggregate = { month: '合计' };
  rows.forEach((row) => {
    Object.entries(row).forEach(([key, value]) => {
      if (key === 'month') return;
      aggregate[key] = toNumber(aggregate[key]) + toNumber(value);
    });
  });
  return aggregate;
};

const getDerivedFixedOther = (row) => {
  const knownFixedCost = FIXED_COST_KNOWN_KEYS.reduce((sum, key) => sum + toNumber(row[key]), 0);
  return toNumber(row.total_fixed_cost) - knownFixedCost;
};

const getCellAmount = (row, config) => {
  if (config.derivedAmount === 'fixedOther') {
    return getDerivedFixedOther(row);
  }
  return toNumber(row[config.amountKey]);
};

const getCellRatio = (row, config, isSummary = false) => {
  if (isSummary) {
    const totalIncome = toNumber(row.total_income);
    if (!totalIncome) return null;
    return getCellAmount(row, config) / totalIncome;
  }

  if (config.ratioKey) {
    const raw = row[config.ratioKey];
    if (raw == null || raw === '') return null;
    return toNumber(raw);
  }

  if (config.ratioType === 'fixedOne') {
    return 1;
  }

  if (config.ratioType === 'profitIncome') {
    const income = toNumber(row.total_income);
    if (!income) return null;
    return toNumber(row.total_profit) / income;
  }

  if (config.ratioType === 'costDerived' && config.derivedAmount === 'fixedOther') {
    const totalCost = toNumber(row.total_cost);
    if (!totalCost) return null;
    return getDerivedFixedOther(row) / totalCost;
  }

  return null;
};

const HeadquartersCostBudgetTable = () => {
  const { data: profitDataRaw, loading, error } = useFetchData('getHeadquartersProfitMonthly', [], []);
  const profitData = Array.isArray(profitDataRaw) ? profitDataRaw : [];

  const monthColumns = useMemo(() => {
    const sortedRows = sortByMonth(profitData);
    if (!sortedRows.length) return [];

    const aggregateRow = buildAggregateRow(sortedRows);
    return [
      ...sortedRows.map((row, index) => ({
        key: row.month || `month-${index}`,
        label: formatMonthLabel(row.month, index),
        row
      })),
      {
        key: 'total',
        label: '合计',
        row: aggregateRow,
        isSummary: true
      }
    ];
  }, [profitData]);

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

  if (!monthColumns.length) {
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
        <div className="mt-2 text-sm text-gray-500 text-left">单位：万元</div>
      </div>

      <div className="overflow-x-auto overflow-y-auto max-h-[900px]">
        <table className="w-full text-sm text-gray-700 relative border-collapse">
          <thead className="bg-gray-50 text-sm text-gray-600 sticky top-0 z-20 shadow-sm">
            <tr>
              <th
                rowSpan={2}
                className="px-6 py-4 font-bold text-center align-middle sticky left-0 bg-gray-50 z-30 border-b border-gray-300 min-w-[120px]" style={{ boxShadow: FROZEN_DIVIDER_SHADOW }}
              >
                中心
              </th>
              <th
                rowSpan={2}
                className="px-6 py-4 font-bold text-center align-middle sticky left-[120px] bg-gray-50 z-30 border-b border-gray-300 min-w-[160px]" style={{ boxShadow: FROZEN_DIVIDER_SHADOW }}
              >
                科目
              </th>
              {monthColumns.map((column) => (
                <th
                  key={column.key}
                  colSpan={2}
                  className="px-6 py-4 font-bold whitespace-nowrap text-center align-middle min-w-[220px] border-r border-b border-gray-300 bg-gray-100"
                >
                  {column.label}
                </th>
              ))}
            </tr>
            <tr>
              {monthColumns.flatMap((column) => ([
                <th
                  key={`${column.key}-amount`}
                  className="px-6 py-2 font-bold whitespace-nowrap text-center align-middle min-w-[130px] bg-gray-50 border-r border-b border-gray-300 text-gray-600"
                >
                  金额
                </th>,
                <th
                  key={`${column.key}-ratio`}
                  className="px-6 py-2 font-bold whitespace-nowrap text-center align-middle min-w-[90px] bg-gray-50 border-r border-b border-gray-300 text-gray-600"
                >
                  占比
                </th>
              ]))}
            </tr>
          </thead>
          <tbody>
            {SECTION_CONFIG.map((section) =>
              section.rows.map((item, rowIndex) => {
                const isSubtotal = Boolean(item.isSubtotal || item.isGrandTotal || item.isProfit);
                const rowClassName = isSubtotal ? 'bg-gray-100 font-bold' : 'hover:bg-gray-50 transition-colors';
                const stickyBgClass = isSubtotal ? 'bg-gray-100' : 'bg-white';

                return (
                  <tr key={`${section.center || 'summary'}-${item.subject}`} className={rowClassName}>
                    {rowIndex === 0 && (
                      <td
                        rowSpan={section.rows.length}
                        className={`px-6 py-2 font-medium text-center align-middle sticky left-0 z-10 border-r border-b border-gray-300 ${stickyBgClass}`} style={{ boxShadow: FROZEN_DIVIDER_SHADOW }}
                      >
                        {section.center}
                      </td>
                    )}
                    <td
                      className={`px-6 py-2 font-medium text-center align-middle sticky left-[120px] z-10 border-r border-b border-gray-300 ${isSubtotal ? 'bg-gray-100' : 'bg-white'}`} style={{ boxShadow: FROZEN_DIVIDER_SHADOW_SOFT }}
                    >
                      {item.subject}
                    </td>
                    {monthColumns.flatMap((column) => {
                      const amount = getCellAmount(column.row, item);
                      const ratio = getCellRatio(column.row, item, column.isSummary);
                      const zeroAsDash = Boolean(item.zeroAsDash);
                      const amountText = formatAmount(amount, zeroAsDash);
                      const ratioText = formatRatio(ratio, zeroAsDash);
                      const profitNegative = item.isProfit && amount < 0;
                      const ratioNegative = item.isProfit && ratio != null && ratio < 0;

                      return [
                        <td
                          key={`${section.center}-${item.subject}-${column.key}-amount`}
                           className={`px-6 py-2 text-center align-middle whitespace-nowrap border-r border-b border-gray-300 font-mono ${
                             profitNegative ? 'text-[#A40035]' : ''
                           }`}
                        >
                          {profitNegative ? `-${formatAmount(Math.abs(amount))}` : amountText}
                        </td>,
                        <td
                          key={`${section.center}-${item.subject}-${column.key}-ratio`}
                           className={`px-6 py-2 text-center align-middle whitespace-nowrap border-r border-b border-gray-300 font-mono ${
                             ratioNegative ? 'text-[#A40035]' : ''
                           }`}
                        >
                          {ratioText}
                        </td>
                      ];
                    })}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default HeadquartersCostBudgetTable;

