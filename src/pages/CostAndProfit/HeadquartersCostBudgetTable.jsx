import React, { useState, useEffect } from 'react';
import useFetchData from '../../hooks/useFetchData';
import { BusinessTargets } from '../../config/businessTargets';
import { getTimeProgress } from '../../components/Common/TimeProgressUtils';

// 从配置中读取预算数据，以 key 为索引方便查找
const BUDGET_CONFIG = BusinessTargets.headquartersCostAccounting;

// 将预算数组转为 key->value 的 Map
const buildBudgetMap = (arr) =>
  arr.reduce((acc, item) => { acc[item.key] = item.value; return acc; }, {});

const REVENUE_BUDGET = buildBudgetMap(BUDGET_CONFIG.revenue);
const LABOR_BUDGET   = buildBudgetMap(BUDGET_CONFIG.laborCosts);
const FIXED_BUDGET   = buildBudgetMap(BUDGET_CONFIG.fixedCosts);
const SUMMARY_BUDGET = BUDGET_CONFIG.summary;

/**
 * 总部成本预算表组件
 * 展示收入、人工成本、固定成本的预算与实际对比，包含完成率、时间进度、达标状态
 */
const HeadquartersCostBudgetTable = () => {
  const [data, setData] = useState(null);

  // 从接口获取总部月度利润数据
  const { data: profitData, loading, error } = useFetchData('getHeadquartersProfitMonthly');

  // 时间进度（全局共用同一个值）
  const timeProgress = parseFloat(getTimeProgress());

  useEffect(() => {
    if (!profitData || profitData.length === 0) return;

    // 汇总所有月份的数据
    const totals = profitData.reduce((acc, row) => {
      acc.management_income            += Number(row.total_management_income || 0);
      acc.rental_income                += Number(row.total_rental_income || 0);
      acc.goods_sales_income           += Number(row.total_goods_sales_income || 0);
      acc.total_income                 += Number(row.total_income || 0);
      acc.massage_home_budget          += Number(row.total_massage_home_budget || 0);
      acc.user_center_budget           += Number(row.total_user_center_budget || 0);
      acc.investment_financing_budget  += Number(row.total_investment_financing_budget || 0);
      acc.digital_platform_budget      += Number(row.total_digital_platform_budget || 0);
      acc.labor_cost                   += Number(row.total_labor_cost || 0);
      acc.rent_fee                     += Number(row.total_rent_fee || 0);
      acc.depreciation_fee             += Number(row.total_depreciation_fee || 0);
      acc.recruitment_channel_fee      += Number(row.total_recruitment_channel_fee || 0);
      acc.office_fee                   += Number(row.total_office_fee || 0);
      acc.utilities_fee                += Number(row.total_utilities_fee || 0);
      acc.server_leasing_fee           += Number(row.total_server_leasing_fee || 0);
      acc.handling_fee                 += Number(row.total_handling_fee || 0);
      acc.tax_and_surcharge            += Number(row.total_tax_and_surcharge || 0);
      acc.fixed_cost                   += Number(row.total_fixed_cost || 0);
      acc.total_cost                   += Number(row.total_cost || 0);
      acc.total_profit                 += Number(row.total_profit || 0);
      return acc;
    }, {
      management_income: 0, rental_income: 0, goods_sales_income: 0, total_income: 0,
      massage_home_budget: 0, user_center_budget: 0, investment_financing_budget: 0,
      digital_platform_budget: 0, labor_cost: 0, rent_fee: 0, depreciation_fee: 0,
      recruitment_channel_fee: 0, office_fee: 0, utilities_fee: 0, server_leasing_fee: 0,
      handling_fee: 0, tax_and_surcharge: 0, fixed_cost: 0, total_cost: 0, total_profit: 0
    });

    // 计算占比（相对于总收入）
    const calcRatio = (value) => {
      if (!totals.total_income || totals.total_income === 0) return 0;
      return (value / totals.total_income) * 100;
    };

    setData({ totals, calcRatio });
  }, [profitData]);

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

  const formatNumber = (val) => Math.round(val).toLocaleString('zh-CN');
  const formatPercent = (val) => val.toFixed(1) + '%';

  /**
   * 计算完成率
   * 统一为：实际值/预算值
   * @param {number} actual  实际值
   * @param {number} budget  预算值
   */
  const calcCompletionRate = (actual, budget) => {
    if (!budget || budget === 0) return null;
    return (actual / budget) * 100;
  };

  /**
   * 渲染完成率单元格
   */
  const renderCompletionRate = (actual, budget) => {
    const rate = calcCompletionRate(actual, budget);
    if (rate === null) return <span className="text-gray-400">-</span>;
    const color = rate >= 100 ? 'text-gray-800' : rate >= 80 ? 'text-gray-800' : 'text-red-500';
    return <span className={`font-mono ${color}`}>{formatPercent(rate)}</span>;
  };

  /**
   * 渲染时间进度单元格（全局统一，直接展示）
   */
  const renderTimeProgress = () => (
    <span className="font-mono text-gray-800">{formatPercent(timeProgress)}</span>
  );

  /**
   * 渲染是否达标单元格
   * 完成率 >= 时间进度 为达标
   */
  const renderReachStandard = (actual, budget) => {
    const rate = calcCompletionRate(actual, budget);
    if (rate === null) return <span className="text-gray-400">-</span>;
    const reached = rate >= timeProgress;
    return reached
      ? <span className="text-gray-800 font-semibold">达标</span>
      : <span className="text-red-500 font-semibold">未达标</span>;
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
              <th className="px-4 py-3 text-center font-bold text-gray-800 border-r border-gray-300 w-[120px]">标题/分类</th>
              <th className="px-4 py-3 text-center font-bold text-gray-800 border-r border-gray-300 w-[180px]">项目</th>
              <th className="px-4 py-3 text-center font-bold text-gray-800 border-r border-gray-300 w-[140px]">预算值</th>
              <th className="px-4 py-3 text-center font-bold text-gray-800 border-r border-gray-300 w-[140px]">实际值</th>
              <th className="px-4 py-3 text-center font-bold text-gray-800 border-r border-gray-300 w-[100px]">完成率</th>
              <th className="px-4 py-3 text-center font-bold text-gray-800 border-r border-gray-300 w-[100px]">时间进度</th>
              <th className="px-4 py-3 text-center font-bold text-gray-800 border-r border-gray-300 w-[100px]">是否达标</th>
              <th className="px-4 py-3 text-center font-bold text-gray-800 w-[100px]">比例</th>
            </tr>
          </thead>
          <tbody>
            {/* 收入部分 */}
            <tr className="border-b border-gray-200">
              <td rowSpan={4} className="px-4 py-4 text-center font-semibold text-gray-700 border-r border-gray-300 bg-gray-50">收入</td>
              <td className="px-4 py-4 text-gray-700 border-r border-gray-300">服务费收入</td>
              <td className="px-4 py-4 text-right font-mono text-gray-600 border-r border-gray-300">{formatNumber(REVENUE_BUDGET.management_income)}</td>
              <td className="px-4 py-4 text-right font-mono text-gray-800 border-r border-gray-300">{formatNumber(totals.management_income)}</td>
              <td className="px-4 py-4 text-center border-r border-gray-300">{renderCompletionRate(totals.management_income, REVENUE_BUDGET.management_income)}</td>
              <td className="px-4 py-4 text-center border-r border-gray-300">{renderTimeProgress()}</td>
              <td className="px-4 py-4 text-center border-r border-gray-300">{renderReachStandard(totals.management_income, REVENUE_BUDGET.management_income)}</td>
              <td className="px-4 py-4 text-center text-gray-500">-</td>
            </tr>
            <tr className="border-b border-gray-200">
              <td className="px-4 py-4 text-gray-700 border-r border-gray-300">租金收入</td>
              <td className="px-4 py-4 text-right font-mono text-gray-600 border-r border-gray-300">{formatNumber(REVENUE_BUDGET.rental_income)}</td>
              <td className="px-4 py-4 text-right font-mono text-gray-800 border-r border-gray-300">{formatNumber(totals.rental_income)}</td>
              <td className="px-4 py-4 text-center border-r border-gray-300">{renderCompletionRate(totals.rental_income, REVENUE_BUDGET.rental_income)}</td>
              <td className="px-4 py-4 text-center border-r border-gray-300">{renderTimeProgress()}</td>
              <td className="px-4 py-4 text-center border-r border-gray-300">{renderReachStandard(totals.rental_income, REVENUE_BUDGET.rental_income)}</td>
              <td className="px-4 py-4 text-center text-gray-500">-</td>
            </tr>
            <tr className="border-b border-gray-200">
              <td className="px-4 py-4 text-gray-700 border-r border-gray-300">商品销售收入</td>
              <td className="px-4 py-4 text-right font-mono text-gray-600 border-r border-gray-300">{formatNumber(REVENUE_BUDGET.goods_sales_income)}</td>
              <td className="px-4 py-4 text-right font-mono text-gray-800 border-r border-gray-300">{formatNumber(totals.goods_sales_income)}</td>
              <td className="px-4 py-4 text-center border-r border-gray-300">{renderCompletionRate(totals.goods_sales_income, REVENUE_BUDGET.goods_sales_income)}</td>
              <td className="px-4 py-4 text-center border-r border-gray-300">{renderTimeProgress()}</td>
              <td className="px-4 py-4 text-center border-r border-gray-300">{renderReachStandard(totals.goods_sales_income, REVENUE_BUDGET.goods_sales_income)}</td>
              <td className="px-4 py-4 text-center text-gray-500">-</td>
            </tr>
            <tr className="border-b-2 border-gray-300 bg-gray-50">
              <td className="px-4 py-4 font-bold text-gray-800 border-r border-gray-300">小计</td>
              <td className="px-4 py-4 text-right font-mono font-bold text-gray-600 border-r border-gray-300">{formatNumber(REVENUE_BUDGET.total_income)}</td>
              <td className="px-4 py-4 text-right font-mono font-bold text-[#a40035] border-r border-gray-300">{formatNumber(totals.total_income)}</td>
              <td className="px-4 py-4 text-center border-r border-gray-300">{renderCompletionRate(totals.total_income, REVENUE_BUDGET.total_income)}</td>
              <td className="px-4 py-4 text-center border-r border-gray-300">{renderTimeProgress()}</td>
              <td className="px-4 py-4 text-center border-r border-gray-300">{renderReachStandard(totals.total_income, REVENUE_BUDGET.total_income)}</td>
              <td className="px-4 py-4 text-center text-gray-500">-</td>
            </tr>
            {/* 人工成本部分 */}
            <tr className="border-b border-gray-200">
              <td rowSpan={5} className="px-4 py-4 text-center font-semibold text-gray-700 border-r border-gray-300 bg-gray-50">人工成本</td>
              <td className="px-4 py-4 text-gray-700 border-r border-gray-300">人工成本-投融资管理</td>
              <td className="px-4 py-4 text-right font-mono text-gray-600 border-r border-gray-300">{formatNumber(LABOR_BUDGET.investment_financing_budget)}</td>
              <td className="px-4 py-4 text-right font-mono text-gray-800 border-r border-gray-300">{formatNumber(totals.investment_financing_budget)}</td>
              <td className="px-4 py-4 text-center border-r border-gray-300">{renderCompletionRate(totals.investment_financing_budget, LABOR_BUDGET.investment_financing_budget)}</td>
              <td className="px-4 py-4 text-center border-r border-gray-300">{renderTimeProgress()}</td>
              <td className="px-4 py-4 text-center border-r border-gray-300">{renderReachStandard(totals.investment_financing_budget, LABOR_BUDGET.investment_financing_budget)}</td>
              <td className="px-4 py-4 text-center font-mono text-gray-600">{formatPercent(calcRatio(totals.investment_financing_budget))}</td>
            </tr>
            <tr className="border-b border-gray-200">
              <td className="px-4 py-4 text-gray-700 border-r border-gray-300">人工成本-推拿之家</td>
              <td className="px-4 py-4 text-right font-mono text-gray-600 border-r border-gray-300">{formatNumber(LABOR_BUDGET.massage_home_budget)}</td>
              <td className="px-4 py-4 text-right font-mono text-gray-800 border-r border-gray-300">{formatNumber(totals.massage_home_budget)}</td>
              <td className="px-4 py-4 text-center border-r border-gray-300">{renderCompletionRate(totals.massage_home_budget, LABOR_BUDGET.massage_home_budget)}</td>
              <td className="px-4 py-4 text-center border-r border-gray-300">{renderTimeProgress()}</td>
              <td className="px-4 py-4 text-center border-r border-gray-300">{renderReachStandard(totals.massage_home_budget, LABOR_BUDGET.massage_home_budget)}</td>
              <td className="px-4 py-4 text-center font-mono text-gray-600">{formatPercent(calcRatio(totals.massage_home_budget))}</td>
            </tr>
            <tr className="border-b border-gray-200">
              <td className="px-4 py-4 text-gray-700 border-r border-gray-300">人工成本-用户中心</td>
              <td className="px-4 py-4 text-right font-mono text-gray-600 border-r border-gray-300">{formatNumber(LABOR_BUDGET.user_center_budget)}</td>
              <td className="px-4 py-4 text-right font-mono text-gray-800 border-r border-gray-300">{formatNumber(totals.user_center_budget)}</td>
              <td className="px-4 py-4 text-center border-r border-gray-300">{renderCompletionRate(totals.user_center_budget, LABOR_BUDGET.user_center_budget)}</td>
              <td className="px-4 py-4 text-center border-r border-gray-300">{renderTimeProgress()}</td>
              <td className="px-4 py-4 text-center border-r border-gray-300">{renderReachStandard(totals.user_center_budget, LABOR_BUDGET.user_center_budget)}</td>
              <td className="px-4 py-4 text-center font-mono text-gray-600">{formatPercent(calcRatio(totals.user_center_budget))}</td>
            </tr>
            <tr className="border-b border-gray-200">
              <td className="px-4 py-4 text-gray-700 border-r border-gray-300">人工成本-IT中心</td>
              <td className="px-4 py-4 text-right font-mono text-gray-600 border-r border-gray-300">{formatNumber(LABOR_BUDGET.digital_platform_budget)}</td>
              <td className="px-4 py-4 text-right font-mono text-gray-800 border-r border-gray-300">{formatNumber(totals.digital_platform_budget)}</td>
              <td className="px-4 py-4 text-center border-r border-gray-300">{renderCompletionRate(totals.digital_platform_budget, LABOR_BUDGET.digital_platform_budget)}</td>
              <td className="px-4 py-4 text-center border-r border-gray-300">{renderTimeProgress()}</td>
              <td className="px-4 py-4 text-center border-r border-gray-300">{renderReachStandard(totals.digital_platform_budget, LABOR_BUDGET.digital_platform_budget)}</td>
              <td className="px-4 py-4 text-center font-mono text-gray-600">{formatPercent(calcRatio(totals.digital_platform_budget))}</td>
            </tr>
            <tr className="border-b-2 border-gray-300 bg-gray-50">
              <td className="px-4 py-4 font-bold text-gray-800 border-r border-gray-300">小计</td>
              <td className="px-4 py-4 text-right font-mono font-bold text-gray-600 border-r border-gray-300">{formatNumber(LABOR_BUDGET.labor_cost)}</td>
              <td className="px-4 py-4 text-right font-mono font-bold text-[#a40035] border-r border-gray-300">{formatNumber(totals.labor_cost)}</td>
              <td className="px-4 py-4 text-center border-r border-gray-300">{renderCompletionRate(totals.labor_cost, LABOR_BUDGET.labor_cost)}</td>
              <td className="px-4 py-4 text-center border-r border-gray-300">{renderTimeProgress()}</td>
              <td className="px-4 py-4 text-center border-r border-gray-300">{renderReachStandard(totals.labor_cost, LABOR_BUDGET.labor_cost)}</td>
              <td className="px-4 py-4 text-center font-mono font-bold text-[#a40035]">{formatPercent(calcRatio(totals.labor_cost))}</td>
            </tr>
            {/* 固定成本部分 */}
            <tr className="border-b border-gray-200">
              <td rowSpan={10} className="px-4 py-4 text-center font-semibold text-gray-700 border-r border-gray-300 bg-gray-50">固定成本</td>
              <td className="px-4 py-4 text-gray-700 border-r border-gray-300">房租费</td>
              <td className="px-4 py-4 text-right font-mono text-gray-600 border-r border-gray-300">{formatNumber(FIXED_BUDGET.rent_fee)}</td>
              <td className="px-4 py-4 text-right font-mono text-gray-800 border-r border-gray-300">{formatNumber(totals.rent_fee)}</td>
              <td className="px-4 py-4 text-center border-r border-gray-300">{renderCompletionRate(totals.rent_fee, FIXED_BUDGET.rent_fee)}</td>
              <td className="px-4 py-4 text-center border-r border-gray-300">{renderTimeProgress()}</td>
              <td className="px-4 py-4 text-center border-r border-gray-300">{renderReachStandard(totals.rent_fee, FIXED_BUDGET.rent_fee)}</td>
              <td className="px-4 py-4 text-center font-mono text-gray-600">{formatPercent(calcRatio(totals.rent_fee))}</td>
            </tr>
            <tr className="border-b border-gray-200">
              <td className="px-4 py-4 text-gray-700 border-r border-gray-300">折旧费</td>
              <td className="px-4 py-4 text-right font-mono text-gray-600 border-r border-gray-300">{formatNumber(FIXED_BUDGET.depreciation_fee)}</td>
              <td className="px-4 py-4 text-right font-mono text-gray-800 border-r border-gray-300">{formatNumber(totals.depreciation_fee)}</td>
              <td className="px-4 py-4 text-center border-r border-gray-300">{renderCompletionRate(totals.depreciation_fee, FIXED_BUDGET.depreciation_fee)}</td>
              <td className="px-4 py-4 text-center border-r border-gray-300">{renderTimeProgress()}</td>
              <td className="px-4 py-4 text-center border-r border-gray-300">{renderReachStandard(totals.depreciation_fee, FIXED_BUDGET.depreciation_fee)}</td>
              <td className="px-4 py-4 text-center font-mono text-gray-600">{formatPercent(calcRatio(totals.depreciation_fee))}</td>
            </tr>
            <tr className="border-b border-gray-200">
              <td className="px-4 py-4 text-gray-700 border-r border-gray-300">研发培训费</td>
              <td className="px-4 py-4 text-right font-mono text-gray-600 border-r border-gray-300">{formatNumber(FIXED_BUDGET.rd_training_fee)}</td>
              <td className="px-4 py-4 text-right font-mono text-gray-800 border-r border-gray-300">-</td>
              <td className="px-4 py-4 text-center border-r border-gray-300"><span className="text-gray-400">-</span></td>
              <td className="px-4 py-4 text-center border-r border-gray-300">{renderTimeProgress()}</td>
              <td className="px-4 py-4 text-center border-r border-gray-300"><span className="text-gray-400">-</span></td>
              <td className="px-4 py-4 text-center text-gray-500">-</td>
            </tr>
            <tr className="border-b border-gray-200">
              <td className="px-4 py-4 text-gray-700 border-r border-gray-300">招聘渠道费</td>
              <td className="px-4 py-4 text-right font-mono text-gray-600 border-r border-gray-300">{formatNumber(FIXED_BUDGET.recruitment_channel_fee)}</td>
              <td className="px-4 py-4 text-right font-mono text-gray-800 border-r border-gray-300">{formatNumber(totals.recruitment_channel_fee)}</td>
              <td className="px-4 py-4 text-center border-r border-gray-300">{renderCompletionRate(totals.recruitment_channel_fee, FIXED_BUDGET.recruitment_channel_fee)}</td>
              <td className="px-4 py-4 text-center border-r border-gray-300">{renderTimeProgress()}</td>
              <td className="px-4 py-4 text-center border-r border-gray-300">{renderReachStandard(totals.recruitment_channel_fee, FIXED_BUDGET.recruitment_channel_fee)}</td>
              <td className="px-4 py-4 text-center font-mono text-gray-600">{formatPercent(calcRatio(totals.recruitment_channel_fee))}</td>
            </tr>
            <tr className="border-b border-gray-200">
              <td className="px-4 py-4 text-gray-700 border-r border-gray-300">办公费</td>
              <td className="px-4 py-4 text-right font-mono text-gray-600 border-r border-gray-300">{formatNumber(FIXED_BUDGET.office_fee)}</td>
              <td className="px-4 py-4 text-right font-mono text-gray-800 border-r border-gray-300">{formatNumber(totals.office_fee)}</td>
              <td className="px-4 py-4 text-center border-r border-gray-300">{renderCompletionRate(totals.office_fee, FIXED_BUDGET.office_fee)}</td>
              <td className="px-4 py-4 text-center border-r border-gray-300">{renderTimeProgress()}</td>
              <td className="px-4 py-4 text-center border-r border-gray-300">{renderReachStandard(totals.office_fee, FIXED_BUDGET.office_fee)}</td>
              <td className="px-4 py-4 text-center font-mono text-gray-600">{formatPercent(calcRatio(totals.office_fee))}</td>
            </tr>
            <tr className="border-b border-gray-200">
              <td className="px-4 py-4 text-gray-700 border-r border-gray-300">水电费</td>
              <td className="px-4 py-4 text-right font-mono text-gray-600 border-r border-gray-300">{formatNumber(FIXED_BUDGET.utilities_fee)}</td>
              <td className="px-4 py-4 text-right font-mono text-gray-800 border-r border-gray-300">{formatNumber(totals.utilities_fee)}</td>
              <td className="px-4 py-4 text-center border-r border-gray-300">{renderCompletionRate(totals.utilities_fee, FIXED_BUDGET.utilities_fee)}</td>
              <td className="px-4 py-4 text-center border-r border-gray-300">{renderTimeProgress()}</td>
              <td className="px-4 py-4 text-center border-r border-gray-300">{renderReachStandard(totals.utilities_fee, FIXED_BUDGET.utilities_fee)}</td>
              <td className="px-4 py-4 text-center font-mono text-gray-600">{formatPercent(calcRatio(totals.utilities_fee))}</td>
            </tr>
            <tr className="border-b border-gray-200">
              <td className="px-4 py-4 text-gray-700 border-r border-gray-300">服务器租赁</td>
              <td className="px-4 py-4 text-right font-mono text-gray-600 border-r border-gray-300">{formatNumber(FIXED_BUDGET.server_leasing_fee)}</td>
              <td className="px-4 py-4 text-right font-mono text-gray-800 border-r border-gray-300">{formatNumber(totals.server_leasing_fee)}</td>
              <td className="px-4 py-4 text-center border-r border-gray-300">{renderCompletionRate(totals.server_leasing_fee, FIXED_BUDGET.server_leasing_fee)}</td>
              <td className="px-4 py-4 text-center border-r border-gray-300">{renderTimeProgress()}</td>
              <td className="px-4 py-4 text-center border-r border-gray-300">{renderReachStandard(totals.server_leasing_fee, FIXED_BUDGET.server_leasing_fee)}</td>
              <td className="px-4 py-4 text-center font-mono text-gray-600">{formatPercent(calcRatio(totals.server_leasing_fee))}</td>
            </tr>
            <tr className="border-b border-gray-200">
              <td className="px-4 py-4 text-gray-700 border-r border-gray-300">手续费</td>
              <td className="px-4 py-4 text-right font-mono text-gray-600 border-r border-gray-300">{formatNumber(FIXED_BUDGET.handling_fee)}</td>
              <td className="px-4 py-4 text-right font-mono text-gray-800 border-r border-gray-300">{formatNumber(totals.handling_fee)}</td>
              <td className="px-4 py-4 text-center border-r border-gray-300">{renderCompletionRate(totals.handling_fee, FIXED_BUDGET.handling_fee)}</td>
              <td className="px-4 py-4 text-center border-r border-gray-300">{renderTimeProgress()}</td>
              <td className="px-4 py-4 text-center border-r border-gray-300">{renderReachStandard(totals.handling_fee, FIXED_BUDGET.handling_fee)}</td>
              <td className="px-4 py-4 text-center font-mono text-gray-600">{formatPercent(calcRatio(totals.handling_fee))}</td>
            </tr>
            <tr className="border-b border-gray-200">
              <td className="px-4 py-4 text-gray-700 border-r border-gray-300">税金</td>
              <td className="px-4 py-4 text-right font-mono text-gray-600 border-r border-gray-300">{formatNumber(FIXED_BUDGET.tax_and_surcharge)}</td>
              <td className="px-4 py-4 text-right font-mono text-gray-800 border-r border-gray-300">{formatNumber(totals.tax_and_surcharge)}</td>
              <td className="px-4 py-4 text-center border-r border-gray-300">{renderCompletionRate(totals.tax_and_surcharge, FIXED_BUDGET.tax_and_surcharge)}</td>
              <td className="px-4 py-4 text-center border-r border-gray-300">{renderTimeProgress()}</td>
              <td className="px-4 py-4 text-center border-r border-gray-300">{renderReachStandard(totals.tax_and_surcharge, FIXED_BUDGET.tax_and_surcharge)}</td>
              <td className="px-4 py-4 text-center font-mono text-gray-600">{formatPercent(calcRatio(totals.tax_and_surcharge))}</td>
            </tr>
            <tr className="border-b-2 border-gray-300 bg-gray-50">
              <td className="px-4 py-4 font-bold text-gray-800 border-r border-gray-300">小计</td>
              <td className="px-4 py-4 text-right font-mono font-bold text-gray-600 border-r border-gray-300">{formatNumber(FIXED_BUDGET.fixed_cost)}</td>
              <td className="px-4 py-4 text-right font-mono font-bold text-[#a40035] border-r border-gray-300">{formatNumber(totals.fixed_cost)}</td>
              <td className="px-4 py-4 text-center border-r border-gray-300">{renderCompletionRate(totals.fixed_cost, FIXED_BUDGET.fixed_cost)}</td>
              <td className="px-4 py-4 text-center border-r border-gray-300">{renderTimeProgress()}</td>
              <td className="px-4 py-4 text-center border-r border-gray-300">{renderReachStandard(totals.fixed_cost, FIXED_BUDGET.fixed_cost)}</td>
              <td className="px-4 py-4 text-center font-mono font-bold text-[#a40035]">{formatPercent(calcRatio(totals.fixed_cost))}</td>
            </tr>
            {/* 支出合计 */}
            <tr className="border-b-2 border-gray-300 bg-gray-100">
              <td colSpan={2} className="px-4 py-4 text-center font-bold text-gray-800 border-r border-gray-300">支出合计</td>
              <td className="px-4 py-4 text-right font-mono font-bold text-gray-600 border-r border-gray-300">{formatNumber(SUMMARY_BUDGET.totalExpenditure)}</td>
              <td className="px-4 py-4 text-right font-mono font-bold text-[#a40035] text-base border-r border-gray-300">{formatNumber(totals.total_cost)}</td>
              <td className="px-4 py-4 text-center border-r border-gray-300">{renderCompletionRate(totals.total_cost, SUMMARY_BUDGET.totalExpenditure)}</td>
              <td className="px-4 py-4 text-center border-r border-gray-300">{renderTimeProgress()}</td>
              <td className="px-4 py-4 text-center border-r border-gray-300">{renderReachStandard(totals.total_cost, SUMMARY_BUDGET.totalExpenditure)}</td>
              <td className="px-4 py-4 text-center text-gray-500">-</td>
            </tr>

            {/* 总部利润 */}
            <tr className="border-b-2 border-gray-300 bg-red-50">
              <td colSpan={2} className="px-4 py-4 text-center font-bold text-gray-800 border-r border-gray-300">总部利润</td>
              <td className="px-4 py-4 text-right font-mono font-bold text-gray-600 border-r border-gray-300">
                {SUMMARY_BUDGET.headquartersProfit >= 0 ? '' : '-'}{formatNumber(Math.abs(SUMMARY_BUDGET.headquartersProfit))}
              </td>
              <td className="px-4 py-4 text-right font-mono font-bold text-[#a40035] text-base border-r border-gray-300">
                {totals.total_profit >= 0 ? '' : '-'}{formatNumber(Math.abs(totals.total_profit))}
              </td>
              <td className="px-4 py-4 text-center border-r border-gray-300">
                <span className="text-gray-400">-</span>
              </td>
              <td className="px-4 py-4 text-center border-r border-gray-300">{renderTimeProgress()}</td>
              <td className="px-4 py-4 text-center border-r border-gray-300">
                <span className="text-gray-400">-</span>
              </td>
              <td className="px-4 py-4 text-center text-gray-500">-</td>
            </tr>

            {/* 门店利润 */}
            <tr className="border-b-2 border-gray-300 bg-green-50">
              <td colSpan={2} className="px-4 py-4 text-center font-bold text-gray-800 border-r border-gray-300">门店利润</td>
              <td className="px-4 py-4 text-right font-mono font-bold text-gray-600 border-r border-gray-300">{formatNumber(SUMMARY_BUDGET.storeProfit)}</td>
              <td className="px-4 py-4 text-right font-mono font-bold text-green-600 text-base border-r border-gray-300">-</td>
              <td className="px-4 py-4 text-center border-r border-gray-300">
                <span className="text-gray-400">-</span>
              </td>
              <td className="px-4 py-4 text-center border-r border-gray-300">{renderTimeProgress()}</td>
              <td className="px-4 py-4 text-center border-r border-gray-300">
                <span className="text-gray-400">-</span>
              </td>
              <td className="px-4 py-4 text-center text-gray-500">-</td>
            </tr>

            {/* 2026年利润合计 */}
            <tr className="border-b-2 border-gray-300 bg-blue-50">
              <td colSpan={2} className="px-4 py-4 text-center font-bold text-gray-800 border-r border-gray-300">2026年利润合计</td>
              <td className="px-4 py-4 text-right font-mono font-bold text-gray-600 border-r border-gray-300">{formatNumber(SUMMARY_BUDGET.annualProfit)}</td>
              <td className="px-4 py-4 text-right font-mono font-bold text-blue-600 text-base border-r border-gray-300">-</td>
              <td className="px-4 py-4 text-center border-r border-gray-300">
                <span className="text-gray-400">-</span>
              </td>
              <td className="px-4 py-4 text-center border-r border-gray-300">{renderTimeProgress()}</td>
              <td className="px-4 py-4 text-center border-r border-gray-300">
                <span className="text-gray-400">-</span>
              </td>
              <td className="px-4 py-4 text-center text-gray-500">-</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default HeadquartersCostBudgetTable;