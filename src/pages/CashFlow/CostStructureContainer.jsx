import React, { useState, useEffect, useRef, useMemo } from 'react';
import axios from 'axios';

const MonthDropdown = ({ months, selectedMonth, onSelect }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
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
        onClick={() => setOpen(!open)}
        className="px-3 py-1.5 rounded-lg bg-gray-100 border border-gray-200 text-sm font-medium text-gray-700 flex items-center gap-2 min-w-[130px] justify-between"
      >
        <span>{selectedMonth || '选择月份'}</span>
        <svg className={`w-4 h-4 ${open ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-48 max-h-60 overflow-y-auto bg-gray-100 border border-gray-200 rounded-lg shadow-lg z-50">
          {[...months].sort((a, b) => b.localeCompare(a)).map(m => (
            <button
              key={m}
              onClick={() => {
                onSelect(m);
                setOpen(false);
              }}
              className={`w-full text-left px-3 py-2 hover:bg-gray-200 ${selectedMonth === m ? 'text-[#a40035] font-semibold' : 'text-gray-700'}`}
            >
              {m}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

const FilterDropdown = ({ options, selected, onSelect, placeholder = '全部' }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
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
        onClick={() => setOpen(!open)}
        className="px-3 py-1.5 rounded-lg bg-gray-100 border border-gray-200 text-sm font-medium text-gray-700 flex items-center gap-2 min-w-[130px] justify-between"
      >
        <span className="truncate max-w-[100px]">{selected || placeholder}</span>
        <svg className={`w-4 h-4 ${open ? 'rotate-180' : ''} flex-shrink-0`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-48 max-h-60 overflow-y-auto bg-gray-100 border border-gray-200 rounded-lg shadow-lg z-50">
          <button
            onClick={() => {
              onSelect('全部');
              setOpen(false);
            }}
            className={`w-full text-left px-3 py-2 hover:bg-gray-200 ${selected === '全部' ? 'text-[#a40035] font-semibold' : 'text-gray-700'}`}
          >
            {placeholder}
          </button>
          {options.map(opt => (
            <button
              key={opt}
              onClick={() => {
                onSelect(opt);
                setOpen(false);
              }}
              className={`w-full text-left px-3 py-2 hover:bg-gray-200 ${selected === opt ? 'text-[#a40035] font-semibold' : 'text-gray-700'}`}
            >
              {opt}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// Dimension Toggle Component
const DimensionToggle = ({ dimension, onChange }) => {
  return (
    <div className="flex bg-gray-100 p-1 rounded-lg">
      <button
        onClick={() => onChange('city')}
        className={`px-3 py-1 text-sm font-medium rounded-md transition-all ${
          dimension === 'city'
            ? 'bg-white text-[#a40035] shadow-sm'
            : 'text-gray-500 hover:text-gray-700'
        }`}
      >
        城市维度
      </button>
      <button
        onClick={() => onChange('store')}
        className={`px-3 py-1 text-sm font-medium rounded-md transition-all ${
          dimension === 'store'
            ? 'bg-white text-[#a40035] shadow-sm'
            : 'text-gray-500 hover:text-gray-700'
        }`}
      >
        门店维度
      </button>
    </div>
  );
};

// Styled Filter Dropdown (Matches DimensionToggle style)
const StyledFilterDropdown = ({ options, selected, onSelect, placeholder }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  
  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
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
        onClick={() => setOpen(!open)}
        className="px-3 py-1 text-sm font-medium rounded-md bg-white text-[#a40035] shadow-sm flex items-center gap-2 min-w-[100px] justify-between"
      >
        <span className="truncate">{selected === '全部' ? placeholder : selected}</span>
        <svg className={`w-4 h-4 ${open ? 'rotate-180' : ''} text-gray-400`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-48 max-h-60 overflow-y-auto bg-white border border-gray-200 rounded-lg shadow-lg z-50">
          <button
            onClick={() => {
              onSelect('全部');
              setOpen(false);
            }}
            className={`w-full text-left px-3 py-2 hover:bg-gray-50 ${selected === '全部' ? 'text-[#a40035] font-semibold' : 'text-gray-700'}`}
          >
            {placeholder}
          </button>
          {options.map(opt => (
            <button
              key={opt}
              onClick={() => {
                onSelect(opt);
                setOpen(false);
              }}
              className={`w-full text-left px-3 py-2 hover:bg-gray-50 ${selected === opt ? 'text-[#a40035] font-semibold' : 'text-gray-700'}`}
            >
              {opt}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

const CostStructureContainer = () => {
  const [loading, setLoading] = useState(true);
  const [allRows, setAllRows] = useState([]);
  const [months, setMonths] = useState([]);
  const [startMonth, setStartMonth] = useState('');
  const [endMonth, setEndMonth] = useState('');
  
  // Dimension State
  const [viewDimension, setViewDimension] = useState('city'); // 'city' | 'store'
  
  // Filters
  const [selectedCityFilter, setSelectedCityFilter] = useState('全部');
  const [selectedStoreFilter, setSelectedStoreFilter] = useState('全部');
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  // Reset filters when dimension changes
  useEffect(() => {
    if (viewDimension === 'city') {
      setSelectedStoreFilter('全部');
      // Keep City Filter as it might be useful, or reset it if desired. 
      // User requirement: "Default shows 9 cities aggregated values". 
      // Let's reset to 'All' to show all 9 cities by default when switching back.
      setSelectedCityFilter('全部'); 
    } else {
      // When switching to Store dimension, maybe keep the city filter if set?
      // Let's reset store filter to ensure clean state.
      setSelectedStoreFilter('全部');
    }
  }, [viewDimension]);

  // Reset store filter when city changes (in Store dimension)
  useEffect(() => {
    if (viewDimension === 'store') {
      setSelectedStoreFilter('全部');
    }
  }, [selectedCityFilter, viewDimension]);

  const fetchData = async () => {
    try {
      const res = await axios.post('/api/fetch-data', {
        queryKey: 'getProfitStoreDetailMonthly'
      });
      if (res.data && res.data.status === 'success' && Array.isArray(res.data.data)) {
        const rows = res.data.data;
        setAllRows(rows);
        const ms = Array.from(new Set(rows.map(r => r['统计月份']))).sort((a, b) => a.localeCompare(b));
        setMonths(ms);
        const latest = ms[ms.length - 1] || '';
        setStartMonth(latest);
        setEndMonth(latest);
      } else {
        setError('数据返回失败');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const processedData = useMemo(() => {
    if (!allRows.length || !startMonth || !endMonth) return null;

    const start = startMonth <= endMonth ? startMonth : endMonth;
    const end = startMonth <= endMonth ? endMonth : startMonth;

    // 1. Filter by Month
    let filteredRows = allRows.filter(r => {
      const m = r['统计月份'];
      return m && m >= start && m <= end;
    });

    // 2. Apply Dimension-Specific Filters
    if (viewDimension === 'city') {
       // In City Mode, we show all cities by default (aggregated).
       // If City Filter is used, we filter by it.
       if (selectedCityFilter !== '全部') {
         filteredRows = filteredRows.filter(r => r['城市名称'] === selectedCityFilter);
       }
    } else {
      // In Store Mode
      if (selectedCityFilter !== '全部') {
        filteredRows = filteredRows.filter(r => r['城市名称'] === selectedCityFilter);
      }
      if (selectedStoreFilter !== '全部') {
        filteredRows = filteredRows.filter(r => r['门店名称'] === selectedStoreFilter);
      }
    }

    if (filteredRows.length === 0) return null;

    // 3. Determine Columns
    const sampleRow = filteredRows[0];
    const allKeys = Object.keys(sampleRow);
    const dimensionKeys = ['统计月份', '门店编码', '城市名称', '门店名称', '门店开业日期', '门店经营阶段'];
    const metricKeys = allKeys.filter(k => !dimensionKeys.includes(k));

    // 4. Aggregation Logic
    const groupByKey = viewDimension === 'city' ? '城市名称' : '门店名称';
    const aggregationMap = {};
    
    filteredRows.forEach(row => {
      const key = row[groupByKey] || (viewDimension === 'city' ? '未知城市' : '未知门店');
      
      if (!aggregationMap[key]) {
        aggregationMap[key] = {
          [groupByKey]: key,
          _count: 0
        };
        // For Store dimension, preserve static attributes like City if needed
        if (viewDimension === 'store') {
            aggregationMap[key]['城市名称'] = row['城市名称'];
        }
        metricKeys.forEach(k => aggregationMap[key][k] = 0);
      }
      
      aggregationMap[key]._count += 1;
      metricKeys.forEach(k => {
        const val = parseFloat(row[k]);
        if (!isNaN(val)) {
          aggregationMap[key][k] += val;
        }
      });
    });

    // 5. Recalculate Ratios and Format
    const finalRows = Object.values(aggregationMap).map(row => {
      const revenue = row['营业额实际'] || row['主营业务收入'] || 0;
      const netProfit = row['净利润实际'] || row['净利润'] || 0;
      
      if (metricKeys.includes('实际利润率')) {
        row['实际利润率'] = revenue !== 0 ? (netProfit / revenue * 100) : 0;
      }
      
      if (metricKeys.includes('利润率')) {
        row['利润率'] = revenue !== 0 ? (netProfit / revenue * 100) : 0;
      }
      
      return row;
    });

    // 6. Create Summary Row
    const summaryRow = {
      [groupByKey]: '合计',
      isSummary: true
    };
    metricKeys.forEach(k => summaryRow[k] = 0);
    
    finalRows.forEach(row => {
      metricKeys.forEach(k => {
        if (k !== '实际利润率' && k !== '利润率') {
             summaryRow[k] += (row[k] || 0);
        }
      });
    });

    // Recalculate Summary Ratios
    const totalRevenue = summaryRow['营业额实际'] || summaryRow['主营业务收入'] || 0;
    const totalNetProfit = summaryRow['净利润实际'] || summaryRow['净利润'] || 0;
    
    if (metricKeys.includes('实际利润率')) {
      summaryRow['实际利润率'] = totalRevenue !== 0 ? (totalNetProfit / totalRevenue * 100) : 0;
    }
    if (metricKeys.includes('利润率')) {
        summaryRow['利润率'] = totalRevenue !== 0 ? (totalNetProfit / totalRevenue * 100) : 0;
    }

    // Sort rows (optional, but good for UX)
    // City mode: Sort by City Name (usually default) or maybe Revenue?
    // Store mode: Sort by Store Name
    finalRows.sort((a, b) => (a[groupByKey] || '').localeCompare(b[groupByKey] || ''));

    return {
      columns: metricKeys,
      data: [...finalRows, summaryRow],
      firstColumnHeader: groupByKey
    };
  }, [allRows, startMonth, endMonth, selectedCityFilter, selectedStoreFilter, viewDimension]);

  // Generate Store Options based on selected City
  const storeOptions = useMemo(() => {
    if (!allRows.length) return [];
    let stores = allRows;
    if (selectedCityFilter !== '全部') {
      stores = stores.filter(r => r['城市名称'] === selectedCityFilter);
    }
    return [...new Set(stores.map(r => r['门店名称']))].filter(Boolean).sort((a, b) => a.localeCompare(b));
  }, [allRows, selectedCityFilter]);

  // Generate City Options
  const cityOptions = useMemo(() => {
     return [...new Set(allRows.map(r => r['城市名称']))].filter(Boolean).sort((a, b) => a.localeCompare(b));
  }, [allRows]);

  // Group Headers Logic
  const headerGroups = useMemo(() => {
    const cols = processedData?.columns || [];
    const groups = [];
    const processed = new Set();

    cols.forEach(col => {
      if (processed.has(col)) return;

      // Check for patterns: X预算, X实际, X差异
      let baseName = null;
      if (col.endsWith('预算')) baseName = col.slice(0, -2);
      else if (col.endsWith('实际')) baseName = col.slice(0, -2);
      else if (col.endsWith('差异')) baseName = col.slice(0, -2);

      if (baseName) {
        const budgetKey = `${baseName}预算`;
        const actualKey = `${baseName}实际`;
        const diffKey = `${baseName}差异`;

        // Check if all three exist in columns
        if (cols.includes(budgetKey) && cols.includes(actualKey) && cols.includes(diffKey)) {
          groups.push({
            title: baseName,
            isGroup: true,
            subHeaders: [
              { label: '预算值', key: budgetKey },
              { label: '实际值', key: actualKey },
              { label: '差异值', key: diffKey }
            ]
          });
          processed.add(budgetKey);
          processed.add(actualKey);
          processed.add(diffKey);
        } else {
          groups.push({ title: col, isGroup: false, key: col });
          processed.add(col);
        }
      } else {
        groups.push({ title: col, isGroup: false, key: col });
        processed.add(col);
      }
    });
    return groups;
  }, [processedData]);

  if (loading) return <div className="p-6 text-center text-gray-500">加载中...</div>;
  if (error) return <div className="p-6 text-center text-red-500">错误: {error}</div>;
  if (!processedData) return <div className="p-6 text-center text-gray-500">暂无数据</div>;

  const { columns, data, firstColumnHeader } = processedData;

  const formatValue = (key, value) => {
    if (key.includes('率') || key.includes('占比')) {
      return `${value.toFixed(2)}%`;
    }
    return value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-6 relative">
      <div className="p-6 border-b border-gray-100 bg-gray-50/50 flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4">
        <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
          <span className="w-1 h-5 bg-[#a40035] rounded-full"></span>
          {viewDimension === 'city' ? '城市维度' : '门店维度'}成本结构分析
        </h3>
        
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">起</span>
              <MonthDropdown
                months={months}
                selectedMonth={startMonth}
                onSelect={(m) => {
                  const nextStart = m;
                  const nextEnd = !endMonth || endMonth.localeCompare(nextStart) < 0 ? nextStart : endMonth;
                  setStartMonth(nextStart);
                  setEndMonth(nextEnd);
                }}
              />
            </div>
            <span className="text-sm text-gray-400">-</span>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">止</span>
              <MonthDropdown
                months={months}
                selectedMonth={endMonth}
                onSelect={(m) => {
                  const nextEnd = m;
                  const nextStart = !startMonth || startMonth.localeCompare(nextEnd) > 0 ? nextEnd : startMonth;
                  setStartMonth(nextStart);
                  setEndMonth(nextEnd);
                }}
              />
            </div>
          </div>
          
          <div className="w-px h-6 bg-gray-200 mx-2 hidden sm:block"></div>
          
          {/* Dimension Toggle and Conditional Store Filter */}
          <div className="flex items-center gap-2">
             <DimensionToggle dimension={viewDimension} onChange={setViewDimension} />
             
             {viewDimension === 'store' && (
               <div className="bg-gray-100 p-1 rounded-lg">
                 <StyledFilterDropdown 
                   options={storeOptions} 
                   selected={selectedStoreFilter}
                   onSelect={setSelectedStoreFilter}
                   placeholder="全部门店"
                 />
               </div>
             )}
          </div>
        </div>
      </div>

      <div className={`overflow-x-auto ${viewDimension === 'store' ? 'max-h-[800px] overflow-y-auto' : ''}`}>
        <table className="w-full text-sm text-left text-gray-600 relative">
          <thead className="bg-gray-50 text-xs text-gray-700 uppercase sticky top-0 z-20 shadow-sm">
            <tr>
              <th rowSpan={2} className="px-6 py-4 font-bold sticky left-0 bg-gray-50 z-30 border-r border-gray-300 min-w-[150px] shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                {firstColumnHeader}
              </th>
              {headerGroups.map((group, idx) => (
                <th 
                  key={idx} 
                  colSpan={group.isGroup ? 3 : 1} 
                  rowSpan={group.isGroup ? 1 : 2}
                  className={`px-6 py-4 font-semibold whitespace-nowrap min-w-[140px] text-center border-b border-r border-gray-300 ${group.isGroup ? 'bg-gray-100' : ''}`}
                >
                  {group.title}
                </th>
              ))}
            </tr>
            <tr>
              {headerGroups.map((group, idx) => (
                group.isGroup && group.subHeaders.map((sub, subIdx) => (
                  <th key={`${idx}-${subIdx}`} className="px-6 py-2 font-medium whitespace-nowrap min-w-[100px] text-right bg-gray-50 border-b border-r border-gray-300 text-gray-500">
                    {sub.label}
                  </th>
                ))
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {data.map((row, idx) => (
              <tr 
                key={idx} 
                className={`
                  ${row.isSummary ? 'bg-red-50 font-bold sticky bottom-0 z-20 shadow-inner' : 'hover:bg-gray-50 transition-colors'}
                `}
              >
                <td className={`px-6 py-4 font-medium sticky left-0 z-10 border-r border-gray-300
                  ${row.isSummary ? 'bg-red-50 text-[#a40035]' : 'bg-white text-gray-900'}
                  shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]
                `}>
                  {row[firstColumnHeader]}
                </td>
                {headerGroups.map((group, gIdx) => {
                  if (group.isGroup) {
                    return group.subHeaders.map((sub, sIdx) => {
                      const val = row[sub.key];
                      const isDiff = sub.key.includes('差异');
                      return (
                        <td key={`${gIdx}-${sIdx}`} className={`px-6 py-4 text-right whitespace-nowrap border-r border-gray-300
                          ${row.isSummary ? 'text-[#a40035]' : ''}
                          ${isDiff && val < 0 ? 'text-green-600' : ''}
                          ${isDiff && val > 0 ? 'text-red-600' : ''}
                        `}>
                          {formatValue(sub.key, val)}
                        </td>
                      );
                    });
                  } else {
                    return (
                      <td key={gIdx} className={`px-6 py-4 text-right whitespace-nowrap border-r border-gray-300
                        ${row.isSummary ? 'text-[#a40035]' : ''}
                        ${group.key.includes('差异') && row[group.key] < 0 ? 'text-green-600' : ''}
                        ${group.key.includes('差异') && row[group.key] > 0 ? 'text-red-600' : ''}
                      `}>
                        {formatValue(group.key, row[group.key])}
                      </td>
                    );
                  }
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CostStructureContainer;
