# AI分析架构使用说明

## 架构概述

本项目实现了完整的AI分析架构，包括以下核心组件：

1. **AI API管理模块** (`src/api/aiApi.js`) - 统一管理AI API调用
2. **AI数据分析服务** (`src/services/aiAnalysisService.js`) - 处理数据读取和分析请求
3. **提示词管理服务** (`src/services/promptManager.js`) - 管理分析提示词模板

## 使用方法

### 1. 配置API密钥

在使用AI分析功能之前，需要设置API密钥：

```javascript
import aiApi from '../api/aiApi';

// 设置OpenAI API密钥
aiApi.setApiKey('your-openai-api-key');

// 或者设置Azure OpenAI API密钥
aiApi.switchProvider('azure', {
  baseUrl: 'https://your-resource-name.openai.azure.com',
});
aiApi.setApiKey('your-azure-api-key');
```

### 2. 单文件数据分析

```javascript
import { aiAnalysisService } from '../services';

// 自动获取提示词并分析数据
const result = await aiAnalysisService.analyzeSingleFile(
  '/src/data/4-客次量-月营销折扣率.csv',
  null, // 不提供提示词，自动获取
  {
    maxRows: 50, // 限制分析行数
    aiOptions: {
      temperature: 0.7,
      max_tokens: 500
    }
  }
);
```

### 3. 多文件联合分析

```javascript
import { aiAnalysisService } from '../services';

// 联合分析多个数据文件
const result = await aiAnalysisService.analyzeMultipleFiles(
  [
    { 
      path: '/src/data/4-客次量-月营销折扣率.csv',
      name: 'discount_rate',
      maxRows: 30
    },
    {
      path: '/src/data/4-客次量-床位利用率.csv',
      name: 'bed_utilization',
      maxRows: 30
    }
  ],
  `请分析以下两组数据的关系：
数据1（营销折扣率）：
{{data_discount_rate}}

数据2（床位利用率）：
{{data_bed_utilization}}

请分析营销折扣率与床位利用率之间的关联性。`,
  {
    aiOptions: {
      temperature: 0.7,
      max_tokens: 800
    }
  }
);
```

### 4. 自定义提示词

```javascript
import promptManager from '../services/promptManager';

// 为特定文件添加自定义提示词
promptManager.setPrompt('custom-file.csv', `
请分析以下数据：
{{data}}

请按照以下格式输出：
1. 数据概览
2. 关键发现
3. 建议措施
`);

// 获取提示词
const prompt = promptManager.getPrompt('custom-file.csv');
```

## 集成到数据容器组件

在数据容器组件中集成AI分析功能：

```javascript
import React, { useState, useEffect } from 'react';
import DataContainer from './Common/DataContainer';
import { aiAnalysisService } from '../services';

const MyDataContainer = () => {
  const [data, setData] = useState(null);
  const [aiAnalysis, setAiAnalysis] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // 加载数据
  useEffect(() => {
    // ... 数据加载逻辑
  }, []);

  // AI分析数据
  useEffect(() => {
    if (data && !aiAnalysis && !isAnalyzing) {
      setIsAnalyzing(true);
      
      aiAnalysisService.analyzeSingleFile(
        '/src/data/my-data-file.csv',
        null,
        { maxRows: 50 }
      )
      .then(result => {
        setAiAnalysis(result);
      })
      .catch(error => {
        console.error('AI分析失败:', error);
        setAiAnalysis('AI分析暂时不可用');
      })
      .finally(() => {
        setIsAnalyzing(false);
      });
    }
  }, [data, aiAnalysis, isAnalyzing]);

  return (
    <DataContainer
      title="我的数据"
      data={data}
      aiAnalysis={aiAnalysis}
      renderFilters={renderFilters}
      renderContent={renderTable}
    />
  );
};
```

## 扩展性说明

### 添加新的提示词模板

在 `src/services/promptManager.js` 中添加新的提示词：

```javascript
// 在 _initDefaultPrompts 方法中添加
this.prompts.set('new-file.csv', `
你的自定义提示词模板
数据：
{{data}}
`);
```

### 支持新的AI提供商

在 `src/api/aiApi.js` 中添加新的提供商配置：

```javascript
// 在 PROVIDER_CONFIGS 中添加
const PROVIDER_CONFIGS = {
  // ... 现有提供商
  newProvider: {
    baseUrl: 'https://api.newprovider.com/v1',
    models: ['model-1', 'model-2']
  }
};
```