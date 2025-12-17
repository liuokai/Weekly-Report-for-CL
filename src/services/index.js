// src/services/index.js
/**
 * 服务层统一出口文件
 * 集中导出所有服务模块
 */

import aiAnalysisService from './aiAnalysisService';
import promptManager from './promptManager';

export { aiAnalysisService, promptManager };
export default {
  aiAnalysis: aiAnalysisService,
  prompt: promptManager
};