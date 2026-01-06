import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import axios from 'axios';

// Global cache for configuration to prevent redundant fetches
let globalConfigCache = null;
let globalConfigPromise = null;

const fetchConfigGlobal = async () => {
  if (globalConfigCache) return globalConfigCache;
  if (globalConfigPromise) return globalConfigPromise;

  globalConfigPromise = Promise.all([
    axios.get('/api/analysis/variables'),
    axios.get('/api/analysis/workflows')
  ]).then(([varsRes, wfsRes]) => {
    globalConfigCache = {
      vars: varsRes.data.data || [],
      wfs: wfsRes.data.data || []
    };
    globalConfigPromise = null;
    return globalConfigCache;
  }).catch(err => {
    globalConfigPromise = null;
    throw err;
  });

  return globalConfigPromise;
};

const AiAnalysisBox = ({ analysisText, isLoading: parentLoading, error: parentError, shouldAnalyze = false }) => {
  const [showConfig, setShowConfig] = useState(false);
  const [configLoading, setConfigLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  
  // Configuration Data
  const [variables, setVariables] = useState([]);
  const [workflows, setWorkflows] = useState([]);
  
  // Selections
  const [selectedVariables, setSelectedVariables] = useState([]);
  const [selectedWorkflow, setSelectedWorkflow] = useState('');

  // Local Analysis State (overrides props if present)
  const [localAnalysis, setLocalAnalysis] = useState(null);
  const [localError, setLocalError] = useState(null);
  const [autoAnalyzed, setAutoAnalyzed] = useState(false);

  // Initialize on mount or when trigger changes
  useEffect(() => {
    // 1. Auto Analysis Trigger
    if (shouldAnalyze && !analysisText && !localAnalysis && !autoAnalyzed && !analyzing) {
       fetchConfigAndAutoAnalyze();
    } 
    // 2. Just fetch config if we need it for UI (e.g. modal is open), but don't analyze yet
    // We remove the automatic fetch on mount to save bandwidth/resources during initial page load
    else if (showConfig && variables.length === 0) {
       fetchConfigOnly();
    }
  }, [shouldAnalyze, showConfig]); // Add showConfig dependency

  const fetchConfigOnly = async () => {
    setConfigLoading(true);
    try {
      const { vars, wfs } = await fetchConfigGlobal();
      
      setVariables(vars);
      setWorkflows(wfs);
      
      // Set defaults for UI
      const defaultVarKey = 'turnover_overview';
      const hasDefaultVar = vars.some(v => v.key === defaultVarKey);
      if (hasDefaultVar) setSelectedVariables([defaultVarKey]);
      if (wfs.length > 0) setSelectedWorkflow(wfs[0].id);
      
    } catch (err) {
      console.error('Failed to load analysis config:', err);
    } finally {
      setConfigLoading(false);
    }
  };

  const fetchConfigAndAutoAnalyze = async () => {
    setConfigLoading(true);
    try {
      const { vars, wfs } = await fetchConfigGlobal();
      
      setVariables(vars);
      setWorkflows(wfs);

      // Determine defaults
      const defaultVarKey = 'turnover_overview';
      const hasDefaultVar = vars.some(v => v.key === defaultVarKey);
      const defaultWorkflowId = wfs.length > 0 ? wfs[0].id : null;

      // Set State
      if (hasDefaultVar) setSelectedVariables([defaultVarKey]);
      if (defaultWorkflowId) setSelectedWorkflow(defaultWorkflowId);

      // Auto Analyze
      if (hasDefaultVar && defaultWorkflowId) {
        setAutoAnalyzed(true);
        await executeAnalysis([defaultVarKey], defaultWorkflowId);
      }
    } catch (err) {
      console.error('Failed to init analysis:', err);
    } finally {
      setConfigLoading(false);
    }
  };

  const executeAnalysis = async (variableKeys, workflowId) => {
    setAnalyzing(true);
    setLocalError(null);
    setLocalAnalysis(null);

    try {
      const response = await axios.post('/api/analysis/execute-smart-analysis', {
        variableKeys,
        workflowId
      });
      
      // Extract result based on Dify response structure (Chat vs Workflow)
      let resultText = '';
      const resData = response.data;

      if (resData.data && resData.data.outputs && resData.data.outputs.result) {
        // Workflow App mode: data.outputs.result
        resultText = resData.data.outputs.result;
      } else if (resData.answer) {
        // Chat App mode: answer
        resultText = resData.answer;
      } else if (resData.data && resData.data.answer) {
        // Nested data structure
        resultText = resData.data.answer;
      } else {
        // Fallback: Try to find any text output in outputs
        if (resData.data && resData.data.outputs) {
           const values = Object.values(resData.data.outputs);
           if (values.length > 0 && typeof values[0] === 'string') {
             resultText = values[0];
           }
        }
      }
      
      // Final fallback to JSON string if nothing found
      if (!resultText) {
        resultText = JSON.stringify(resData);
      }

      setLocalAnalysis(resultText);
    } catch (err) {
      setLocalError(err.response?.data?.message || err.message || '分析请求失败');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleAnalyzeClick = () => {
    if (selectedVariables.length === 0) {
      alert('请至少选择一个数据变量');
      return;
    }
    if (!selectedWorkflow) {
      alert('请选择一个工作流');
      return;
    }
    setShowConfig(false);
    executeAnalysis(selectedVariables, selectedWorkflow);
  };


  const toggleVariable = (key) => {
    setSelectedVariables(prev => 
      prev.includes(key) 
        ? prev.filter(k => k !== key)
        : [...prev, key]
    );
  };

  // Determine what to show
  const displayContent = localAnalysis || analysisText;
  const displayLoading = analyzing || parentLoading;
  const displayError = localError || parentError;

  // Even if no content, if we are analyzing, show the box
  if (!displayContent && !displayLoading && !displayError && !analyzing) {
    // But if we want to show the button to *start* analysis, we should render something.
    // User requirement: "In the smart analysis component... provide a button". 
    // If the box is hidden, the button is hidden. 
    // So we should always render the header at least if we want the feature to be discoverable.
    // However, the original code hid it. I'll respect the original behavior BUT since I added a feature,
    // I should probably allow it to be visible if the user wants to configure it.
    // Let's render a placeholder if nothing is there but config is possible.
    // For now, I'll keep the hide logic but assume parent passes *some* prop or we want to allow empty state to be configured.
    // Actually, let's always render the header so the button is available.
  }

  return (
    <div className="bg-gray-50 rounded-lg border border-gray-100 p-4 mb-6 relative">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-purple-600">✨</span>
          <h3 className="text-sm font-bold text-gray-700">智能分析</h3>
        </div>
        <button 
          onClick={() => setShowConfig(true)}
          className="text-gray-400 hover:text-purple-600 transition-colors p-1"
          title="配置分析数据与工作流"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </button>
      </div>
      
      <div className="text-sm text-gray-600 leading-relaxed min-h-[60px]">
        {displayLoading ? (
          <div className="flex items-center gap-2 text-gray-500 py-4">
            <svg className="animate-spin h-4 w-4 text-purple-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span>{analyzing ? '正在进行自定义分析...' : '正在生成智能分析...'}</span>
          </div>
        ) : displayError ? (
          <div className="text-red-500 py-2">{displayError}</div>
        ) : !displayContent ? (
           <div className="text-gray-400 italic py-2">点击右上角设置按钮开始自定义分析...</div>
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
              {displayContent}
            </ReactMarkdown>
          </div>
        )}
      </div>

      {/* Configuration Modal */}
      {showConfig && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[85vh] flex flex-col">
            <div className="p-4 border-b border-gray-100 flex justify-between items-center">
              <h3 className="text-lg font-bold text-gray-800">自定义智能分析</h3>
              <button onClick={() => setShowConfig(false)} className="text-gray-400 hover:text-gray-600">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
              {/* Left Column: Variables */}
              <div className="flex-1 p-4 border-r border-gray-100 overflow-y-auto">
                <h4 className="font-bold text-gray-700 mb-3 flex items-center gap-2">
                  <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                  选择数据基础 (多选)
                </h4>
                {configLoading ? (
                  <div className="text-gray-400 text-sm">加载数据列表中...</div>
                ) : (
                  <div className="space-y-2">
                    {variables.map(v => (
                      <label key={v.key} className="flex items-start gap-3 p-2 hover:bg-gray-50 rounded cursor-pointer group">
                        <input 
                          type="checkbox" 
                          checked={selectedVariables.includes(v.key)}
                          onChange={() => toggleVariable(v.key)}
                          className="mt-1 w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                        />
                        <div>
                          <div className="font-medium text-gray-800 group-hover:text-blue-600 transition-colors">{v.name}</div>
                          <div className="text-xs text-gray-400 font-mono">{v.key}</div>
                        </div>
                      </label>
                    ))}
                  </div>
                )}
              </div>

              {/* Right Column: Workflows */}
              <div className="flex-1 p-4 overflow-y-auto bg-gray-50/50">
                <h4 className="font-bold text-gray-700 mb-3 flex items-center gap-2">
                  <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                  选择AI工作流 (单选)
                </h4>
                {configLoading ? (
                  <div className="text-gray-400 text-sm">加载工作流中...</div>
                ) : (
                  <div className="space-y-2">
                    {workflows.map(wf => (
                      <label key={wf.id} className="flex items-start gap-3 p-3 bg-white border border-gray-200 rounded-lg hover:border-purple-300 cursor-pointer shadow-sm">
                        <input 
                          type="radio" 
                          name="workflow"
                          checked={selectedWorkflow === wf.id}
                          onChange={() => setSelectedWorkflow(wf.id)}
                          className="mt-1 w-4 h-4 text-purple-600 border-gray-300 focus:ring-purple-500"
                        />
                        <div>
                          <div className="font-medium text-gray-800">{wf.name}</div>
                          <div className="text-xs text-gray-500 mt-1">{wf.description || '暂无描述'}</div>
                        </div>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="p-4 border-t border-gray-100 flex justify-end gap-3 bg-gray-50">
              <button 
                onClick={() => setShowConfig(false)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-200 rounded-lg text-sm font-medium transition-colors"
              >
                取消
              </button>
              <button 
                onClick={handleAnalyzeClick}
                disabled={configLoading || selectedVariables.length === 0 || !selectedWorkflow}
                className={`px-6 py-2 rounded-lg text-sm font-bold text-white shadow-sm transition-all
                  ${configLoading || selectedVariables.length === 0 || !selectedWorkflow 
                    ? 'bg-gray-300 cursor-not-allowed' 
                    : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:shadow-md transform hover:-translate-y-0.5'
                  }`}
              >
                开始智能分析
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AiAnalysisBox;
