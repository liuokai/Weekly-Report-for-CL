import React, { useState, useEffect } from "react";
import LineTrendChart from "../../components/Common/LineTrendChart";
import useFetchData from "../../hooks/useFetchData";

const WeeklyTurnoverChart = () => {
  // 定义指标配置
  const METRICS = [
    { key: 'revenue', label: '周度营业额', unit: '元', format: (val) => `¥ ${(val || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, axisFormat: (val) => (val / 10000).toFixed(0) + '万' },
    { key: 'ytdRevenue', label: '年度累计营业额', unit: '元', format: (val) => `¥ ${(val || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, axisFormat: (val) => (val / 100000000).toFixed(2) + '亿' },
    { key: 'dailyAvgRevenue', label: '天均营业额', unit: '元', format: (val) => `¥ ${(val || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, axisFormat: (val) => (val / 10000).toFixed(1) + '万' },
  ];

  const [selectedMetricKey, setSelectedMetricKey] = useState('revenue');
  const [showTrend, setShowTrend] = useState(true);
  const [showExtremes, setShowExtremes] = useState(true);
  const [showYoY, setShowYoY] = useState(false);
  const [chartData, setChartData] = useState([]);

  const { data: fetchedData, loading, fetchData } = useFetchData('getWeeklyTurnover');

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (fetchedData && Array.isArray(fetchedData) && fetchedData.length > 0) {
      // Process fetched data
      let cumulativeRevenue = 0; 
      let cumulativeRevenueLY = 0;

      const processed = fetchedData.map((row, index) => {
        const revenue = Number(row.revenue) || 0;
        const revenueLY = Number(row.revenue_ly) || 0;
        
        cumulativeRevenue += revenue;
        cumulativeRevenueLY += revenueLY;

        const dailyAvgRevenue = revenue / 7;
        const dailyAvgRevenueLY = revenueLY / 7;
        
        const dailyAvgPrice = Number(row.avg_price) || 0;
        const dailyAvgPriceLY = Number(row.avg_price_ly) || 0;
        const dailyAvgCustomer = dailyAvgPrice ? dailyAvgRevenue / dailyAvgPrice : 0;
        const dailyAvgCustomerLY = dailyAvgPriceLY ? dailyAvgRevenueLY / dailyAvgPriceLY : 0;

        return {
          weekNum: row.week_num,
          weekLabel: row.week_label || `${row.week_num}周`,
          dateRange: row.date_range || '',
          
          revenue,
          ytdRevenue: cumulativeRevenue,
          dailyAvgRevenue,
          dailyAvgCustomer: Math.round(dailyAvgCustomer),
          dailyAvgPrice,
          avgServiceDuration: 0, 

          revenueLastYear: revenueLY,
          ytdRevenueLastYear: cumulativeRevenueLY,
          dailyAvgRevenueLastYear: dailyAvgRevenueLY,
          dailyAvgCustomerLastYear: Math.round(dailyAvgCustomerLY),
          dailyAvgPriceLastYear: dailyAvgPriceLY,
          avgServiceDurationLastYear: 0
        };
      });
      setChartData(processed);
    } else {
      // Mock Fallback
      const currentWeek = 12;
      const weeks = Array.from({ length: 12 }, (_, i) => currentWeek - 11 + i);
      
      let cumRev = 0;
      let cumRevLY = 0;

      const mockData = weeks.map((w, i) => {
        // Base revenue ~40M with some trend
        const base = 40000000; 
        const noise = (Math.random() - 0.5) * 5000000;
        const trend = (i / 12) * 5000000;
        
        const rev = base + trend + noise;
        const revLY = rev * (0.9 + Math.random() * 0.2); // +/- 10% YoY diff

        cumRev += rev;
        cumRevLY += revLY;

        const dAvgRev = rev / 7;
        const dAvgRevLY = revLY / 7;
        const price = 150 + Math.random() * 20;
        const priceLY = 145 + Math.random() * 20;

        return {
          weekNum: w,
          weekLabel: `${w}周`,
          dateRange: '',
          
          revenue: rev,
          ytdRevenue: cumRev,
          dailyAvgRevenue: dAvgRev,
          dailyAvgCustomer: Math.round(dAvgRev / price),
          dailyAvgPrice: price,
          
          revenueLastYear: revLY,
          ytdRevenueLastYear: cumRevLY,
          dailyAvgRevenueLastYear: dAvgRevLY,
          dailyAvgCustomerLastYear: Math.round(dAvgRevLY / priceLY),
          dailyAvgPriceLastYear: priceLY
        };
      });
      setChartData(mockData);
    }
  }, [fetchedData]);

  const currentMetric = METRICS.find(m => m.key === selectedMetricKey);
  
  // Use chartData instead of generateData()
  const currentDataValues = chartData.map(d => d[selectedMetricKey]);
  const lastYearKey = `${selectedMetricKey}LastYear`;
  const lastYearDataValues = chartData.map(d => d[lastYearKey]);

  // 图表尺寸配置
  const width = 800;
  const height = 320;
  const padding = { top: 40, right: 40, bottom: 60, left: 45 };

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
      
      {loading ? (
        <div className="flex justify-center items-center h-[320px] text-gray-400">加载中...</div>
      ) : chartData.length > 0 ? (
        <LineTrendChart
          headerTitle={`${currentMetric.label}趋势`}
          headerUnit={currentMetric.unit}
          values={currentDataValues}
          valuesYoY={lastYearDataValues}
          xLabels={chartData.map(d => `${d.weekNum}周`)}
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
          getHoverTitle={(i) => chartData[i] ? `周数：${chartData[i].weekLabel}` : ''}
          getHoverSubtitle={(i) => chartData[i] ? `日期范围：${chartData[i].dateRange || '--'}` : ''}
        />
      ) : (
        <div className="flex justify-center items-center h-[320px] text-gray-400">暂无数据</div>
      )}
    </div>
  );
};

export default WeeklyTurnoverChart;
