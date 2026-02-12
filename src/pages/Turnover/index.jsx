// 推拿之家 Tab，仅保留核心指标区域
import React, { useState, useEffect } from "react";
import WeeklyTurnoverChart from "./WeeklyTurnoverChart";
import RevenueDecompositionContainer from "./RevenueDecompositionContainer";
import PriceDecompositionContainer from "./PriceDecompositionContainer";
import VolumeDecompositionContainer from "./VolumeDecompositionContainer";
import AiAnalysisBox from "../../components/Common/AiAnalysisBox";
import UnifiedProgressBar from "../../components/Common/UnifiedProgressBar";
import BusinessTargets from "../../config/businessTargets";
import { getTimeProgress } from "../../components/Common/TimeProgressUtils";
import difyService from "../../services/difyService";
import dataLoader from "../../utils/dataLoader";

// Global cache object to store data during the session (cleared on page refresh)
const sessionCache = {
  turnoverData: null,
  aiAnalysis: null,
  revenueMetrics: null,
  dataFetched: false,
  aiFetched: false
};

const TurnoverReport = () => {
  // Initialize state from cache if available
  const [turnoverData, setTurnoverData] = useState(sessionCache.turnoverData || []);
  const [aiAnalysis, setAiAnalysis] = useState(sessionCache.aiAnalysis || "");
  // Only show loading if we haven't fetched data yet
  const [loading, setLoading] = useState(!sessionCache.dataFetched);
  const [error, setError] = useState(null);
  const [aiError, setAiError] = useState(null);

  const [revenueMetrics, setRevenueMetrics] = useState(() => {
    // Priority: Session Cache -> LocalStorage -> Default
    if (sessionCache.revenueMetrics) {
      return sessionCache.revenueMetrics;
    }
    
    const saved = localStorage.getItem('revenueMetrics');
    if (saved) {
      return JSON.parse(saved);
    }

    return {
      actual: 0,
      target: BusinessTargets.turnover.annualTarget,
      yoy: 0
    };
  });

  // State to control AI analysis triggering
  const [shouldTriggerAi, setShouldTriggerAi] = useState(false);

  // Handle AI analysis completion to update cache
  const handleAnalysisComplete = (result) => {
    setAiAnalysis(result);
    sessionCache.aiAnalysis = result;
    sessionCache.aiFetched = true;
  };

  // Fetch data and AI analysis from backend
  useEffect(() => {
    let isMounted = true; // Flag to prevent state updates if unmounted

    const fetchData = async () => {
      // If we already have data in cache, don't re-fetch
      if (sessionCache.dataFetched) {
        // Even if data is cached, we might need to trigger AI if it wasn't fetched yet
        if (!sessionCache.aiFetched && difyService.isEnabled) {
           setShouldTriggerAi(true);
        }
        return;
      }
      
      setLoading(true);

      // Define critical queries for this page to load sequentially or in parallel
      // To satisfy "sequential" requirement and reduce load, we can await them one by one or in small groups.
      // However, dataLoader already handles concurrency (limit 3).
      // We will explicitly wait for the main overview data first.
      
      try {
        // 1. Fetch Turnover Overview (Critical for top metrics)
        const dataResult = await dataLoader.fetchData('getTurnoverOverview', []);

        if (isMounted && dataResult) {
          if (dataResult.status === 'success') {
            const newData = dataResult.data;
          setTurnoverData(newData);
          sessionCache.turnoverData = newData;
          sessionCache.dataFetched = true;
          
          // Calculate metrics from data
          if (newData && newData.length > 0) {
            const sortedData = [...newData].sort((a, b) => b.year - a.year);
            const currentYearData = sortedData[0];
            const prevYearData = sortedData[1];

            // 1. 本年累计营业额 (最新一年 total_turnover)
            const currentTurnover = currentYearData ? parseFloat(currentYearData.total_turnover) : 0;
            const actualInWan = currentTurnover / 10000;
            
            // 2. 去年同期值
            // 优先使用当前行数据中的 last_year_same_period_turnover 字段，该字段在 SQL 中已专门计算
            // 如果该字段无效，再尝试回退到上一年的 same_period_turnover
            let prevSamePeriodTurnover = 0;
            if (currentYearData && currentYearData.last_year_same_period_turnover) {
                prevSamePeriodTurnover = parseFloat(currentYearData.last_year_same_period_turnover);
            } else if (prevYearData && prevYearData.same_period_turnover) {
                prevSamePeriodTurnover = parseFloat(prevYearData.same_period_turnover);
            }
            
            const lastYearSamePeriodInWan = prevSamePeriodTurnover / 10000;

            // 4. 同比 (最新一年 yoy_rate)
            let yoy = 0;
            if (currentYearData && currentYearData.yoy_rate != null) {
              yoy = parseFloat(currentYearData.yoy_rate);
            } else if (prevSamePeriodTurnover > 0) {
              yoy = ((currentTurnover - prevSamePeriodTurnover) / prevSamePeriodTurnover) * 100;
            }

            // 3. 目标值 (优先使用后端返回的 annual_target，否则回退到本地配置)
            let annualTargetInWan = BusinessTargets.turnover.annualTarget;
            if (currentYearData && currentYearData.annual_target != null) {
                // 后端已经按万元计算并取整
                annualTargetInWan = Math.floor(parseFloat(currentYearData.annual_target) / 10000);
            }

            const newMetrics = {
              actual: parseFloat(actualInWan.toFixed(2)),
              target: annualTargetInWan,
              lastYearSamePeriod: parseFloat(lastYearSamePeriodInWan.toFixed(2)),
              // 直接使用数值，不要再次 toFixed(1) 导致精度丢失或四舍五入
              yoy: yoy
            };

            setRevenueMetrics(newMetrics);
            sessionCache.revenueMetrics = newMetrics;
            // Save to localStorage
            localStorage.setItem('revenueMetrics', JSON.stringify(newMetrics));
          }
        } else {
          setError(dataResult.message);
        }
      }

        // 2. Wait for other critical queries that are visible on first screen
        // This ensures data loading has priority over AI (User Requirement 3)
        if (isMounted) {
          try {
            await Promise.all([
               // Weekly Turnover Chart (Default)
               dataLoader.fetchData('getWeeklyTurnover', []),
               // Revenue Decomposition (City List)
               dataLoader.fetchData('getCityTurnover', []),
               // Price Overview
               dataLoader.fetchData('getAnnualAvgPrice', []),
               // Price Table (Default)
               dataLoader.fetchData('getCityAnnualAvgPrice', []),
               // Volume Overview
               dataLoader.fetchData('getUserVisitCountAnnual', [])
            ]);
          } catch (e) {
            console.warn('Prefetch secondary critical data failed', e);
            // We continue to trigger AI even if some data failed, 
            // as we don't want to block AI forever.
          }
        }

        if (isMounted && difyService.isEnabled) {
           // Signal AI to start. 
           setShouldTriggerAi(true);
        }

      } catch (err) {
        if (isMounted) {
          console.error("Failed to fetch turnover data:", err);
          setError("无法连接到服务器获取数据");
        }
      } finally {
        if (isMounted) setLoading(false);
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
  const completionRate = (revenueMetrics.actual / revenueMetrics.target) * 100;

  // 计算时间进度
  const timeProgress = getTimeProgress();
  
  const budgetTotal = BusinessTargets.turnover.budget.total;    // 万元
  const budgetUsed = BusinessTargets.turnover.budget.used;      // 万元
  const budgetProgress = (budgetUsed / budgetTotal) * 100;

  return (
    <div className="space-y-6">
      {/* 营业额概览容器 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
        <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
          <span className="w-1 h-5 bg-[#a40035] rounded-full mr-3"></span>
          营业额概览
        </h2>


        {/* AI 分析展示 - 已移动到下方 */}


        <div className="flex flex-col md:flex-row items-start justify-between gap-8">
           <div className="flex-1 md:pl-4 min-w-0">
               <div className="inline-flex flex-col w-full md:w-auto">
                 <div className="flex items-end gap-6 mb-4 flex-wrap">
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

                    {/* 竖线分隔 - 改为左边框视觉分割 */}
                    <div className="flex flex-col gap-2 pl-6 border-l border-gray-200 py-1">
                       <div className="flex items-center gap-4">
                          <span className="text-sm text-gray-500 whitespace-nowrap">去年同期营业额</span>
                          <span className="text-lg font-bold text-gray-800">
                            {revenueMetrics.lastYearSamePeriod?.toLocaleString() ?? 0} <span className="text-xs font-normal text-gray-500">万元</span>
                          </span>
                       </div>
                       <div className="flex items-center gap-4">
                          <span className="text-sm text-gray-500 whitespace-nowrap">同比增长</span>
                          <span className={`text-lg font-bold ${revenueMetrics.yoy >= 0 ? 'text-[#a40035]' : 'text-green-600'}`}>
                             {revenueMetrics.yoy > 0 ? '+' : ''}{revenueMetrics.yoy?.toFixed(2)}%
                          </span>
                       </div>
                       <div className="flex items-center gap-4">
                          <span className="text-sm text-gray-500 whitespace-nowrap">今年目标值</span>
                          <span className="text-lg font-bold text-gray-800">
                            {revenueMetrics.target.toLocaleString()} <span className="text-xs font-normal text-gray-500">万元</span>
                          </span>
                       </div>
                    </div>
                 </div>
                 
                 {/* 营业额目标完成率进度条 */}
                 <UnifiedProgressBar 
                   label="目标完成率"
                   value={completionRate}
                   timeProgress={timeProgress}
                 />
               </div>
           </div>
           <div className="flex-1 md:pr-4 min-w-0">
             <div className="inline-flex flex-col w-full md:w-auto">
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

               {/* 预算消耗进度条 */}
               <UnifiedProgressBar
                 label="预算消耗进度"
                 value={budgetProgress}
                 timeProgress={timeProgress}
               />
             </div>
           </div>
        </div>

        {/* AI 分析展示 - 移动到容器下方 */}
        {difyService.isEnabled && (
          <div className="mt-6 pt-4 border-t border-gray-100">
            <AiAnalysisBox 
              analysisText={aiAnalysis} 
              isLoading={loading} 
              error={aiError} 
              shouldAnalyze={shouldTriggerAi}
              onAnalysisComplete={handleAnalysisComplete}
            />
          </div>
        )}
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
