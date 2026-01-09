import React, { useState, useEffect } from "react";
import TurnoverReport from "../Turnover";
import StoreTab from "../Store";
import CostAndProfitTab from "../CostAndProfit";
import CashFlowTab from "../CashFlow";
import dataLoader from "../../utils/dataLoader";

const WeeklyReport = () => {
  // Tab导航状态管理
  const [activeTab, setActiveTab] = useState(0);
  const [isPrefetching, setIsPrefetching] = useState(true);

  useEffect(() => {
    let active = true;
    const run = async () => {
      setIsPrefetching(true);
      await dataLoader.prefetchAll();
      if (active) setIsPrefetching(false);
    };
    run();
    return () => {
      active = false;
    };
  }, []);

  // Tab列表
  const tabs = [
    "营业额",
    "成本与利润",
    "现金流",
    "门店"
  ];

  // 获取当前日期
  const getCurrentDate = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}年${month}月${day}日`;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 标题区域 */}
      <header 
        className="bg-gradient-to-r from-[#a40035] to-[#c81f52] text-white"
      >
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col items-start">
            {/* 副标题 */}
            <p className="text-sm md:text-base font-light tracking-wider mb-2 text-white/90">
              AI 经营分析洞察
            </p>
            
            {/* 主标题 */}
            <h1 className="text-3xl md:text-4xl font-bold mb-6">
              常乐经营管理周报
            </h1>
            
            {/* 更新时间 */}
            <p className="text-white/90 text-sm md:text-base">
              更新时间：{getCurrentDate()}
            </p>
          </div>
        </div>
      </header>

      {/* 内容切换区域 */}
      <main className="container mx-auto px-4 py-6">
        {/* Tab导航 */}
        <div className="flex flex-wrap gap-2 md:gap-4 mb-8 border-b border-gray-200 pb-2">
          {tabs.map((tab, index) => (
            <button
              key={index}
              onClick={() => setActiveTab(index)}
              disabled={isPrefetching}
              className={`px-3 py-2 text-sm md:text-base font-medium rounded-t-lg transition-colors ${
                activeTab === index
                  ? "text-[#a40035] font-bold border-b-2 border-[#a40035]"
                  : "text-gray-700 hover:text-[#a40035]"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* 内容区域 */}
        <div className="bg-white rounded-lg shadow p-4 md:p-6 min-h-[400px]">
          {isPrefetching ? (
            <div className="flex justify-center items-center h-[320px] text-gray-400">数据加载中...</div>
          ) : (
            <>
              {activeTab === 0 && <TurnoverReport />}
              
              {activeTab === 1 && <CostAndProfitTab />}

              {activeTab === 2 && <CashFlowTab />}
              
              {activeTab === 3 && <StoreTab />}
            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default WeeklyReport;
