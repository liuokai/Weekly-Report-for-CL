import React from 'react';
import useFetchData from '../../hooks/useFetchData';
import useTableSorting from '../../components/Common/useTableSorting';

const IconStore = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7"/>
    <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/>
    <path d="M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4"/>
    <path d="M2 7h20"/>
    <path d="M22 7v3a2 2 0 0 1-2 2v0a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 16 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 12 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 8 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 4 12v0a2 2 0 0 1-2-2V7"/>
  </svg>
);

const NewStoreOperationStatusContainer = () => {
  const { data, loading, error, fetchData } = useFetchData('getNewStoreOperationStatus', []);

  const columns = [
    { key: '城市', label: '城市' },
    { key: '门店名称', label: '门店名称' },
    { key: '开业日期', label: '开业日期' },
    { key: '城市经理', label: '城市经理' },
    { key: '技术副总', label: '技术副总' },
    { key: '爬坡期长度', label: '爬坡期长度' },
    { key: '当前爬坡期', label: '当前爬坡期' },
    { key: '现金流目标值', label: '现金流目标值' },
    { key: '爬坡期现金流实际值', label: '爬坡期现金流实际值' },
    { key: '现金流差异', label: '现金流差异' },
  ];

  const { sortedData, sortConfig, handleSort } = useTableSorting(columns, data || []);

  const formatCurrency = (val) => {
    if (val === null || val === undefined) return '-';
    return Number(val).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };
  
  const formatDate = (dateStr) => {
      if (!dateStr) return '-';
      return dateStr.split('T')[0];
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden mb-6">
      <div className="px-6 py-4 border-b border-gray-100 bg-[#a40035]/5 flex items-center justify-between">
         <h2 className="text-lg font-bold text-[#a40035] flex items-center gap-2">
           <IconStore />
           新店经营情况总结
           <span className="ml-2 text-sm font-normal bg-[#a40035]/10 text-[#a40035] px-2 py-0.5 rounded-full">
             {loading ? '...' : `${data?.length || 0} 家`}
           </span>
         </h2>
         {error && (
            <button onClick={() => fetchData()} className="text-xs text-[#a40035] hover:text-[#8a002d] underline">
            重试
            </button>
         )}
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left text-gray-500">
            <thead className="text-xs text-gray-700 uppercase bg-gray-50 border-b">
                <tr>
                    {columns.map((col) => (
                        <th 
                            key={col.key} 
                            scope="col" 
                            className="px-6 py-3 cursor-pointer hover:bg-gray-100 whitespace-nowrap"
                            onClick={() => handleSort(col.key)}
                        >
                            <div className="flex items-center gap-1">
                                {col.label}
                                {sortConfig.key === col.key && (
                                    <span className="text-gray-400">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                                )}
                            </div>
                        </th>
                    ))}
                </tr>
            </thead>
            <tbody>
                {loading ? (
                    <tr><td colSpan={columns.length} className="px-6 py-8 text-center text-gray-400">加载中...</td></tr>
                ) : sortedData.length === 0 ? (
                    <tr><td colSpan={columns.length} className="px-6 py-8 text-center text-gray-400">暂无数据</td></tr>
                ) : (
                    sortedData.map((item, index) => (
                        <tr key={index} className="bg-white border-b hover:bg-gray-50/50">
                            <td className="px-6 py-4 font-medium text-gray-900">{item['城市']}</td>
                            <td className="px-6 py-4 text-gray-900">{item['门店名称']}</td>
                            <td className="px-6 py-4 whitespace-nowrap">{formatDate(item['开业日期'])}</td>
                            <td className="px-6 py-4">{item['城市经理'] || '-'}</td>
                            <td className="px-6 py-4">{item['技术副总'] || '-'}</td>
                            <td className="px-6 py-4 text-center">{item['爬坡期长度']}</td>
                            <td className="px-6 py-4 text-center">{item['当前爬坡期']}</td>
                            <td className="px-6 py-4 text-right font-mono">{formatCurrency(item['现金流目标值'])}</td>
                            <td className="px-6 py-4 text-right font-mono">{formatCurrency(item['爬坡期现金流实际值'])}</td>
                            <td className={`px-6 py-4 text-right font-mono font-bold ${item['现金流差异'] < 0 ? 'text-red-600' : 'text-green-600'}`}>
                                {formatCurrency(item['现金流差异'])}
                            </td>
                        </tr>
                    ))
                )}
            </tbody>
        </table>
      </div>
    </div>
  );
};

export default NewStoreOperationStatusContainer;
