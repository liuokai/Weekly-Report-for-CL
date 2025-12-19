import React, { useState } from "react";
import LineTrendChart from "../Common/LineTrendChart";

const WeeklyTurnoverChart = () => {
  // 定义指标配置
  const METRICS = [
    { key: 'revenue', label: '周度营业额', unit: '元', format: (val) => `¥ ${val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, axisFormat: (val) => (val / 10000).toFixed(0) + '万' },
    { key: 'ytdRevenue', label: '年度累计营业额', unit: '元', format: (val) => `¥ ${val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, axisFormat: (val) => (val / 100000000).toFixed(2) + '亿' },
    { key: 'dailyAvgRevenue', label: '天均营业额', unit: '元', format: (val) => `¥ ${val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, axisFormat: (val) => (val / 10000).toFixed(1) + '万' },
  ];

  const [selectedMetricKey, setSelectedMetricKey] = useState('revenue');
  const [showTrend, setShowTrend] = useState(true);
  const [showExtremes, setShowExtremes] = useState(true);
  const [showYoY, setShowYoY] = useState(false);

  const currentMetric = METRICS.find(m => m.key === selectedMetricKey);

  // 模拟近12周数据
  // 2025年截至12月15日总营业额 391,063,245.03
  // 12月15日约为第50周结束（实际是第51周开始），粗略按50周计算周均值
  // 周均值 ≈ 391,063,245.03 / 50 ≈ 7,821,265
  const generateData = () => {
    const data = [];
    const baseRevenue = 7821265; // 基准营业额 782万
    
    // 假设最后一周是第51周（12/15 ~ 12/21）
    // 倒推12周，起始周为第40周
    const endWeek = 51;
    const startWeek = endWeek - 11;
    
    // 辅助函数：根据周数计算日期范围（2025年）
    const getWeekDateRange = (weekNum) => {
      const refDate = new Date(2025, 11, 15); // 12月15日
      const diffWeeks = 51 - weekNum;
      
      const monday = new Date(refDate);
      monday.setDate(refDate.getDate() - diffWeeks * 7);
      
      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);
      
      const fmt = (d) => `${d.getMonth() + 1}/${d.getDate()}`;
      return `${fmt(monday)} ～ ${fmt(sunday)}`;
    };

    let cumulativeRevenue = 391063245.03 - (12 * baseRevenue); // 倒推初始累计值
    let cumulativeRevenueLY = (391063245.03 * 0.85) - (12 * baseRevenue * 0.85); // 去年累计初始值 (假设去年同期是85%)

    for (let i = 0; i < 12; i++) {
      const weekNum = startWeek + i;
      // 模拟更明显的波动 +/- 10% 以体现累计营业额的斜率变化
      const fluctuation = (Math.sin(i * 0.8) * 0.08) + (Math.random() - 0.5) * 0.05; 
      const revenue = baseRevenue * (1 + fluctuation);
      
      // 去年同期模拟：趋势保持一致（同向波动），数值整体偏小（约85%），叠加微小随机差异
      // 这里的差异 (Math.random() - 0.5) * 0.02 使得两条线不会完全平行，但趋势高度一致
      const revenueLY = revenue * (0.85 + (Math.random() - 0.5) * 0.02);

      cumulativeRevenue += revenue;
      cumulativeRevenueLY += revenueLY;

      const dailyAvgRevenue = revenue / 7;
      const dailyAvgRevenueLY = revenueLY / 7;

      // 客单价在 170 上下小幅波动
      const dailyAvgPrice = 170 * (1 + (Math.random() - 0.5) * 0.05); 
      // 去年客单价略低，且趋势大致跟随
      const dailyAvgPriceLY = dailyAvgPrice * (0.95 + (Math.random() - 0.5) * 0.02); 

      const dailyAvgCustomer = dailyAvgRevenue / dailyAvgPrice;
      const dailyAvgCustomerLY = dailyAvgRevenueLY / dailyAvgPriceLY;

      // 推拿师日均服务时长 300分钟
      const avgServiceDuration = 300 * (1 + (Math.random() - 0.5) * 0.1);
      // 去年服务时长略低或接近，趋势跟随
      const avgServiceDurationLY = avgServiceDuration * (0.98 + (Math.random() - 0.5) * 0.02);

      data.push({
        weekNum: weekNum,
        weekLabel: `2025 年第 ${weekNum} 周`,
        dateRange: getWeekDateRange(weekNum),
        
        // 本期数据
        revenue: revenue,
        ytdRevenue: cumulativeRevenue,
        dailyAvgRevenue: dailyAvgRevenue,
        dailyAvgCustomer: Math.round(dailyAvgCustomer),
        dailyAvgPrice: dailyAvgPrice,
        avgServiceDuration: Math.round(avgServiceDuration),

        // 去年同期数据 (字段名对应 METRICS 中的 key + 'LastYear')
        revenueLastYear: revenueLY,
        ytdRevenueLastYear: cumulativeRevenueLY,
        dailyAvgRevenueLastYear: dailyAvgRevenueLY,
        dailyAvgCustomerLastYear: Math.round(dailyAvgCustomerLY),
        dailyAvgPriceLastYear: dailyAvgPriceLY,
        avgServiceDurationLastYear: Math.round(avgServiceDurationLY),
      });
    }
    return data;
  };

  const [data] = useState(generateData());

  // 获取当前选中指标的数据数组
  const currentKey = selectedMetricKey;
  const lastYearKey = `${selectedMetricKey}LastYear`;
  
  const currentDataValues = data.map(d => d[currentKey]);
  const lastYearDataValues = data.map(d => d[lastYearKey]);

  // 图表尺寸配置
  const width = 800;
  const height = 320;
  const padding = { top: 40, right: 40, bottom: 60, left: 45 }; // 优化左边距以平衡视觉协调性与数值显示


  return (
    <div className="bg-white p-4 rounded-lg shadow-sm">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-800">{currentMetric.label}趋势</h3>
        <p className="text-sm text-gray-500">单位：{currentMetric.unit}</p>
      </div>

      {/* 指标选择区域 */}
      <div className="flex flex-wrap gap-2 mb-3">
        {METRICS.map((metric) => (
          <button
            key={metric.key}
            onClick={() => setSelectedMetricKey(metric.key)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              selectedMetricKey === metric.key
                ? "bg-[#a40035]/10 text-[#a40035]"
                : "bg-gray-100 text-gray-500 hover:bg-gray-200"
            }`}
          >
            {metric.label}
          </button>
        ))}
      </div>

      {/* 图表辅助展示控制区域 */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setShowYoY(!showYoY)}
          className={`px-3 py-1 rounded-full text-xs font-medium transition-colors border ${
            showYoY
              ? "bg-[#2563eb]/10 text-[#2563eb] border-[#2563eb]"
              : "bg-gray-50 text-gray-500 border-transparent hover:bg-gray-100"
          }`}
        >
          显示同比
        </button>
        <button
          onClick={() => setShowTrend(!showTrend)}
          className={`px-3 py-1 rounded-full text-xs font-medium transition-colors border ${
            showTrend
              ? "bg-[#a40035]/10 text-[#a40035] border-[#a40035]"
              : "bg-gray-50 text-gray-500 border-transparent hover:bg-gray-100"
          }`}
        >
          显示均线
        </button>
        <button
          onClick={() => setShowExtremes(!showExtremes)}
          className={`px-3 py-1 rounded-full text-xs font-medium transition-colors border ${
            showExtremes
              ? "bg-[#a40035]/10 text-[#a40035] border-[#a40035]"
              : "bg-gray-50 text-gray-500 border-transparent hover:bg-gray-100"
          }`}
        >
          显示极值
        </button>
      </div>
      
      <LineTrendChart
        headerTitle={`${currentMetric.label}趋势`}
        headerUnit={currentMetric.unit}
        values={currentDataValues}
        valuesYoY={lastYearDataValues}
        xLabels={data.map(d => `${d.weekNum}周`)}
        showYoY={showYoY}
        showTrend={showTrend}
        showExtremes={showExtremes}
        yAxisFormatter={currentMetric.axisFormat}
        valueFormatter={currentMetric.format}
        width={width}
        height={height}
        padding={padding}
        colorPrimary="#a40035"
        colorYoY="#2563eb"
        getHoverTitle={(i) => `周数：${data[i].weekLabel}`}
        getHoverSubtitle={(i) => `日期范围：${data[i].dateRange}`}
      />
    </div>
  );
};

export default WeeklyTurnoverChart;
