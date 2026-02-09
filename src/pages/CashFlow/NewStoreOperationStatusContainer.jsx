import React from 'react';
import useFetchData from '../../hooks/useFetchData';
import useTableSorting from '../../components/Common/useTableSorting';

const NewStoreOperationStatusContainer = () => {
  const { data, loading, error, fetchData } = useFetchData('getNewStoreOperationStatus', []);

  const columns = [
    { key: '城市', label: '城市', dataIndex: '城市' },
    { key: '门店名称', label: '门店名称', dataIndex: '门店名称' },
    { key: '门店编码', label: '门店编码', dataIndex: '门店编码' },
    { key: '开业日期', label: '开业日期', dataIndex: '开业日期' },
    { key: '城市经理', label: '城市经理', dataIndex: '城市经理' },
    { key: '技术副总', label: '技术副总', dataIndex: '技术副总' },
    { key: '爬坡期长度', label: '爬坡期长度', dataIndex: '爬坡期长度' },
    { key: '当前爬坡期', label: '当前爬坡期', dataIndex: '当前爬坡期' },
    { key: '现金流目标值', label: '现金流目标值', dataIndex: '现金流目标值' },
    { key: '爬坡期现金流实际值', label: '爬坡期现金流实际值', dataIndex: '爬坡期现金流实际值' },
    { key: '现金流差异', label: '现金流差异', dataIndex: '现金流差异' },
    { key: '营销费预算', label: '营销费预算', dataIndex: '营销费预算' },
    { key: '营销费合计', label: '营销费合计', dataIndex: '营销费合计' },
    { key: '营销费使用率', label: '营销费使用率', dataIndex: '营销费使用率' },
    { key: '广告费', label: '广告费', dataIndex: '广告费' },
    { key: '团购优惠', label: '团购优惠', dataIndex: '团购优惠' },
    { key: '线下广告', label: '线下广告', dataIndex: '线下广告' },
    { key: '新客优惠', label: '新客优惠', dataIndex: '新客优惠' },
    { key: '布展', label: '布展', dataIndex: '布展' },
    { key: '推拿师提成', label: '推拿师提成', dataIndex: '推拿师提成' },
    { key: '激励费预算', label: '激励费预算', dataIndex: '激励费预算' },
    { key: '激励费实际', label: '激励费实际', dataIndex: '激励费实际' },
    { key: '激励费使用率', label: '激励费使用率', dataIndex: '激励费使用率' },
    { key: '激励费差异', label: '激励费差异', dataIndex: '激励费差异' },
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
                            className="px-6 py-3 cursor-pointer hover:bg-gray-100 whitespace-nowrap group"
                            onClick={() => handleSort(col.key)}
                        >
                            <div className="flex items-center gap-1">
                                {col.label}
                                {sortConfig.key === col.key && (
                                    <span className="text-[#a40035]">
                                        {sortConfig.direction === 'asc' ? '▲' : '▼'}
                                    </span>
                                )}
                                {(!sortConfig.key || sortConfig.key !== col.key) && (
                                    <span className="text-gray-300 opacity-0 group-hover:opacity-100">
                                        ↕
                                    </span>
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
                            <td className="px-6 py-4 text-gray-500 text-xs">{item['门店编码']}</td>
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
                            <td className="px-6 py-4 text-right font-mono">{formatCurrency(item['营销费预算'])}</td>
                            <td className="px-6 py-4 text-right font-mono">{formatCurrency(item['营销费合计'])}</td>
                            <td className="px-6 py-4 text-right font-mono text-gray-500">{item['营销费使用率'] || '-'}</td>
                            <td className="px-6 py-4 text-right font-mono">{formatCurrency(item['广告费'])}</td>
                            <td className="px-6 py-4 text-right font-mono">{formatCurrency(item['团购优惠'])}</td>
                            <td className="px-6 py-4 text-right font-mono">{formatCurrency(item['线下广告'])}</td>
                            <td className="px-6 py-4 text-right font-mono">{formatCurrency(item['新客优惠'])}</td>
                            <td className="px-6 py-4 text-right font-mono">{formatCurrency(item['布展'])}</td>
                            <td className="px-6 py-4 text-right font-mono">{formatCurrency(item['推拿师提成'])}</td>
                            <td className="px-6 py-4 text-right font-mono">{formatCurrency(item['激励费预算'])}</td>
                            <td className="px-6 py-4 text-right font-mono">{formatCurrency(item['激励费实际'])}</td>
                            <td className="px-6 py-4 text-right font-mono text-gray-500">{item['激励费使用率'] || '-'}</td>
                            <td className={`px-6 py-4 text-right font-mono font-bold ${item['激励费差异'] > 0 ? 'text-red-600' : 'text-green-600'}`}>
                                {formatCurrency(item['激励费差异'])}
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
