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
  const cities = ['合计', '四川','重庆','深圳','杭州','南京','宁波','广州','上海','北京'];

  

  // 新开子列（目标 + 实际）
  const newOpenCols = [
    { key: '新店目标', label: '目标' },
    { key: '新开店',   label: '实际' },
  ];

  // 其余单列
  const singleCols = [
    { key: '闭店',      label: '闭店' },
    { key: '年末门店数', label: '年末数' },
    { key: '净增',      label: '净增' },
    { key: '对照目标',  label: '目标对照' },
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
  const getCompareClass = (val) => {
    const n = Number(val);
    if (n < 0) return 'text-[#a40035]';
    return 'text-gray-700';
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden mb-6">
      <div className="px-6 py-4 border-b border-gray-100 bg-[#a40035]/5">
        <h2 className="text-lg font-bold text-[#a40035]">新店数量统计</h2>
      </div>
      <div className="p-4">
        {loading ? (
          <div className="text-center py-8 text-gray-400">加载中...</div>
        ) : !data || data.length === 0 ? (
          <div className="text-center py-8 text-gray-400">暂无数据</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <colgroup>
                <col style={{ width: '60px' }} />
                {cities.flatMap(city =>
                  subCols.map(col => (
                    <col key={`${city}_${col.key}`} style={{ width: '52px' }} />
                  ))
                )}
              </colgroup>
              <thead>
                {/* 第一行：时间 + 城市分组 */}
                <tr className="bg-gray-100 text-gray-600 text-center">
                  <th rowSpan={3} className="border border-gray-300 px-3 py-2 text-xs font-semibold whitespace-nowrap align-middle">时间</th>
                  {cities.map(city => (
                    <th key={city} colSpan={subCols.length} className="border border-gray-300 px-3 py-2 text-xs font-semibold whitespace-nowrap">
                      {city}
                    </th>
                  ))}
                </tr>
                {/* 第二行：新开（跨2列）+ 其余列（rowSpan=2） */}
                <tr className="bg-gray-100 text-gray-600 text-center">
                  {cities.map(city => (
                    <React.Fragment key={city}>
                      <th colSpan={2} className="border border-gray-300 px-3 py-2 text-xs font-semibold whitespace-nowrap">新开</th>
                      {singleCols.map(col => (
                        <th key={`${city}_${col.key}`} rowSpan={2} className="border border-gray-300 px-3 py-2 text-xs font-semibold whitespace-nowrap align-middle">
                          {col.label}
                        </th>
                      ))}
                    </React.Fragment>
                  ))}
                </tr>
                {/* 第三行：目标 / 实际 */}
                <tr className="bg-gray-100 text-gray-600 text-center">
                  {cities.map(city =>
                    newOpenCols.map(col => (
                      <th key={`${city}_${col.key}`} className="border border-gray-300 px-3 py-2 text-xs font-semibold whitespace-nowrap">
                        {col.label}
                      </th>
                    ))
                  )}
                </tr>
              </thead>
              <tbody>
                {[...data].sort((a, b) => Number(a['年度']) - Number(b['年度'])).map((row, idx) => {
                  const year = row['年度'];
                  const isCurrentYear = String(year) === String(currentYear);
                  return (
                    <tr key={year} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}>
                      <td className="border border-gray-200 px-3 py-2 text-center whitespace-nowrap text-gray-700">
                        {year}年
                      </td>
                      {cities.map(city =>
                        subCols.map(col => {
                          const fieldKey = `${city}_${col.key}`;
                          const val = row[fieldKey];
                          const isCompare = col.key === '对照目标';
                          const displayVal = (val === null || val === undefined || val === '') ? '-' : val;
                          return (
                            <td key={fieldKey} className={`border border-gray-200 px-3 py-2 text-center whitespace-nowrap ${isCompare ? getCompareClass(val) : 'text-gray-700'}`}>
                              {displayVal}
                            </td>
                          );
                        })
                      )}
                    </tr>
                  );
                })}
                {/* 合计行 */}
                <tr className="bg-gray-100 font-semibold">
                  <td className="border border-gray-300 px-3 py-2 text-center whitespace-nowrap text-gray-700">合计</td>
                  {cities.map(city =>
                    subCols.map(col => {
                      const fieldKey = `${city}_${col.key}`;
                      const val = summaryRow[fieldKey];
                      const isCompare = col.key === '对照目标';
                      return (
                        <td key={fieldKey} className={`border border-gray-300 px-3 py-2 text-center whitespace-nowrap ${isCompare ? getCompareClass(val) : 'text-gray-700'}`}>
                          {val || '-'}
                        </td>
                      );
                    })
                  )}
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default NewStoreStatisticsContainer;
