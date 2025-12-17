// src/services/aiAnalysisService.js
/**
 * AI数据分析服务
 * 负责处理数据文件的读取、预处理和分析请求构建
 */

import { parseCSV } from '../utils/dataLoader';
import aiApi from '../api/aiApi';
import promptManager from './promptManager';

// 缓存存储，避免重复分析相同数据
const analysisCache = new Map();
const CACHE_TTL = 30 * 60 * 1000; // 缓存30分钟

class AIAnalysisService {
  /**
   * 读取数据文件
   * @param {string} filePath - 数据文件路径
   * @returns {Promise<Object>} 解析后的数据
   */
  async loadDataFile(filePath) {
    try {
      const response = await fetch(filePath);
      if (!response.ok) {
        throw new Error(`无法加载数据文件: ${filePath}`);
      }
      
      const text = await response.text();
      return parseCSV(text);
    } catch (error) {
      console.error('加载数据文件失败:', error);
      throw error;
    }
  }

  /**
   * 预处理数据，转换为适合AI分析的格式
   * @param {Object} data - 原始数据
   * @param {number} maxRows - 最大行数限制，默认100行
   * @returns {string} 格式化的数据字符串
   */
  preprocessData(data, maxRows = 100) {
    if (!data || !data.headers || !data.rows) {
      throw new Error('无效的数据格式');
    }

    // 限制数据行数，避免超出token限制
    const rows = data.rows.slice(0, maxRows);
    
    // 构建CSV格式字符串
    const csvLines = [
      data.headers.join(','),
      ...rows.map(row => 
        data.headers.map(header => {
          const value = row[header] || '';
          // 如果值包含逗号或引号，需要用引号包围并转义
          if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return value;
        }).join(',')
      )
    ];
    
    return csvLines.join('\n');
  }

  /**
   * 构建AI分析请求
   * @param {Object} params - 分析参数
   * @param {string} params.data - 数据内容
   * @param {string} params.promptTemplate - 提示词模板
   * @param {Object} params.context - 上下文信息
   * @returns {string} 完整的提示词
   */
  buildAnalysisPrompt({ data, promptTemplate, context = {} }) {
    // 替换模板中的占位符
    let prompt = promptTemplate;
    
    // 替换数据占位符
    prompt = prompt.replace('{{data}}', data);
    
    // 替换上下文占位符
    Object.keys(context).forEach(key => {
      const placeholder = `{{${key}}}`;
      prompt = prompt.replace(new RegExp(placeholder, 'g'), context[key]);
    });
    
    return prompt;
  }

  /**
   * 执行单文件数据分析
   * @param {string} filePath - 数据文件路径
   * @param {string} promptTemplate - 提示词模板（可选，如果不提供则自动获取）
   * @param {Object} options - 分析选项
   * @returns {Promise<string>} AI分析结果
   */
  async analyzeSingleFile(filePath, promptTemplate, options = {}) {
    // 如果没有提供提示词模板，则根据文件名自动获取
    let finalPromptTemplate = promptTemplate;
    if (!finalPromptTemplate) {
      // 从文件路径中提取文件名
      const fileName = filePath.split('/').pop();
      finalPromptTemplate = promptManager.getPrompt(fileName);
    }
    
    // 生成缓存键
    const cacheKey = `${filePath}_${finalPromptTemplate}_${JSON.stringify(options)}`;
    
    // 检查缓存
    const cachedResult = this._getFromCache(cacheKey);
    if (cachedResult) {
      return cachedResult;
    }
    
    try {
      // 加载数据
      const data = await this.loadDataFile(filePath);
      
      // 预处理数据
      const processedData = this.preprocessData(data, options.maxRows);
      
      // 构建提示词
      const prompt = this.buildAnalysisPrompt({
        data: processedData,
        promptTemplate: finalPromptTemplate,
        context: options.context
      });
      
      // 调用AI API进行分析
      const response = await aiApi.analyze(prompt, options.aiOptions);
      
      // 提取分析结果
      const analysisResult = response.choices?.[0]?.message?.content || '未能生成分析结果';
      
      // 存储到缓存
      this._setToCache(cacheKey, analysisResult);
      
      return analysisResult;
    } catch (error) {
      console.error('AI分析失败:', error);
      throw error;
    }
  }

  /**
   * 执行多文件联合数据分析
   * @param {Array<Object>} fileConfigs - 文件配置数组
   * @param {string} promptTemplate - 提示词模板
   * @param {Object} options - 分析选项
   * @returns {Promise<string>} AI分析结果
   */
  async analyzeMultipleFiles(fileConfigs, promptTemplate, options = {}) {
    // 生成缓存键
    const cacheKey = `multi_${JSON.stringify(fileConfigs)}_${promptTemplate}_${JSON.stringify(options)}`;
    
    // 检查缓存
    const cachedResult = this._getFromCache(cacheKey);
    if (cachedResult) {
      return cachedResult;
    }
    
    try {
      // 并行加载所有数据文件
      const loadDataPromises = fileConfigs.map(config => 
        this.loadDataFile(config.path).then(data => ({
          ...config,
          data
        }))
      );
      
      const loadedData = await Promise.all(loadDataPromises);
      
      // 预处理所有数据
      const processedData = loadedData.map(item => ({
        ...item,
        processed: this.preprocessData(item.data, item.maxRows || options.maxRows)
      }));
      
      // 构建包含所有数据的上下文
      const context = {
        ...options.context
      };
      
      processedData.forEach((item, index) => {
        context[`data_${index}`] = item.processed;
        if (item.name) {
          context[`data_${item.name}`] = item.processed;
        }
      });
      
      // 构建提示词
      const prompt = this.buildAnalysisPrompt({
        data: '', // 多文件分析时主要依靠上下文
        promptTemplate,
        context
      });
      
      // 调用AI API进行分析
      const response = await aiApi.analyze(prompt, options.aiOptions);
      
      // 提取分析结果
      const analysisResult = response.choices?.[0]?.message?.content || '未能生成分析结果';
      
      // 存储到缓存
      this._setToCache(cacheKey, analysisResult);
      
      return analysisResult;
    } catch (error) {
      console.error('AI联合分析失败:', error);
      throw error;
    }
  }

  /**
   * 从缓存获取数据
   * @param {string} key - 缓存键
   * @returns {any} 缓存数据或null
   */
  _getFromCache(key) {
    const cachedItem = analysisCache.get(key);
    if (!cachedItem) return null;
    
    // 检查是否过期
    if (Date.now() - cachedItem.timestamp > CACHE_TTL) {
      analysisCache.delete(key);
      return null;
    }
    
    return cachedItem.data;
  }

  /**
   * 存储数据到缓存
   * @param {string} key - 缓存键
   * @param {any} data - 要缓存的数据
   */
  _setToCache(key, data) {
    analysisCache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  /**
   * 清除缓存
   */
  clearCache() {
    analysisCache.clear();
  }
}

// 导出单例实例
const aiAnalysisService = new AIAnalysisService();
export default aiAnalysisService;