import React from 'react';

const DataTable = ({ data, columns, getKey = (item, index) => index, stickyHeader = true }) => {
  if (!data || data.length === 0) {
    return <div className="text-center py-4 text-gray-500">暂无数据</div>;
  }

  const theadClass = `bg-gray-50 ${stickyHeader ? 'sticky top-0' : ''}`;

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className={theadClass}>
          <tr>
            {columns.map(column => (
              <th 
                key={column.key} 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap"
              >
                {column.title}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {data.map((row, index) => (
            <tr key={getKey(row, index)}>
              {columns.map(column => (
                <td key={column.key} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
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
