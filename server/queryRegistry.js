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
    description: 'Get annual turnover overview'
  },
  getHQMetrics: {
    sql: loadSql('hq_metrics.sql'),
    description: 'Get HQ metrics trend data'
  },
  getWeeklyTurnover: {
    sql: loadSql('weekly_turnover.sql'),
    description: 'Get weekly turnover trend data'
  },
  getCityTurnover: {
    sql: loadSql('city_turnover.sql'),
    description: 'Get city turnover data'
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
