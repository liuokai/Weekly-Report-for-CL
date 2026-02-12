import React from 'react';
import useFetchData from '../../hooks/useFetchData';
import useTableSorting from '../../components/Common/useTableSorting';

const NewStoreOperationStatusContainer = () => {
  const { data, loading, error, fetchData } = useFetchData('getNewStoreOperationStatus', []);

  const columns = [
    { key: 'city_name', label: '城市', dataIndex: 'city_name' },
    { key: 'store_name', label: '门店名称', dataIndex: 'store_name' },
    { key: 'store_code', label: '门店编码', dataIndex: 'store_code' },
    { key: 'opening_date', label: '开业日期', dataIndex: 'opening_date' },
    { key: 'city_manager_name', label: '城市经理', dataIndex: 'city_manager_name' },
    { key: 'tech_vice_president_name', label: '技术副总', dataIndex: 'tech_vice_president_name' },
    { key: 'ramp_up_period_months', label: '爬坡期长度', dataIndex: 'ramp_up_period_months' },
    { key: 'current_ramp_up_month_index', label: '当前爬坡期', dataIndex: 'current_ramp_up_month_index' },
    { key: 'cash_flow_budget_total', label: '现金流目标值', dataIndex: 'cash_flow_budget_total' },
    { key: 'cash_flow_actual_to_date', label: '爬坡期现金流实际值', dataIndex: 'cash_flow_actual_to_date' },
    { key: 'cash_flow_variance', label: '现金流差异', dataIndex: 'cash_flow_variance' },
    { key: 'marketing_budget_total', label: '营销费预算', dataIndex: 'marketing_budget_total' },
    { key: 'marketing_actual_total', label: '营销费合计', dataIndex: 'marketing_actual_total' },
    { key: 'marketing_usage_ratio_display', label: '营销费使用率', dataIndex: 'marketing_usage_ratio_display' },
    { key: 'ad_fee_actual', label: '广告费', dataIndex: 'ad_fee_actual' },
    { key: 'group_buy_discount_actual', label: '团购优惠', dataIndex: 'group_buy_discount_actual' },
    { key: 'offline_ad_fee_actual', label: '线下广告', dataIndex: 'offline_ad_fee_actual' },
    { key: 'new_guest_discount_actual', label: '新客优惠', dataIndex: 'new_guest_discount_actual' },
    { key: 'exhibition_fee_actual', label: '布展', dataIndex: 'exhibition_fee_actual' },
    { key: 'masseur_commission_actual', label: '推拿师提成', dataIndex: 'masseur_commission_actual' },
    { key: 'incentive_budget_total', label: '激励费预算', dataIndex: 'incentive_budget_total' },
    { key: 'incentive_actual_total', label: '激励费实际', dataIndex: 'incentive_actual_total' },
    { key: 'incentive_usage_ratio_display', label: '激励费使用率', dataIndex: 'incentive_usage_ratio_display' },
    { key: 'incentive_variance', label: '激励费差异', dataIndex: 'incentive_variance' },
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
                            <td className="px-6 py-4 font-medium text-gray-900">{item['city_name']}</td>
                            <td className="px-6 py-4 text-gray-900">{item['store_name']}</td>
                            <td className="px-6 py-4 text-gray-500 text-xs">{item['store_code']}</td>
                            <td className="px-6 py-4 whitespace-nowrap">{formatDate(item['opening_date'])}</td>
                            <td className="px-6 py-4">{item['city_manager_name'] || '-'}</td>
                            <td className="px-6 py-4">{item['tech_vice_president_name'] || '-'}</td>
                            <td className="px-6 py-4 text-center">{item['ramp_up_period_months']}</td>
                            <td className="px-6 py-4 text-center">{item['current_ramp_up_month_index']}</td>
                            <td className="px-6 py-4 text-right font-mono">{formatCurrency(item['cash_flow_budget_total'])}</td>
                            <td className="px-6 py-4 text-right font-mono">{formatCurrency(item['cash_flow_actual_to_date'])}</td>
                            <td className={`px-6 py-4 text-right font-mono font-bold ${item['cash_flow_variance'] < 0 ? 'text-red-600' : 'text-green-600'}`}>
                                {formatCurrency(item['cash_flow_variance'])}
                            </td>
                            <td className="px-6 py-4 text-right font-mono">{formatCurrency(item['marketing_budget_total'])}</td>
                            <td className="px-6 py-4 text-right font-mono">{formatCurrency(item['marketing_actual_total'])}</td>
                            <td className="px-6 py-4 text-right font-mono text-gray-500">{item['marketing_usage_ratio_display'] || '-'}</td>
                            <td className="px-6 py-4 text-right font-mono">{formatCurrency(item['ad_fee_actual'])}</td>
                            <td className="px-6 py-4 text-right font-mono">{formatCurrency(item['group_buy_discount_actual'])}</td>
                            <td className="px-6 py-4 text-right font-mono">{formatCurrency(item['offline_ad_fee_actual'])}</td>
                            <td className="px-6 py-4 text-right font-mono">{formatCurrency(item['new_guest_discount_actual'])}</td>
                            <td className="px-6 py-4 text-right font-mono">{formatCurrency(item['exhibition_fee_actual'])}</td>
                            <td className="px-6 py-4 text-right font-mono">{formatCurrency(item['masseur_commission_actual'])}</td>
                            <td className="px-6 py-4 text-right font-mono">{formatCurrency(item['incentive_budget_total'])}</td>
                            <td className="px-6 py-4 text-right font-mono">{formatCurrency(item['incentive_actual_total'])}</td>
                            <td className="px-6 py-4 text-right font-mono text-gray-500">{item['incentive_usage_ratio_display'] || '-'}</td>
                            <td className={`px-6 py-4 text-right font-mono font-bold ${item['incentive_variance'] > 0 ? 'text-red-600' : 'text-green-600'}`}>
                                {formatCurrency(item['incentive_variance'])}
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
