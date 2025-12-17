// src/components/Common/AiAnalysisBox.jsx
import React from 'react';

const AiAnalysisBox = ({ analysisText }) => {
  // 如果分析文本为空，则不显示组件
  if (!analysisText || analysisText.trim() === '') {
    return null;
  }

  return (
    <div className="mb-4">
      <div 
        className="bg-blue-50 border-l-4 border-blue-500 p-3 text-sm text-blue-700 rounded"
        style={{ minHeight: '50px' }}
      >
        <span className="font-medium">AI分析：</span>
        {analysisText}
      </div>
    </div>
  );
};

export default AiAnalysisBox;