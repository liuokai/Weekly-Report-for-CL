// src/components/Common/AiAnalysisDemo.jsx
import React, { useState, useEffect } from 'react';
import { aiAnalysisService } from '../../services';

const AiAnalysisDemo = () => {
  const [analysisResult, setAnalysisResult] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // 示例：分析月营销折扣率数据
  const analyzeMonthlyDiscountRate = async () => {
    setIsLoading(true);
    setError('');
    setAnalysisResult('');
    
    try {
      const result = await aiAnalysisService.analyzeSingleFile(
        '/src/data/4-客次量-月营销折扣率.csv',
        null, // 不提供提示词模板，让服务自动获取
        {
          maxRows: 50, // 限制分析前50行数据
          aiOptions: {
            temperature: 0.7,
            max_tokens: 800
          }
        }
      );
      
      setAnalysisResult(result);
    } catch (err) {
      setError(`分析失败: ${err.message}`);
      console.error('AI分析错误:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mt-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">AI分析演示</h3>
      
      <div className="mb-4">
        <button
          onClick={analyzeMonthlyDiscountRate}
          disabled={isLoading}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-blue-300 transition-colors"
        >
          {isLoading ? '分析中...' : '分析月营销折扣率数据'}
        </button>
      </div>
      
      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-700 rounded">
          {error}
        </div>
      )}
      
      {analysisResult && (
        <div className="mt-4">
          <h4 className="font-medium text-gray-700 mb-2">AI分析结果：</h4>
          <div className="p-4 bg-gray-50 rounded whitespace-pre-wrap">
            {analysisResult}
          </div>
        </div>
      )}
    </div>
  );
};

export default AiAnalysisDemo;