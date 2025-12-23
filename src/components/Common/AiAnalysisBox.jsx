import React from 'react';
import ReactMarkdown from 'react-markdown';

const AiAnalysisBox = ({ analysisText, isLoading, error }) => {
  // 如果没有内容且不在加载且没有错误，则不显示
  if (!analysisText && !isLoading && !error) {
    return null;
  }

  return (
    <div className="bg-gray-50 rounded-lg border border-gray-100 p-4 mb-6">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-purple-600">✨</span>
        <h3 className="text-sm font-bold text-gray-700">智能分析</h3>
      </div>
      
      <div className="text-sm text-gray-600 leading-relaxed">
        {isLoading ? (
          <div className="flex items-center gap-2 text-gray-500">
            <svg className="animate-spin h-4 w-4 text-purple-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span>正在生成智能分析...</span>
          </div>
        ) : error ? (
          <div className="text-red-500">{error}</div>
        ) : (
          <div className="markdown-content">
            <ReactMarkdown
              components={{
                h1: ({node, ...props}) => <h1 className="text-lg font-bold text-gray-800 my-2" {...props} />,
                h2: ({node, ...props}) => <h2 className="text-base font-bold text-gray-800 my-2" {...props} />,
                h3: ({node, ...props}) => <h3 className="text-sm font-bold text-gray-700 my-1" {...props} />,
                p: ({node, ...props}) => <p className="mb-2 last:mb-0" {...props} />,
                ul: ({node, ...props}) => <ul className="list-disc list-outside ml-4 mb-2 space-y-1" {...props} />,
                ol: ({node, ...props}) => <ol className="list-decimal list-outside ml-4 mb-2 space-y-1" {...props} />,
                li: ({node, ...props}) => <li className="" {...props} />,
                strong: ({node, ...props}) => <strong className="font-semibold text-gray-800" {...props} />,
                blockquote: ({node, ...props}) => <blockquote className="border-l-4 border-gray-300 pl-3 py-1 my-2 bg-gray-100 italic" {...props} />,
                code: ({node, inline, ...props}) => 
                  inline ? 
                    <code className="bg-gray-200 rounded px-1 py-0.5 text-xs font-mono" {...props} /> :
                    <pre className="bg-gray-800 text-gray-100 rounded p-2 my-2 overflow-x-auto text-xs font-mono"><code {...props} /></pre>
              }}
            >
              {analysisText}
            </ReactMarkdown>
          </div>
        )}
      </div>
    </div>
  );
};

export default AiAnalysisBox;
