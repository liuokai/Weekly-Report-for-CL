import React, { useMemo } from 'react';
import useFetchData from '../../hooks/useFetchData';

/**
 * 城市现金流总结容器组件
 * 数据来源：cash_flow_summary_urban_city.sql
 * 展示年度维度各城市经营现金流、新店投资、年度结余（单位：万元）
 */
const CityFlowSummaryContainer = () => {
  const { data, loading } = useFetchData('getCityFlowSummary');

  // 城市列表（总 + 各城市）
  const cities = ['总', '上海', '北京', '南京', '四川', '宁波', '广州', '杭州', '深圳', '重庆'];

  // 每个城市下的子列
  const subCols = [
    { key: '经营现金流', label: '经营现金流' },
    { key: '新店投资',   label: '新店投资' },
    { key: '年度结余',   label: '年度结余' },
  ];

  // 数字格式化：万元，保留1位小数
  const formatWan = (val) => {
    const n = Number(val);
    if (val === null || val === undefined || val === '' || isNaN(n)) return '-';
    return (n / 10000).toFixed(1);
  };

  // 年度结余着色
  const getSurplusClass = (val) => {
    const n = Number(val);
    if (!isNaN(n) && n < 0) return 'text-[#a40035]';
    return 'text-gray-700';
  };

  // 计算合计行
  const summaryRow = useMemo(() => {
    if (!data || data.length === 0) return null;
    const result = {};
    cities.forEach(city => {
      subCols.forEach(col => {
        const key = `${city}_${col.key}`;
        result[key] = data.reduce((sum, row) => sum + (Number(row[key]) || 0), 0);
      });
    });
    return result;
  }, [data]);

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden mb-6">
      <div className="px-6 py-4 border-b border-gray-100 bg-[#a40035]/5">
        <h2 className="text-lg font-bold text-[#a40035]">城市现金流总结</h2>
        <p className="text-xs text-gray-400 mt-0.5">单位：万元</p>
      </div>
      <div className="p-4">
        {loading ? (
          <div className="text-center py-8 text-gray-400">加载中...</div>
        ) : !data || data.length === 0 ? (
          <div className="text-center py-8 text-gray-400">暂无数据</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                {/* 第一行：年度 + 城市分组 */}
                <tr className="bg-gray-100 text-gray-600 text-center">
                  <th rowSpan={2} className="border border-gray-300 px-3 py-2 text-xs font-semibold whitespace-nowrap align-middle">年度</th>
                  {cities.map(city => (
                    <th key={city} colSpan={subCols.length} className="border border-gray-300 px-3 py-2 text-xs font-semibold whitespace-nowrap">
                      {city === '总' ? '合计' : city}
                    </th>
                  ))}
                </tr>
                {/* 第二行：子列标题 */}
                <tr className="bg-gray-100 text-gray-600 text-center">
                  {cities.map(city =>
                    subCols.map(col => (
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
                  return (
                    <tr key={year} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}>
                      <td className="border border-gray-200 px-3 py-2 text-center whitespace-nowrap text-gray-700">
                        {year}年
                      </td>
                      {cities.map(city =>
                        subCols.map(col => {
                          const fieldKey = `${city}_${col.key}`;
                          const val = row[fieldKey];
                          const isSurplus = col.key === '年度结余';
                          return (
                            <td key={fieldKey} className={`border border-gray-200 px-3 py-2 text-center whitespace-nowrap ${isSurplus ? getSurplusClass(val) : 'text-gray-700'}`}>
                              {formatWan(val)}
                            </td>
                          );
                        })
                      )}
                    </tr>
                  );
                })}
              </tbody>
              {summaryRow && (
                <tfoot>
                  <tr className="bg-gray-100 font-semibold">
                    <td className="border border-gray-300 px-3 py-2 text-center whitespace-nowrap text-gray-700">合计</td>
                    {cities.map(city =>
                      subCols.map(col => {
                        const fieldKey = `${city}_${col.key}`;
                        const val = summaryRow[fieldKey];
                        const isSurplus = col.key === '年度结余';
                        return (
                          <td key={fieldKey} className={`border border-gray-300 px-3 py-2 text-center whitespace-nowrap ${isSurplus ? getSurplusClass(val) : 'text-gray-700'}`}>
                            {formatWan(val)}
                          </td>
                        );
                      })
                    )}
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default CityFlowSummaryContainer;
