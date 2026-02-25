const MINUTE = 60 * 1000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

/**
 * AI Functionality Configuration
 * Used to control global AI features (Dify API calls, Component visibility)
 */
export const AI_CONFIG = {
  // Master switch for AI Analysis
  // true: Enable API calls and show components
  // false: Disable API calls and hide components
  ENABLE_AI: true, //true 则调用 Dify API，false 则不调用
  
  // 控制 “营业额”tab 中“客单价拆解”数据容器中“岗位提醒”按钮的展示/隐藏
  POSITION_REMINDER_BUTTON_ENABLED: false,
  
  // Module switches
  // 2026年城市新店投资与现金流预算执行情况 - 深度分析（DeepSeek）
  CITY_BUDGET_ANALYSIS_ENABLED: false,
  
  // Cache Configuration
  CACHE: {
    ENABLED: true, // Enable caching to prevent repetitive API calls
    DURATION: 1 * HOUR, // Adjust here: e.g., 1 * HOUR, 30 * MINUTE, 1 * DAY
    STORAGE_KEY_PREFIX: 'dify_cache_', // Prefix for localStorage keys
  }
};
