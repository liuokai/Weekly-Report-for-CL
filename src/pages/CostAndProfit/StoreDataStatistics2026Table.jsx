import React, { useMemo } from 'react';
import useFetchData from '../../hooks/useFetchData';

const TABLE_TITLE = '2026年门店数据统计';

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

const isNumericValue = (value) => typeof value === 'number' || (value !== null && value !== '' && !Number.isNaN(Number(value)));

const formatValue = (value, column) => {
  if (value === null || value === undefined || value === '') {
    return '-';
  }

  if (!isNumericValue(value)) {
    return String(value);
  }

  const numberValue = Number(value);

  if (column.fullLabel.includes('比例')) {
    return `${(numberValue * 100).toFixed(2)}%`;
  }

  if (column.fullLabel.includes('回收期')) {
    return numberValue.toLocaleString('zh-CN', {
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
      </div>

      <div className="overflow-x-auto max-h-[800px] overflow-y-auto">
        <table className="w-full text-sm text-center text-gray-700 relative">
          <thead className="bg-gray-50 text-xs text-gray-600 sticky top-0 z-20 shadow-sm">
            <tr>
              <th
                rowSpan={2}
                className="px-6 py-4 font-bold sticky left-0 bg-gray-50 z-30 border-r border-gray-300 min-w-[140px] shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] text-center"
              >
                {firstColumn.title}
              </th>
              {headerGroups.map((group, index) => (
                <th
                  key={`${group.title}-${index}`}
                  colSpan={group.columns.length}
                  rowSpan={group.isGroup ? 1 : 2}
                  className={`px-6 py-4 font-semibold whitespace-nowrap min-w-[140px] text-center border-b border-r border-gray-300 ${
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
                      className="px-6 py-3 font-medium whitespace-nowrap min-w-[140px] text-center border-r border-gray-300 bg-gray-50"
                    >
                      {column.title}
                    </th>
                  ))
                )}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rows.map((row, rowIndex) => {
              const rowBgClass = rowIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50';

              return (
                <tr key={`${row[firstColumn.key]}-${rowIndex}`} className={`${rowBgClass} hover:bg-gray-50 transition-colors`}>
                  <td
                    className={`px-6 py-4 font-medium text-center align-middle sticky left-0 z-10 border-r border-gray-300 text-gray-700 ${rowBgClass} shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]`}
                  >
                    {formatValue(row[firstColumn.key], firstColumn)}
                  </td>
                  {headerGroups.map((group) =>
                    group.columns.map((column, columnIndex) => {
                      const value = row[column.key];
                      const isNumeric = isNumericValue(value);
                      const isNegative = isNumeric && Number(value) < 0;
                      const isLastInGroup = columnIndex === group.columns.length - 1;

                      return (
                        <td
                          key={`${rowIndex}-${column.key}`}
                          className={`px-6 py-4 whitespace-nowrap text-center align-middle ${
                            isNumeric ? 'font-mono' : ''
                          } ${isNegative ? 'text-red-500' : 'text-gray-700'} border-r border-gray-300`}
                        >
                          {formatValue(value, column)}
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

export default StoreDataStatistics2026Table;
