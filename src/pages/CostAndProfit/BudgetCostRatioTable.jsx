import React from 'react';
import BusinessTargets from '../../config/businessTargets';

const { title: TABLE_TITLE, headerGroups: HEADER_GROUPS, rows: TABLE_ROWS } = BusinessTargets.profit.budgetCostRatioTable;

const BudgetCostRatioTable = () => {
  const citySortOrder = ['四川', '重庆', '深圳', '杭州', '南京', '宁波', '广州', '上海', '北京', '合计'];
  const normalizeCityForSort = (value) => {
    const text = String(value || '').trim();
    if (text === '合计') return text;
    return text.replace(/(省|市)$/, '');
  };
  const sortedRows = [...TABLE_ROWS].sort((a, b) => {
    const aIndex = citySortOrder.indexOf(normalizeCityForSort(a.city));
    const bIndex = citySortOrder.indexOf(normalizeCityForSort(b.city));
    return (aIndex === -1 ? 999 : aIndex) - (bIndex === -1 ? 999 : bIndex);
  });

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-6">
      <div className="p-6 border-b border-gray-100 bg-gray-50/50">
        <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
          <span className="w-1 h-5 bg-[#a40035] rounded-full"></span>
          {TABLE_TITLE}
        </h3>
      </div>

      <div className="overflow-x-auto max-h-[800px] overflow-y-auto">
        <table className="w-full text-sm text-center text-black relative">
          <thead className="bg-gray-50 text-xs text-gray-600 uppercase sticky top-0 z-20 shadow-sm">
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
            {sortedRows.map((row, rowIndex) => (
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
                  group.subHeaders.map((sub) => (
                    <td
                      key={`${row.city}-${sub.key}`}
                      className={`px-6 py-2 text-center whitespace-nowrap border-r border-b border-gray-300 ${row.isSummary ? 'bg-red-50' : rowIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50'} ${
                        row.isSummary ? 'text-[#a40035]' : 'text-black'
                      } ${sub.key === 'profit_rate' ? 'font-semibold' : ''}`}
                    >
                      {row[sub.key]}
                    </td>
                  ))
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default BudgetCostRatioTable;
