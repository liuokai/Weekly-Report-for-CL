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

// Helper to read Prompt templates
// In a real app these might also be files, here we'll keep them simple or load them
const loadPrompt = (filename) => {
    // For now, if filename is provided, we can try to load it from prompts/ dir
    // Or we can define default prompts here
    return `Please analyze the following turnover data. 
Focus on year-over-year growth if available, or general trends. 
Provide insights on revenue performance.`;
};

// Central mapping table
const queryRegistry = {
  getTurnoverOverview: {
    sql: loadSql('turnover_overview.sql'),
    promptTemplate: `
    请分析年度营业额数据，提供简要的财务绩效执行摘要，指出关键趋势。关键趋势要求语言简练，数据清晰、详实、可靠，不可杜撰。整体字数 100 字左右，不可太多或太少。`,
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
