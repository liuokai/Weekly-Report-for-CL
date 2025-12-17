import React, { useState, useEffect, useRef } from 'react';
import AiAnalysisBox from './AiAnalysisBox';

const DataContainer = ({ 
  title, 
  data, 
  aiAnalysis,  // AI分析结论文本
  renderFilters, 
  renderContent,
  className = "",
  maxHeight = "500px"  // 默认最大高度为500px
}) => {
  const contentRef = useRef(null);
  const [isScrollable, setIsScrollable] = useState(false);

  // 检查内容是否超出最大高度
  useEffect(() => {
    // 使用 setTimeout 确保内容已经渲染完成
    const timer = setTimeout(() => {
      if (contentRef.current) {
        const contentHeight = contentRef.current.scrollHeight;
        const maxHeightValue = parseInt(maxHeight);
        setIsScrollable(contentHeight > maxHeightValue);
      }
    }, 0);
    
    return () => clearTimeout(timer);
  }, [data, maxHeight, renderContent]);

  // 点击外部关闭下拉框的逻辑
  useEffect(() => {
    const handleClickOutside = (event) => {
      // 这里可以添加全局点击事件处理逻辑
      // 具体的下拉框关闭逻辑可以在各组件内部处理
    };

    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, []);

  return (
    <div className={`bg-white rounded-lg shadow-md p-6 ${className}`}>
      <h3 className="text-lg font-semibold text-gray-800 mb-4">{title}</h3>
      <AiAnalysisBox analysisText={aiAnalysis} />
      {renderFilters && (
        <div className="mb-6">
          {renderFilters()}
        </div>
      )}
      <div 
        ref={contentRef}
        className="mt-4"
        style={{ 
          maxHeight: isScrollable ? maxHeight : 'none',
          overflowY: isScrollable ? 'auto' : 'visible'
        }}
      >
        {renderContent ? renderContent() : <div>暂无内容</div>}
      </div>
    </div>
  );
};

export default DataContainer;