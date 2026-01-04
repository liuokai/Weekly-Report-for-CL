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
  getHQMetrics: {
    sql: loadSql('hq_metrics.sql'), // 不知是什么文件
    description: 'Get HQ metrics trend data'
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
  getStoreList: {
    sql: loadSql('store_list.sql'),
    description: 'Get store list by city'
  },
  getProcessMetricTrend: {
    sql: loadSql('process_metric_trend.sql'),
    description: 'Get process metric trend data'
  },
  getProcessCityData: {
    sql: loadSql('process_city_data.sql'),
    description: 'Get process metric city data'
  },
  getVolumeTrend: {
    sql: loadSql('volume_trend.sql'),
    description: 'Get volume trend data'
  },
  getVolumeInfluenceCity: {
    sql: loadSql('volume_influence_city.sql'),
    description: 'Get volume influence city data'
  },
  getCityPriceGrowth: {
    sql: loadSql('city_price_growth.sql'),
    description: 'Get city price growth and cost data'
  },
  getCityAnnualAvgPrice: {
    sql: loadSql('avg_order_value_city_annual_yoy.sql'),
    description: '获取城市年度客单价及同比'
  },
  getCityWeeklyTrend: {
    sql: loadSql('turnover_weekly_city_yoy.sql'),
    description: 'Get city weekly turnover trend data'
  },
  getCityWeeklyCumTrend: {
    sql: loadSql('turnover_weekly_city_cum_yoy.sql'),
    description: 'Get city weekly cumulative turnover trend data'
  },
  getCityWeeklyAvgDayTrend: {
    sql: loadSql('turnover_weekly_city_per_day_yoy.sql'),
    description: 'Get city weekly average daily turnover trend data'
  },
  getCityStoreWeeklyTurnover: {
    sql: loadSql('turnover_weekly_store_yoy.sql'),
    description: 'Get weekly turnover by store for a city'
  },
  getCityModalTrend: {
    sql: loadSql('city_modal_trend.sql'),
    description: 'Get city modal trend data'
  },
  getCityModalStoreData: {
    sql: loadSql('city_modal_store_data.sql'),
    description: 'Get city modal store data'
  },
  getVolumeCityBreakdown: {
    sql: loadSql('volume_city_breakdown.sql'),
    description: 'Get volume city breakdown data'
  },
  getVolumeHQOverview: {
    sql: loadSql('volume_hq_overview.sql'),
    description: 'Get volume HQ overview data'
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
  getVolumeInfluenceTrend: {
    sql: loadSql('volume_influence_trend.sql'),
    description: 'Get volume influence trend data'
  },
  getVolumeCityModalTrend: {
    sql: loadSql('volume_city_modal_trend.sql'),
    description: 'Get volume city modal trend data'
  },
  getVolumeCityModalStoreData: {
    sql: loadSql('volume_city_modal_store_data.sql'),
    description: 'Get volume city modal store data'
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
};

module.exports = queryRegistry;
