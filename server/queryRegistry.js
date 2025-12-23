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
  }
};

module.exports = queryRegistry;
