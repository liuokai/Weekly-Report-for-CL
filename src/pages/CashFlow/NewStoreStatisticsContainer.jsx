import React, { useMemo } from 'react';
import useFetchData from '../../hooks/useFetchData';

/**
 * 新店数量统计容器组件
 * 数据来源：cash_flow_dws_new_store_statistics_year.sql
 * 展示年度维度各城市新开、闭店、净增、年末门店数、目标对照
 */
const NewStoreStatisticsContainer = () => {
  const { data, loading } = useFetchData('getNewStoreStatisticsYear');

  // 城市列表
  const cities = ['合计', '上海', '北京', '南京', '四川', '宁波', '广州', '杭州', '深圳', '重庆'];

  // 新开子列（目标 + 实际）
  const newOpenCols = [
    { key: '新店目标', label: '目标' },
    { key: '新开店',   label: '实际' },
  ];

  // 其余单列
  const singleCols = [
    { key: '闭店',       label: '闭店' },
    { key: '年末门店数',  label: '年末数' },
    { key: '净增',       label: '净增' },
    { key: '对照目标',   label: '目标对照' },
  ];

  // 所有子列（用于数据行渲染）
  const subCols = [...newOpenCols, ...singleCols];

  const currentYear = new Date().getFullYear();

  // 计算合计行
  const summaryRow = useMemo(() => {
    if (!data || data.length === 0) return {};
    const result = {};
    cities.forEach(city => {
      subCols.forEach(col => {
        const key = `${city}_${col.key}`;
        result[key] = data.reduce((sum, row) => sum + (Number(row[key]) || 0), 0);
      });
    });
    return result;
  }, [data]);

  // 目标对照列着色
  const getTargetCompareStyle = (val) => {
    const n = Number(val);
    if (n > 0) return { color: '#16a34a', fontWeight: 600 };
    if (n < 0) return { color: '#a40035', fontWeight: 600 };
    return {};
  };

  const cellStyle = {
    padding: '6px 8px',
    textAlign: 'center',
    fontSize: '12px',
    borderRight: '1px solid #e5e7eb',
    borderBottom: '1px solid #e5e7eb',
    whiteSpace: 'nowrap',
  };
  const headerCellStyle = {
    ...cellStyle,
    background: '#f3f4f6',
    color: '#111827',
    fontWeight: 700,
  };
  const groupHeaderStyle = {
    ...headerCellStyle,
    borderBottom: '1px solid #d1d5db',
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-100 mb-6">
      <div className="px-6 py-4 border-b border-gray-100 bg-[#a40035]/5 rounded-t-lg">
        <h2 className="text-lg font-bold text-[#a40035]">新店数量统计</h2>
      </div>
      <div className="p-6 pt-5 overflow-x-auto">
        {loading ? (
          <div className="flex items-center justify-center py-8 text-gray-400 text-sm">加载中...</div>
        ) : !data || data.length === 0 ? (
          <div className="flex items-center justify-center py-8 text-gray-400 text-sm">暂无数据</div>
        ) : (
          <table style={{ borderCollapse: 'collapse', width: '100%', tableLayout: 'auto' }}>
            <thead>
              {/* 第一行：时间 + 城市分组 */}
              <tr>
                <th rowSpan={3} style={{ ...headerCellStyle, minWidth: 64, verticalAlign: 'middle' }}>时间</th>
                {cities.map(city => (
                  <th key={city} colSpan={subCols.length} style={{ ...groupHeaderStyle, textAlign: 'center' }}>
                    {city}
                  </th>
                ))}
              </tr>
              {/* 第二行：新开（跨2列）+ 其余列（rowSpan=2） */}
              <tr>
                {cities.map(city => (
                  <React.Fragment key={city}>
                    <th colSpan={2} style={{ ...groupHeaderStyle, textAlign: 'center' }}>新开</th>
                    {singleCols.map(col => (
                      <th key={`${city}_${col.key}`} rowSpan={2} style={{ ...headerCellStyle, minWidth: 44, verticalAlign: 'middle' }}>
                        {col.label}
                      </th>
                    ))}
                  </React.Fragment>
                ))}
              </tr>
              {/* 第三行：目标 / 实际 */}
              <tr>
                {cities.map(city =>
                  newOpenCols.map(col => (
                    <th key={`${city}_${col.key}`} style={{ ...headerCellStyle, minWidth: 44 }}>
                      {col.label}
                    </th>
                  ))
                )}
              </tr>
            </thead>
            <tbody>
              {data.map((row, idx) => {
                const year = row['年度'];
                const isCurrentYear = String(year) === String(currentYear);
                const rowBg = isCurrentYear ? '#fff7ed' : (idx % 2 === 0 ? '#fff' : '#fafafa');
                return (
                  <tr key={year} style={{ background: rowBg, outline: isCurrentYear ? '2px solid #fb923c' : 'none', outlineOffset: '-1px' }}>
                    <td style={{ ...cellStyle, fontWeight: isCurrentYear ? 700 : 400, color: isCurrentYear ? '#ea580c' : '#374151' }}>
                      {year}年
                    </td>
                    {cities.map(city =>
                      subCols.map(col => {
                        const fieldKey = `${city}_${col.key}`;
                        const val = row[fieldKey];
                        const isCompare = col.key === '对照目标';
                        const displayVal = (val === null || val === undefined || val === '') ? '-' : val;
                        return (
                          <td key={fieldKey} style={{ ...cellStyle, ...(isCompare ? getTargetCompareStyle(val) : {}) }}>
                            {displayVal}
                          </td>
                        );
                      })
                    )}
                  </tr>
                );
              })}
              {/* 合计行 */}
              <tr style={{ background: '#f3f4f6', fontWeight: 700 }}>
                <td style={{ ...cellStyle, fontWeight: 700, color: '#111827' }}>合计</td>
                {cities.map(city =>
                  subCols.map(col => {
                    const fieldKey = `${city}_${col.key}`;
                    const val = summaryRow[fieldKey];
                    const isCompare = col.key === '对照目标';
                    return (
                      <td key={fieldKey} style={{ ...cellStyle, fontWeight: 700, ...(isCompare ? getTargetCompareStyle(val) : {}) }}>
                        {val || '-'}
                      </td>
                    );
                  })
                )}
              </tr>
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default NewStoreStatisticsContainer;
