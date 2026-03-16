import React, { useState, useEffect } from 'react';
import useFetchData from '../../hooks/useFetchData';
import { BusinessTargets } from '../../config/businessTargets';
import dataLoader from '../../utils/dataLoader';

const HeadquartersCostBudgetTable = () => {
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
          
          let annualTargetInWan = BusinessTargets.turnover.annualTarget;
          if (currentYearData && currentYearData.annual_target != null) {
            annualTargetInWan = Math.floor(parseFloat(currentYearData.annual_target) / 10000);
          }
          setTurnoverTarget(annualTargetInWan);
        }
      } catch (err) {
        console.error('获取营业额目标失败:', err);
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
    const budgetIncome = Number((turnoverTarget * 10000 * 0.025).toFixed(2));

    // 计算占比(相对于总收入)
    const calcRatio = (value) => {
      if (!totals.total_income || totals.total_income === 0) return 0;
      return ((value / totals.total_income) * 100);
    };

    setData({
      totals,
      budgetIncome,
      calcRatio
    });
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

  const { totals, calcRatio } = data;

  const formatNumber = (val) => {
    return Math.round(val).toLocaleString('zh-CN');
  };

  const formatPercent = (val) => {
    return val.toFixed(1) + '%';
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-6">
      <div className="p-6 border-b border-gray-100 bg-gray-50/50">
        <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
          <span className="w-1 h-5 bg-[#a40035] rounded-full"></span>
          总部利润汇总
        </h3>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-100 border-b border-gray-300">
              <th className="px-6 py-3 text-center font-bold text-gray-800 border-r border-gray-300 w-[200px]">标题/分类</th>
              <th className="px-6 py-3 text-center font-bold text-gray-800 border-r border-gray-300 w-[200px]">项目</th>
              <th className="px-6 py-3 text-center font-bold text-gray-800 border-r border-gray-300 w-[200px]">金额</th>
              <th className="px-6 py-3 text-center font-bold text-gray-800 w-[150px]">比例</th>
            </tr>
          </thead>
          <tbody>
            {/* 收入部分 */}
            <tr className="border-b border-gray-200">
              <td rowSpan={4} className="px-6 py-4 text-center font-semibold text-gray-700 border-r border-gray-300 bg-gray-50">
                收入
              </td>
              <td className="px-6 py-4 text-gray-700 border-r border-gray-300">服务费收入</td>
              <td className="px-6 py-4 text-right font-mono text-gray-800">{formatNumber(totals.management_income)}</td>
              <td className="px-6 py-4 text-center text-gray-500">-</td>
            </tr>
            <tr className="border-b border-gray-200">
              <td className="px-6 py-4 text-gray-700 border-r border-gray-300">租金收入</td>
              <td className="px-6 py-4 text-right font-mono text-gray-800">{formatNumber(totals.rental_income)}</td>
              <td className="px-6 py-4 text-center text-gray-500">-</td>
            </tr>
            <tr className="border-b border-gray-200">
              <td className="px-6 py-4 text-gray-700 border-r border-gray-300">商品销售收入</td>
              <td className="px-6 py-4 text-right font-mono text-gray-800">{formatNumber(totals.goods_sales_income)}</td>
              <td className="px-6 py-4 text-center text-gray-500">-</td>
            </tr>
            <tr className="border-b-2 border-gray-300 bg-gray-50">
              <td className="px-6 py-4 font-bold text-gray-800 border-r border-gray-300">小计</td>
              <td className="px-6 py-4 text-right font-mono font-bold text-[#a40035]">{formatNumber(totals.total_income)}</td>
              <td className="px-6 py-4 text-center text-gray-500">-</td>
            </tr>

            {/* 人工成本部分 */}
            <tr className="border-b border-gray-200">
              <td rowSpan={5} className="px-6 py-4 text-center font-semibold text-gray-700 border-r border-gray-300 bg-gray-50">
                人工成本
              </td>
              <td className="px-6 py-4 text-gray-700 border-r border-gray-300">人工成本-投融资管</td>
              <td className="px-6 py-4 text-right font-mono text-gray-800">{formatNumber(totals.investment_financing_budget)}</td>
              <td className="px-6 py-4 text-center font-mono text-gray-600">{formatPercent(calcRatio(totals.investment_financing_budget))}</td>
            </tr>
            <tr className="border-b border-gray-200">
              <td className="px-6 py-4 text-gray-700 border-r border-gray-300">人工成本-推拿之家</td>
              <td className="px-6 py-4 text-right font-mono text-gray-800">{formatNumber(totals.massage_home_budget)}</td>
              <td className="px-6 py-4 text-center font-mono text-gray-600">{formatPercent(calcRatio(totals.massage_home_budget))}</td>
            </tr>
            <tr className="border-b border-gray-200">
              <td className="px-6 py-4 text-gray-700 border-r border-gray-300">人工成本-用户中心</td>
              <td className="px-6 py-4 text-right font-mono text-gray-800">{formatNumber(totals.user_center_budget)}</td>
              <td className="px-6 py-4 text-center font-mono text-gray-600">{formatPercent(calcRatio(totals.user_center_budget))}</td>
            </tr>
            <tr className="border-b border-gray-200">
              <td className="px-6 py-4 text-gray-700 border-r border-gray-300">人工成本-IT中心</td>
              <td className="px-6 py-4 text-right font-mono text-gray-800">{formatNumber(totals.digital_platform_budget)}</td>
              <td className="px-6 py-4 text-center font-mono text-gray-600">{formatPercent(calcRatio(totals.digital_platform_budget))}</td>
            </tr>
            <tr className="border-b-2 border-gray-300 bg-gray-50">
              <td className="px-6 py-4 font-bold text-gray-800 border-r border-gray-300">小计</td>
              <td className="px-6 py-4 text-right font-mono font-bold text-[#a40035]">{formatNumber(totals.labor_cost)}</td>
              <td className="px-6 py-4 text-center font-mono font-bold text-[#a40035]">{formatPercent(calcRatio(totals.labor_cost))}</td>
            </tr>

            {/* 固定成本部分 */}
            <tr className="border-b border-gray-200">
              <td rowSpan={9} className="px-6 py-4 text-center font-semibold text-gray-700 border-r border-gray-300 bg-gray-50">
                固定成本
              </td>
              <td className="px-6 py-4 text-gray-700 border-r border-gray-300">房租费</td>
              <td className="px-6 py-4 text-right font-mono text-gray-800">{formatNumber(totals.rent_fee)}</td>
              <td className="px-6 py-4 text-center font-mono text-gray-600">{formatPercent(calcRatio(totals.rent_fee))}</td>
            </tr>
            <tr className="border-b border-gray-200">
              <td className="px-6 py-4 text-gray-700 border-r border-gray-300">折旧费</td>
              <td className="px-6 py-4 text-right font-mono text-gray-800">{formatNumber(totals.depreciation_fee)}</td>
              <td className="px-6 py-4 text-center font-mono text-gray-600">{formatPercent(calcRatio(totals.depreciation_fee))}</td>
            </tr>
            <tr className="border-b border-gray-200">
              <td className="px-6 py-4 text-gray-700 border-r border-gray-300">招聘渠道费</td>
              <td className="px-6 py-4 text-right font-mono text-gray-800">{formatNumber(totals.recruitment_channel_fee)}</td>
              <td className="px-6 py-4 text-center font-mono text-gray-600">{formatPercent(calcRatio(totals.recruitment_channel_fee))}</td>
            </tr>
            <tr className="border-b border-gray-200">
              <td className="px-6 py-4 text-gray-700 border-r border-gray-300">办公费</td>
              <td className="px-6 py-4 text-right font-mono text-gray-800">{formatNumber(totals.office_fee)}</td>
              <td className="px-6 py-4 text-center font-mono text-gray-600">{formatPercent(calcRatio(totals.office_fee))}</td>
            </tr>
            <tr className="border-b border-gray-200">
              <td className="px-6 py-4 text-gray-700 border-r border-gray-300">水电费</td>
              <td className="px-6 py-4 text-right font-mono text-gray-800">{formatNumber(totals.utilities_fee)}</td>
              <td className="px-6 py-4 text-center font-mono text-gray-600">{formatPercent(calcRatio(totals.utilities_fee))}</td>
            </tr>
            <tr className="border-b border-gray-200">
              <td className="px-6 py-4 text-gray-700 border-r border-gray-300">服务器租赁</td>
              <td className="px-6 py-4 text-right font-mono text-gray-800">{formatNumber(totals.server_leasing_fee)}</td>
              <td className="px-6 py-4 text-center font-mono text-gray-600">{formatPercent(calcRatio(totals.server_leasing_fee))}</td>
            </tr>
            <tr className="border-b border-gray-200">
              <td className="px-6 py-4 text-gray-700 border-r border-gray-300">手续费</td>
              <td className="px-6 py-4 text-right font-mono text-gray-800">{formatNumber(totals.handling_fee)}</td>
              <td className="px-6 py-4 text-center font-mono text-gray-600">{formatPercent(calcRatio(totals.handling_fee))}</td>
            </tr>
            <tr className="border-b border-gray-200">
              <td className="px-6 py-4 text-gray-700 border-r border-gray-300">税金</td>
              <td className="px-6 py-4 text-right font-mono text-gray-800">{formatNumber(totals.tax_and_surcharge)}</td>
              <td className="px-6 py-4 text-center font-mono text-gray-600">{formatPercent(calcRatio(totals.tax_and_surcharge))}</td>
            </tr>
            <tr className="border-b-2 border-gray-300 bg-gray-50">
              <td className="px-6 py-4 font-bold text-gray-800 border-r border-gray-300">小计</td>
              <td className="px-6 py-4 text-right font-mono font-bold text-[#a40035]">{formatNumber(totals.fixed_cost)}</td>
              <td className="px-6 py-4 text-center font-mono font-bold text-[#a40035]">{formatPercent(calcRatio(totals.fixed_cost))}</td>
            </tr>

            {/* 支出合计 */}
            <tr className="border-b-2 border-gray-300 bg-gray-100">
              <td colSpan={2} className="px-6 py-4 text-center font-bold text-gray-800 border-r border-gray-300">
                支出合计
              </td>
              <td className="px-6 py-4 text-right font-mono font-bold text-[#a40035] text-base">{formatNumber(totals.total_cost)}</td>
              <td className="px-6 py-4 text-center text-gray-500">-</td>
            </tr>

            {/* 总部利润 */}
            <tr className="border-b-2 border-gray-300 bg-red-50">
              <td colSpan={2} className="px-6 py-4 text-center font-bold text-gray-800 border-r border-gray-300">
                总部利润
              </td>
              <td className="px-6 py-4 text-right font-mono font-bold text-[#a40035] text-base">
                {totals.total_profit >= 0 ? '' : '-'}{formatNumber(Math.abs(totals.total_profit))}
              </td>
              <td className="px-6 py-4 text-center text-gray-500">-</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default HeadquartersCostBudgetTable;
