import React, { useMemo } from 'react';
import useFetchData from '../../hooks/useFetchData';

const TABLE_TITLE = '2026年门店数据统计';
const FROZEN_COLUMN_WIDTH = 160;

const isRatioColumn = (column) => column?.fullLabel?.includes('比例');

const isPeriodColumn = (column) => column?.fullLabel?.includes('回收期');

const isAmountColumn = (column) =>
  !isRatioColumn(column) &&
  !isPeriodColumn(column) &&
  !isOperatingStoreCountColumn(column);

const getFrozenColumnStyle = (left = 0) => ({
  left: `${left}px`,
  minWidth: `${FROZEN_COLUMN_WIDTH}px`,
  width: `${FROZEN_COLUMN_WIDTH}px`,
  maxWidth: `${FROZEN_COLUMN_WIDTH}px`
});

const getFrozenHeaderBgClass = (bgClass) => `${bgClass} bg-opacity-100`;
const FROZEN_DIVIDER_SHADOW = 'inset -1px 0 0 #d1d5db, 2px 0 5px -2px rgba(0,0,0,0.1)';
const FROZEN_DIVIDER_SHADOW_SOFT = 'inset -1px 0 0 #d1d5db, 2px 0 5px -2px rgba(0,0,0,0.08)';

const getLastMonthLabel = () => {
  const currentDate = new Date();
  const lastMonthDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
  const year = lastMonthDate.getFullYear();
  const month = String(lastMonthDate.getMonth() + 1).padStart(2, '0');

  return `${year}-${month}`;
};

const isMainBusinessIncomeColumn = (column) =>
  !isRatioColumn(column) &&
  column?.fullLabel?.includes('主营') &&
  column?.fullLabel?.includes('收入');

const isLatestMonthValueColumn = (column) =>
  column?.fullLabel?.includes('累计经营净现金流') || column?.fullLabel?.includes('总折旧');

const isAverageColumn = (column) => column?.fullLabel?.includes('投资回收期');

const isOperatingStoreCountColumn = (column) => column?.fullLabel?.includes('在营门店数');

const getNumericTotal = (rows, key) =>
  rows.reduce((sum, row) => {
    const value = row?.[key];
    return isNumericValue(value) ? sum + Number(value) : sum;
  }, 0);

const getAverageValue = (rows, key) => {
  const numericValues = rows
    .map((row) => row?.[key])
    .filter((value) => isNumericValue(value))
    .map((value) => Number(value));

  if (numericValues.length === 0) {
    return null;
  }

  return numericValues.reduce((sum, value) => sum + value, 0) / numericValues.length;
};

const getLatestRowByMonth = (rows, monthKey) =>
  rows.reduce((latestRow, currentRow) => {
    if (!latestRow) {
      return currentRow;
    }

    const latestMonth = String(latestRow?.[monthKey] || '');
    const currentMonth = String(currentRow?.[monthKey] || '');

    return currentMonth > latestMonth ? currentRow : latestRow;
  }, null);

const splitHeaderLabel = (label) => {
  const text = String(label || '');
  const parts = text.split('-');

  if (parts.length <= 1) {
    return {
      group: null,
      title: text
    };
  }

  return {
    group: parts[0],
    title: parts.slice(1).join('-')
  };
};

const buildHeaderGroups = (columns) => {
  const groups = [];

  columns.forEach((column) => {
    if (!column.group) {
      groups.push({
        isGroup: false,
        title: column.title,
        columns: [column]
      });
      return;
    }

    const lastGroup = groups[groups.length - 1];
    if (lastGroup && lastGroup.isGroup && lastGroup.title === column.group) {
      lastGroup.columns.push(column);
      return;
    }

    groups.push({
      isGroup: true,
      title: column.group,
      columns: [column]
    });
  });

  return groups;
};

const POST_SERVICE_FEE_ORDER = [
  '净利润',
  '净利润比例',
  '经营净现金流',
  '经营净现金流比例',
  '累计经营净现金流',
  '总折旧',
  '投资回收期',
  '人工成本总计',
  '人工成本总计比例',
  '固定成本总计',
  '固定成本总计比例',
  '变动成本总计',
  '变动成本总计比例',
  '税前利润',
  '税前利润比例',
  '所得税金额',
  '所得税金额比例'
];

const sortDataColumns = (columns) => {
  const anchorIndex = columns.findIndex((column) => column.fullLabel === '服务费比例');
  if (anchorIndex === -1) {
    return columns;
  }

  const before = columns.slice(0, anchorIndex + 1);
  const after = columns.slice(anchorIndex + 1);
  const orderMap = new Map(POST_SERVICE_FEE_ORDER.map((label, index) => [label, index]));
  const ordered = new Array(POST_SERVICE_FEE_ORDER.length);
  const remaining = [];

  after.forEach((column) => {
    const targetIndex = orderMap.get(column.fullLabel);
    if (targetIndex === undefined) {
      remaining.push(column);
      return;
    }

    ordered[targetIndex] = column;
  });

  return [...before, ...ordered.filter(Boolean), ...remaining];
};

const isNumericValue = (value) => typeof value === 'number' || (value !== null && value !== '' && !Number.isNaN(Number(value)));

const formatValue = (value, column) => {
  if (value === null || value === undefined || value === '') {
    return '-';
  }

  if (!isNumericValue(value)) {
    return String(value);
  }

  const numberValue = Number(value);

  if (isRatioColumn(column)) {
    return `${(numberValue * 100).toFixed(2)}%`;
  }

  if (isPeriodColumn(column)) {
    return numberValue.toLocaleString('zh-CN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  }

  if (isAmountColumn(column)) {
    const amountInWan = numberValue / 10000;
    return amountInWan.toLocaleString('zh-CN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  }

  const hasFraction = Math.abs(numberValue % 1) > 0.000001;
  return numberValue.toLocaleString('zh-CN', {
    minimumFractionDigits: hasFraction ? 2 : 0,
    maximumFractionDigits: 2
  });
};

const StoreDataStatistics2026Table = () => {
  const { data: rowsRaw, loading, error } = useFetchData('getTurnoverOverviewMonthly', [], []);
  const rows = Array.isArray(rowsRaw) ? rowsRaw : [];
  const statsPeriodLabel = `统计周期：2026-01~${getLastMonthLabel()} 最近新开门店的总折旧需要人工维护，更新可能不及时。投资回收期=总折旧/当月经营现金流`;

  const { firstColumn, secondColumn, dataColumns, headerGroups } = useMemo(() => {
    if (!rows.length) {
      return { firstColumn: null, secondColumn: null, dataColumns: [], headerGroups: [] };
    }

    const columns = Object.keys(rows[0]).map((key) => {
      const { group, title } = splitHeaderLabel(key);
      return {
        key,
        group,
        title,
        fullLabel: key
      };
    });

    const orderedDataColumns = sortDataColumns(columns.slice(1));

    return {
      firstColumn: columns[0] || null,
      secondColumn: columns[1] || null,
      dataColumns: orderedDataColumns,
      headerGroups: buildHeaderGroups(orderedDataColumns)
    };
  }, [rows]);

  const summaryRow = useMemo(() => {
    if (!rows.length || !firstColumn || !dataColumns.length) {
      return null;
    }

    const latestRow = getLatestRowByMonth(rows, firstColumn.key) || rows[rows.length - 1];
    const mainBusinessIncomeColumn = dataColumns.find((column) => isMainBusinessIncomeColumn(column));
    const mainBusinessIncomeTotal = mainBusinessIncomeColumn ? getNumericTotal(rows, mainBusinessIncomeColumn.key) : 0;

    const summary = {
      [firstColumn.key]: '合计'
    };

    dataColumns.forEach((column) => {
      if (isOperatingStoreCountColumn(column)) {
        summary[column.key] = '';
        return;
      }
      if (isRatioColumn(column)) {
        const amountLabel = column.fullLabel.replace(/比例$/, '');
        const amountColumn = dataColumns.find((item) => item.fullLabel === amountLabel);
        const amountTotal = amountColumn ? getNumericTotal(rows, amountColumn.key) : 0;

        summary[column.key] = mainBusinessIncomeTotal === 0 ? 0 : amountTotal / mainBusinessIncomeTotal;
        return;
      }

      if (isLatestMonthValueColumn(column)) {
        summary[column.key] = isNumericValue(latestRow?.[column.key]) ? Number(latestRow[column.key]) : null;
        return;
      }

      if (isAverageColumn(column)) {
        summary[column.key] = getAverageValue(rows, column.key);
        return;
      }

      if (isAmountColumn(column)) {
        summary[column.key] = getNumericTotal(rows, column.key);
        return;
      }

      summary[column.key] = isNumericValue(latestRow?.[column.key]) ? Number(latestRow[column.key]) : latestRow?.[column.key] || '-';
    });

    return summary;
  }, [dataColumns, firstColumn, rows]);

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

  if (!firstColumn || rows.length === 0) {
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
        <div className="mt-2 text-sm text-gray-500 text-left">{statsPeriodLabel}</div>
        <div className="mt-2 text-sm text-gray-500 text-left">单位：万元</div>
      </div>

      <div className="overflow-x-auto max-h-[800px] overflow-y-auto">
        <table className="w-full text-sm text-center text-gray-700 relative">
          <thead className="bg-gray-50 text-xs text-gray-600 sticky top-0 z-20 shadow-sm">
            <tr>
              <th
                rowSpan={2}
                className="px-6 py-2 font-bold sticky bg-gray-50 z-30 text-center border-b border-gray-300"
                style={{ ...getFrozenColumnStyle(0), boxShadow: FROZEN_DIVIDER_SHADOW }}
              >
                {firstColumn.title}
              </th>
              {headerGroups.map((group, index) => (
                <th
                  key={`${group.title}-${index}`}
                  colSpan={group.columns.length}
                  rowSpan={group.isGroup ? 1 : 2}
                  className={`px-6 py-2 font-bold whitespace-nowrap min-w-[140px] text-center border-b border-r border-gray-300 ${
                    secondColumn && !group.isGroup && group.columns[0]?.key === secondColumn.key
                      ? `sticky z-30 ${getFrozenHeaderBgClass('bg-gray-50')} border-r-0`
                      : group.isGroup
                        ? 'bg-gray-100'
                        : 'bg-gray-50'
                  }`}
                  style={
                    secondColumn && !group.isGroup && group.columns[0]?.key === secondColumn.key
                      ? { ...getFrozenColumnStyle(FROZEN_COLUMN_WIDTH), boxShadow: FROZEN_DIVIDER_SHADOW }
                      : undefined
                  }
                >
                  {group.title}
                </th>
              ))}
            </tr>
            <tr>
              {headerGroups
                .filter((group) => group.isGroup)
                .flatMap((group) =>
                  group.columns.map((column) => (
                    <th
                      key={column.key}
                      className={`px-6 py-2 font-bold whitespace-nowrap min-w-[140px] text-center border-r border-gray-300 bg-gray-50 ${
                        secondColumn?.key === column.key
                          ? `sticky z-30 ${getFrozenHeaderBgClass('bg-gray-50')} border-r-0`
                          : ''
                      }`}
                      style={
                        secondColumn?.key === column.key
                          ? { ...getFrozenColumnStyle(FROZEN_COLUMN_WIDTH), boxShadow: FROZEN_DIVIDER_SHADOW }
                          : undefined
                      }
                    >
                      {column.title}
                    </th>
                  ))
                )}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, rowIndex) => {
              const rowBgClass = rowIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50';

              return (
                <tr key={`${row[firstColumn.key]}-${rowIndex}`} className={`${rowBgClass} hover:bg-gray-50 transition-colors`}>
                  <td
                    className={`px-6 py-2 font-medium text-center align-middle sticky z-20 text-gray-700 border-b border-gray-300 ${rowBgClass}`}
                    style={{ ...getFrozenColumnStyle(0), boxShadow: FROZEN_DIVIDER_SHADOW }}
                  >
                    {formatValue(row[firstColumn.key], firstColumn)}
                  </td>
                  {headerGroups.map((group) =>
                    group.columns.map((column, columnIndex) => {
                      const value = row[column.key];
                      const isNumeric = isNumericValue(value);
                      const isNegative = isNumeric && Number(value) < 0;
                      const isSecondFrozenColumn = secondColumn?.key === column.key;

                      return (
                        <td
                          key={`${rowIndex}-${column.key}`}
                          className={`px-6 py-2 whitespace-nowrap text-center align-middle border-b border-gray-300 text-black ${
                            isSecondFrozenColumn ? `sticky z-10 ${rowBgClass} border-r-0` : 'border-r border-gray-300'
                          }`}
                          style={
                            isSecondFrozenColumn
                              ? { ...getFrozenColumnStyle(FROZEN_COLUMN_WIDTH), boxShadow: FROZEN_DIVIDER_SHADOW_SOFT }
                              : undefined
                          }
                        >
                          {formatValue(value, column)}
                        </td>
                      );
                    })
                  )}
                </tr>
              );
            })}
            {summaryRow && (
              <tr className="bg-amber-50 font-semibold">
                <td
                  className="px-6 py-2 text-center align-middle sticky z-20 text-gray-800 bg-amber-50 border-b border-gray-300"
                  style={{ ...getFrozenColumnStyle(0), boxShadow: FROZEN_DIVIDER_SHADOW }}
                >
                  {summaryRow[firstColumn.key]}
                </td>
                {headerGroups.map((group) =>
                  group.columns.map((column) => {
                    const value = summaryRow[column.key];
                    const isNumeric = isNumericValue(value);
                    const isNegative = isNumeric && Number(value) < 0;
                    const isSecondFrozenColumn = secondColumn?.key === column.key;

                    return (
                      <td
                        key={`summary-${column.key}`}
                        className={`px-6 py-2 whitespace-nowrap text-center align-middle border-b border-gray-300 text-black ${
                          isSecondFrozenColumn ? 'sticky z-10 bg-amber-50 border-r-0' : 'border-r border-gray-300'
                        }`}
                        style={
                          isSecondFrozenColumn
                            ? { ...getFrozenColumnStyle(FROZEN_COLUMN_WIDTH), boxShadow: FROZEN_DIVIDER_SHADOW_SOFT }
                            : undefined
                        }
                      >
                        {formatValue(value, column)}
                      </td>
                    );
                  })
                )}
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default StoreDataStatistics2026Table;
