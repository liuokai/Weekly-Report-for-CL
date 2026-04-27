import React from 'react';

const DataTable = ({
  data,
  columns,
  getKey = (item, index) => index,
  stickyHeader = true,
  hideNoDataMessage = false,
  onSort,
  sortConfig,
  summaryRow,
  summaryPosition = 'top',
  summaryClassName = 'bg-white font-bold shadow-sm',
  maxHeight,
  bordered = false,
}) => {
  if (!data || data.length === 0) {
    if (hideNoDataMessage) return null;
    return <div className="text-center py-4 text-gray-500">暂无数据</div>;
  }

  const theadClass = `bg-gray-50 ${stickyHeader ? 'sticky top-0 z-10' : ''}`;
  const tableClassName = bordered
    ? 'min-w-full table-fixed border-collapse border border-gray-300'
    : 'min-w-full divide-y divide-gray-200 table-fixed';
  const headerCellClassName = bordered
    ? 'px-3 py-2 text-center text-xs font-semibold text-gray-600 whitespace-nowrap group border border-gray-300'
    : 'px-3 py-2 text-center text-xs font-semibold text-gray-600 whitespace-nowrap group';
  const bodyCellClassName = bordered
    ? 'px-3 py-2 whitespace-nowrap text-sm text-gray-700 text-center border border-gray-200'
    : 'px-3 py-2 whitespace-nowrap text-sm text-gray-700 text-center';
  const summaryCellClassName = bordered
    ? 'px-3 py-2 whitespace-nowrap text-sm text-gray-700 text-center border border-gray-300'
    : 'px-3 py-2 whitespace-nowrap text-sm text-gray-700 text-center';

  const containerStyle = maxHeight ? { maxHeight, overflowY: 'auto' } : {};

  return (
    <div className="overflow-x-auto" style={containerStyle}>
      <table className={tableClassName}>
        <colgroup>
          {columns.map((column) => (
            <col key={column.key} style={{ width: column.width || `${Math.floor(100 / columns.length)}%` }} />
          ))}
        </colgroup>
        <thead className={theadClass}>
          <tr>
            {columns.map((column) => {
              const thInteractive = onSort ? 'cursor-pointer hover:bg-gray-100 select-none' : '';
              return (
                <th
                  key={column.key}
                  className={`${headerCellClassName} ${thInteractive}`}
                  onClick={() => onSort && onSort(column.key)}
                >
                  <div className="flex w-full items-center">
                    <span className="w-4 shrink-0" aria-hidden="true" />
                    <span className="block flex-1 text-center">{column.title}</span>
                    <span className="w-4 shrink-0 text-right text-[#a40035]">
                      {sortConfig && sortConfig.key === column.key
                        ? (sortConfig.direction === 'asc' ? '\u2191' : '\u2193')
                        : ''}
                    </span>
                    {onSort && (!sortConfig || sortConfig.key !== column.key) && (
                      <span className="absolute right-0 w-4 text-right text-gray-500 opacity-0 group-hover:opacity-100">
                        {'\u2195'}
                      </span>
                    )}
                  </div>
                </th>
              );
            })}
          </tr>
          {summaryRow && summaryPosition === 'top' && (
            <tr className={`border-b border-gray-200 ${summaryClassName}`}>
              {columns.map((column) => (
                <td key={column.key} className={summaryCellClassName}>
                  {column.render ? column.render(summaryRow[column.dataIndex], summaryRow, -1) : (summaryRow[column.dataIndex] || '-')}
                </td>
              ))}
            </tr>
          )}
        </thead>
        <tbody className={bordered ? '' : 'bg-white divide-y divide-gray-200'}>
          {data.map((row, index) => (
            <tr key={getKey(row, index)} className={bordered ? (index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50') : ''}>
              {columns.map((column) => (
                <td key={column.key} className={bodyCellClassName}>
                  {column.render ? column.render(row[column.dataIndex], row, index) : (row[column.dataIndex] || '-')}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
        {summaryRow && summaryPosition === 'bottom' && (
          <tfoot className="sticky bottom-0 z-10">
            <tr className={`border-t border-gray-200 ${summaryClassName}`}>
              {columns.map((column) => (
                <td key={column.key} className={summaryCellClassName}>
                  {column.render ? column.render(summaryRow[column.dataIndex], summaryRow, -1) : (summaryRow[column.dataIndex] || '-')}
                </td>
              ))}
            </tr>
          </tfoot>
        )}
      </table>
    </div>
  );
};

export default DataTable;
