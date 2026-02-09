import React, { useState, useEffect, useRef } from 'react';
import AiAnalysisBox from './AiAnalysisBox';

const DataContainer = ({ 
  title, 
  data, 
  aiAnalysis,  // AI分析结论文本
  enableAiAnalysis = false, // 是否启用AI分析组件，默认为false
  renderFilters, 
  renderContent,
  children,
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
  }, [data, maxHeight, renderContent, children]);

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
    <div className={`bg-white rounded-lg shadow-sm border border-gray-100 mb-6 ${className}`}>
      <div className="px-6 py-4 border-b border-gray-100 bg-[#a40035]/5 flex items-center justify-between rounded-t-lg">
        <h2 className="text-lg font-bold text-[#a40035] flex items-center gap-2">
          {title}
        </h2>
        {renderFilters && (
          <div className="flex items-center">
            {renderFilters()}
          </div>
        )}
      </div>
      
      <div className="p-6">
        {enableAiAnalysis && <AiAnalysisBox analysisText={aiAnalysis} />}
        <div 
          ref={contentRef}
          className="mt-4"
          style={{ 
            maxHeight: isScrollable ? maxHeight : 'none',
            overflowY: isScrollable ? 'auto' : 'visible'
          }}
        >
          {children ? children : (renderContent ? renderContent() : <div>暂无内容</div>)}
        </div>
      </div>
    </div>
  );
};

export default DataContainer;