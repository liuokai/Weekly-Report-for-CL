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
  
  // Cache Configuration
  CACHE: {
    ENABLED: false, // Enable caching to prevent repetitive API calls
    DURATION: 1 * HOUR, // Adjust here: e.g., 1 * HOUR, 30 * MINUTE, 1 * DAY
    STORAGE_KEY_PREFIX: 'dify_cache_', // Prefix for localStorage keys
  }
};
