import React, { useMemo, useState } from 'react';
import useFetchData from '../../hooks/useFetchData';
import FilterDropdown from '../../components/Common/FilterDropdown';

/**
 * 现金流持续亏损门店列表表格
 * 数据来源：getCashFlowContinuousLoss（月度粒度）
 * 展示最近2个季度，每季度显示各月 + 季度合计
 */
const CashFlowContinuousLossTableContainer = () => {
  const { data: lossData, loading, error, fetchData } = useFetchData('getCashFlowContinuousLossMonthly', [], [], { manual: false });

  const [selectedCity, setSelectedCity] = useState(null);
  const [selectedStore, setSelectedStore] = useState(null);

  // 格式化金额，保留两位小数
  const fmtMoney = (val) => {
    if (val === null || val === undefined || val === '') return '';
    const num = Number(val);
    if (isNaN(num)) return '';
    return num.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  // 格式化日期
  const fmtDate = (dateStr) => {
    if (!dateStr) return '-';
    return dateStr.split('T')[0];
  };

  // 金额单元格样式：合计列小于-30000显示红色，其余统一黑色
  const moneyClass = (val, isTotal = false) => {
    if (isTotal) {
      const num = Number(val);
      if (!isNaN(num) && num < -30000) return 'text-[#a40035]';
    }
    return 'text-gray-900';
  };

  /**
   * 将季度字符串（如 "2025Q4"）转换为显示标签（如 "2025年4季度"）
   * 并解析出该季度包含的月份列表
   */
  const parseQuarter = (q) => {
    // 支持 "2025Q4" 或 "2025-Q4" 两种格式
    const match = q.match(/(\d{4})-?Q(\d)/);
    if (!match) return null;
    const year = parseInt(match[1]);
    const qNum = parseInt(match[2]);
    const startMonth = (qNum - 1) * 3 + 1;
    const months = [startMonth, startMonth + 1, startMonth + 2].map(m => ({
      label: `${m}月`,
      key: `${year}-${String(m).padStart(2, '0')}`,
    }));
    return {
      quarter: q,
      label: `${year}年${qNum}季度`,
      months,
    };
  };

  const { quarterGroups, storeRows } = useMemo(() => {
    if (!lossData || lossData.length === 0) return { quarterGroups: [], storeRows: [] };

    // 收集所有季度并排序，只取最近2个
    // SQL 返回的季度格式为 "2025Q4"（无连字符）
    const quartersSet = new Set();
    lossData.forEach(r => {
      const q = r['quarter_number'];
      if (q) quartersSet.add(q);
    });
    const sortedQuarters = Array.from(quartersSet).sort();
    // 只保留最近2个季度
    const recentQuarters = sortedQuarters.slice(-2);
    const quarterGroups = recentQuarters.map(parseQuarter).filter(Boolean);

    // 按门店聚合数据
    const storeMap = {};
    lossData.forEach(r => {
      const code = r['store_code'];
      const quarter = r['quarter_number'];
      const month = r['stat_month'];  // 格式 "2025-10"

      // 只处理最近2个季度的数据
      if (!recentQuarters.includes(quarter)) return;

      if (!storeMap[code]) {
        const openingDate = r['opening_date'];
        storeMap[code] = {
          city_name: r['city_name'],
          store_code: code,
          store_name: r['store_name'],
          opening_date: openingDate,
          opening_year: openingDate ? String(openingDate).split('T')[0].slice(0, 4) : '-',
          store_type: null, // 取最后季度最后月的值
          _latestMonthKey: '',
          quarterData: {},
        };
      }

      if (!storeMap[code].quarterData[quarter]) {
        storeMap[code].quarterData[quarter] = { months: {}, total: null };
      }

      // 月度净现金流
      if (month) {
        storeMap[code].quarterData[quarter].months[month] = r['monthly_cashflow'];
        // 记录最后季度最后月的 store_type
        const monthKey = `${quarter}_${month}`;
        if (monthKey > storeMap[code]._latestMonthKey) {
          storeMap[code]._latestMonthKey = monthKey;
          storeMap[code].store_type = r['store_type'];
        }
      }
      // 季度合计（每行都有，值相同，直接覆盖）
      storeMap[code].quarterData[quarter].total = r['qtr_total_cash'];
    });

    // 按最后一个季度合计升序排序
    const lastQuarter = recentQuarters[recentQuarters.length - 1];
    const storeRows = Object.values(storeMap).sort((a, b) => {
      const aTotal = a.quarterData[lastQuarter]?.total ?? Infinity;
      const bTotal = b.quarterData[lastQuarter]?.total ?? Infinity;
      return Number(aTotal) - Number(bTotal);
    });

    return { quarterGroups, storeRows };
  }, [lossData]);

  // 城市选项
  const cityOptions = useMemo(() => {
    return [...new Set(storeRows.map(r => r.city_name).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'zh-CN'));
  }, [storeRows]);

  // 门店选项（随城市联动）
  const storeOptions = useMemo(() => {
    const base = selectedCity ? storeRows.filter(r => r.city_name === selectedCity) : storeRows;
    return base.map(r => r.store_name).filter(Boolean);
  }, [storeRows, selectedCity]);

  // 过滤后的行
  const filteredRows = useMemo(() => {
    return storeRows.filter(r => {
      if (selectedCity && r.city_name !== selectedCity) return false;
      if (selectedStore && r.store_name !== selectedStore) return false;
      return true;
    });
  }, [storeRows, selectedCity, selectedStore]);

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden mb-6">
      {/* 标题栏 */}
      <div className="px-6 py-4 border-b border-gray-100 bg-[#a40035]/5 flex items-center justify-between">
        <h2 className="text-lg font-bold text-[#a40035] flex items-center gap-2">
          现金流持续亏损门店列表
          <span className="ml-2 text-sm font-normal bg-[#a40035]/10 text-[#a40035] px-2 py-0.5 rounded-full">
            {loading ? '...' : (error ? '-' : `${filteredRows.length} 家`)}
          </span>
        </h2>
        <div className="flex items-center gap-2">
          {error && (
            <button onClick={() => fetchData()} className="text-xs text-[#a40035] hover:text-[#8a002d] underline mr-2">
              重试
            </button>
          )}
          <div className="flex flex-row relative z-40">
            <FilterDropdown
              label="城市"
              value={selectedCity}
              options={cityOptions}
              onChange={(val) => { setSelectedCity(val); setSelectedStore(null); }}
            />
            <FilterDropdown
              label="门店"
              value={selectedStore}
              options={storeOptions}
              onChange={setSelectedStore}
            />
          </div>
        </div>
      </div>

      <div className="p-4">
        {loading ? (
          <div className="text-center py-8 text-gray-400">加载中...</div>
        ) : storeRows.length === 0 ? (
          <div className="text-center py-8 text-gray-400">暂无持续亏损门店</div>
        ) : filteredRows.length === 0 ? (
          <div className="text-center py-8 text-gray-400">无符合筛选条件的门店</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                {/* 第一行：固定列 + 季度分组 */}
                <tr className="bg-gray-100 text-gray-600 text-center">
                  <th rowSpan={2} className="border border-gray-300 px-3 py-2 text-xs font-semibold whitespace-nowrap">城市</th>
                  <th rowSpan={2} className="border border-gray-300 px-3 py-2 text-xs font-semibold whitespace-nowrap">门店编码</th>
                  <th rowSpan={2} className="border border-gray-300 px-3 py-2 text-xs font-semibold whitespace-nowrap">门店名称</th>
                  <th rowSpan={2} className="border border-gray-300 px-3 py-2 text-xs font-semibold whitespace-nowrap">开业年份</th>
                  <th rowSpan={2} className="border border-gray-300 px-3 py-2 text-xs font-semibold whitespace-nowrap">开业时间</th>
                  <th rowSpan={2} className="border border-gray-300 px-3 py-2 text-xs font-semibold whitespace-nowrap">预警类型</th>
                  {quarterGroups.map(qg => (
                    <th
                      key={qg.quarter}
                      colSpan={qg.months.length + 1}
                      className="border border-gray-300 px-3 py-2 text-xs font-semibold text-gray-600 whitespace-nowrap"
                    >
                      {qg.label}
                    </th>
                  ))}
                </tr>
                {/* 第二行：月份 + 合计 */}
                <tr className="bg-gray-50 text-gray-600 text-center">
                  {quarterGroups.map(qg =>
                    [...qg.months, { label: '合计', key: `${qg.quarter}_total` }].map(m => (
                      <th
                        key={m.key}
                        className={`border border-gray-300 px-3 py-2 text-xs font-medium whitespace-nowrap ${m.label === '合计' ? 'bg-gray-100 font-semibold text-gray-600' : ''}`}
                      >
                        {m.label}
                      </th>
                    ))
                  )}
                </tr>
              </thead>
              <tbody>
                {filteredRows.map((row, idx) => (
                  <tr key={row.store_code} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}>
                    <td className="border border-gray-200 px-3 py-2 text-center whitespace-nowrap text-gray-700">{row.city_name}</td>
                    <td className="border border-gray-200 px-3 py-2 text-center whitespace-nowrap text-sm text-gray-700">{row.store_code}</td>
                    <td className="border border-gray-200 px-3 py-2 whitespace-nowrap text-gray-700">{row.store_name}</td>
                    <td className="border border-gray-200 px-3 py-2 text-center whitespace-nowrap text-gray-700">{row.opening_year}</td>
                    <td className="border border-gray-200 px-3 py-2 text-center whitespace-nowrap text-gray-700">{fmtDate(row.opening_date)}</td>
                    <td className="border border-gray-200 px-3 py-2 text-center whitespace-nowrap text-gray-700">{row.store_type || '-'}</td>
                    {quarterGroups.map(qg => {
                      const qData = row.quarterData[qg.quarter];
                      return [
                        ...qg.months.map(m => {
                          const val = qData?.months?.[m.key];
                          return (
                            <td key={m.key} className="border border-gray-200 px-3 py-2 text-right whitespace-nowrap">
                              {val !== undefined && val !== null ? (
                                <span className={moneyClass(val, false)}>{fmtMoney(val)}</span>
                              ) : ''}
                            </td>
                          );
                        }),
                        // 季度合计列
                        <td key={`${qg.quarter}_total`} className="border border-gray-200 px-3 py-2 text-right whitespace-nowrap">
                          {qData?.total !== undefined && qData?.total !== null ? (
                            <span className={moneyClass(qData.total, true)}>{fmtMoney(qData.total)}</span>
                          ) : ''}
                        </td>,
                      ];
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default CashFlowContinuousLossTableContainer;
