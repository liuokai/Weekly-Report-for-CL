// src/api/index.js
/**
 * API统一出口文件
 * 集中导出所有API模块
 */

import aiApi from './aiApi';

export { aiApi };
export default {
  ai: aiApi
};