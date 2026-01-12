import React from 'react';
import BusinessTargets from '../../config/businessTargets';

const HeadquartersCostBudget = () => {
  const data = BusinessTargets.profit.headquartersBudget.financial_report;
  
  if (!data) return null;

  const { labor_costs, fixed_costs, summary } = data;

  const formatCurrency = (val) => {
    return val.toLocaleString('zh-CN', { maximumFractionDigits: 2 });
  };

  const renderSection = (sectionData) => (
    <div className="flex flex-col space-y-4">
      <h4 className="text-md font-bold text-gray-700 border-b border-gray-100 pb-2">
        {sectionData.category}
      </h4>
      <div className="space-y-2">
        {sectionData.items.map((item, index) => (
          <div key={index} className="flex justify-between items-center text-sm hover:bg-gray-50 p-1 rounded transition-colors">
            <span className="text-gray-600">{item.name}</span>
            <div className="flex items-center gap-4">
              <span className="font-medium text-gray-800 w-28 text-right">{formatCurrency(item.value)}</span>
              <span className="text-gray-500 w-16 text-right text-xs bg-gray-100 rounded px-1">{item.ratio}</span>
            </div>
          </div>
        ))}
      </div>
      <div className="flex justify-between items-center pt-3 border-t border-gray-100 mt-2 font-bold text-sm bg-gray-50 p-3 rounded-lg">
        <span className="text-gray-800">小计</span>
        <div className="flex items-center gap-4">
          <span className="text-[#a40035] w-28 text-right">{formatCurrency(sectionData.subtotal.value)}</span>
          <span className="text-gray-500 w-16 text-right text-xs">{sectionData.subtotal.ratio}</span>
        </div>
      </div>
    </div>
  );

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
      <h3 className="text-lg font-bold text-gray-800 mb-6 border-l-4 border-[#a40035] pl-3">
        总部成本预算
      </h3>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {renderSection(labor_costs)}
        {renderSection(fixed_costs)}
      </div>

      <div className="grid grid-cols-2 gap-4 bg-gray-50 rounded-lg p-6 border border-gray-100">
        <div className="flex flex-col items-center justify-center border-r border-gray-200">
          <span className="text-sm text-gray-500 mb-2">总支出</span>
          <span className="text-2xl font-bold text-gray-800 tracking-tight">
            {formatCurrency(summary.total_expenditure)}
          </span>
        </div>
        <div className="flex flex-col items-center justify-center">
          <span className="text-sm text-gray-500 mb-2">总部利润</span>
          <span className={`text-2xl font-bold tracking-tight ${summary.headquarters_profit >= 0 ? 'text-green-600' : 'text-red-500'}`}>
            {formatCurrency(summary.headquarters_profit)}
          </span>
        </div>
      </div>
    </div>
  );
};

export default HeadquartersCostBudget;
