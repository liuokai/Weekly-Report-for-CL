import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import CostMapping from '../../config/costMapping';

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
        <div className="absolute right-0 mt-2 w-48 max-h-60 overflow-y-auto bg-gray-100 border border-gray-200 rounded-lg shadow-lg z-10">
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

const CityDropdown = ({ options, selected, onSelect }) => {
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
        <span>{selected || '全部'}</span>
        <svg className={`w-4 h-4 ${open ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-48 max-h-60 overflow-y-auto bg-gray-100 border border-gray-200 rounded-lg shadow-lg z-10">
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

const CostStructureContainer = () => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [allRows, setAllRows] = useState([]);
  const [months, setMonths] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState('');
  const [viewMode, setViewMode] = useState('city'); // 'city' or 'store'
  const [selectedCityFilter, setSelectedCityFilter] = useState('全部'); // New filter for store view
  const [error, setError] = useState(null);
  const [detailModal, setDetailModal] = useState(null); // { title: string, items: Array, total: number }

  useEffect(() => {
    fetchData();
  }, []);
  
  useEffect(() => {
    if (detailModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [detailModal]);

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
        setSelectedMonth(latest);
        const processedData = processRows(rows, latest);
        setData(processedData);
      } else {
        setError('数据返回失败');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const processRows = (rows, month) => {
    const monthRows = rows.filter(r => r['统计月份'] === month);
    if (monthRows.length === 0) return null;

    const toCostItems = (row) => {
      return CostMapping.categories.map(cat => {
        if (cat.subCategories && Array.isArray(cat.subCategories)) {
          const subCategories = cat.subCategories.map(sub => {
            const subValue = sub.columns.reduce((sum, col) => sum + (Number(row[col]) || 0), 0);
            const subDetails = sub.columns.map(col => ({ name: col, value: Number(row[col]) || 0 }));
            return { name: sub.name, value: subValue, details: subDetails };
          });
          const total = subCategories.reduce((sum, s) => sum + s.value, 0);
          return { name: cat.name, value: total, subCategories };
        } else {
          const value = cat.columns.reduce((sum, col) => sum + (Number(row[col]) || 0), 0);
          const details = cat.columns.map(col => ({ name: col, value: Number(row[col]) || 0 }));
          return { name: cat.name, value, details };
        }
      });
    };

    const store_dimension = monthRows.map(r => ({
      name: r['门店名称'],
      store: r['门店名称'],
      storeCode: r['门店编码'],
      city: r['城市名称'],
      revenue: Number(r[CostMapping.revenueColumn]) || 0,
      netProfit: Number(r[CostMapping.netProfitColumn]) || 0,
      costs: toCostItems(r)
    }));

    const cityMap = {};
    store_dimension.forEach(s => {
      const key = s.city || '未知城市';
      if (!cityMap[key]) {
        cityMap[key] = {
          name: key,
          revenue: 0,
          netProfit: 0,
          costs: CostMapping.categories.map(cat => {
            if (cat.subCategories && Array.isArray(cat.subCategories)) {
              return {
                name: cat.name,
                value: 0,
                subCategories: cat.subCategories.map(sub => ({
                  name: sub.name,
                  value: 0,
                  details: sub.columns.map(col => ({ name: col, value: 0 }))
                }))
              };
            } else {
              return {
                name: cat.name,
                value: 0,
                details: cat.columns.map(col => ({ name: col, value: 0 }))
              };
            }
          })
        };
      }
      const agg = cityMap[key];
      agg.revenue += s.revenue;
      agg.netProfit += s.netProfit;
      s.costs.forEach((c, idx) => {
        agg.costs[idx].value += c.value;
        if (c.subCategories && agg.costs[idx].subCategories) {
          c.subCategories.forEach((sub, subIdx) => {
            const targetSub = agg.costs[idx].subCategories[subIdx];
            targetSub.value += sub.value;
            sub.details.forEach((d, didx) => {
              targetSub.details[didx].value += d.value;
            });
          });
        } else if (c.details && agg.costs[idx].details) {
          c.details.forEach((d, didx) => {
            agg.costs[idx].details[didx].value += d.value;
          });
        }
      });
    });

    const city_dimension = Object.values(cityMap);

    return {
      categories: CostMapping.categories.map(c => c.name),
      city_dimension,
      store_dimension
    };
  };

  if (loading) return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 flex flex-col items-center justify-center space-y-4 mb-6">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#a40035]"></div>
      <p className="text-gray-500 text-sm">正在加载成本结构数据...</p>
    </div>
  );

  if (error) return (
    <div className="bg-white rounded-xl shadow-sm border border-red-100 p-6 mb-6">
      <div className="text-red-500 flex items-center gap-2">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
        <span>数据加载失败: {error}</span>
      </div>
    </div>
  );

  if (!data) return null;

  const { categories, city_dimension, store_dimension } = data;
  
  // Prepare Filter Options
  const cityOptions = ['全部', ...city_dimension.map(c => c.name)];

  // Filter Data
  let currentData = viewMode === 'city' ? city_dimension : store_dimension;
  if (viewMode === 'store' && selectedCityFilter !== '全部') {
    currentData = currentData.filter(item => item.city === selectedCityFilter);
  }

  // Calculate Summary Row
  const getSummaryRow = (rows) => {
    if (!rows || rows.length === 0) return null;

    const firstRow = rows[0];
    const summary = {
      name: '合计',
      store: '合计',
      city: '-',
      revenue: 0,
      netProfit: 0,
      isSummary: true,
      costs: firstRow.costs.map(c => {
        const newCost = { name: c.name, value: 0 };
        if (c.subCategories) {
          newCost.subCategories = c.subCategories.map(sub => ({
            name: sub.name,
            value: 0,
            details: []
          }));
        } else if (c.details) {
          newCost.details = [];
        }
        return newCost;
      })
    };

    rows.forEach(row => {
      summary.revenue += (row.revenue || 0);
      summary.netProfit += (row.netProfit || 0);

      row.costs.forEach((cost, idx) => {
        const summaryCost = summary.costs[idx];
        summaryCost.value += (cost.value || 0);

        if (cost.subCategories && summaryCost.subCategories) {
          cost.subCategories.forEach((sub, subIdx) => {
            const targetSub = summaryCost.subCategories[subIdx];
            targetSub.value += (sub.value || 0);
            
            if (sub.details) {
              sub.details.forEach(d => {
                const existing = targetSub.details.find(x => x.name === d.name);
                if (existing) {
                  existing.value += (d.value || 0);
                } else {
                  targetSub.details.push({ ...d });
                }
              });
            }
          });
        }

        if (cost.details && summaryCost.details) {
          cost.details.forEach(d => {
            const existing = summaryCost.details.find(x => x.name === d.name);
            if (existing) {
              existing.value += (d.value || 0);
            } else {
              summaryCost.details.push({ ...d });
            }
          });
        }
      });
    });

    return summary;
  };

  const summaryRow = getSummaryRow(currentData);
  const displayData = summaryRow ? [summaryRow, ...currentData] : currentData;

  const targetCategories = ['服务费', '人工成本', '变动成本'];
  
  const calculateCostStructureBase = (costs) => {
    let sum = 0;
    costs.forEach(c => {
      if (targetCategories.includes(c.name)) {
        sum += c.value;
      }
    });
    return sum;
  };

  const handleCellClick = (rowName, costItem) => {
    const complexCategories = ['人工成本', '变动成本'];
    if (!complexCategories.includes(costItem.name)) return;
    setDetailModal({
      title: `${rowName} - ${costItem.name}明细`,
      costItem: costItem,
      total: costItem.value
    });
  };

  const renderModal = () => {
    if (!detailModal) return null;
    const { costItem, total } = detailModal;

    const renderDetailItem = (item, baseTotal) => (
      <div key={item.name} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg">
        <span className="text-gray-700 text-sm font-medium">{item.name}</span>
        <div className="text-right">
          <div className="font-bold text-gray-900">{item.value?.toLocaleString()}</div>
          <div className="text-xs text-gray-500">
            占比: {baseTotal ? ((item.value / baseTotal) * 100).toFixed(2) : 0}%
          </div>
        </div>
      </div>
    );

    let content;
    if (costItem.name === '人工成本' && costItem.subCategories) {
      content = (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {costItem.subCategories.map(sub => (
            <div key={sub.name} className="space-y-2">
               <div className="flex items-center justify-between bg-gray-100 p-2 rounded-lg">
                 <span className="font-bold text-gray-800">{sub.name}</span>
                 <div className="text-right flex items-center gap-3">
                   <span className="text-sm font-bold text-gray-900">{sub.value?.toLocaleString()}</span>
                   <span className="text-xs bg-white px-1.5 py-0.5 rounded text-gray-500">
                     {(total ? (sub.value / total * 100).toFixed(1) : 0)}%
                   </span>
                 </div>
               </div>
               <div className="space-y-1">
                 {sub.details.sort((a, b) => b.value - a.value).map(detail => renderDetailItem(detail, sub.value))}
               </div>
            </div>
          ))}
        </div>
      );
    } else {
      content = (
        <div className="space-y-3">
           {costItem.details.sort((a, b) => b.value - a.value).map(item => renderDetailItem(item, total))}
        </div>
      );
    }

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={() => setDetailModal(null)}>
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl overflow-hidden animate-in fade-in zoom-in duration-200" onClick={e => e.stopPropagation()}>
          <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-gray-50">
             <h3 className="font-bold text-gray-800">{detailModal.title}</h3>
             <button onClick={() => setDetailModal(null)} className="text-gray-400 hover:text-gray-600">
               <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
             </button>
          </div>
          <div className="max-h-[70vh] overflow-y-auto p-4">
            {content}
          </div>
          <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-between items-center">
            <span className="font-bold text-gray-700">合计</span>
            <span className="font-bold text-[#a40035] text-lg">{total?.toLocaleString()}</span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-6 relative">
      <div className="p-6 border-b border-gray-100 bg-gray-50/50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
            <span className="w-1 h-5 bg-[#a40035] rounded-full"></span>
            城市维度成本结构分析
          </h3>
        </div>
        
        <div className="flex items-center gap-3">
          <MonthDropdown
              months={months}
              selectedMonth={selectedMonth}
              onSelect={(m) => {
                setSelectedMonth(m);
                const processedData = processRows(allRows, m);
                setData(processedData);
              }}
            />
          {viewMode === 'store' && (
            <CityDropdown
              options={cityOptions}
              selected={selectedCityFilter}
              onSelect={(city) => setSelectedCityFilter(city)}
            />
          )}

          <div className="flex bg-gray-200 rounded-lg p-1 text-sm">
            <button
              onClick={() => setViewMode('city')}
              className={`px-3 py-1.5 rounded-md transition-all font-medium ${viewMode === 'city' ? 'bg-white text-[#a40035] shadow-sm' : 'text-gray-600 hover:text-gray-800'}`}
            >
              城市维度
            </button>
            <button
              onClick={() => setViewMode('store')}
              className={`px-3 py-1.5 rounded-md transition-all font-medium ${viewMode === 'store' ? 'bg-white text-[#a40035] shadow-sm' : 'text-gray-600 hover:text-gray-800'}`}
            >
              门店维度
            </button>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left whitespace-nowrap">
          <thead className="bg-gray-50 text-gray-600 font-medium border-b border-gray-100">
            <tr>
              <th className="px-6 py-4 sticky left-0 bg-gray-50 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)] z-10">
                {viewMode === 'city' ? '城市' : '门店'}
              </th>
              {viewMode === 'store' && <th className="px-6 py-4">所属城市</th>}
              <th className="px-6 py-4 text-right">主营业务收入</th>
              <th className="px-6 py-4 text-right text-gray-900 font-bold bg-gray-50/80">净利润</th>
              {categories.map(cat => (
                <th key={cat} className="px-6 py-4 text-right min-w-[140px]">
                  {cat}
                  <div className="text-xs font-normal text-gray-400 mt-0.5">数值 / 占比</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {displayData.map((row, idx) => {
              const baseCost = calculateCostStructureBase(row.costs);
              const isSummary = row.isSummary;
              
              return (
                <tr key={idx} className={`hover:bg-gray-50/50 transition-colors group ${isSummary ? 'bg-gray-100/80 font-bold border-b-2 border-gray-200' : ''}`}>
                  <td className={`px-6 py-4 font-medium sticky left-0 group-hover:bg-gray-50/50 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)] z-10 ${isSummary ? 'text-gray-900 bg-gray-100/80' : 'text-gray-800 bg-white'}`}>
                    {viewMode === 'city' ? row.name : (
                      <div>
                        <div>{row.store}</div>
                        {!isSummary && row.storeCode && (
                          <div className="text-xs text-gray-400 mt-0.5 font-normal">{row.storeCode}</div>
                        )}
                      </div>
                    )}
                  </td>
                  {viewMode === 'store' && <td className="px-6 py-4 text-gray-600">{row.city}</td>}
                  <td className={`px-6 py-4 text-right font-bold ${isSummary ? 'text-gray-900' : 'text-gray-900'}`}>{row.revenue?.toLocaleString()}</td>
                  <td className={`px-6 py-4 text-right bg-gray-50/30`}>
                    <div className={`font-bold ${row.netProfit >= 0 ? 'text-[#a40035]' : 'text-green-600'}`}>
                      {row.netProfit?.toLocaleString()}
                    </div>
                    {(() => {
                      const profitMargin = row.revenue ? (row.netProfit / row.revenue * 100) : 0;
                      return (
                        <div className={`text-xs mt-1 font-medium ${profitMargin > 6 ? 'text-[#a40035]' : 'text-green-600'}`}>
                          {profitMargin.toFixed(1)}%
                        </div>
                      );
                    })()}
                  </td>
                  {categories.map(cat => {
                    const item = row.costs.find(c => c.name === cat);
                    const percent = baseCost ? (item?.value / baseCost * 100).toFixed(2) : 0;
                    const isInteractive = ['人工成本', '变动成本'].includes(cat);
                    
                    return (
                      <td 
                        key={cat} 
                        className={`px-6 py-4 text-right ${isInteractive ? 'cursor-pointer hover:bg-blue-50/50 transition-colors' : ''}`}
                        onClick={() => handleCellClick(viewMode === 'city' ? row.name : row.store, item)}
                      >
                        <div className={`font-medium ${isInteractive ? 'text-blue-600 underline decoration-blue-200 decoration-dashed underline-offset-4' : 'text-gray-800'}`}>
                           {item?.value?.toLocaleString()}
                        </div>
                        <div className={`text-xs mt-1 inline-block px-1.5 py-0.5 rounded ${isSummary ? 'text-gray-600 bg-gray-200' : 'text-gray-500 bg-gray-100'}`}>
                          {percent}%
                        </div>
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {renderModal()}
    </div>
  );
};

export default CostStructureContainer;
