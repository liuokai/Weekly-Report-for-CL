// src/api/aiApi.js
/**
 * AI API接口管理模块
 * 负责统一管理AI API的调用，支持多API切换配置
 */

// 默认配置
const DEFAULT_CONFIG = {
  // 默认使用OpenAI API
  provider: 'openai',
  // API基础URL
  baseUrl: 'https://api.openai.com/v1',
  // 默认模型
  model: 'gpt-3.5-turbo',
  // 默认超时时间（毫秒）
  timeout: 30000,
  // 默认最大重试次数
  maxRetries: 3
};

// API提供商配置
const PROVIDER_CONFIGS = {
  openai: {
    baseUrl: 'https://api.openai.com/v1',
    models: ['gpt-3.5-turbo', 'gpt-4']
  },
  azure: {
    baseUrl: '', // 需要在环境变量中配置
    models: ['gpt-35-turbo', 'gpt-4']
  },
  // 可以添加更多提供商
};

class AIApi {
  constructor(config = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    // 在浏览器环境中安全地获取环境变量
    this.apiKey = (typeof process !== 'undefined' && process.env && process.env.REACT_APP_AI_API_KEY) || 
                  (typeof window !== 'undefined' && window.REACT_APP_AI_API_KEY) || 
                  '';
  }

  /**
   * 设置API密钥
   * @param {string} apiKey - API密钥
   */
  setApiKey(apiKey) {
    this.apiKey = apiKey;
  }

  /**
   * 设置配置
   * @param {Object} config - 配置对象
   */
  setConfig(config) {
    this.config = { ...this.config, ...config };
  }

  /**
   * 切换API提供商
   * @param {string} provider - 提供商名称
   * @param {Object} config - 特定提供商的配置
   */
  switchProvider(provider, config = {}) {
    this.config.provider = provider;
    if (PROVIDER_CONFIGS[provider]) {
      this.config.baseUrl = PROVIDER_CONFIGS[provider].baseUrl;
    }
    this.setConfig(config);
  }

  /**
   * 发送分析请求到AI API
   * @param {string} prompt - 分析提示词
   * @param {Object} options - 请求选项
   * @returns {Promise<Object>} AI分析结果
   */
  async analyze(prompt, options = {}) {
    if (!this.apiKey) {
      throw new Error('API密钥未设置，请先调用setApiKey方法设置密钥');
    }

    const requestOptions = {
      model: this.config.model,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: options.temperature || 0.7,
      max_tokens: options.maxTokens || 1000,
      ...options
    };

    let lastError;
    
    for (let attempt = 1; attempt <= this.config.maxRetries; attempt++) {
      try {
        const response = await this._makeRequest(requestOptions);
        return response;
      } catch (error) {
        lastError = error;
        console.warn(`AI API请求失败 (尝试 ${attempt}/${this.config.maxRetries}):`, error.message);
        
        // 如果不是最后一次尝试，等待一段时间后重试
        if (attempt < this.config.maxRetries) {
          await this._delay(1000 * attempt); // 递增延迟
        }
      }
    }
    
    throw new Error(`AI API请求失败，已重试${this.config.maxRetries}次: ${lastError.message}`);
  }

  /**
   * 发送HTTP请求
   * @param {Object} options - 请求选项
   * @returns {Promise<Object>} 响应数据
   */
  async _makeRequest(options) {
    const url = `${this.config.baseUrl}/chat/completions`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(options),
      timeout: this.config.timeout
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API请求失败: ${response.status} ${response.statusText} - ${errorText}`);
    }

    return await response.json();
  }

  /**
   * 延迟函数
   * @param {number} ms - 延迟毫秒数
   * @returns {Promise<void>}
   */
  _delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// 导出单例实例
const aiApi = new AIApi();
export default aiApi;

// 导出类以支持创建多个实例
export { AIApi };