import React, { useState, useEffect } from 'react';
import axios from 'axios';

const CostStructureContainer = () => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [viewMode, setViewMode] = useState('city'); // 'city' or 'store'
  const [selectedCityFilter, setSelectedCityFilter] = useState('全部'); // New filter for store view
  const [error, setError] = useState(null);
  const [detailModal, setDetailModal] = useState(null); // { title: string, items: Array, total: number }

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const response = await axios.get('/api/cost-structure');
      if (response.data.status === 'success') {
        const processedData = processData(response.data.data);
        setData(processedData);
      } else {
        setError(response.data.message);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const processData = (apiData) => {
    if (!apiData) return null;
    const { categories, city_dimension, store_dimension } = apiData;

    // 1. Update Categories List
    // Remove Masseur and Manager, insert Artificial Cost
    const newCategories = categories.filter(c => c !== '推拿师成本' && c !== '客户经理成本');
    // Find index to insert "人工成本" to maintain relative order (usually after Service Fee)
    // If "推拿师成本" was present, use its index.
    const insertIndex = categories.indexOf('推拿师成本');
    if (insertIndex !== -1) {
      newCategories.splice(insertIndex, 0, '人工成本');
    } else {
      newCategories.push('人工成本');
    }

    // 2. Transform Rows
    const transformRow = (row) => {
      const masseur = row.costs.find(c => c.name === '推拿师成本');
      const manager = row.costs.find(c => c.name === '客户经理成本');
      
      const artificialValue = (masseur?.value || 0) + (manager?.value || 0);
      
      const artificialItem = {
        name: '人工成本',
        value: artificialValue,
        // Store sub-categories for the modal
        subCategories: [
          { 
            name: '推拿师成本', 
            value: masseur?.value || 0, 
            details: masseur?.details || [] 
          },
          { 
            name: '客户经理成本', 
            value: manager?.value || 0, 
            details: manager?.details || [] 
          }
        ]
      };

      // Remove old items, add new item
      const newCosts = row.costs.filter(c => c.name !== '推拿师成本' && c.name !== '客户经理成本');
      newCosts.push(artificialItem);

      return {
        ...row,
        costs: newCosts
      };
    };

    return {
      categories: newCategories,
      city_dimension: city_dimension.map(transformRow),
      store_dimension: store_dimension.map(transformRow)
    };
  };

  if (loading) return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 flex flex-col items-center justify-center space-y-4 mb-6">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#a40035]"></div>
      <p className="text-gray-500 text-sm">正在通过 DeepSeek 分析成本结构...</p>
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

  // Helper to calculate percentage based on "ServiceFee + Artificial + Variable"
  // Note: We need to sum these specific categories.
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
    // Only show modal for complex categories
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

    if (costItem.name === '人工成本') {
      // Nested Display
      content = (
        <div className="space-y-6">
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
               <div className="pl-2 border-l-2 border-gray-100 space-y-1">
                 {sub.details.sort((a, b) => b.value - a.value).map(detail => renderDetailItem(detail, sub.value))}
               </div>
            </div>
          ))}
        </div>
      );
    } else {
      // Flat Display (e.g. Variable Cost)
      content = (
        <div className="space-y-3">
           {costItem.details.sort((a, b) => b.value - a.value).map(item => renderDetailItem(item, total))}
        </div>
      );
    }

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={() => setDetailModal(null)}>
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200" onClick={e => e.stopPropagation()}>
          <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-gray-50">
             <h3 className="font-bold text-gray-800">{detailModal.title}</h3>
             <button onClick={() => setDetailModal(null)} className="text-gray-400 hover:text-gray-600">
               <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
             </button>
          </div>
          <div className="max-h-[60vh] overflow-y-auto p-4">
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
            成本结构分析
          </h3>
          <p className="text-xs text-gray-500 mt-1 ml-3">基于 DeepSeek 智能分类解析</p>
        </div>
        
        <div className="flex items-center gap-3">
          {viewMode === 'store' && (
            <select 
              value={selectedCityFilter}
              onChange={(e) => setSelectedCityFilter(e.target.value)}
              className="text-sm border-gray-200 rounded-lg focus:ring-[#a40035] focus:border-[#a40035]"
            >
              {cityOptions.map(city => (
                <option key={city} value={city}>{city}</option>
              ))}
            </select>
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
