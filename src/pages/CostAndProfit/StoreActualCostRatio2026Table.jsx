import React, { useEffect, useMemo, useRef, useState } from 'react';
import useFetchData from '../../hooks/useFetchData';

const TABLE_TITLE = '2026年门店实际成本占比情况';

const GROUP_ORDER = ['总部提取管理费', '人工成本', '固定成本', '变动成本', '利润率'];
const VARIABLE_COST_COLUMN_ORDER = ['物资成本', '税金', '资产维护', '水电费', '其他', '小计'];

const MONTH_OPTIONS = Array.from({ length: 12 }, (_, index) => {
  const month = String(index + 1).padStart(2, '0');
  return `2026-${month}`;
});

const QUARTER_OPTIONS = ['2026Q1', '2026Q2', '2026Q3', '2026Q4'];

const SelectorDropdown = ({ options, value, onChange, placeholder, minWidth = '130px' }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;

    const handler = (event) => {
      if (ref.current && !ref.current.contains(event.target)) {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handler);
    return () => {
      document.removeEventListener('mousedown', handler);
    };
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="px-3 py-1.5 rounded-lg bg-gray-100 border border-gray-200 text-sm font-medium text-gray-700 flex items-center gap-2 justify-between"
        style={{ minWidth }}
      >
        <span className="truncate">{value || placeholder}</span>
        <svg className={`w-4 h-4 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-48 max-h-60 overflow-y-auto bg-gray-100 border border-gray-200 rounded-lg shadow-lg z-50">
          {options.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => {
                onChange(option);
                setOpen(false);
              }}
              className={`w-full text-left px-3 py-2 hover:bg-gray-200 ${value === option ? 'text-[#a40035] font-semibold' : 'text-gray-700'}`}
            >
              {option}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

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

const QUARTER_TO_MONTH_RANGE = {
  '2026Q1': ['2026-01', '2026-03'],
  '2026Q2': ['2026-04', '2026-06'],
  '2026Q3': ['2026-07', '2026-09'],
  '2026Q4': ['2026-10', '2026-12']
};

const buildQueryParams = (viewMode, startMonth, endMonth, quarter) => {
  if (viewMode === 'quarter') {
    return QUARTER_TO_MONTH_RANGE[quarter] || ['2026-01', '2026-03'];
  }

  return [startMonth, endMonth];
};

const StoreActualCostRatio2026Table = ({
  viewMode = 'month',
  startMonth = '2026-01',
  endMonth = MONTH_OPTIONS[MONTH_OPTIONS.length - 1],
  selectedQuarter = '2026Q1',
  onViewModeChange,
  onStartMonthChange,
  onEndMonthChange,
  onSelectedQuarterChange,
  queryParams: queryParamsProp
}) => {
  const [hasRequested, setHasRequested] = useState(false);
  const tableViewportRef = useRef(null);
  const [emptyStateMinHeight, setEmptyStateMinHeight] = useState(420);

  const startMonthOptions = useMemo(
    () => MONTH_OPTIONS.filter((option) => option <= endMonth),
    [endMonth]
  );

  const endMonthOptions = useMemo(
    () => MONTH_OPTIONS.filter((option) => option >= startMonth),
    [startMonth]
  );

  useEffect(() => {
    if (startMonth > endMonth) {
      onEndMonthChange?.(startMonth);
    }
  }, [endMonth, onEndMonthChange, startMonth]);

  const queryParams = useMemo(
    () => queryParamsProp || buildQueryParams(viewMode, startMonth, endMonth, selectedQuarter),
    [endMonth, queryParamsProp, selectedQuarter, startMonth, viewMode]
  );
  const queryParamsKey = JSON.stringify(queryParams);

  const citySortOrder = ['四川', '重庆', '深圳', '杭州', '南京', '宁波', '广州', '上海', '北京', '合计'];
  const normalizeCityForSort = (value) => {
    const text = String(value || '').trim();
    if (text === '合计' || text === '汇总') return '合计';
    return text.replace(/(省|市|区)$/, '');
  };

  const { data: rowsRaw, loading, error, fetchData } = useFetchData(
    'getCashFlowOverviewCityMonthly',
    [],
    [],
    { manual: true }
  );
  const rows = Array.isArray(rowsRaw) ? rowsRaw : [];

  useEffect(() => {
    let active = true;

    setHasRequested(false);

    Promise.resolve(fetchData(queryParams)).finally(() => {
      if (active) {
        setHasRequested(true);
      }
    });

    return () => {
      active = false;
    };
  }, [fetchData, queryParamsKey]);

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

  const tableRows = useMemo(() => {
    if (!firstColumn) return [];

    const mappedRows = rows.map((row, index) => ({
      ...row,
      isSummary: String(row[firstColumn.key] || '').trim() === '合计',
      __originalIndex: index
    }));

    mappedRows.sort((a, b) => {
      const aIndex = citySortOrder.indexOf(normalizeCityForSort(a[firstColumn.key]));
      const bIndex = citySortOrder.indexOf(normalizeCityForSort(b[firstColumn.key]));

      if (aIndex !== bIndex) {
        return (aIndex === -1 ? 999 : aIndex) - (bIndex === -1 ? 999 : bIndex);
      }

      if (a.isSummary === b.isSummary) {
        return a.__originalIndex - b.__originalIndex;
      }
      return a.isSummary ? 1 : -1;
    });

    return mappedRows.map(({ __originalIndex, ...row }) => row);
  }, [rows, firstColumn]);

  const hasTableData = Boolean(firstColumn) && tableRows.length > 0;
  const isWaitingForResult = !hasRequested || loading;
  const showEmptyState = hasRequested && !loading && !error && !hasTableData;
  const showErrorState = hasRequested && !loading && Boolean(error);
  const tableViewportStyle = hasTableData ? undefined : { minHeight: `${emptyStateMinHeight}px` };

  useEffect(() => {
    if (!hasTableData || !tableViewportRef.current) return;

    const nextHeight = Math.ceil(tableViewportRef.current.getBoundingClientRect().height);
    if (nextHeight > 0 && nextHeight !== emptyStateMinHeight) {
      setEmptyStateMinHeight(nextHeight);
    }
  }, [emptyStateMinHeight, hasTableData, tableRows.length, viewMode]);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-6">
      <div className="p-6 border-b border-gray-100 bg-gray-50/50">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
              <span className="w-1 h-5 bg-[#a40035] rounded-full"></span>
              {TABLE_TITLE}
            </h3>
            <div className="mt-2 text-sm text-gray-500 text-left">占比=成本项/门店营业额</div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-end xl:min-w-[460px]">
            <div className="flex bg-gray-100 p-1 rounded-lg">
              <button
                type="button"
                onClick={() => onViewModeChange?.('month')}
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
                onClick={() => onViewModeChange?.('quarter')}
                className={`px-3 py-1 text-sm font-medium rounded-md transition-all ${
                  viewMode === 'quarter'
                    ? 'bg-white text-[#a40035] shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                季度
              </button>
            </div>

            <div className="flex flex-wrap gap-3 sm:min-w-[290px] sm:justify-end">
              {viewMode === 'month' ? (
                <>
                  <SelectorDropdown
                    options={startMonthOptions}
                    value={startMonth}
                    onChange={onStartMonthChange}
                    placeholder="开始月份"
                  />
                  <SelectorDropdown
                    options={endMonthOptions}
                    value={endMonth}
                    onChange={onEndMonthChange}
                    placeholder="结束月份"
                  />
                </>
              ) : (
                <SelectorDropdown
                  options={QUARTER_OPTIONS}
                  value={selectedQuarter}
                  onChange={onSelectedQuarterChange}
                  placeholder="选择季度"
                />
              )}
            </div>
          </div>
        </div>
      </div>

      <div
        ref={tableViewportRef}
        className="relative overflow-x-auto max-h-[800px] overflow-y-auto"
        style={tableViewportStyle}
      >
        {hasTableData && (
          <table className="w-full text-sm text-center text-black relative">
            <thead className="bg-gray-50 text-xs text-gray-600 sticky top-0 z-20 shadow-sm">
              <tr>
                <th
                  rowSpan={2}
                  className="px-6 py-2 font-bold sticky left-0 bg-gray-50 z-30 border-r border-b border-gray-300 min-w-[120px] whitespace-nowrap shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]"
                >
                  {firstColumn.title}
                </th>
                {headerGroups.map((group) => (
                  <th
                    key={group.title}
                    colSpan={group.columns.length}
                    rowSpan={group.isGroup ? 1 : 2}
                    className={`px-6 py-2 font-bold whitespace-nowrap min-w-[120px] text-center border-b border-r border-gray-300 ${
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
            <tbody>
              {tableRows.map((row, rowIndex) => {
                const isSummary = row.isSummary;
                const rowBgClass = isSummary ? 'bg-red-50 font-bold' : rowIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50';
                const stickyBgClass = isSummary ? 'bg-red-50 text-black' : `${rowBgClass} text-black`;

                return (
                  <tr key={`${row[firstColumn.key]}-${rowIndex}`} className={`${rowBgClass} ${isSummary ? '' : 'hover:bg-gray-50 transition-colors'}`}>
                    <td
                      className={`px-6 py-2 font-medium sticky left-0 z-10 border-r border-b border-gray-300 min-w-[120px] whitespace-nowrap ${stickyBgClass} shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]`}
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
                            className={`px-6 py-2 border-r border-b border-gray-300 whitespace-nowrap ${rowBgClass} ${
                              isNegativeProfitRate ? 'text-[#A40035]' : 'text-black'
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
        )}

        {isWaitingForResult && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/75 backdrop-blur-[1px]">
            <div className="text-sm text-gray-500">加载中...</div>
          </div>
        )}

        {showEmptyState && (
          <div className="absolute inset-0 flex items-center justify-center bg-white">
            <div className="text-sm text-gray-500">暂无数据</div>
          </div>
        )}

        {showErrorState && (
          <div className="absolute inset-0 flex items-center justify-center bg-white">
            <div className="text-sm text-red-500">加载失败: {error}</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StoreActualCostRatio2026Table;
