import React, { useState, useEffect, useMemo, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import axios from 'axios';
import difyService from '../../services/difyService';
import { AnalysisModules } from '../../config/businessTargets';
import { getTimeProgress } from './TimeProgressUtils';

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
    // Merge SQL variables with Static Modules
    const sqlVars = varsRes.data.data || [];
    const staticVars = AnalysisModules.map(m => ({
      ...m,
      type: 'static'
    }));

    globalConfigCache = {
      vars: [...sqlVars, ...staticVars],
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

const AiAnalysisBox = ({ analysisText, isLoading: parentLoading, error: parentError, shouldAnalyze = false, onAnalysisComplete }) => {
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
      
      const defaults = ['turnover_overview', 'static_budget', 'static_turnover_targets'];

      if (defaults.length > 0) setSelectedVariables(defaults);

      const turnoverWorkflow = wfs.find(w => w.id === 'turnover_overview');
      const defaultWorkflowId = turnoverWorkflow ? turnoverWorkflow.id : (wfs[0] ? wfs[0].id : null);
      if (defaultWorkflowId) setSelectedWorkflow(defaultWorkflowId);
      
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

      const defaults = ['turnover_overview', 'static_budget', 'static_turnover_targets'];

      const turnoverWorkflow = wfs.find(w => w.id === 'turnover_overview');
      const defaultWorkflowId = turnoverWorkflow ? turnoverWorkflow.id : (wfs[0] ? wfs[0].id : null);

      if (defaults.length > 0) setSelectedVariables(defaults);
      if (defaultWorkflowId) setSelectedWorkflow(defaultWorkflowId);

      if (defaults.length > 0 && defaultWorkflowId) {
        setAutoAnalyzed(true);
        await executeAnalysis(defaults, defaultWorkflowId);
      }
    } catch (err) {
      console.error('Failed to init analysis:', err);
    } finally {
      setConfigLoading(false);
    }
  };



  // We need to handle the isMounted logic properly. 
  // Since executeAnalysis is an async function called from handlers/effects, 
  // we can't simply return a cleanup function from it.
  // Instead, we should use a ref for the component mount state.
  
  const isComponentMounted = useRef(true);
  const activeRequestRef = useRef(null);
  
  useEffect(() => {
    isComponentMounted.current = true;
    return () => {
      isComponentMounted.current = false;
      // Abort any pending request on unmount
      if (activeRequestRef.current) {
        activeRequestRef.current.abort();
      }
    };
  }, []);

  const executeAnalysis = async (selectedKeys, workflowId, forceRefresh = false) => {
    if (!isComponentMounted.current) return;
    
    setAnalyzing(true);
    setLocalError(null);
    setLocalAnalysis(null);

    // Create an AbortController for this specific request
    const abortController = new AbortController();

    // Store it in a ref or variable if we wanted to abort it manually, 
    // but here we just need to abort it if the component unmounts or if a new request starts.
    // However, executeAnalysis is async, so we can't return the abort function to useEffect directly here.
    // The useEffect that calls this should ideally handle cleanup, but since this is called from multiple places,
    // we'll rely on the isMounted check + AbortSignal.
    
    // Actually, we can attach the abort controller to the ref to cancel previous requests
    if (activeRequestRef.current) {
      activeRequestRef.current.abort();
    }
    activeRequestRef.current = abortController;

    try {
      const variableKeys = [];
      const staticData = {};

      selectedKeys.forEach(key => {
        const staticModule = AnalysisModules.find(m => m.key === key);
        if (staticModule) {
          staticData[key] = staticModule.value;
        } else {
          variableKeys.push(key);
        }
      });

      const timeProgress = parseFloat(getTimeProgress());
      const fixedStaticData = {
        time_progress: {
          percent: Number.isFinite(timeProgress) ? timeProgress : getTimeProgress(),
          as_of_date: new Date().toISOString().slice(0, 10)
        }
      };

      const resultText = await difyService.executeSmartAnalysis(
        variableKeys,
        workflowId,
        { ...staticData, ...fixedStaticData },
        abortController.signal,
        forceRefresh
      );
      
      if (isComponentMounted.current) {
        setLocalAnalysis(resultText);
        if (onAnalysisComplete) {
          onAnalysisComplete(resultText);
        }
      }
    } catch (err) {
      if (isComponentMounted.current) {
        if (axios.isCancel(err) || err.name === 'AbortError') {
          console.log('Request cancelled');
        } else {
          setLocalError(err.response?.data?.message || err.message || '分析请求失败');
        }
      }
    } finally {
      if (isComponentMounted.current) {
        // Only set analyzing to false if this is still the active request
        if (activeRequestRef.current === abortController) {
             setAnalyzing(false);
             activeRequestRef.current = null;
        }
      }
    }
  };

  const handleAnalyzeClick = () => {
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

  /**
   * 将 JSON 或复杂内容转换为标准的 Markdown 格式
   * 目标：实现清晰的一二级标题结构，彻底移除 JSON 符号，移除引用符号
   */
  const formatAsMarkdown = (content) => {
    if (!content) return '';
    
    // 尝试解析 JSON
    let data = null;
    try {
      if (typeof content === 'string' && (content.trim().startsWith('{') || content.trim().startsWith('['))) {
        data = JSON.parse(content);
      } else if (typeof content === 'object') {
        data = content;
      }
    } catch (e) {
      return content;
    }

    if (!data) return content;

    // 递归转换函数，将值转换为不含 JSON 符号的纯文本
    const cleanValue = (val) => {
      if (val === null || val === undefined) return '';
      if (Array.isArray(val)) {
        return val.map(v => cleanValue(v)).join('；');
      }
      if (typeof val === 'object') {
        return Object.entries(val)
          .map(([k, v]) => `${k}：${cleanValue(v)}`)
          .join('；');
      }
      // 仅在确定是 JSON 结构时才移除引号，避免破坏正常文本中的引号
      return String(val).replace(/["'{}[\]]/g, '');
    };

    let markdown = '';
    const keys = Object.keys(data);
    
    // 识别一级标题相关的 key
    const primaryKeys = ['summary', 'conclusion', '总结', '结论', '核心结论', '概览', 'overview', '核心经营结论', '增长速率与动能研判', '成本效能与进度预警'];
    
    keys.forEach(key => {
      const val = data[key];
      if (!val) return;

      // 判断是否为一级标题
      const isPrimaryKey = primaryKeys.some(pk => key.includes(pk));
      
      if (isPrimaryKey) {
        markdown += `### ${key}\n\n`;
      } else {
        markdown += `#### ${key}\n\n`;
      }
      
      if (Array.isArray(val)) {
        val.forEach(item => {
          const itemStr = cleanValue(item);
          // 同时支持全角和半角冒号的拆分
          const colonMatch = itemStr.match(/[：:]/);
          if (colonMatch) {
            const index = colonMatch.index;
            const subTitle = itemStr.slice(0, index).trim();
            const subContent = itemStr.slice(index + 1).trim();
            markdown += `**${subTitle}**：${subContent}\n\n`;
          } else {
            markdown += `- ${itemStr}\n`;
          }
        });
        markdown += '\n';
      } else if (typeof val === 'object') {
        Object.entries(val).forEach(([subKey, subVal]) => {
          markdown += `**${subKey}**：${cleanValue(subVal)}\n\n`;
        });
      } else {
        const valStr = cleanValue(val);
        const colonMatch = valStr.match(/[：:]/);
        if (colonMatch) {
          const index = colonMatch.index;
          const subTitle = valStr.slice(0, index).trim();
          const subContent = valStr.slice(index + 1).trim();
          markdown += `**${subTitle}**：${subContent}\n\n`;
        } else {
          markdown += `${valStr}\n\n`;
        }
      }
    });

    return markdown.trim();
  };

  const finalMarkdown = useMemo(() => formatAsMarkdown(displayContent), [displayContent]);

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 mb-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center text-purple-600 shadow-sm">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M5 2a1 1 0 011 1v1h1a1 1 0 010 2H6v1a1 1 0 01-2 0V6H3a1 1 0 010-2h1V3a1 1 0 011-1zm0 10a1 1 0 011 1v1h1a1 1 0 110 2H6v1a1 1 0 11-2 0v-1H3a1 1 0 110-2h1v-1a1 1 0 011-1zM12 2a1 1 0 01.967.744L14.146 7.2 17.5 9.134a1 1 0 010 1.732l-3.354 1.935-1.18 4.455a1 1 0 01-1.933 0L9.854 12.8 6.5 10.866a1 1 0 010-1.732l3.354-1.935 1.18-4.455A1 1 0 0112 2z" clipRule="evenodd" />
            </svg>
          </div>
          <div>
            <h3 className="text-sm font-bold text-gray-800">智能经营洞察</h3>
            <p className="text-[10px] text-gray-400">AI 深度解析数据结论</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {((displayContent && !displayLoading) || displayError) && (
            <button 
              onClick={() => executeAnalysis(selectedVariables, selectedWorkflow, true)}
              className="p-1.5 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-all"
              title="重新分析"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          )}
          <button 
            onClick={() => setShowConfig(true)}
            className="text-gray-400 hover:text-purple-600 transition-colors p-1.5 hover:bg-gray-50 rounded-lg"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
        </div>
      </div>
      
      <div className="text-sm text-gray-600 leading-relaxed min-h-[60px]">
        {displayLoading ? (
          <div className="flex flex-col items-center justify-center py-8">
            <div className="animate-spin h-6 w-6 border-2 border-purple-100 border-t-purple-600 rounded-full mb-3"></div>
            <span className="text-gray-400 text-xs">分析中...</span>
          </div>
        ) : displayError ? (
          <div className="bg-red-50 text-red-600 p-3 rounded-lg text-xs border border-red-100">
            {displayError}
          </div>
        ) : !displayContent ? (
          <div className="flex items-center justify-center py-8 border border-dashed border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors" onClick={() => setShowConfig(true)}>
            <p className="text-gray-400 text-xs">点击配置并开始分析</p>
          </div>
        ) : (
          <div className="markdown-content bg-gray-50/50 p-4 rounded-xl border border-gray-100">
            <ReactMarkdown
              components={{
                h3: ({node, children, ...props}) => <h3 className="text-base font-bold text-gray-800 mb-3 mt-4 first:mt-0 border-b border-gray-100 pb-1" {...props}>{children}</h3>,
                h4: ({node, children, ...props}) => <h4 className="text-sm font-bold text-purple-700 mb-2 mt-3" {...props}>{children}</h4>,
                p: ({node, ...props}) => <p className="mb-2 last:mb-0 text-gray-700 text-sm leading-relaxed" {...props} />,
                ul: ({node, ...props}) => <ul className="space-y-1 mb-3 ml-4 list-disc list-outside" {...props} />,
                ol: ({node, ...props}) => <ol className="space-y-1 mb-3 ml-4 list-decimal list-outside" {...props} />,
                li: ({node, ...props}) => <li className="text-gray-600 text-sm pl-1" {...props} />,
                strong: ({node, ...props}) => <strong className="font-bold text-gray-800" {...props} />,
                blockquote: ({node, ...props}) => (
                  <blockquote className="border-l-4 border-purple-200 pl-3 py-1 my-2 text-gray-700 text-sm italic" {...props} />
                ),
                code: ({node, inline, ...props}) => 
                  inline ? 
                    <code className="bg-gray-100 text-purple-600 rounded px-1 py-0.5 text-[11px]" {...props} /> :
                    <pre className="bg-white rounded-lg p-3 my-2 overflow-x-auto text-[11px] border border-gray-100"><code {...props} /></pre>
              }}
            >
              {finalMarkdown}
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
                          <div className="font-medium text-gray-800 group-hover:text-blue-600 transition-colors">
                            {v.name}
                            {v.type === 'static' && <span className="ml-2 text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded border border-green-200">静态配置</span>}
                          </div>
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
