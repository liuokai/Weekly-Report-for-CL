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
    ? 'relative px-3 py-2 text-center text-xs font-semibold text-gray-600 whitespace-nowrap group border border-gray-300'
    : 'relative px-3 py-2 text-center text-xs font-semibold text-gray-600 whitespace-nowrap group';
  const bodyCellClassName = bordered
    ? 'px-3 py-2 whitespace-nowrap text-sm text-gray-700 text-center border border-gray-200'
    : 'px-3 py-2 whitespace-nowrap text-sm text-gray-700 text-center';
  const summaryCellClassName = bordered
    ? 'px-3 py-2 whitespace-nowrap text-sm text-gray-700 text-center border border-gray-300'
    : 'px-3 py-2 whitespace-nowrap text-sm text-gray-700 text-center';
  const resolveClassName = (className, value, row, index) =>
    typeof className === 'function' ? className(value, row, index) : (className || '');

  const containerStyle = maxHeight ? { maxHeight, overflowY: 'auto' } : {};
  const groupedHeader = columns.some((column) => column.groupTitle);

  return (
    <div className="overflow-x-auto" style={containerStyle}>
      <table className={tableClassName}>
        <colgroup>
          {columns.map((column) => (
            <col key={column.key} style={{ width: column.width || `${Math.floor(100 / columns.length)}%` }} />
          ))}
        </colgroup>
        <thead className={theadClass}>
          {groupedHeader ? (
            <>
              <tr>
                {(() => {
                  const groups = [];
                  columns.forEach((column) => {
                    const title = column.groupTitle || column.title;
                    const lastGroup = groups[groups.length - 1];
                    if (lastGroup && lastGroup.title === title) {
                      lastGroup.columns.push(column);
                    } else {
                      groups.push({ title, columns: [column] });
                    }
                  });

                  return groups.map((group) => {
                    const isSingle = group.columns.length === 1 && !group.columns[0].groupTitle;
                    const groupClassName = isSingle
                      ? resolveClassName(group.columns[0].headerClassName)
                      : resolveClassName(group.columns[0].groupHeaderClassName || group.columns[0].headerClassName);
                    return (
                      <th
                        key={`group-${group.title}`}
                        colSpan={isSingle ? 1 : group.columns.length}
                        rowSpan={isSingle ? 2 : 1}
                        className={`${headerCellClassName} ${groupClassName}`}
                      >
                        <div className="flex w-full items-center justify-center">
                          <span className="block text-center">{group.title}</span>
                        </div>
                      </th>
                    );
                  });
                })()}
              </tr>
              <tr>
                {columns
                  .filter((column) => column.groupTitle)
                  .map((column) => {
                    const thInteractive = onSort ? 'cursor-pointer hover:bg-gray-100 select-none' : '';
                    return (
                      <th
                        key={column.key}
                        className={`${headerCellClassName} ${thInteractive} ${resolveClassName(column.headerClassName)}`}
                        onClick={() => onSort && onSort(column.key)}
                      >
                        <div className="flex w-full items-center justify-center">
                          <span className="block text-center">{column.title}</span>
                        </div>
                        {sortConfig && sortConfig.key === column.key && (
                          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[#a40035]">
                            {sortConfig.direction === 'asc' ? '\u2191' : '\u2193'}
                          </span>
                        )}
                        {onSort && (!sortConfig || sortConfig.key !== column.key) && (
                          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 opacity-0 group-hover:opacity-100">
                            {'\u2195'}
                          </span>
                        )}
                      </th>
                    );
                  })}
              </tr>
            </>
          ) : (
            <tr>
              {columns.map((column) => {
                const thInteractive = onSort ? 'cursor-pointer hover:bg-gray-100 select-none' : '';
                return (
                  <th
                    key={column.key}
                    className={`${headerCellClassName} ${thInteractive} ${resolveClassName(column.headerClassName)}`}
                    onClick={() => onSort && onSort(column.key)}
                  >
                    <div className="flex w-full items-center justify-center">
                      <span className="block text-center">{column.title}</span>
                    </div>
                    {sortConfig && sortConfig.key === column.key && (
                      <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[#a40035]">
                        {sortConfig.direction === 'asc' ? '\u2191' : '\u2193'}
                      </span>
                    )}
                    {onSort && (!sortConfig || sortConfig.key !== column.key) && (
                      <span className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 opacity-0 group-hover:opacity-100">
                        {'\u2195'}
                      </span>
                    )}
                  </th>
                );
              })}
            </tr>
          )}
          {summaryRow && summaryPosition === 'top' && (
            <tr className={`border-b border-gray-200 ${summaryClassName}`}>
              {columns.map((column) => (
                <td
                  key={column.key}
                  className={`${summaryCellClassName} ${resolveClassName(column.summaryCellClassName, summaryRow[column.dataIndex], summaryRow, -1)}`}
                >
                  {column.render ? column.render(summaryRow[column.dataIndex], summaryRow, -1) : (summaryRow[column.dataIndex] || '-')}
                </td>
              ))}
            </tr>
          )}
        </thead>
        <tbody className={bordered ? '' : 'bg-white divide-y divide-gray-200'}>
          {data.map((row, index) => (
            <tr key={getKey(row, index)} className={bordered ? (index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50') : ''}>
              {columns.map((column) => {
                const cellProps = column.onCell ? (column.onCell(row, index) || {}) : {};
                const { rowSpan, colSpan, className: cellClassName, ...restCellProps } = cellProps;

                if (rowSpan === 0 || colSpan === 0) {
                  return null;
                }

                return (
                  <td
                    key={column.key}
                    rowSpan={rowSpan}
                    colSpan={colSpan}
                    className={`${bodyCellClassName} ${resolveClassName(column.cellClassName, row[column.dataIndex], row, index)} ${cellClassName || ''}`}
                    {...restCellProps}
                  >
                    {column.render ? column.render(row[column.dataIndex], row, index) : (row[column.dataIndex] || '-')}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
        {summaryRow && summaryPosition === 'bottom' && (
          <tfoot className="sticky bottom-0 z-10">
            <tr className={`border-t border-gray-200 ${summaryClassName}`}>
              {columns.map((column) => (
                <td
                  key={column.key}
                  className={`${summaryCellClassName} ${resolveClassName(column.summaryCellClassName, summaryRow[column.dataIndex], summaryRow, -1)}`}
                >
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
