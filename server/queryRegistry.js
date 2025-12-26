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
  }
};

module.exports = queryRegistry;
