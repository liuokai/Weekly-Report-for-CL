import React, { useMemo } from 'react';
import useFetchData from '../../hooks/useFetchData';

const TABLE_TITLE = '2026年门店实际成本占比情况';

const GROUP_ORDER = ['总部提取管理费', '人工成本', '固定成本', '变动成本', '利润率'];

const VARIABLE_COST_COLUMN_ORDER = ['物资成本', '税金', '资产维护', '水电费', '其他', '小计'];

const splitHeaderLabel = (label) => {
  const text = String(label || '');

  if (text === '城市') {
    return { group: null, title: text };
  }

  if (text === '总部提取管理费' || text === '利润率') {
    return { group: null, title: text };
  }

  if (text.includes('-')) {
    const [group, ...rest] = text.split('-');
    return {
      group: group.trim(),
      title: rest.join('-').trim()
    };
  }

  if (text.endsWith('小计')) {
    if (text.startsWith('人工成本')) {
      return { group: '人工成本', title: '小计' };
    }
    if (text.startsWith('固定成本')) {
      return { group: '固定成本', title: '小计' };
    }
    if (text.startsWith('变动成本')) {
      return { group: '变动成本', title: '小计' };
    }
  }

  return { group: null, title: text };
};

const isNumericValue = (value) =>
  typeof value === 'number' || (value !== null && value !== '' && !Number.isNaN(Number(value)));

const formatPercent = (value) => `${(Number(value) * 100).toFixed(2)}%`;

const sortGroupColumns = (groupTitle, columns) => {
  if (groupTitle !== '变动成本') return columns;

  return [...columns].sort((a, b) => {
    const aIndex = VARIABLE_COST_COLUMN_ORDER.indexOf(a.title);
    const bIndex = VARIABLE_COST_COLUMN_ORDER.indexOf(b.title);
    return (aIndex === -1 ? 999 : aIndex) - (bIndex === -1 ? 999 : bIndex);
  });
};

const buildHeaderGroups = (columns) => {
  const groupsMap = new Map();

  columns.forEach((column) => {
    const groupKey = column.group || column.title;
    if (!groupsMap.has(groupKey)) {
      groupsMap.set(groupKey, {
        title: groupKey,
        isGroup: Boolean(column.group),
        columns: []
      });
    }
    groupsMap.get(groupKey).columns.push(column);
  });

  return Array.from(groupsMap.values())
    .map((group) => ({
      ...group,
      columns: sortGroupColumns(group.title, group.columns)
    }))
    .sort((a, b) => {
      const aIndex = GROUP_ORDER.indexOf(a.title);
      const bIndex = GROUP_ORDER.indexOf(b.title);
      return (aIndex === -1 ? 999 : aIndex) - (bIndex === -1 ? 999 : bIndex);
    });
};

const isNegativeProfitRateValue = (column, value) =>
  column.title === '利润率' && isNumericValue(value) && Number(value) < 0;

const StoreActualCostRatio2026Table = () => {
  const { data: rowsRaw, loading, error } = useFetchData('getCashFlowOverviewCityMonthly', [], []);
  const rows = Array.isArray(rowsRaw) ? rowsRaw : [];

  const { firstColumn, headerGroups } = useMemo(() => {
    if (!rows.length) {
      return { firstColumn: null, headerGroups: [] };
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

    return {
      firstColumn: columns[0] || null,
      headerGroups: buildHeaderGroups(columns.slice(1))
    };
  }, [rows]);

  const summaryRow = useMemo(() => {
    if (!rows.length || !firstColumn) return null;

    const summary = { [firstColumn.key]: '合计', isSummary: true };
    headerGroups.forEach((group) => {
      group.columns.forEach((column) => {
        const numericRows = rows
          .map((row) => row[column.key])
          .filter((value) => isNumericValue(value))
          .map((value) => Number(value));

        summary[column.key] = numericRows.length
          ? numericRows.reduce((sum, value) => sum + value, 0) / numericRows.length
          : null;
      });
    });

    return summary;
  }, [rows, firstColumn, headerGroups]);

  const tableRows = summaryRow ? [...rows, summaryRow] : rows;

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

  if (!firstColumn || !tableRows.length) {
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
          <thead className="bg-gray-50 text-sm text-gray-600 sticky top-0 z-20 shadow-sm">
            <tr>
              <th
                rowSpan={2}
                className="px-6 py-4 font-bold sticky left-0 bg-gray-50 z-30 border-r border-b border-gray-300 min-w-[120px] whitespace-nowrap shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]"
              >
                {firstColumn.title}
              </th>
              {headerGroups.map((group) => (
                <th
                  key={group.title}
                  colSpan={group.columns.length}
                  rowSpan={group.isGroup ? 1 : 2}
                  className={`px-6 py-4 font-bold whitespace-nowrap min-w-[120px] text-center border-b border-r border-gray-300 ${
                    group.isGroup ? 'bg-gray-100' : ''
                  }`}
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
                      className="px-6 py-2 font-bold whitespace-nowrap min-w-[86px] text-center bg-gray-50 border-b border-r border-gray-300 text-gray-600"
                    >
                      {column.title}
                    </th>
                  ))
                )}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {tableRows.map((row, rowIndex) => {
              const isSummary = row.isSummary;
              const rowBgClass = isSummary ? 'bg-red-50 font-bold' : 'hover:bg-gray-50 transition-colors';
              const stickyBgClass = isSummary ? 'bg-red-50 text-black' : 'bg-white text-black';

              return (
                <tr key={`${row[firstColumn.key]}-${rowIndex}`} className={rowBgClass}>
                  <td
                    className={`px-6 py-4 font-medium sticky left-0 z-10 border-r border-gray-300 min-w-[120px] whitespace-nowrap ${stickyBgClass} shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]`}
                  >
                    {row[firstColumn.key]}
                  </td>
                  {headerGroups.map((group) =>
                    group.columns.map((column) => {
                      const value = row[column.key];
                      const isNegativeProfitRate = isNegativeProfitRateValue(column, value);

                      return (
                        <td
                          key={`${rowIndex}-${column.key}`}
                          className={`px-6 py-4 border-r border-gray-300 font-mono whitespace-nowrap ${
                            isNegativeProfitRate ? 'text-red-500' : 'text-black'
                          }`}
                        >
                          {isNumericValue(value) ? formatPercent(value) : '-'}
                        </td>
                      );
                    })
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default StoreActualCostRatio2026Table;
