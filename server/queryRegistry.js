const fs = require('fs');
const path = require('path');

// Helper to read SQL files
const loadSql = (filename) => {
  try {
    return fs.readFileSync(path.join(__dirname, 'sqls', filename), 'utf8');
  } catch (err) {
    console.error(`Failed to load SQL file: ${filename}`, err);
    return null;
  }
};

// Central mapping table
const queryRegistry = {
  getAnnualAvgPrice: {
    sql: loadSql('avg_order_value_annual_yoy.sql'),
    description: '获取年度平均客单价及同比'
  },
  getWeeklyAvgPriceYTD: {
    sql: loadSql('avg_order_value_weekly_ytd_yoy.sql'),
    description: '获取年度累计平均客单价及同比（周度粒度）'
  },
  getWeeklyAvgPrice: {
    sql: loadSql('avg_order_value_weekly_yoy.sql'),
    description: '获取周度平均客单价及同比'
  },
  getTurnoverOverview: {
    sql: loadSql('turnover_overview.sql'),
    description: '营业额概览中的年度累计营业额'
  },
  getWeeklyTurnover: {
    sql: loadSql('turnover_weekly.sql'),
    description: '获取周度营业额'
  },
  getWeeklyTurnoverCum: {
    sql: loadSql('turnover_weekly_cum_yoy.sql'),
    description: '获取周度营业额累计数据'
  },
  getWeeklyTurnoverAvgDay: {
    sql: loadSql('turnover_weekly_avg_per_day_yoy.sql'),
    description: '获取周度营业额日均数据'
  },
  // 年度利润概览（按年统计：营收、利润、利润率、去年利润率、同比）
  getProfitYearly: {
    sql: loadSql('profit_yearly.sql'),
    description: '年度利润统计（含利润率、去年利润率、同比增长）'
  },
  getProfitTrend: {
    sql: loadSql('profit_weekly.sql'),
    description: '获取月度利润及利润率趋势数据'
  },
  // 门店月度利润明细（用于成本结构分析，支持按月份筛选）
  getProfitStoreDetailMonthly: {
    sql: loadSql('profit_store_detail_monthly.sql'),
    description: '获取门店月度利润与成本明细（含城市信息）'
  },
  getCityWeeklyAvgPriceYTD: {
    sql: loadSql('avg_order_value_city_weekly_ytd_yoy.sql'),
    description: '获取城市累计平均客单价及同比（周度粒度）'
  },
  getStoreWeeklyAvgPriceYTD: {
    sql: loadSql('avg_order_value_store_weekly_ytd_yoy.sql'),
    description: '获取门店累计平均客单价及同比（周度粒度）'
  },
  getCityTurnover: {
    sql: loadSql('turnover_city_actual_target.sql'),
    description: '获取城市年度营业额数据'
  },
  getCityAnnualAvgPrice: {
    sql: loadSql('avg_order_value_city_annual_yoy.sql'),
    description: '获取城市年度客单价及同比'
  },
  getCityWeeklyTrend: {
    sql: loadSql('turnover_weekly_city_yoy.sql'),
    description: '获取城市周度营业额趋势数据'
  },
  getCityWeeklyCumTrend: {
    sql: loadSql('turnover_weekly_city_cum_yoy.sql'),
    description: '获取城市周度年度累计营业额趋势数据'
  },
  getCityWeeklyAvgDayTrend: {
    sql: loadSql('turnover_weekly_city_per_day_yoy.sql'),
    description: '获取城市周度天均营业额趋势数据'
  },
  getCityStoreWeeklyTurnover: {
    sql: loadSql('turnover_weekly_store_yoy.sql'),
    description: '获取某城市门店周度营业额数据'
  },
  getCashFlowClosingWarning: {
    sql: loadSql('cash_flow_closing_warning.sql'),
    description: '获取触发闭店预警的门店列表及详情'
  },

  // 客次量：年度累计（取最新年份）
  getUserVisitCountAnnual: {
    sql: loadSql('user_visit_count_annual.sql'),
    description: '按年度统计客次量（含去年值与同比），前端取最新年份'
  },
  // 客次量：天均（月度，近12个月）
  getUserVisitCountDailyAvgMonthly: {
    sql: loadSql('user_visit_count_daily_avg_visit_monthly.sql'),
    description: '按月统计天均客次量（含去年同期与同比），取最近12个月'
  },
  // 客次量：年度累计（月度，近12个月）
  getUserVisitCountCumMonthly: {
    sql: loadSql('user_visit_count_cum_monthly.sql'),
    description: '按月统计年度累计客次量（含去年同期与同比），取最近12个月'
  },
  getRepurchaseRateAnnual: {
    sql: loadSql('repurchase_rate_annual_yoy.sql'),
    description: '年度项目回头率统计'
  },
  getRepurchaseRateWeekly: {
    sql: loadSql('repurchase_rate_weekly_yoy.sql'),
    description: '周维度项目回头率统计'
  },
  getRepurchaseRateCityWeekly: {
    sql: loadSql('repurchase_reate_city_weekly_yoy.sql'),
    description: '城市维度项目回头率统计'
  },
  getRepurchaseRateStoreWeekly: {
    sql: loadSql('repurchase_reate_store_weekly_yoy.sql'),
    description: '门店维度项目回头率统计'
  },
  // 活跃会员数相关
  getActiveUserMonthlyYoy: {
    sql: loadSql('active_user_monthly_yoy.sql'),
    description: '按月统计活跃会员数（含去年同期与同比），取最近12个月'
  },
  getActiveUserCityMonthlyYoy: {
    sql: loadSql('active_user_city_monthly_yoy.sql'),
    description: '按月、城市维度统计活跃会员数（含去年同期与同比）'
  },
  getActiveUserStoreMonthlyYoy: {
    sql: loadSql('active_user_store_monthly_yoy.sql'),
    description: '按月、城市、门店维度统计活跃会员数（含去年同期与同比）'
  },
  // 主动评价率相关
  getActiveReviewRateMonthlyYoy: {
    sql: loadSql('active_review_rates_monthly_yoy.sql'),
    description: '按月统计会员主动评价率（含去年同期与同比差）'
  },
  getActiveReviewRateCityMonthlyYoy: {
    sql: loadSql('active_review_rates_city_monthly_yoy.sql'),
    description: '按月、城市维度统计会员主动评价率（含去年同期与同比差）'
  },
  getActiveReviewRateStoreMonthlyYoy: {
    sql: loadSql('active_review_rates_store_monthly_yoy.sql'),
    description: '按月、城市、门店维度统计会员主动评价率（含去年同期与同比差）'
  },
  // 会员流失率相关
  getMemberChurnRateMonthlyYoy: {
    sql: loadSql('member_churn_rate_monthly_yoy.sql'),
    description: '按月统计会员数量、流失数量及流失率（含去年同期与同比差）'
  },
  getMemberChurnRateCityMonthlyYoy: {
    sql: loadSql('member_churn_rate_city_monthly_yoy.sql'),
    description: '按月、城市维度统计会员数量、流失数量及流失率（含去年同期与同比差）'
  },
  getMemberChurnRateStoreMonthlyYoy: {
    sql: loadSql('member_churn_rate_store_monthly_yoy.sql'),
    description: '按月、城市、门店维度统计会员数量、流失数量及流失率（含去年同期与同比差）'
  },
  // 新员工回头率达标率相关
  getNewEmpReturnComplianceAnnual: {
    sql: loadSql('staff_return_compliance_annual.sql'),
    description: '新员工回头率达标率年度统计（全公司）'
  },
  getNewEmpReturnComplianceMonthly: {
    sql: loadSql('staff_return_compliance_monthly.sql'),
    description: '新员工回头率达标率月度统计（全公司，近12个月）'
  },
  getNewEmpReturnComplianceCityAnnual: {
    sql: loadSql('staff_return_compliance_city_annual.sql'),
    description: '新员工回头率达标率年度统计（城市维度）'
  },
  getNewEmpReturnComplianceCityMonthly: {
    sql: loadSql('staff_return_compliance_city_monthly.sql'),
    description: '新员工回头率达标率月度统计（城市维度，近12个月，需城市参数）'
  },
  getNewEmpReturnComplianceStoreAnnual: {
    sql: loadSql('staff_return_compliance_store_annual.sql'),
    description: '新员工回头率达标率年度统计（门店维度）'
  },
  // Bed-to-Staff Ratio
  getBedStaffRatioAnnual: {
    sql: loadSql('bed_to_staff_ratio_annual.sql'),
    description: '年度床位人员配置比统计'
  },
  getBedStaffRatioWeekly: {
    sql: loadSql('bed_to_staff_ratio_weekly.sql'),
    description: '周度床位人员配置比统计'
  },
  getBedStaffRatioCityAnnual: {
    sql: loadSql('bed_to_staff_ratio_city_annual.sql'),
    description: '城市年度床位人员配置比统计'
  },
  getBedStaffRatioCityWeekly: {
    sql: loadSql('bed_to_staff_ratio_city_weekly.sql'),
    description: '城市周度床位人员配置比统计'
  },
  getBedStaffRatioStoreAnnual: {
    sql: loadSql('bed_to_staff_ratio_store_annual.sql'),
    description: '门店年度床位人员配置比统计'
  },
  // 推拿师产值达标率（月度/城市月度/门店月度）
  getEmployeeOutputStandardRateMonthly: {
    sql: loadSql('employee_output_standard_rate_monthly.sql'),
    description: '推拿师产值达标率月度统计（含同比）'
  },
  getEmployeeOutputStandardRateCityMonthly: {
    sql: loadSql('employee_output_standard_rate_city_monthly.sql'),
    description: '推拿师产值达标率城市月度统计（含同比）'
  },
  getEmployeeOutputStandardRateStoreMonthly: {
    sql: loadSql('employee_output_standard_rate_store_monthly.sql'),
    description: '推拿师产值达标率门店月度统计（含同比）'
  },
  // 推拿师天均服务时长（月度/城市月度/门店月度）
  getStaffServiceDurationMonthly: {
    sql: loadSql('staff_avg_daily_service_duration_monthly_yoy.sql'),
    description: '按月统计推拿师天均服务时长（含去年同期与同比），取最近12个月'
  },
  getStaffServiceDurationCityMonthly: {
    sql: loadSql('staff_avg_daily_service_duration_city_monthly_yoy.sql'),
    description: '按月、城市维度统计推拿师天均服务时长（含去年同期与同比），近12个月'
  },
  getStaffServiceDurationStoreMonthly: {
    sql: loadSql('staff_avg_daily_service_duration_store_monthly_yoy.sql'),
    description: '按月、城市、门店维度统计推拿师天均服务时长（含去年同期与同比），近12个月'
  },
  // 推拿师天均服务时长不达标占比（月度/城市月度）
  getStaffServiceDurationBelowStandardMonthly: {
    sql: loadSql('staff_service_duration_below_standard_monthly.sql'),
    description: '按月统计推拿师天均服务时长不达标占比（含去年同期与同比），近12个月'
  },
  getStaffServiceDurationBelowStandardCityMonthly: {
    sql: loadSql('staff_service_duration_below_standard_city_monthly.sql'),
    description: '按月、城市维度统计推拿师天均服务时长不达标占比（含去年同期与同比），近12个月'
  },

  getClosingStoreList: {
    sql: loadSql('closing_store_list.sql'),
    description: '闭店预警门店列表'
  },
  getCashFlowNewStoreProcess: {
    sql: loadSql('cash_flow_new_store_process.sql'),
    description: '新店目标完成情况'
  },
  getCashFlowBudgetMonthly: {
    sql: loadSql('cash_flow_budget.sql'),
    description: '按月输出预算、实际、剩余与滚动的现金流等汇总'
  },
  getCashFlowContinuousLoss: {
    sql: loadSql('cash_flow_continuous_loss.sql'),
    description: '获取现金流持续亏损门店列表'
  },
  getCashFlowCapitalSafetyLine: {
    sql: loadSql('cash_flow_capital_safety_line.sql'),
    description: '资金安全线汇总查询'
  },
};

module.exports = queryRegistry;
