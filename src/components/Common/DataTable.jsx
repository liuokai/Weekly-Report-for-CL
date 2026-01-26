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
  maxHeight // 新增：支持自定义最大高度，启用内部滚动
}) => {
  if (!data || data.length === 0) {
    if (hideNoDataMessage) return null;
    return <div className="text-center py-4 text-gray-500">暂无数据</div>;
  }

  const theadClass = `bg-gray-50 ${stickyHeader ? 'sticky top-0 z-10' : ''}`;
  
  // 容器样式：如果提供了 maxHeight，则启用纵向滚动
  const containerStyle = maxHeight ? { maxHeight, overflowY: 'auto' } : {};

  return (
    <div className="overflow-x-auto" style={containerStyle}>
      <table className="min-w-full divide-y divide-gray-200">
        <thead className={theadClass}>
          <tr>
            {columns.map(column => (
              (() => {
                const align = column.align || 'left';
                const thAlignClass = align === 'right' ? 'text-right' : 'text-left';
                const thBase = `px-6 py-3 ${thAlignClass} text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap group`;
                const thInteractive = onSort ? 'cursor-pointer hover:bg-gray-100 select-none' : '';
                const headerFlexClass = `flex items-center space-x-1 ${align === 'right' ? 'justify-end' : ''}`;
                return (
              <th 
                key={column.key} 
                className={`${thBase} ${thInteractive}`}
                onClick={() => onSort && onSort(column.key)}
              >
                <div className={headerFlexClass}>
                  <span>{column.title}</span>
                  {sortConfig && sortConfig.key === column.key && (
                    <span className="text-[#a40035]">
                      {sortConfig.direction === 'asc' ? '▲' : '▼'}
                    </span>
                  )}
                  {onSort && (!sortConfig || sortConfig.key !== column.key) && (
                    <span className="text-gray-300 opacity-0 group-hover:opacity-100">
                      ↕
                    </span>
                  )}
                </div>
              </th>
                );
              })()
            ))}
          </tr>
          {summaryRow && (
            <tr className="bg-white border-b border-gray-200 font-bold shadow-sm">
              {columns.map(column => (
                <td
                  key={column.key}
                  className={`px-6 py-4 whitespace-nowrap text-sm text-gray-900 ${column.align === 'right' ? 'text-right' : 'text-left'}`}
                >
                  {column.render ? column.render(summaryRow[column.dataIndex], summaryRow, -1) : (summaryRow[column.dataIndex] || '-')}
                </td>
              ))}
            </tr>
          )}
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {data.map((row, index) => (
            <tr key={getKey(row, index)}>
              {columns.map(column => (
                <td
                  key={column.key}
                  className={`px-6 py-4 whitespace-nowrap text-sm text-gray-500 ${column.align === 'right' ? 'text-right' : 'text-left'}`}
                >
                  {column.render ? column.render(row[column.dataIndex], row, index) : (row[column.dataIndex] || '-')}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default DataTable;
