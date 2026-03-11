import React, { useState, useEffect } from 'react';
import useFetchData from '../../hooks/useFetchData';
import { BusinessTargets } from '../../config/businessTargets';
import dataLoader from '../../utils/dataLoader';

const HeadquartersCostBudget = () => {
  const [data, setData] = useState(null);
  const [turnoverTarget, setTurnoverTarget] = useState(BusinessTargets.turnover.annualTarget);
  
  // 从接口获取总部月度利润数据
  const { data: profitData, loading, error } = useFetchData('getHeadquartersProfitMonthly');

  // 获取营业额目标数据
  useEffect(() => {
    const fetchTurnoverTarget = async () => {
      try {
        const dataResult = await dataLoader.fetchData('getTurnoverOverview', []);
        if (dataResult && dataResult.status === 'success' && dataResult.data && dataResult.data.length > 0) {
          const sortedData = [...dataResult.data].sort((a, b) => b.year - a.year);
          const currentYearData = sortedData[0];
          
          // 优先使用后端返回的 annual_target，否则回退到本地配置
          let annualTargetInWan = BusinessTargets.turnover.annualTarget;
          if (currentYearData && currentYearData.annual_target != null) {
            // 后端已经按万元计算并取整
            annualTargetInWan = Math.floor(parseFloat(currentYearData.annual_target) / 10000);
          }
          setTurnoverTarget(annualTargetInWan);
        }
      } catch (err) {
        console.error('获取营业额目标失败:', err);
        // 保持使用默认值
      }
    };

    fetchTurnoverTarget();
  }, []);

  useEffect(() => {
    if (!profitData || profitData.length === 0) return;

    // 汇总所有月份的数据
    const totals = profitData.reduce((acc, row) => {
      acc.management_income += Number(row.total_management_income || 0);
      acc.rental_income += Number(row.total_rental_income || 0);
      acc.goods_sales_income += Number(row.total_goods_sales_income || 0);
      acc.total_income += Number(row.total_income || 0);
      acc.massage_home_budget += Number(row.total_massage_home_budget || 0);
      acc.user_center_budget += Number(row.total_user_center_budget || 0);
      acc.investment_financing_budget += Number(row.total_investment_financing_budget || 0);
      acc.digital_platform_budget += Number(row.total_digital_platform_budget || 0);
      acc.labor_cost += Number(row.total_labor_cost || 0);
      acc.rent_fee += Number(row.total_rent_fee || 0);
      acc.depreciation_fee += Number(row.total_depreciation_fee || 0);
      acc.recruitment_channel_fee += Number(row.total_recruitment_channel_fee || 0);
      acc.office_fee += Number(row.total_office_fee || 0);
      acc.utilities_fee += Number(row.total_utilities_fee || 0);
      acc.server_leasing_fee += Number(row.total_server_leasing_fee || 0);
      acc.handling_fee += Number(row.total_handling_fee || 0);
      acc.tax_and_surcharge += Number(row.total_tax_and_surcharge || 0);
      acc.fixed_cost += Number(row.total_fixed_cost || 0);
      acc.total_cost += Number(row.total_cost || 0);
      acc.total_profit += Number(row.total_profit || 0);
      return acc;
    }, {
      management_income: 0,
      rental_income: 0,
      goods_sales_income: 0,
      total_income: 0,
      massage_home_budget: 0,
      user_center_budget: 0,
      investment_financing_budget: 0,
      digital_platform_budget: 0,
      labor_cost: 0,
      rent_fee: 0,
      depreciation_fee: 0,
      recruitment_channel_fee: 0,
      office_fee: 0,
      utilities_fee: 0,
      server_leasing_fee: 0,
      handling_fee: 0,
      tax_and_surcharge: 0,
      fixed_cost: 0,
      total_cost: 0,
      total_profit: 0
    });

    // 计算预算收入：营业额目标 * 0.025
    const budgetIncome = turnoverTarget * 10000 * 0.025; // 转换为元并乘以0.025

    // 计算占比(相对于总收入)
    const calcRatio = (value) => {
      if (!totals.total_income || totals.total_income === 0) return '0.0%';
      return ((value / totals.total_income) * 100).toFixed(1) + '%';
    };

    // 构建数据结构
    const formattedData = {
      budget_income: {
        category: "预算收入",
        items: [
          { name: "今年目标值", value: budgetIncome, ratio: calcRatio(budgetIncome) }
        ],
        subtotal: { value: budgetIncome, ratio: calcRatio(budgetIncome) }
      },
      income: {
        category: "实际收入",
        items: [
          { name: "管理费收入", value: totals.management_income, ratio: calcRatio(totals.management_income) },
          { name: "租金收入", value: totals.rental_income, ratio: calcRatio(totals.rental_income) },
          { name: "商品销售收入", value: totals.goods_sales_income, ratio: calcRatio(totals.goods_sales_income) }
        ],
        subtotal: { value: totals.total_income, ratio: calcRatio(totals.total_income) }
      },
      labor_costs: {
        category: "人工成本",
        items: [
          { name: "人工成本-投融资管理", value: totals.investment_financing_budget, ratio: calcRatio(totals.investment_financing_budget) },
          { name: "人工成本-推拿之家", value: totals.massage_home_budget, ratio: calcRatio(totals.massage_home_budget) },
          { name: "人工成本-用户中心", value: totals.user_center_budget, ratio: calcRatio(totals.user_center_budget) },
          { name: "人工成本-IT中心", value: totals.digital_platform_budget, ratio: calcRatio(totals.digital_platform_budget) }
        ],
        subtotal: { value: totals.labor_cost, ratio: calcRatio(totals.labor_cost) }
      },
      fixed_costs: {
        category: "固定成本",
        items: [
          { name: "房租费", value: totals.rent_fee, ratio: calcRatio(totals.rent_fee) },
          { name: "折旧费", value: totals.depreciation_fee, ratio: calcRatio(totals.depreciation_fee) },
          { name: "招聘费", value: totals.recruitment_channel_fee, ratio: calcRatio(totals.recruitment_channel_fee) },
          { name: "办公费", value: totals.office_fee, ratio: calcRatio(totals.office_fee) },
          { name: "水电费", value: totals.utilities_fee, ratio: calcRatio(totals.utilities_fee) },
          { name: "服务器租赁", value: totals.server_leasing_fee, ratio: calcRatio(totals.server_leasing_fee) },
          { name: "手续费", value: totals.handling_fee, ratio: calcRatio(totals.handling_fee) },
          { name: "税金", value: totals.tax_and_surcharge, ratio: calcRatio(totals.tax_and_surcharge) }
        ],
        subtotal: { value: totals.fixed_cost, ratio: calcRatio(totals.fixed_cost) }
      },
      summary: {
        total_expenditure: totals.total_cost,
        headquarters_profit: totals.total_profit
      }
    };

    setData(formattedData);
  }, [profitData, turnoverTarget]);

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
        <div className="text-center text-gray-500">加载中...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
        <div className="text-center text-red-500">加载失败: {error}</div>
      </div>
    );
  }
  
  if (!data) return null;

  const { budget_income, income, labor_costs, fixed_costs, summary } = data;

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
              {sectionData.category !== "预算收入" && sectionData.category !== "实际收入" && (
                <span className="text-gray-500 w-16 text-right text-xs bg-gray-100 rounded px-1">{item.ratio}</span>
              )}
            </div>
          </div>
        ))}
      </div>
      <div className="flex justify-between items-center pt-3 border-t border-gray-100 mt-2 font-bold text-sm bg-gray-50 p-3 rounded-lg">
        <span className="text-gray-800">小计</span>
        <div className="flex items-center gap-4">
          <span className="text-[#a40035] w-28 text-right">{formatCurrency(sectionData.subtotal.value)}</span>
          {sectionData.category !== "预算收入" && sectionData.category !== "实际收入" && (
            <span className="text-gray-500 w-16 text-right text-xs">{sectionData.subtotal.ratio}</span>
          )}
        </div>
      </div>
    </div>
  );

  // 专门渲染收入模块（实际收入 + 预算收入）
  const renderIncomeSection = (budgetIncomeData, actualIncomeData) => (
    <div className="flex flex-col space-y-6">
      <h4 className="text-md font-bold text-gray-700 border-b border-gray-100 pb-2">
        收入概览
      </h4>
      
      {/* 实际收入部分 */}
      <div className="space-y-2">
        <h5 className="text-sm font-semibold text-gray-600 bg-gray-50 px-2 py-1 rounded">
          {actualIncomeData.category}
        </h5>
        {actualIncomeData.items.map((item, index) => (
          <div key={index} className="flex justify-between items-center text-sm hover:bg-gray-50 p-1 rounded transition-colors ml-2">
            <span className="text-gray-600">{item.name}</span>
            <span className="font-medium text-gray-800 w-28 text-right">{formatCurrency(item.value)}</span>
          </div>
        ))}
        <div className="flex justify-between items-center pt-2 border-t border-gray-200 mt-2 font-bold text-sm bg-gray-50 p-2 rounded ml-2">
          <span className="text-gray-800">小计</span>
          <span className="text-[#a40035] w-28 text-right">{formatCurrency(actualIncomeData.subtotal.value)}</span>
        </div>
      </div>

      {/* 预算收入部分 */}
      <div className="space-y-2">
        <h5 className="text-sm font-semibold text-gray-600 bg-gray-50 px-2 py-1 rounded">
          {budgetIncomeData.category}
        </h5>
        {budgetIncomeData.items.map((item, index) => (
          <div key={index} className="flex justify-between items-center text-sm hover:bg-gray-50 p-1 rounded transition-colors ml-2">
            <span className="text-gray-600">{item.name}</span>
            <span className="font-medium text-gray-800 w-28 text-right">{formatCurrency(item.value)}</span>
          </div>
        ))}
        <div className="flex justify-between items-center pt-2 border-t border-gray-200 mt-2 font-bold text-sm bg-gray-50 p-2 rounded ml-2">
          <span className="text-gray-800">小计</span>
          <span className="text-[#a40035] w-28 text-right">{formatCurrency(budgetIncomeData.subtotal.value)}</span>
        </div>
      </div>
    </div>
  );

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
      <h3 className="text-lg font-bold text-gray-800 mb-6 border-l-4 border-[#a40035] pl-3">
        总部成本预算
      </h3>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {renderIncomeSection(budget_income, income)}
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
