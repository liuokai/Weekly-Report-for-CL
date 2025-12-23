// 推拿之家 Tab，仅保留核心指标区域
import React, { useState, useEffect } from "react";
import WeeklyTurnoverChart from "./WeeklyTurnoverChart";
import RevenueDecompositionContainer from "./RevenueDecompositionContainer";
import PriceDecompositionContainer from "./PriceDecompositionContainer";
import VolumeDecompositionContainer from "./VolumeDecompositionContainer";
import AiAnalysisBox from "../../components/Common/AiAnalysisBox";

const TurnoverReport = () => {
  const [turnoverData, setTurnoverData] = useState([]);
  const [aiAnalysis, setAiAnalysis] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [aiError, setAiError] = useState(null);

  const [revenueMetrics, setRevenueMetrics] = useState(() => {
    // Try to load from localStorage first
    const saved = localStorage.getItem('revenueMetrics');
    return saved ? JSON.parse(saved) : {
      actual: 0,
      target: 40000,
      yoy: 0
    };
  });

  // Fetch data and AI analysis from backend
  useEffect(() => {
    let isMounted = true; // Flag to prevent state updates if unmounted

    const fetchData = async () => {
      setLoading(true);
      
      // 1. Fetch Data (Fast)
      try {
        const dataResponse = await fetch('/api/fetch-data', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            queryKey: 'getTurnoverOverview',
            analyze: false // First request only for data
          }),
        });

        const dataResult = await dataResponse.json();

        if (isMounted && dataResult.status === 'success') {
          setTurnoverData(dataResult.data);
          
          // Calculate metrics from data
          if (dataResult.data && dataResult.data.length > 0) {
            const sortedData = [...dataResult.data].sort((a, b) => b.year - a.year);
            const currentYearData = sortedData[0];
            const prevYearData = sortedData[1];

            const currentTurnover = currentYearData ? parseFloat(currentYearData.total_turnover) : 0;
            const prevTurnover = prevYearData ? parseFloat(prevYearData.total_turnover) : 0;
            
            const actualInWan = currentTurnover / 10000;
            
            let yoy = 0;
            if (prevTurnover > 0) {
              yoy = ((currentTurnover - prevTurnover) / prevTurnover) * 100;
            }

            const newMetrics = {
              actual: parseFloat(actualInWan.toFixed(2)),
              target: 40000,
              yoy: parseFloat(yoy.toFixed(1))
            };

            setRevenueMetrics(newMetrics);
            // Save to localStorage
            localStorage.setItem('revenueMetrics', JSON.stringify(newMetrics));
          }
        } else if (isMounted) {
          setError(dataResult.message);
        }
      } catch (err) {
        if (isMounted) {
          console.error("Failed to fetch turnover data:", err);
          setError("无法连接到服务器获取数据");
        }
      }

      // 2. Fetch AI Analysis (Slow) - only if we have data successfully or independently
      try {
        // Create a timeout promise
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Request timed out')), 45000)
        );

        const fetchPromise = fetch('/api/fetch-data', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            queryKey: 'getTurnoverOverview',
            analyze: true // Second request for AI
          }),
        });

        const aiResponse = await Promise.race([fetchPromise, timeoutPromise]);
        
        const aiResult = await aiResponse.json();
        
        if (isMounted) {
          if (aiResult.status === 'success' && aiResult.analysis) {
            setAiAnalysis(aiResult.analysis);
            setAiError(null);
          } else {
             // Handle case where status is success but analysis is missing/error string returned
             if (aiResult.analysis && aiResult.analysis.startsWith('AI Analysis failed')) {
                setAiError(aiResult.analysis);
             }
          }
        }
      } catch (err) {
        if (isMounted) {
          console.error("Failed to fetch AI analysis:", err);
          setAiError("获取 AI 分析超时或失败，请稍后重试。");
          setAiAnalysis("");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      isMounted = false;
    };
  }, []);

  // 移除旧的模拟数据定义
  // const revenueMetrics = { ... }


  // 计算完成率
  const completionRate = Math.round((revenueMetrics.actual / revenueMetrics.target) * 100);

  // 计算时间进度
  const today = new Date();
  const startOfYear = new Date(today.getFullYear(), 0, 1);
  const endOfYear = new Date(today.getFullYear(), 11, 31);
  const timeProgress = Math.min(100, Math.max(0, ((today - startOfYear) / (endOfYear - startOfYear)) * 100));
  
  const budgetTotal = 4500;    // 万元
  const budgetUsed = 3796;     // 万元
  const budgetProgress = Math.round((budgetUsed / budgetTotal) * 100);

  return (
    <div className="space-y-6">
      {/* 营业额概览容器 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
        <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
          <span className="w-1 h-5 bg-[#a40035] rounded-full mr-3"></span>
          营业额概览
        </h2>

        {/* AI 分析展示 */}
        <AiAnalysisBox 
          analysisText={aiAnalysis} 
          isLoading={loading} 
          error={aiError} 
        />

        <div className="flex flex-col md:flex-row items-start justify-between gap-8">
           <div className="flex-1 md:pl-4 min-w-0">
               <div className="flex items-center gap-8 mb-4 flex-wrap">
                  {/* 实际营业额 */}
                  <div>
                    <p className="text-sm text-gray-600 mb-1">本年累计营业额</p>
                    <div className="flex items-baseline gap-2">
                       <p className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-[#a40035] tracking-tight truncate">
                         {revenueMetrics.actual.toLocaleString()}
                       </p>
                       <span className="text-lg md:text-xl font-medium text-gray-500">万元</span>
                    </div>
                  </div>

                  {/* 竖线分隔 */}
                  <div className="w-px h-12 bg-gray-200 hidden md:block"></div>

                  {/* 其他指标 */}
                  <div className="flex flex-col gap-2">
                     <div className="flex items-center gap-4">
                        <span className="text-sm text-gray-500 whitespace-nowrap">目标值</span>
                        <span className="text-lg font-bold text-gray-800">
                          {revenueMetrics.target.toLocaleString()} <span className="text-xs font-normal text-gray-500">万元</span>
                        </span>
                     </div>
                     <div className="flex items-center gap-4">
                        <span className="text-sm text-gray-500 whitespace-nowrap">同比</span>
                        <span className={`text-lg font-bold ${revenueMetrics.yoy >= 0 ? 'text-[#a40035]' : 'text-green-600'}`}>
                           {revenueMetrics.yoy > 0 ? '+' : ''}{revenueMetrics.yoy}%
                        </span>
                     </div>
                  </div>
               </div>
           </div>
           <div className="flex-1 md:pr-4 min-w-0">
             <div className="flex items-center gap-8 mb-4 flex-wrap">
               <div>
                 <p className="text-sm text-gray-600 mb-1">预算金额</p>
                 <div className="flex items-baseline gap-2">
                   <p className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-gray-800 tracking-tight truncate">
                     {budgetTotal.toLocaleString()}
                   </p>
                   <span className="text-lg md:text-xl font-medium text-gray-500">万元</span>
                 </div>
               </div>
               <div className="w-px h-12 bg-gray-200 hidden md:block"></div>
               <div>
                 <p className="text-sm text-gray-600 mb-1">实际消耗金额</p>
                 <div className="flex items-baseline gap-2">
                   <p className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-gray-800 tracking-tight truncate">
                     {budgetUsed.toLocaleString()}
                   </p>
                   <span className="text-lg md:text-xl font-medium text-gray-500">万元</span>
                 </div>
               </div>
             </div>
           </div>
        </div>
        <div className="mt-2 grid md:grid-cols-2 gap-8">
          <div className="w-full max-w-[480px]">
            <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
              <span>目标完成率 {completionRate}%</span>
              <span>时间进度 {Math.round(timeProgress)}%</span>
            </div>
            <div className="relative h-2 bg-gray-100 rounded-full overflow-hidden">
              <div 
                className={`absolute left-0 top-0 bottom-0 rounded-full transition-all duration-500 ${completionRate >= timeProgress ? 'bg-[#a40035]' : 'bg-orange-400'}`}
                style={{ width: `${Math.min(100, completionRate)}%` }}
              />
              <div 
                className="absolute top-0 bottom-0 w-0.5 bg-black/30 z-10"
                style={{ left: `${timeProgress}%` }}
              />
            </div>
          </div>
          <div className="w-full max-w-[480px]">
            <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
              <span>预算消耗进度 {budgetProgress}%</span>
              <span>时间进度 {Math.round(timeProgress)}%</span>
            </div>
            <div className="relative h-2 bg-gray-100 rounded-full overflow-hidden">
              <div 
                className={`absolute left-0 top-0 bottom-0 rounded-full transition-all duration-500 ${budgetProgress > Math.round(timeProgress) ? 'bg-[#a40035]' : 'bg-green-600'}`}
                style={{ width: `${Math.min(100, budgetProgress)}%` }}
              />
              <div 
                className="absolute top-0 bottom-0 w-0.5 bg-black/30 z-10"
                style={{ left: `${timeProgress}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* 核心指标区域已移除，移动到 WeeklyReport 的 CoreMetricsBar 中 */}
      
      {/* 总部营业额维度拆解 - 包含周度趋势与城市拆解 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
          <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
            <span className="w-1 h-5 bg-[#a40035] rounded-full"></span>
            总部营业额维度拆解
          </h2>
        </div>
        <div className="p-6 space-y-8">
          <WeeklyTurnoverChart />
          <RevenueDecompositionContainer />
        </div>
      </div>

      {/* 客单价拆解 */}
      <PriceDecompositionContainer />

      {/* 客次量拆解 */}
      <VolumeDecompositionContainer />
    </div>
  );
};

export default TurnoverReport;
