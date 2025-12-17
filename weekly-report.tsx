import { useState } from "react";

const WeeklyReport = () => {
  // Tab导航状态管理
  const [activeTab, setActiveTab] = useState(0);
  
  // Tab列表
  const tabs = [
    "战略指标",
    "新店总结",
    "营业额总结-客单价",
    "营业额总结-客次量",
    "利润总结"
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
          {/* 副标题 */}
          <p className="text-sm md:text-base font-light tracking-wider mb-2 text-white/90">
            AI 经营分析洞察
          </p>
          
          {/* 主标题 */}
          <h1 className="text-3xl md:text-4xl font-bold text-center mb-6">
            常乐经营管理周报
          </h1>
          
          {/* 更新时间 */}
          <p className="text-center text-white/90 text-sm md:text-base">
            更新时间：{getCurrentDate()}
          </p>
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
          {activeTab === 0 && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-gray-800">战略指标</h2>
              <div className="text-gray-600">
                <p>这里是战略指标的内容区域。</p>
                <p className="mt-2">您可以在此展示关键的战略指标数据和分析。</p>
              </div>
            </div>
          )}
          
          {activeTab === 1 && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-gray-800">新店总结</h2>
              <div className="text-gray-600">
                <p>这里是新店总结的内容区域。</p>
                <p className="mt-2">您可以在此展示新开店铺的运营情况和业绩表现。</p>
              </div>
            </div>
          )}
          
          {activeTab === 2 && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-gray-800">营业额总结-客单价</h2>
              <div className="text-gray-600">
                <p>这里是营业额总结（客单价）的内容区域。</p>
                <p className="mt-2">您可以在此展示客单价相关的数据分析和趋势变化。</p>
              </div>
            </div>
          )}
          
          {activeTab === 3 && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-gray-800">营业额总结-客次量</h2>
              <div className="text-gray-600">
                <p>这里是营业额总结（客次量）的内容区域。</p>
                <p className="mt-2">您可以在此展示客次量相关的数据分析和趋势变化。</p>
              </div>
            </div>
          )}
          
          {activeTab === 4 && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-gray-800">利润总结</h2>
              <div className="text-gray-600">
                <p>这里是利润总结的内容区域。</p>
                <p className="mt-2">您可以在此展示利润相关的数据分析和财务表现。</p>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default WeeklyReport;