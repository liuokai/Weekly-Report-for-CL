import React, { useMemo } from 'react';
import BusinessTargets from '../../config/businessTargets';
import useFetchData from '../../hooks/useFetchData';

const TABLE_TITLE = '2026年成本占比对比';
const { headerGroups: HEADER_GROUPS, rows: BUDGET_ROWS } = BusinessTargets.profit.budgetCostRatioTable;

const ACTUAL_TO_BUDGET_KEY_MAP = {
  城市: 'city',
  总部提取管理费: 'hq_fee',
  '人工成本-推拿师成本': 'masseur_cost',
  '人工成本-后台成本': 'backstage_cost',
  人工成本小计: 'labor_subtotal',
  '固定成本-房租成本': 'rent_cost',
  '固定成本-折旧成本': 'depreciation_cost',
  固定成本小计: 'fixed_subtotal',
  '变动成本-物资成本': 'material_cost',
  '变动成本-税金': 'tax_cost',
  '变动成本-资产维护': 'asset_maintenance',
  '变动成本-水电费': 'utility_cost',
  '变动成本-其他': 'other_cost',
  变动成本小计: 'variable_subtotal',
  利润率: 'profit_rate'
};

const normalizeCityName = (value) => {
  if (!value) return '';
  const text = String(value).trim();
  if (text === '合计') return text;
  return text.replace(/(省|市)$/, '');
};

const parsePercent = (value) => {
  if (value == null || value === '') return null;
  if (typeof value === 'number') return value;
  const text = String(value).trim();
  const hasPercentSign = text.includes('%');
  const normalized = text.replace('%', '').trim();
  const parsed = Number(normalized);
  if (Number.isNaN(parsed)) return null;
  return hasPercentSign ? parsed / 100 : parsed;
};

const formatDiff = (value) => {
  if (value == null || Number.isNaN(value)) return '';
  return `${value >= 0 ? '' : '-'}${Math.abs(value * 100).toFixed(2)}%`;
};

const isNegativeValue = (value) => typeof value === 'number' && value < 0;

const deriveMaterialCost = (row) => {
  const subtotal = parsePercent(row.variable_subtotal);
  const assetMaintenance = parsePercent(row.asset_maintenance) || 0;
  const taxCost = parsePercent(row.tax_cost) || 0;
  const utilityCost = parsePercent(row.utility_cost) || 0;
  const otherCost = parsePercent(row.other_cost) || 0;

  if (subtotal == null) return null;
  return subtotal - assetMaintenance - taxCost - utilityCost - otherCost;
};

const normalizeActualRow = (row) => {
  const normalized = {};

  Object.entries(ACTUAL_TO_BUDGET_KEY_MAP).forEach(([actualKey, budgetKey]) => {
    normalized[budgetKey] = row[actualKey];
  });

  if ((normalized.material_cost == null || normalized.material_cost === '') && normalized.variable_subtotal != null) {
    normalized.material_cost = deriveMaterialCost(normalized);
  }

  return normalized;
};

const buildActualLookup = (rows) => {
  const lookup = new Map();
  const normalizedRows = [];

  rows.forEach((row) => {
    const normalized = normalizeActualRow(row);

    if (normalized.city) {
      const cityKey = normalizeCityName(normalized.city);
      lookup.set(cityKey, { ...normalized, city: cityKey });
      normalizedRows.push({ ...normalized, city: cityKey });
    }
  });

  if (normalizedRows.length) {
    const summary = { city: '合计' };

    HEADER_GROUPS.forEach((group) => {
      group.subHeaders.forEach((sub) => {
        const numericRows = normalizedRows
          .map((row) => {
            if (sub.key === 'material_cost' && (row[sub.key] == null || row[sub.key] === '')) {
              return deriveMaterialCost(row);
            }
            return parsePercent(row[sub.key]);
          })
          .filter((value) => value != null);

        summary[sub.key] = numericRows.length
          ? numericRows.reduce((sum, value) => sum + value, 0) / numericRows.length
          : null;
      });
    });

    lookup.set('合计', summary);
  }

  return lookup;
};

const CostRatioComparison2026Table = () => {
  const citySortOrder = ['四川', '重庆', '深圳', '杭州', '南京', '宁波', '广州', '上海', '北京', '合计'];
  const normalizeCityForSort = (value) => {
    const text = String(value || '').trim();
    if (text === '合计' || text === '鍚堣') return '合计';
    return text.replace(/(省|市|鐪亅甯?)$/, '');
  };

  const { data: actualRowsRaw, loading, error } = useFetchData('getCashFlowOverviewCityMonthly', [], []);
  const actualRows = Array.isArray(actualRowsRaw) ? actualRowsRaw : [];

  const comparisonRows = useMemo(() => {
    if (!actualRows.length) return [];

    const actualLookup = buildActualLookup(actualRows);

    const rows = BUDGET_ROWS.map((budgetRow) => {
      const actualRow = actualLookup.get(normalizeCityName(budgetRow.city));
      const diffRow = {
        city: budgetRow.city,
        isSummary: Boolean(budgetRow.isSummary)
      };

      HEADER_GROUPS.forEach((group) => {
        group.subHeaders.forEach((sub) => {
          const actualValue = actualRow
            ? sub.key === 'material_cost'
              ? (parsePercent(actualRow[sub.key]) ?? deriveMaterialCost(actualRow))
              : parsePercent(actualRow[sub.key])
            : null;
          const budgetValue = parsePercent(budgetRow[sub.key]);

          if (actualValue == null || budgetValue == null) {
            diffRow[sub.key] = '';
            return;
          }

          diffRow[sub.key] = actualValue - budgetValue;
        });
      });

      return diffRow;
    });

    rows.sort((a, b) => {
      const aIndex = citySortOrder.indexOf(normalizeCityForSort(a.city));
      const bIndex = citySortOrder.indexOf(normalizeCityForSort(b.city));
      return (aIndex === -1 ? 999 : aIndex) - (bIndex === -1 ? 999 : bIndex);
    });

    return rows.filter((row) => !row.isSummary);
  }, [actualRows]);

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

  if (!comparisonRows.length) {
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
          <div className="mt-2 text-sm text-gray-500 text-left">对比值=实际占比-成本占比</div>
      </div>

      <div className="overflow-x-auto max-h-[800px] overflow-y-auto">
        <table className="w-full text-sm text-center text-black relative">
          <thead className="bg-gray-50 text-xs text-gray-600 sticky top-0 z-20 shadow-sm">
            <tr>
              <th rowSpan={2} className="px-6 py-2 font-bold sticky left-0 bg-gray-50 z-30 border-r border-gray-300 min-w-[100px] shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                城市
              </th>
              {HEADER_GROUPS.map((group) => (
                <th
                  key={group.title}
                  colSpan={group.subHeaders.length}
                  rowSpan={group.subHeaders.length === 1 ? 2 : 1}
                  className={`px-6 py-2 font-bold whitespace-nowrap min-w-[120px] text-center border-b border-r border-gray-300 ${
                    group.subHeaders.length > 1 ? 'bg-gray-100' : ''
                  }`}
                >
                  {group.title}
                </th>
              ))}
            </tr>
            <tr>
              {HEADER_GROUPS.map((group) =>
                group.subHeaders.length > 1
                  ? group.subHeaders.map((sub) => (
                      <th
                        key={sub.key}
                        className="px-6 py-2 font-bold whitespace-nowrap min-w-[90px] text-center bg-gray-50 border-b border-r border-gray-300 text-gray-600"
                      >
                        {sub.label}
                      </th>
                    ))
                  : null
              )}
            </tr>
          </thead>
          <tbody>
            {comparisonRows.map((row, rowIndex) => (
              <tr
                key={row.city}
                className={row.isSummary ? 'bg-red-50 font-bold' : `${rowIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-gray-50 transition-colors`}
              >
                <td
                  className={`px-6 py-2 font-medium sticky left-0 z-10 border-r border-b border-gray-300 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] ${
                    row.isSummary ? 'bg-red-50 text-[#a40035]' : rowIndex % 2 === 0 ? 'bg-white text-black' : 'bg-gray-50 text-black'
                  }`}
                >
                  {row.city}
                </td>
                {HEADER_GROUPS.flatMap((group) =>
                  group.subHeaders.map((sub) => {
                    const value = row[sub.key];
                    const isEmpty = value === '';
                    const isNegative = isNegativeValue(value);

                    return (
                      <td
                        key={`${row.city}-${sub.key}`}
                        className={`px-6 py-2 text-center whitespace-nowrap border-r border-b border-gray-300 ${row.isSummary ? 'bg-red-50' : rowIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50'} ${
                          row.isSummary ? 'font-bold' : ''
                        } ${isNegative ? 'text-[#a40035]' : 'text-black'} ${
                          sub.key === 'profit_rate' ? 'font-semibold' : ''
                        }`}
                      >
                        {isEmpty ? '' : formatDiff(value)}
                      </td>
                    );
                  })
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CostRatioComparison2026Table;
